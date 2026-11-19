import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AppError } from '../shared/errors';
import { Logger } from '../shared/logger';

export function errorHandler(logger: Logger) {
  return (err: Error, c: Context) => {
    const requestId = (c.get as (key: string) => string | undefined)('requestId');

    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    if (err instanceof AppError) {
      logger.warn({
        requestId,
        code: err.code,
        status: err.status,
        message: err.message,
        details: err.details,
      });

      if (err.status === 429 && typeof (err.details as Record<string, unknown>)?.retryAfter === 'number') {
        c.header('Retry-After', String((err.details as Record<string, unknown>).retryAfter));
      }

      return c.json(
        {
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
            requestId,
          },
        },
        err.status
      );
    }

    // Unhandled exception
    logger.error({
      requestId,
      message: err.message,
      stack: err.stack,
    });

    return c.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Terjadi kesalahan internal pada server.',
          requestId,
        },
      },
      500
    );
  };
}
