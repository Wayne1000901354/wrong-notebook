/**
 * 應用配置模組單元測試
 * 測試 getAppConfig 和 updateAppConfig 函數
 * 注意：這些測試 mock 了文件系統操作
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock fs module
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
}));

// Store original env
const originalEnv = { ...process.env };

describe('config module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset environment variables
        process.env = { ...originalEnv };
        // Clear module cache to re-import with fresh state
        vi.resetModules();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('getAppConfig', () => {
        it('應該返回預設配置（文件不存在時）', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);

            const { getAppConfig } = await import('@/lib/config');
            const config = getAppConfig();

            expect(config.aiProvider).toBe('gemini'); // 預設值
            expect(config.allowRegistration).toBe(true);
        });

        it('應該從環境變量讀取 AI Provider', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            process.env.AI_PROVIDER = 'openai';

            const { getAppConfig } = await import('@/lib/config');
            const config = getAppConfig();

            expect(config.aiProvider).toBe('openai');
        });

        it('應該從環境變量讀取 API Keys', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            process.env.OPENAI_API_KEY = 'sk-env-key';
            process.env.GOOGLE_API_KEY = 'AIza-env-key';

            const { getAppConfig } = await import('@/lib/config');
            const config = getAppConfig();

            // OpenAI 現在使用多實例格式
            expect(config.openai?.instances?.[0]?.apiKey).toBe('sk-env-key');
            expect(config.gemini?.apiKey).toBe('AIza-env-key');
        });

        it('應該從配置文件讀取並與預設值合併', async () => {
            // 新格式的配置文件
            const fileConfig = {
                aiProvider: 'openai',
                openai: {
                    instances: [{
                        id: 'test-instance',
                        name: 'Test',
                        apiKey: 'sk-file-key',
                        baseUrl: 'https://api.openai.com/v1',
                        model: 'gpt-4o',
                    }],
                    activeInstanceId: 'test-instance',
                },
            };
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(fileConfig));

            const { getAppConfig } = await import('@/lib/config');
            const config = getAppConfig();

            expect(config.aiProvider).toBe('openai');
            expect(config.openai?.instances?.[0]?.apiKey).toBe('sk-file-key');
            // 其他預設值應該保留
            expect(config.allowRegistration).toBe(true);
            expect(config.gemini).toBeDefined();
        });

        it('應該在配置文件解析失敗時返回預設值', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue('invalid json{');

            const { getAppConfig } = await import('@/lib/config');
            const config = getAppConfig();

            // 應該回退到預設配置
            expect(config.aiProvider).toBeDefined();
        });

        it('應該使用環境變量的模型名稱', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            process.env.OPENAI_API_KEY = 'sk-test';
            process.env.OPENAI_MODEL = 'gpt-4-turbo';
            process.env.GEMINI_MODEL = 'gemini-3.0';

            const { getAppConfig } = await import('@/lib/config');
            const config = getAppConfig();

            expect(config.openai?.instances?.[0]?.model).toBe('gpt-4-turbo');
            expect(config.gemini?.model).toBe('gemini-3.0');
        });

        it('應該使用預設模型名稱（無環境變量時）', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            process.env.OPENAI_API_KEY = 'sk-test';
            delete process.env.OPENAI_MODEL;
            delete process.env.GEMINI_MODEL;

            const { getAppConfig } = await import('@/lib/config');
            const config = getAppConfig();

            expect(config.openai?.instances?.[0]?.model).toBe('gpt-4o');
            expect(config.gemini?.model).toBe('gemini-2.5-flash');
        });
    });

    describe('updateAppConfig', () => {
        it('應該成功寫入配置文件', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            vi.mocked(fs.writeFileSync).mockImplementation(() => { });

            const { updateAppConfig } = await import('@/lib/config');
            const result = updateAppConfig({ aiProvider: 'openai' });

            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(result.aiProvider).toBe('openai');
        });

        it('應該合併嵌套配置', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            vi.mocked(fs.writeFileSync).mockImplementation(() => { });

            const { updateAppConfig } = await import('@/lib/config');
            const result = updateAppConfig({
                openai: {
                    instances: [{
                        id: 'new-instance',
                        name: 'New',
                        apiKey: 'new-key',
                        baseUrl: 'https://api.openai.com/v1',
                        model: 'gpt-4o',
                    }],
                    activeInstanceId: 'new-instance',
                },
            });

            expect(result.openai?.instances?.[0]?.apiKey).toBe('new-key');
            // 實例應該存在
            expect(result.openai?.instances?.length).toBeGreaterThan(0);
        });

        it('應該在寫入失敗時拋出錯誤', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            vi.mocked(fs.writeFileSync).mockImplementation(() => {
                throw new Error('Permission denied');
            });

            const { updateAppConfig } = await import('@/lib/config');

            expect(() => updateAppConfig({ aiProvider: 'openai' })).toThrow();
        });

        it('應該更新提示詞配置', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            vi.mocked(fs.writeFileSync).mockImplementation(() => { });

            const { updateAppConfig } = await import('@/lib/config');
            const result = updateAppConfig({
                prompts: { analyze: '自定義提示詞' },
            });

            expect(result.prompts?.analyze).toBe('自定義提示詞');
        });

        it('應該更新註冊開關', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            vi.mocked(fs.writeFileSync).mockImplementation(() => { });

            const { updateAppConfig } = await import('@/lib/config');
            const result = updateAppConfig({ allowRegistration: false });

            expect(result.allowRegistration).toBe(false);
        });
    });
});
