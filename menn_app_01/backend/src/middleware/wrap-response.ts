import type { Request, Response, NextFunction } from "express";

export function wrapResponseMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown): Response {
    if (res.statusCode >= 400) {
      return originalJson(body);
    }

    if (
      body !== null &&
      typeof body === "object" &&
      "success" in body &&
      typeof (body as { success: unknown }).success === "boolean"
    ) {
      return originalJson(body);
    }

    return originalJson({
      success: true,
      data: body,
    });
  };

  next();
}

