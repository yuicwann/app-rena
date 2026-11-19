export const CURRENT_SCHEMA_VERSION = 1;

export function migrateState(persistedState: unknown, version: number): unknown {
  if (version === 0) {
    // Migration from version 0 to 1 if applicable
    return persistedState;
  }
  return persistedState;
}
