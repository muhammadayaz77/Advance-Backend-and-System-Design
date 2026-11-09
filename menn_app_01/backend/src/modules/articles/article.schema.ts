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


 // Export inferred Typescript type so Servie and Repository can use it

 export type CreateArticleInput = z.infer<typeof createArticleSchema>