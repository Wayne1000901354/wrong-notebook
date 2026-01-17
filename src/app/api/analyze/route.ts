import { NextResponse } from "next/server";
import { getAIService } from "@/lib/ai";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { calculateGradeNumber, inferSubjectFromName } from "@/lib/knowledge-tags";
import { prisma } from "@/lib/prisma";
import { badRequest, internalError, createErrorResponse, ErrorCode } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";

const logger = createLogger('api:analyze');

export async function POST(req: Request) {
    logger.info('Analyze API called');

    const session = await getServerSession(authOptions);

    // 認證檢查
    if (!session) {
        logger.warn('Unauthorized access attempt');
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        let { imageBase64, mimeType, language, subjectId } = body;

        logger.debug({
            imageLength: imageBase64?.length,
            mimeType,
            language,
            subjectId
        }, 'Request received');

        if (!imageBase64) {
            logger.warn('Missing image data');
            return badRequest("Missing image data");
        }

        // Parse Data URL if present
        if (imageBase64.startsWith('data:')) {
            const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                mimeType = matches[1];
                imageBase64 = matches[2];
                logger.debug({ mimeType, base64Length: imageBase64.length }, 'Parsed Data URL');
            }
        }

        // 先獲取用戶年級信息，用於動態生成 AI prompt 中的標籤列表
        let userGrade: 7 | 8 | 9 | 10 | 11 | 12 | null = null;
        let subjectName: 'math' | 'physics' | 'chemistry' | 'biology' | 'english' | 'chinese' | 'history' | 'geography' | 'politics' | null = null;

        if (session?.user?.email) {
            try {
                // 獲取用戶信息
                const user = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: { educationStage: true, enrollmentYear: true }
                });

                if (user) {
                    userGrade = calculateGradeNumber(user.educationStage, user.enrollmentYear);
                    logger.debug({ userGrade }, 'Calculated user grade');
                }

                // 獲取錯題本信息以推斷學科
                if (subjectId) {
                    const subject = await prisma.subject.findUnique({
                        where: { id: subjectId },
                        select: { name: true }
                    });

                    if (subject) {
                        subjectName = inferSubjectFromName(subject.name);
                        logger.debug({ subjectName, subjectDisplayName: subject.name }, 'Inferred subject');
                    }
                }
            } catch (error) {
                logger.error({ error }, 'Error fetching user/subject info');
                // 繼續執行，不傳遞年級參數（會返回所有年級的標籤）
            }
        }


        // 將內部科目名稱轉換為中文科目名稱
        const subjectNameMapping: Record<string, string> = {
            'math': '數學',
            'physics': '物理',
            'chemistry': '化學',
            'biology': '生物',
            'chinese': '國文',
            'english': '英語',
            'history': '歷史',
            'geography': '地理',
            'politics': '公民',
            'others': '其他'
        };
        const subjectChinese = subjectName ? subjectNameMapping[subjectName] : null;

        logger.info({ userGrade, subject: subjectChinese }, 'Calling AI service for image analysis');
        const aiService = getAIService();
        const analysisResult = await aiService.analyzeImage(imageBase64, mimeType, language, userGrade, subjectChinese);

        logger.debug({
            knowledgePointsCount: analysisResult.knowledgePoints?.length,
            knowledgePointsType: typeof analysisResult.knowledgePoints,
            isArray: Array.isArray(analysisResult.knowledgePoints)
        }, 'AI returned knowledge points');

        // AI 現在從數據庫獲取標籤列表，返回的標籤已經是標準化的，不需要額外處理
        if (!analysisResult.knowledgePoints || analysisResult.knowledgePoints.length === 0) {
            logger.warn('Knowledge points is empty or null');
        }

        logger.info('AI analysis successful');

        return NextResponse.json(analysisResult);
    } catch (error: any) {
        logger.error({
            error: error.message,
            stack: error.stack
        }, 'Analysis error occurred');

        // 返回具體的錯誤類型，便於前端顯示詳細提示
        let errorMessage = error.message || "Failed to analyze image";

        // 識別特定錯誤類型
        if (error.message && (
            error.message === 'AI_CONNECTION_FAILED' ||
            error.message === 'AI_RESPONSE_ERROR' ||
            error.message.includes('AI_AUTH_ERROR') ||
            error.message === 'AI_TIMEOUT_ERROR' ||
            error.message === 'AI_QUOTA_EXCEEDED' ||
            error.message === 'AI_PERMISSION_DENIED' ||
            error.message === 'AI_NOT_FOUND' ||
            error.message === 'AI_SERVICE_UNAVAILABLE' ||
            error.message === 'AI_UNKNOWN_ERROR'
        )) {
            // 直接傳遞 AI Provider 定義的錯誤類型 (如果是 AI_AUTH_ERROR，提取出來)
            if (error.message.includes('AI_AUTH_ERROR')) {
                errorMessage = 'AI_AUTH_ERROR';
            } else {
                errorMessage = error.message;
            }
        } else if (error.message?.includes('Zod') || error.message?.includes('validate')) {
            // Zod 驗證錯誤
            errorMessage = 'AI_RESPONSE_ERROR';
        }

        return createErrorResponse(errorMessage, 500, ErrorCode.AI_ERROR, error.message);
    }
}
