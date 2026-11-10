 import {z} from "zod";


 export const createArticleSchema = z.object({
    title : z
    .string()
    .min(3,"Title must be at least 3 characters")
    .max(150,"Title cannot exceed 150 characters")
    .transform((s)=>s.trim()),
    content: z
    .string()
    .min(10,"Content must be at least 10 characters"),
    excerpt : z
    .string()
    .max(300,"Excerpt cannot exceed 300 characters")
    .optional(),
    coverImage : z
    .string()
    .url("Cover image must be a valid URL")
    .optional(),
    categoryId : z
    .string()
    .uuid("Category ID must be a valid UUID")
    .optional(),
    tags : z
    .array(z.string().min(1).max(30))
    .max(5,"An article can have at most 5 tags")
    .optional()
    .default([])
 })


 export const publishArticleSchema = z.object({
    status: z.enum(["published","draft"]),
 })

 export const listArticlesQuerySchema = z.object({

   page : z.coerce.number().int().positive().default(1),
   limit: z.coerce.number().int().positive().max(50).default(10),
   search: z.string().optional(),
   tag : z.string().optional(),
   category: z.string().optional(),
   authorId : z.string().optional(),
   sortBy: z.enum(["latest","popular"]).default("latest"),
 })

// All fields from createArticleSchema become optional 
export const updateArticleSchema = createArticleSchema.partial();
 // Export inferred Typescript type so Servie and Repository can use it

 export type CreateArticleInput = z.infer<typeof createArticleSchema>
 export type PublishArticleInput = z.infer<typeof publishArticleSchema>
 export type UpdateArticleInput = z.infer<typeof updateArticleSchema>

export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>