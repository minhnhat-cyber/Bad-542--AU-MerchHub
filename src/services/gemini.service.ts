import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

export async function generateProductDescription(input: {
  name: string;
  category: string;
}) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  const ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: `
Write a concise, SEO-friendly product description for a university merchandise store.

Product name: ${input.name}
Category: ${input.category}

Requirements:
- 60 to 100 words
- Professional and student-friendly
- Do not invent discounts, materials, or technical specifications
- Return only the description
    `.trim(),
  });

  const description = response.text?.trim();

  if (!description) {
    throw new Error("Gemini returned an empty description");
  }

  return description;
}