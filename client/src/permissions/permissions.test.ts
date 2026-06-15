import { describe, expect, it } from 'vitest';
import { canAccess, canEditField, filterEditablePayload } from './permissions';

describe('permission helpers', () => {
  it('keeps product write actions admin-only', () => {
    expect(canAccess('Admin', 'products', 'create')).toBe(true);
    expect(canAccess('Staff', 'products', 'create')).toBe(false);
    expect(canEditField('Staff', 'products', 'price')).toBe(false);
  });

  it('filters disallowed payload fields before submit', () => {
    const payload = filterEditablePayload('Staff', 'customers', {
      id: 'customer-1',
      name: 'Luna Office Supply',
      email: 'hello@luna.test',
      createdAt: '2026-06-15T00:00:00Z'
    });

    expect(payload).toEqual({
      name: 'Luna Office Supply',
      email: 'hello@luna.test'
    });
  });
});
