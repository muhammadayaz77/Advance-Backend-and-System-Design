export function wrapResponseMiddleware(_req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        if (res.statusCode >= 400) {
            return originalJson(body);
        }
        if (body !== null &&
            typeof body === "object" &&
            "success" in body &&
            typeof body.success === "boolean") {
            return originalJson(body);
        }
        return originalJson({
            success: true,
            data: body,
        });
    };
    next();
}
//# sourceMappingURL=wrap-response.js.map