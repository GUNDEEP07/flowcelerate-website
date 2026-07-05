import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    readingTime: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

const playbooks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/playbooks' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    track: z.enum(['practitioner', 'leadership']),
    topics: z.array(z.string()),
    pages: z.number().optional(),
    gated: z.boolean().default(true),
    s3Key: z.string().optional(),
    downloadUrl: z.string().optional(),
    previewExcerpt: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

const workshops = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/workshops' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    track: z.enum(['practitioner', 'leadership']),
    format: z.enum(['live-virtual', 'in-house', 'recorded']),
    duration: z.string(),
    maxParticipants: z.number().optional(),
    price: z.string(),
    topics: z.array(z.string()),
    outcomes: z.array(z.string()),
    agenda: z.array(z.object({ time: z.string(), title: z.string() })).optional(),
    calendlyUrl: z.string().optional(),
    nextDate: z.coerce.date().optional(),
    openEnrollment: z.boolean().default(false),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, playbooks, workshops };
