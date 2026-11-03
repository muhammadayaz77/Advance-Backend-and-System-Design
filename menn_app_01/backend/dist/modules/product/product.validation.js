import { z } from "zod";
export const createProductSchema = z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(1000).optional(),
    price: z.number().finite().nonnegative(),
    stock: z.number().int().nonnegative().default(0),
});
export const updateProductSchema = createProductSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
});
//# sourceMappingURL=product.validation.js.map