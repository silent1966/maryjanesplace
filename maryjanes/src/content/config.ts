import { defineCollection, z } from 'astro:content';

const products = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    category: z.string(),
    description: z.string(),
    priceFrom: z.string().optional(),
    order: z.number().default(0),
    available: z.boolean().default(true),
  }),
});

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { products, posts };
