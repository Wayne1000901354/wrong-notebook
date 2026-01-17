/**
 * /api/practice API 整合測試
 * 測試舉一反三功能（生成相似題目和記錄練習結果）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mocks are initialized before module imports
const mocks = vi.hoisted(() => ({
    mockPrismaErrorItem: {
        findUnique: vi.fn(),
    },
    mockPrismaPracticeRecord: {
        create: vi.fn(),
    },
    mockAIService: {
        generateSimilarQuestion: vi.fn(),
    },
    mockSession: {
        user: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Test User',
        },
        expires: '2025-12-31',
    },
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
    prisma: {
        errorItem: mocks.mockPrismaErrorItem,
        practiceRecord: mocks.mockPrismaPracticeRecord,
    },
}));

// Mock AI service
vi.mock('@/lib/ai', () => ({
    getAIService: vi.fn(() => mocks.mockAIService),
}));

// Mock next-auth
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(() => Promise.resolve(mocks.mockSession)),
}));

vi.mock('@/lib/auth', () => ({
    authOptions: {},
}));

// Import after mocks
import { POST as GENERATE_POST } from '@/app/api/practice/generate/route';
import { POST as RECORD_POST } from '@/app/api/practice/record/route';
import { getServerSession } from 'next-auth';

describe('/api/practice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getServerSession).mockResolvedValue(mocks.mockSession);
    });

    describe('POST /api/practice/generate (生成相似題目)', () => {
        const mockErrorItem = {
            id: 'error-item-1',
            questionText: '求解 x + 2 = 5',
            knowledgePoints: '["一元一次方程式", "移項"]',
            subject: { id: 'math', name: '數學' },
        };

        it('應該成功生成相似題目', async () => {
            mocks.mockPrismaErrorItem.findUnique.mockResolvedValue(mockErrorItem);
            const aiResult = {
                questionText: '求解 2x - 3 = 7',
                answerText: 'x = 5',
                analysis: '移項得 2x = 10, x = 5',
                knowledgePoints: ['一元一次方程式'],
                subject: '數學',
            };
            mocks.mockAIService.generateSimilarQuestion.mockResolvedValue(aiResult);

            const request = new Request('http://localhost/api/practice/generate', {
                method: 'POST',
                body: JSON.stringify({
                    errorItemId: 'error-item-1',
                    language: 'zh',
                    difficulty: 'medium',
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await GENERATE_POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.questionText).toBe('求解 2x - 3 = 7');
            expect(data.subject).toBe('數學');
        });

        it('應該支持不同難度級別', async () => {
            mocks.mockPrismaErrorItem.findUnique.mockResolvedValue(mockErrorItem);
            mocks.mockAIService.generateSimilarQuestion.mockResolvedValue({
                questionText: '簡單題目',
                answerText: '答案',
                analysis: '解析',
                knowledgePoints: [],
            });

            const difficulties = ['easy', 'medium', 'hard', 'harder'];

            for (const difficulty of difficulties) {
                const request = new Request('http://localhost/api/practice/generate', {
                    method: 'POST',
                    body: JSON.stringify({
                        errorItemId: 'error-item-1',
                        language: 'zh',
                        difficulty,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                });

                const response = await GENERATE_POST(request);
                expect(response.status).toBe(200);
            }

            // 驗證 AI 服務被調用時使用了不同難度
            expect(mocks.mockAIService.generateSimilarQuestion).toHaveBeenCalledTimes(4);
        });

        it('應該預設使用 medium 難度', async () => {
            mocks.mockPrismaErrorItem.findUnique.mockResolvedValue(mockErrorItem);
            mocks.mockAIService.generateSimilarQuestion.mockResolvedValue({
                questionText: '題目',
                answerText: '答案',
                analysis: '解析',
                knowledgePoints: [],
            });

            const request = new Request('http://localhost/api/practice/generate', {
                method: 'POST',
                body: JSON.stringify({
                    errorItemId: 'error-item-1',
                    language: 'zh',
                    // 不指定 difficulty
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            await GENERATE_POST(request);

            expect(mocks.mockAIService.generateSimilarQuestion).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Array),
                'zh',
                'medium' // 預設難度
            );
        });

        it('應該返回 404 當錯題不存在', async () => {
            mocks.mockPrismaErrorItem.findUnique.mockResolvedValue(null);

            const request = new Request('http://localhost/api/practice/generate', {
                method: 'POST',
                body: JSON.stringify({
                    errorItemId: 'not-exist',
                    language: 'zh',
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await GENERATE_POST(request);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.message).toBe('Item not found');
        });

        it('應該正確解析知識點標籤', async () => {
            mocks.mockPrismaErrorItem.findUnique.mockResolvedValue(mockErrorItem);
            mocks.mockAIService.generateSimilarQuestion.mockResolvedValue({
                questionText: '題目',
                answerText: '答案',
                analysis: '解析',
                knowledgePoints: ['一元一次方程式'],
            });

            const request = new Request('http://localhost/api/practice/generate', {
                method: 'POST',
                body: JSON.stringify({
                    errorItemId: 'error-item-1',
                    language: 'zh',
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            await GENERATE_POST(request);

            expect(mocks.mockAIService.generateSimilarQuestion).toHaveBeenCalledWith(
                '求解 x + 2 = 5',
                ['一元一次方程式', '移項'], // 解析後的標籤數組
                'zh',
                'medium'
            );
        });

        it('應該處理無效的知識點 JSON', async () => {
            const errorItemWithInvalidTags = {
                ...mockErrorItem,
                knowledgePoints: 'invalid json{',
            };
            mocks.mockPrismaErrorItem.findUnique.mockResolvedValue(errorItemWithInvalidTags);
            mocks.mockAIService.generateSimilarQuestion.mockResolvedValue({
                questionText: '题目',
                answerText: '答案',
                analysis: '解析',
                knowledgePoints: [],
            });

            const request = new Request('http://localhost/api/practice/generate', {
                method: 'POST',
                body: JSON.stringify({
                    errorItemId: 'error-item-1',
                    language: 'zh',
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await GENERATE_POST(request);

            expect(response.status).toBe(200);
            // 應該使用空陣列作為標籤
            expect(mocks.mockAIService.generateSimilarQuestion).toHaveBeenCalledWith(
                expect.any(String),
                [], // 空陣列
                'zh',
                'medium'
            );
        });

        it('應該處理空的知識點', async () => {
            const errorItemWithNoTags = {
                ...mockErrorItem,
                knowledgePoints: null,
            };
            mocks.mockPrismaErrorItem.findUnique.mockResolvedValue(errorItemWithNoTags);
            mocks.mockAIService.generateSimilarQuestion.mockResolvedValue({
                questionText: '题目',
                answerText: '答案',
                analysis: '解析',
                knowledgePoints: [],
            });

            const request = new Request('http://localhost/api/practice/generate', {
                method: 'POST',
                body: JSON.stringify({
                    errorItemId: 'error-item-1',
                    language: 'zh',
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await GENERATE_POST(request);

            expect(response.status).toBe(200);
        });

        it('應該從數據庫獲取正確的學科', async () => {
            const errorItemWithPhysics = {
                ...mockErrorItem,
                subject: { id: 'physics', name: '物理' },
            };
            mocks.mockPrismaErrorItem.findUnique.mockResolvedValue(errorItemWithPhysics);
            mocks.mockAIService.generateSimilarQuestion.mockResolvedValue({
                questionText: '物理題目',
                answerText: '答案',
                analysis: '解析',
                knowledgePoints: [],
                subject: undefined, // AI 返回的可能沒有學科
            });

            const request = new Request('http://localhost/api/practice/generate', {
                method: 'POST',
                body: JSON.stringify({
                    errorItemId: 'error-item-1',
                    language: 'zh',
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await GENERATE_POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.subject).toBe('物理'); // 應該從數據庫注入
        });

        it('應該處理未知學科為"其他"', async () => {
            const errorItemWithUnknownSubject = {
                ...mockErrorItem,
                subject: { id: 'unknown', name: '未知學科' },
            };
            mocks.mockPrismaErrorItem.findUnique.mockResolvedValue(errorItemWithUnknownSubject);
            mocks.mockAIService.generateSimilarQuestion.mockResolvedValue({
                questionText: '题目',
                answerText: '答案',
                analysis: '解析',
                knowledgePoints: [],
            });

            const request = new Request('http://localhost/api/practice/generate', {
                method: 'POST',
                body: JSON.stringify({
                    errorItemId: 'error-item-1',
                    language: 'zh',
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await GENERATE_POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.subject).toBe('其他');
        });

        it('應該處理沒有關聯學科的錯題', async () => {
            const errorItemWithNoSubject = {
                ...mockErrorItem,
                subject: null,
            };
            mocks.mockPrismaErrorItem.findUnique.mockResolvedValue(errorItemWithNoSubject);
            mocks.mockAIService.generateSimilarQuestion.mockResolvedValue({
                questionText: '題目',
                answerText: '答案',
                analysis: '解析',
                knowledgePoints: [],
            });

            const request = new Request('http://localhost/api/practice/generate', {
                method: 'POST',
                body: JSON.stringify({
                    errorItemId: 'error-item-1',
                    language: 'zh',
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await GENERATE_POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.subject).toBe('其他');
        });

        it('應該處理 AI 服務錯誤', async () => {
            mocks.mockPrismaErrorItem.findUnique.mockResolvedValue(mockErrorItem);
            mocks.mockAIService.generateSimilarQuestion.mockRejectedValue(
                new Error('AI service unavailable')
            );

            const request = new Request('http://localhost/api/practice/generate', {
                method: 'POST',
                body: JSON.stringify({
                    errorItemId: 'error-item-1',
                    language: 'zh',
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await GENERATE_POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.message).toBe('AI service unavailable');
        });
    });

    describe('POST /api/practice/record (記錄練習結果)', () => {
        it('應該成功記錄正確的練習結果', async () => {
            const createdRecord = {
                id: 'record-1',
                userId: 'user-123',
                subject: '數學',
                difficulty: 'medium',
                isCorrect: true,
                createdAt: new Date(),
            };
            mocks.mockPrismaPracticeRecord.create.mockResolvedValue(createdRecord);

            const request = new Request('http://localhost/api/practice/record', {
                method: 'POST',
                body: JSON.stringify({
                    subject: '數學',
                    difficulty: 'medium',
                    isCorrect: true,
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await RECORD_POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.subject).toBe('數學');
            expect(data.isCorrect).toBe(true);
        });

        it('應該成功記錄錯誤的練習結果', async () => {
            const createdRecord = {
                id: 'record-2',
                userId: 'user-123',
                subject: '英語',
                difficulty: 'hard',
                isCorrect: false,
                createdAt: new Date(),
            };
            mocks.mockPrismaPracticeRecord.create.mockResolvedValue(createdRecord);

            const request = new Request('http://localhost/api/practice/record', {
                method: 'POST',
                body: JSON.stringify({
                    subject: '英語',
                    difficulty: 'hard',
                    isCorrect: false,
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await RECORD_POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.isCorrect).toBe(false);
        });

        it('應該記錄不同學科的練習結果', async () => {
            const subjects = ['數學', '物理', '化學', '英語', '國文'];

            for (const subject of subjects) {
                mocks.mockPrismaPracticeRecord.create.mockResolvedValue({
                    id: `record-${subject}`,
                    userId: 'user-123',
                    subject,
                    difficulty: 'medium',
                    isCorrect: true,
                });

                const request = new Request('http://localhost/api/practice/record', {
                    method: 'POST',
                    body: JSON.stringify({
                        subject,
                        difficulty: 'medium',
                        isCorrect: true,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                });

                const response = await RECORD_POST(request);
                expect(response.status).toBe(200);
            }
        });

        it('應該拒絕未登入用戶', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);

            const request = new Request('http://localhost/api/practice/record', {
                method: 'POST',
                body: JSON.stringify({
                    subject: '數學',
                    difficulty: 'medium',
                    isCorrect: true,
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await RECORD_POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.message).toBe('Unauthorized');
        });

        it('應該拒絕 session 中沒有 user 的請求', async () => {
            vi.mocked(getServerSession).mockResolvedValue({
                user: undefined,
                expires: '2025-12-31',
            } as any);

            const request = new Request('http://localhost/api/practice/record', {
                method: 'POST',
                body: JSON.stringify({
                    subject: '數學',
                    difficulty: 'medium',
                    isCorrect: true,
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await RECORD_POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.message).toBe('Unauthorized');
        });

        it('應該處理數據庫錯誤', async () => {
            mocks.mockPrismaPracticeRecord.create.mockRejectedValue(
                new Error('Database connection failed')
            );

            const request = new Request('http://localhost/api/practice/record', {
                method: 'POST',
                body: JSON.stringify({
                    subject: '數學',
                    difficulty: 'medium',
                    isCorrect: true,
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await RECORD_POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.message).toBe('Failed to save record');
        });
    });
});
