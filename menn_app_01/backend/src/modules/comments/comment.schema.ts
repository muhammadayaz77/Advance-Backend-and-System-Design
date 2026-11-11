
import {z} from "zod";

export const createCommentSchema = z.object({
    content: z.string().min(1,"Comment cannot be empty").max(1000,"Comment cannot exceed 1000 characters")
    .transform((s) => s.trim()),
    parentId: z
    .string().uuid("Parent comment ID must be a valid UUID").optional()
})

export const listCommentsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20)
})


export type CreateCommentInput = z.infer<typeof createCommentSchema>

export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>