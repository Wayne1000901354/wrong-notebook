import { z } from 'zod';

/**
 * Zod schema for validating AI-parsed questions
 * Ensures type safety and business rule compliance
 */
export const ParsedQuestionSchema = z.object({
    questionText: z.string().min(1, "題目文本不能為空"),
    answerText: z.string().min(1, "答案不能為空"),
    analysis: z.string().min(1, "解析不能為空"),
    subject: z.enum([
        "數學", "物理", "化學", "生物",
        "英語", "國文", "歷史", "地理",
        "公民", "其他"
    ]).describe("題目所屬學科"),
    knowledgePoints: z.array(z.string()).max(5, "知識點最多 5 個"),
    requiresImage: z.boolean().optional().default(false), // 題目是否依賴圖片（如幾何題）
});

/**
 * Type inference from Zod schema
 * Use this type instead of manually defining ParsedQuestion
 */
export type ParsedQuestionFromSchema = z.infer<typeof ParsedQuestionSchema>;

/**
 * Validates and parses AI response JSON
 * @param data - Raw JSON data from AI
 * @returns Validated ParsedQuestion object
 * @throws ZodError if validation fails
 */
export function validateParsedQuestion(data: unknown): ParsedQuestionFromSchema {
    return ParsedQuestionSchema.parse(data);
}

/**
 * Safe validation that returns success/error object
 * @param data - Raw JSON data from AI
 */
export function safeParseParsedQuestion(data: unknown) {
    return ParsedQuestionSchema.safeParse(data);
}
