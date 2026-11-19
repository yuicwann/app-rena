import { getInitials } from '../src/shared/lib/initials';

describe('getInitials helper', () => {
  it('extracts first two letters for single word names like "eimas"', () => {
    expect(getInitials('eimas')).toBe('EI');
    expect(getInitials('Eimas')).toBe('EI');
    expect(getInitials('budi')).toBe('BU');
    expect(getInitials('B')).toBe('B');
  });

  it('extracts first letter of first two words for multi-word names', () => {
    expect(getInitials('Aris Pratama')).toBe('AP');
    expect(getInitials('Eimas Putra')).toBe('EP');
    expect(getInitials('Siti Nur Haliza')).toBe('SN');
  });

  it('handles edge cases, extra whitespace, and empty strings gracefully', () => {
    expect(getInitials('   eimas   ')).toBe('EI');
    expect(getInitials('')).toBe('ST');
    expect(getInitials('   ')).toBe('ST');
    expect(getInitials(null)).toBe('ST');
    expect(getInitials(undefined)).toBe('ST');
  });
});
