import { describe, expect, it } from 'bun:test';
import { normalizeKey, buildInternalEmail, buildLoginKeys } from '../src/shared/strings';

describe('Shared Pure String Helpers', () => {
  it('normalizes keys by trimming and converting to lowercase', () => {
    expect(normalizeKey('  XII TAV 1  ')).toBe('xii tav 1');
    expect(normalizeKey('Budi Pratama')).toBe('budi pratama');
  });

  it('builds internal email addresses for students correctly', () => {
    const email = buildInternalEmail('budi', 'xii-tav-1');
    expect(email).toBe('budi.xii-tav-1@sinyallab.internal');
  });

  it('builds login keys with normalized fields and optional username', () => {
    const keys = buildLoginKeys({
      className: '  Kelas Radio AM  ',
      username: '  Aris P  ',
    });

    expect(keys.className).toBe('Kelas Radio AM');
    expect(keys.classKey).toBe('kelas radio am');
    expect(keys.username).toBe('Aris P');
    expect(keys.usernameKey).toBe('aris p');
  });

  it('handles empty or missing username gracefully in buildLoginKeys', () => {
    const keys = buildLoginKeys({
      className: 'SMK TAV',
    });

    expect(keys.className).toBe('SMK TAV');
    expect(keys.classKey).toBe('smk tav');
    expect(keys.username).toBeUndefined();
    expect(keys.usernameKey).toBeNull();
  });
});
