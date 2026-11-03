import { Prisma } from "../generated/prisma/client.js";
import { ZodError } from "zod";
export const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};
export const errorHandler = (error, _req, res, _next) => {
    // Zod validation errors
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: "Validation failed",
            errors: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }
    // Prisma not found
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025") {
        res.status(404).json({
            success: false,
            statusCode: 404,
            message: "Record not found",
        });
        return;
    }
    // Prisma unique constraint
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002") {
        res.status(409).json({
            success: false,
            statusCode: 409,
            message: "A record with this unique value already exists",
        });
        return;
    }
    // Application errors with explicit statusCode
    if (error.statusCode) {
        res.status(error.statusCode).json({
            success: false,
            statusCode: error.statusCode,
            message: error.message,
        });
        return;
    }
    // Unknown errors
    console.error("[Unhandled Error]", error);
    res.status(500).json({
        success: false,
        statusCode: 500,
        message: "Internal server error",
    });
};
//# sourceMappingURL=error.middleware.js.map