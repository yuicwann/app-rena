/**
 * Utilitas string murni tanpa efek samping (pure functions)
 */

export interface RawLoginKeysInput {
  className: string;
  username?: string;
}

export interface LoginKeys {
  className: string;
  classKey: string;
  username?: string;
  usernameKey: string | null;
}

export const normalizeKey = (value: string): string => value.trim().toLowerCase();

export const buildInternalEmail = (usernameKey: string, classKey: string): string =>
  `${usernameKey}.${classKey}@sinyallab.internal`;

export const buildLoginKeys = (input: RawLoginKeysInput): LoginKeys => {
  const cleanClassName = input.className.trim();
  const classKey = normalizeKey(cleanClassName);
  const usernameKey = input.username?.trim() ? normalizeKey(input.username) : null;

  return {
    className: cleanClassName,
    classKey,
    username: input.username?.trim(),
    usernameKey,
  };
};
