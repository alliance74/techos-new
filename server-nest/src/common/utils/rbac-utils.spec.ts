import { isOrgAdmin, isDeliveryAdmin, assertOrgAdmin, assertDeliveryAdmin } from './org-admin';
import { canViewProject, parseProjectVisibleRoles, assertCanViewProject } from './project-visibility';
import { ForbiddenException } from '@nestjs/common';

describe('org-admin utils', () => {
  describe('isOrgAdmin', () => {
    it('should return true for CEO role', () => {
      expect(isOrgAdmin('ceo')).toBe(true);
    });

    it('should return false for CTO role', () => {
      expect(isOrgAdmin('cto')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isOrgAdmin(null)).toBe(false);
      expect(isOrgAdmin(undefined)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isOrgAdmin('CEO')).toBe(true);
      expect(isOrgAdmin('CeO')).toBe(true);
    });
  });

  describe('isDeliveryAdmin', () => {
    it('should return true for CEO', () => {
      expect(isDeliveryAdmin('ceo')).toBe(true);
    });

    it('should return true for CTO', () => {
      expect(isDeliveryAdmin('cto')).toBe(true);
    });

    it('should return false for software_engineer', () => {
      expect(isDeliveryAdmin('software_engineer')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isDeliveryAdmin(null)).toBe(false);
      expect(isDeliveryAdmin(undefined)).toBe(false);
    });
  });

  describe('assertOrgAdmin', () => {
    it('should not throw for CEO', () => {
      expect(() => assertOrgAdmin({ role: 'ceo' }, 'do something')).not.toThrow();
    });

    it('should throw ForbiddenException for non-CEO', () => {
      expect(() => assertOrgAdmin({ role: 'cto' }, 'do something')).toThrow(
        ForbiddenException,
      );
    });

    it('should throw for null user', () => {
      expect(() => assertOrgAdmin(null, 'do something')).toThrow(ForbiddenException);
    });
  });

  describe('assertDeliveryAdmin', () => {
    it('should not throw for CEO', () => {
      expect(() => assertDeliveryAdmin({ role: 'ceo' })).not.toThrow();
    });

    it('should not throw for CTO', () => {
      expect(() => assertDeliveryAdmin({ role: 'cto' })).not.toThrow();
    });

    it('should throw for software_engineer', () => {
      expect(() => assertDeliveryAdmin({ role: 'software_engineer' })).toThrow(
        ForbiddenException,
      );
    });
  });
});

describe('project-visibility utils', () => {
  const ceoUser = { id: 'ceo-1', role: 'ceo' };
  const ctoUser = { id: 'cto-1', role: 'cto' };
  const engineerUser = { id: 'eng-1', role: 'software_engineer' };
  const financeUser = { id: 'fin-1', role: 'finance' };

  describe('parseProjectVisibleRoles', () => {
    it('should parse array of roles', () => {
      const result = parseProjectVisibleRoles({
        visible_to_roles: ['cto', 'software_engineer'],
      });
      expect(result).toEqual(['cto', 'software_engineer']);
    });

    it('should parse JSON string', () => {
      const result = parseProjectVisibleRoles({
        visible_to_roles: '["ceo", "finance"]',
      });
      expect(result).toEqual(['ceo', 'finance']);
    });

    it('should return null for empty input', () => {
      expect(parseProjectVisibleRoles({ visible_to_roles: null })).toBeNull();
      expect(parseProjectVisibleRoles({ visible_to_roles: [] })).toBeNull();
    });
  });

  describe('canViewProject', () => {
    it('CEO can always see any project', () => {
      expect(
        canViewProject(
          { visible_to_roles: ['finance'] },
          ceoUser,
        ),
      ).toBe(true);
    });

    it('creator can always see their own project', () => {
      expect(
        canViewProject(
          { visible_to_roles: ['finance'], created_by: 'eng-1' },
          engineerUser,
        ),
      ).toBe(true);
    });

    it('user with matching role can see project', () => {
      expect(
        canViewProject(
          { visible_to_roles: ['finance', 'cto'] },
          financeUser,
        ),
      ).toBe(true);
    });

    it('user with non-matching role cannot see project', () => {
      expect(
        canViewProject(
          { visible_to_roles: ['finance'] },
          engineerUser,
        ),
      ).toBe(false);
    });

    it('project with no visible_to_roles is visible to all', () => {
      expect(canViewProject({ visible_to_roles: null }, engineerUser)).toBe(true);
      expect(canViewProject({ visible_to_roles: [] }, engineerUser)).toBe(true);
    });
  });

  describe('assertCanViewProject', () => {
    it('should not throw when user has access', () => {
      expect(() =>
        assertCanViewProject({ visible_to_roles: null }, engineerUser),
      ).not.toThrow();
    });

    it('should throw ForbiddenException when user has no access', () => {
      expect(() =>
        assertCanViewProject(
          { visible_to_roles: ['finance'] },
          engineerUser,
        ),
      ).toThrow(ForbiddenException);
    });
  });
});
