import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    brand: z.string(),
    category: z.enum([
      'portable-vapes',
      'desktop-vapes',
      'pen-vapes',
      'dab-pens',
      'cartridge-batteries',
      'dab-rigs',
      'grinders',
      'storage',
      'cleaning',
      'accessories',
      'batteries',
      'cases',
    ]),
    price: z.number(),
    salePrice: z.number().optional(),
    image: z.string(),
    gallery: z.array(z.string()).default([]),
    summary: z.string(),
    description: z.string(),
    specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    inStock: z.boolean().default(true),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    stripeLink: z.string().default(''),
    rnSku: z.string().optional(),
    order: z.number().default(0),
    hireAvailable: z.boolean().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { products, posts };
