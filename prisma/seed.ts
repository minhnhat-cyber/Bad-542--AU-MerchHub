import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoryNames = [
  "Apparel",
  "Accessories",
  "Stationery",
  "Technology",
];

try {
  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${categoryNames.length} merchandise categories.`);
} finally {
  await prisma.$disconnect();
}
