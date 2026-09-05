import { OrderStatus, Prisma, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware.js";
import {
  createOrderSchema,
  orderIdSchema,
  updateOrderStatusSchema,
} from "../schemas/order.schema.js";

export const orderRouter = Router();

class OrderRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const orderInclude = {
  student: {
    select: { id: true, email: true, displayName: true },
  },
  items: {
    include: {
      product: {
        select: { id: true, name: true, active: true },
      },
    },
  },
} satisfies Prisma.OrderInclude;

orderRouter.post(
  "/",
  requireAuth,
  requireRoles(Role.STUDENT),
  async (request, response) => {
    const parsedBody = createOrderSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return response.status(400).json({
        success: false,
        error: z.treeifyError(parsedBody.error),
      });
    }

    try {
      const order = await prisma.$transaction(async (transaction) => {
        const productIds = parsedBody.data.items.map((item) => item.productId);
        const products = await transaction.product.findMany({
          where: { id: { in: productIds } },
        });
        const productsById = new Map(
          products.map((product) => [product.id, product]),
        );
        let totalPrice = new Prisma.Decimal(0);

        for (const item of parsedBody.data.items) {
          const product = productsById.get(item.productId);

          if (!product) {
            throw new OrderRequestError(404, `Product ${item.productId} not found`);
          }

          if (!product.active) {
            throw new OrderRequestError(409, `Product ${product.name} is unavailable`);
          }

          const stockUpdate = await transaction.product.updateMany({
            where: {
              id: product.id,
              active: true,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });

          if (stockUpdate.count !== 1) {
            throw new OrderRequestError(
              409,
              `Insufficient stock for ${product.name}`,
            );
          }

          totalPrice = totalPrice.plus(product.price.mul(item.quantity));
        }

        return transaction.order.create({
          data: {
            studentId: request.auth!.userId,
            totalPrice,
            items: {
              create: parsedBody.data.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: productsById.get(item.productId)!.price,
              })),
            },
          },
          include: orderInclude,
        });
      });

      return response.status(201).json({ success: true, data: order });
    } catch (error) {
      if (error instanceof OrderRequestError) {
        return response.status(error.status).json({
          success: false,
          error: error.message,
        });
      }

      throw error;
    }
  },
);

orderRouter.get(
  "/mine",
  requireAuth,
  requireRoles(Role.STUDENT),
  async (request, response) => {
    const orders = await prisma.order.findMany({
      where: { studentId: request.auth!.userId },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });

    return response.status(200).json({ success: true, data: orders });
  },
);

orderRouter.get(
  "/",
  requireAuth,
  requireRoles(Role.STAFF, Role.ADMIN),
  async (_request, response) => {
    const orders = await prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });

    return response.status(200).json({ success: true, data: orders });
  },
);

orderRouter.patch(
  "/:id/status",
  requireAuth,
  requireRoles(Role.STAFF, Role.ADMIN),
  async (request, response) => {
    const parsedParams = orderIdSchema.safeParse(request.params);
    const parsedBody = updateOrderStatusSchema.safeParse(request.body);

    if (!parsedParams.success) {
      return response.status(400).json({
        success: false,
        error: z.treeifyError(parsedParams.error),
      });
    }

    if (!parsedBody.success) {
      return response.status(400).json({
        success: false,
        error: z.treeifyError(parsedBody.error),
      });
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      CONFIRMED: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      COMPLETED: [],
      CANCELLED: [],
    };

    try {
      const order = await prisma.$transaction(async (transaction) => {
        const currentOrder = await transaction.order.findUnique({
          where: { id: parsedParams.data.id },
          include: { items: true },
        });

        if (!currentOrder) {
          throw new OrderRequestError(404, "Order not found");
        }

        const nextStatus = parsedBody.data.status;

        if (currentOrder.status === nextStatus) {
          return transaction.order.findUniqueOrThrow({
            where: { id: currentOrder.id },
            include: orderInclude,
          });
        }

        if (!allowedTransitions[currentOrder.status].includes(nextStatus)) {
          throw new OrderRequestError(
            409,
            `Cannot change order from ${currentOrder.status} to ${nextStatus}`,
          );
        }

        const statusUpdate = await transaction.order.updateMany({
          where: {
            id: currentOrder.id,
            status: currentOrder.status,
          },
          data: { status: nextStatus },
        });

        if (statusUpdate.count !== 1) {
          throw new OrderRequestError(409, "Order status changed; retry the request");
        }

        if (nextStatus === OrderStatus.CANCELLED) {
          for (const item of currentOrder.items) {
            await transaction.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        return transaction.order.findUniqueOrThrow({
          where: { id: currentOrder.id },
          include: orderInclude,
        });
      });

      return response.status(200).json({ success: true, data: order });
    } catch (error) {
      if (error instanceof OrderRequestError) {
        return response.status(error.status).json({
          success: false,
          error: error.message,
        });
      }

      throw error;
    }
  },
);
