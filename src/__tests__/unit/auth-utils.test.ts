/**
 * 認證工具函數單元測試
 * 測試 isAdmin 和 requireAdmin 函數
 */
import { describe, it, expect } from 'vitest';
import { isAdmin, requireAdmin } from '@/lib/auth-utils';

describe('auth-utils', () => {
    describe('isAdmin', () => {
        it('應該對 admin 角色返回 true', () => {
            expect(isAdmin({ role: 'admin' })).toBe(true);
        });

        it('應該對 user 角色返回 false', () => {
            expect(isAdmin({ role: 'user' })).toBe(false);
        });

        it('應該對 null 返回 false', () => {
            expect(isAdmin(null)).toBe(false);
        });

        it('應該對 undefined 返回 false', () => {
            expect(isAdmin(undefined)).toBe(false);
        });

        it('應該對沒有 role 屬性的對象返回 false', () => {
            expect(isAdmin({})).toBe(false);
        });

        it('應該對空字串 role 返回 false', () => {
            expect(isAdmin({ role: '' })).toBe(false);
        });
    });

    describe('requireAdmin', () => {
        it('應該對管理員 session 返回 true', () => {
            const session = {
                user: { id: 'admin-id', role: 'admin', email: 'admin@localhost' },
                expires: '2025-12-31',
            };
            expect(requireAdmin(session as any)).toBe(true);
        });

        it('應該對一般用戶 session 返回 false', () => {
            const session = {
                user: { id: 'user-id', role: 'user', email: 'user@example.com' },
                expires: '2025-12-31',
            };
            expect(requireAdmin(session as any)).toBe(false);
        });

        it('應該對 null session 返回 false', () => {
            expect(requireAdmin(null)).toBe(false);
        });

        it('應該對沒有 user 的 session 返回 false', () => {
            const session = {
                user: undefined,
                expires: '2025-12-31',
            } as any;
            expect(requireAdmin(session)).toBe(false);
        });
    });
});
