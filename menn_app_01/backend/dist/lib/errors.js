export class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class BadRequestError extends AppError {
    constructor(msg) {
        super(400, msg);
    }
}
export class UnauthorizedError extends AppError {
    constructor(msg) {
        super(401, msg);
    }
}
export class ForbiddenError extends AppError {
    constructor(msg) {
        super(403, msg);
    }
}
export class NotFoundError extends AppError {
    constructor(msg) {
        super(404, msg);
    }
}
export class ConflictError extends AppError {
    constructor(msg) {
        super(409, msg);
    }
}
//# sourceMappingURL=errors.js.map