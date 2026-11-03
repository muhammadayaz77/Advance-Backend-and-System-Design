import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

/**
 * Returns an Express middleware that validates req.body against the given Zod schema.
 * On failure it returns 400 with a structured error list.
 * On success it replaces req.body with the parsed (coerced + stripped) value.
 */
export function validate(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
