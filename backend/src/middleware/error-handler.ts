import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error Handler]', err);

  if (err instanceof ZodError) {
    const issues = (err as any).issues || (err as any).errors || [];
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: issues.map((e: any) => ({ field: (e.path || []).join('.'), message: e.message })),
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
}
