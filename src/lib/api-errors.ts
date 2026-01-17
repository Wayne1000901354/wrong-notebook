/**
 * 統一的 API 錯誤回應工具
 * 確保所有 API 錯誤回應格式一致
 */
import { NextResponse } from "next/server";

/**
 * 標準化的錯誤回應結構
 */
export interface ApiErrorResponse {
    message: string;
    code?: string;
    details?: unknown;
}

/**
 * 錯誤代碼枚舉
 */
export const ErrorCode = {
    // 認證相關 (401)
    UNAUTHORIZED: 'UNAUTHORIZED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    // 權限相關 (403)
    FORBIDDEN: 'FORBIDDEN',
    NOT_OWNER: 'NOT_OWNER',
    ADMIN_REQUIRED: 'ADMIN_REQUIRED',

    // 資源相關 (404)
    NOT_FOUND: 'NOT_FOUND',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',

    // 請求相關 (400)
    BAD_REQUEST: 'BAD_REQUEST',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',

    // 衝突 (409)
    CONFLICT: 'CONFLICT',
    ALREADY_EXISTS: 'ALREADY_EXISTS',

    // 伺服器錯誤 (500)
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    AI_ERROR: 'AI_ERROR',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * 創建統一的錯誤回應
 * @param message 用戶友好的錯誤消息
 * @param status HTTP 狀態碼
 * @param code 可選的錯誤代碼
 * @param details 可選的詳細資訊
 */
export function createErrorResponse(
    message: string,
    status: number,
    code?: ErrorCodeType,
    details?: unknown
): NextResponse<ApiErrorResponse> {
    const body: ApiErrorResponse = { message };

    if (code) {
        body.code = code;
    }

    if (details) {
        body.details = details;
    }

    return NextResponse.json(body, { status });
}

// ============ 便捷方法 ============

/**
 * 401 Unauthorized - 未認證
 */
export function unauthorized(message: string = "Unauthorized"): NextResponse<ApiErrorResponse> {
    return createErrorResponse(message, 401, ErrorCode.UNAUTHORIZED);
}

/**
 * 403 Forbidden - 無權限
 */
export function forbidden(message: string = "Forbidden"): NextResponse<ApiErrorResponse> {
    return createErrorResponse(message, 403, ErrorCode.FORBIDDEN);
}

/**
 * 404 Not Found - 資源不存在
 */
export function notFound(message: string = "Not found"): NextResponse<ApiErrorResponse> {
    return createErrorResponse(message, 404, ErrorCode.NOT_FOUND);
}

/**
 * 400 Bad Request - 請求錯誤
 */
export function badRequest(message: string, details?: unknown): NextResponse<ApiErrorResponse> {
    return createErrorResponse(message, 400, ErrorCode.BAD_REQUEST, details);
}

/**
 * 400 Validation Error - 驗證錯誤
 */
export function validationError(message: string, errors?: unknown): NextResponse<ApiErrorResponse> {
    return createErrorResponse(message, 400, ErrorCode.VALIDATION_ERROR, errors);
}

/**
 * 409 Conflict - 衝突
 */
export function conflict(message: string): NextResponse<ApiErrorResponse> {
    return createErrorResponse(message, 409, ErrorCode.CONFLICT);
}

/**
 * 500 Internal Server Error - 伺服器錯誤
 */
export function internalError(message: string = "Internal server error"): NextResponse<ApiErrorResponse> {
    return createErrorResponse(message, 500, ErrorCode.INTERNAL_ERROR);
}
