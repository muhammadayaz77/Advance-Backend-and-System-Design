import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors.js";
export { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from "../lib/errors.js";
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.url,
        message: `Route not found: ${req.method} ${req.originalUrl || req.url}`,
    });
};
export const errorHandler = (error, req, res, _next) => {
    const timestamp = new Date().toISOString();
    const path = req.originalUrl || req.url;
    // Zod validation errors
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            timestamp,
            path,
            message: error.issues[0]?.message || "Validation failed",
            errors: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }
    // AppError instances (BadRequestError, UnauthorizedError, etc.)
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            statusCode: error.statusCode,
            timestamp,
            path,
            message: error.message,
        });
        return;
    }
    // Prisma not found
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025") {
        res.status(404).json({
            success: false,
            statusCode: 404,
            timestamp,
            path,
            message: "Record not found",
        });
        return;
    }
    // Prisma unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002") {
        res.status(409).json({
            success: false,
            statusCode: 409,
            timestamp,
            path,
            message: "A record with this unique value already exists",
        });
        return;
    }
    // Generic errors with a custom statusCode
    if (typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 600) {
        res.status(error.statusCode).json({
            success: false,
            statusCode: error.statusCode,
            timestamp,
            path,
            message: error.message || "An error occurred",
        });
        return;
    }
    // Fallback 500 error
    console.error("[Unhandled Error]:", error);
    res.status(500).json({
        success: false,
        statusCode: 500,
        timestamp,
        path,
        message: "Internal server error",
    });
};
//# sourceMappingURL=error-handler.js.map