import { Context } from 'hono';
import { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Helper format response sukses standar
 */
export const sendSuccess = <T>(c: Context, data: T, status: ContentfulStatusCode = 200) =>
  c.json(
    {
      status: 'success',
      data,
    },
    status
  );

/**
 * Helper format response sukses dengan pesan
 */
export const sendSuccessMessage = (
  c: Context,
  message: string,
  status: ContentfulStatusCode = 200
) =>
  c.json(
    {
      status: 'success',
      message,
    },
    status
  );

