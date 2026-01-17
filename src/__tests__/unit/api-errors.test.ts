/**
 * lib/api-errors.ts 單元測試
 * 測試統一的 API 錯誤響應工具
 */
import { describe, it, expect } from 'vitest';
import {
    createErrorResponse,
    unauthorized,
    forbidden,
    notFound,
    badRequest,
    validationError,
    conflict,
    internalError,
    ErrorCode,
} from '@/lib/api-errors';

describe('lib/api-errors', () => {
    describe('createErrorResponse (創建錯誤響應)', () => {
        it('應該創建基本錯誤響應', async () => {
            const response = createErrorResponse('Test error', 400);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.message).toBe('Test error');
            expect(data.code).toBeUndefined();
            expect(data.details).toBeUndefined();
        });

        it('應該包含錯誤代碼', async () => {
            const response = createErrorResponse('Test error', 400, ErrorCode.BAD_REQUEST);
            const data = await response.json();

            expect(data.message).toBe('Test error');
            expect(data.code).toBe('BAD_REQUEST');
        });

        it('應該包含詳細信息', async () => {
            const details = { field: 'email', error: 'Invalid format' };
            const response = createErrorResponse('Validation failed', 400, ErrorCode.VALIDATION_ERROR, details);
            const data = await response.json();

            expect(data.message).toBe('Validation failed');
            expect(data.details).toEqual(details);
        });
    });

    describe('unauthorized (401)', () => {
        it('應該返回 401 狀態碼', async () => {
            const response = unauthorized();
            expect(response.status).toBe(401);
        });

        it('應該返回預設消息', async () => {
            const response = unauthorized();
            const data = await response.json();
            expect(data.message).toBe('Unauthorized');
        });

        it('應該支持自定義消息', async () => {
            const response = unauthorized('Please login first');
            const data = await response.json();
            expect(data.message).toBe('Please login first');
        });

        it('應該包含 UNAUTHORIZED 錯誤代碼', async () => {
            const response = unauthorized();
            const data = await response.json();
            expect(data.code).toBe('UNAUTHORIZED');
        });
    });

    describe('forbidden (403)', () => {
        it('應該返回 403 狀態碼', async () => {
            const response = forbidden();
            expect(response.status).toBe(403);
        });

        it('應該返回預設消息', async () => {
            const response = forbidden();
            const data = await response.json();
            expect(data.message).toBe('Forbidden');
        });

        it('應該支持自定義消息', async () => {
            const response = forbidden('Admin access required');
            const data = await response.json();
            expect(data.message).toBe('Admin access required');
        });
    });

    describe('notFound (404)', () => {
        it('應該返回 404 狀態碼', async () => {
            const response = notFound();
            expect(response.status).toBe(404);
        });

        it('應該返回預設消息', async () => {
            const response = notFound();
            const data = await response.json();
            expect(data.message).toBe('Not found');
        });

        it('應該支持自定義消息', async () => {
            const response = notFound('User not found');
            const data = await response.json();
            expect(data.message).toBe('User not found');
        });
    });

    describe('badRequest (400)', () => {
        it('應該返回 400 狀態碼', async () => {
            const response = badRequest('Invalid input');
            expect(response.status).toBe(400);
        });

        it('應該返回消息', async () => {
            const response = badRequest('Invalid email format');
            const data = await response.json();
            expect(data.message).toBe('Invalid email format');
        });

        it('應該支持詳細信息', async () => {
            const details = { field: 'password', minLength: 6 };
            const response = badRequest('Password too short', details);
            const data = await response.json();
            expect(data.details).toEqual(details);
        });
    });

    describe('validationError (400)', () => {
        it('應該返回 400 狀態碼', async () => {
            const response = validationError('Validation failed');
            expect(response.status).toBe(400);
        });

        it('應該包含 VALIDATION_ERROR 錯誤代碼', async () => {
            const response = validationError('Validation failed');
            const data = await response.json();
            expect(data.code).toBe('VALIDATION_ERROR');
        });

        it('應該支持驗證錯誤列表', async () => {
            const errors = [
                { field: 'email', message: 'Invalid format' },
                { field: 'name', message: 'Required' },
            ];
            const response = validationError('Validation failed', errors);
            const data = await response.json();
            expect(data.details).toEqual(errors);
        });
    });

    describe('conflict (409)', () => {
        it('應該返回 409 狀態碼', async () => {
            const response = conflict('Email already exists');
            expect(response.status).toBe(409);
        });

        it('應該包含 CONFLICT 錯誤代碼', async () => {
            const response = conflict('Resource already exists');
            const data = await response.json();
            expect(data.code).toBe('CONFLICT');
        });
    });

    describe('internalError (500)', () => {
        it('應該返回 500 狀態碼', async () => {
            const response = internalError();
            expect(response.status).toBe(500);
        });

        it('應該返回預設消息', async () => {
            const response = internalError();
            const data = await response.json();
            expect(data.message).toBe('Internal server error');
        });

        it('應該支持自定義消息', async () => {
            const response = internalError('Database connection failed');
            const data = await response.json();
            expect(data.message).toBe('Database connection failed');
        });

        it('應該包含 INTERNAL_ERROR 錯誤代碼', async () => {
            const response = internalError();
            const data = await response.json();
            expect(data.code).toBe('INTERNAL_ERROR');
        });
    });

    describe('ErrorCode (錯誤代碼常量)', () => {
        it('應該包含認證相關代碼', () => {
            expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
            expect(ErrorCode.SESSION_EXPIRED).toBe('SESSION_EXPIRED');
        });

        it('應該包含權限相關代碼', () => {
            expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
            expect(ErrorCode.NOT_OWNER).toBe('NOT_OWNER');
            expect(ErrorCode.ADMIN_REQUIRED).toBe('ADMIN_REQUIRED');
        });

        it('應該包含資源相關代碼', () => {
            expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
            expect(ErrorCode.USER_NOT_FOUND).toBe('USER_NOT_FOUND');
            expect(ErrorCode.ITEM_NOT_FOUND).toBe('ITEM_NOT_FOUND');
        });

        it('應該包含請求相關代碼', () => {
            expect(ErrorCode.BAD_REQUEST).toBe('BAD_REQUEST');
            expect(ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
            expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
        });

        it('應該包含服務器錯誤代碼', () => {
            expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
            expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
            expect(ErrorCode.AI_ERROR).toBe('AI_ERROR');
        });
    });
});
