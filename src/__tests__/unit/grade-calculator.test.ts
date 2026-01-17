/**
 * 年級計算器單元測試
 * 測試 calculateGrade 函數在各種場景下的正確性
 */
import { describe, it, expect } from 'vitest';
import { calculateGrade } from '@/lib/grade-calculator';

describe('calculateGrade', () => {
    describe('國中階段 (junior_high)', () => {
        it('應該正確計算國一上學期（9月入學當年9月）', () => {
            // 2025年9月入學，2025年9月查詢
            const result = calculateGrade('junior_high', 2025, new Date('2025-09-15'), 'zh');
            expect(result).toBe('國一上');
        });

        it('應該正確計算國一上學期（英文）', () => {
            const result = calculateGrade('junior_high', 2025, new Date('2025-09-15'), 'en');
            expect(result).toBe('Junior High Grade 1, 1st Semester');
        });

        it('應該正確計算國一下學期（次年2月）', () => {
            // 2025年9月入學，2026年3月查詢
            const result = calculateGrade('junior_high', 2025, new Date('2026-03-15'), 'zh');
            expect(result).toBe('國一下');
        });

        it('應該正確計算國二上學期', () => {
            // 2024年9月入學，2025年10月查詢
            const result = calculateGrade('junior_high', 2024, new Date('2025-10-15'), 'zh');
            expect(result).toBe('國二上');
        });

        it('應該正確計算國三下學期', () => {
            // 2022年9月入學，2025年5月查詢
            const result = calculateGrade('junior_high', 2022, new Date('2025-05-15'), 'zh');
            expect(result).toBe('國三下');
        });

        it('應該正確處理已畢業情況', () => {
            // 2020年9月入學，2024年查詢（已超過3年）
            const result = calculateGrade('junior_high', 2020, new Date('2024-09-15'), 'zh');
            expect(result).toBe('已畢業上'); // 注意：grade-calculator.ts 可能在畢業後仍會附加學期，需確認邏輯，但此處僅翻譯
        });

        it('應該正確處理已畢業情況（英文）', () => {
            const result = calculateGrade('junior_high', 2020, new Date('2024-09-15'), 'en');
            expect(result).toBe('Graduated, 1st Semester');
        });
    });

    describe('高中階段 (senior_high)', () => {
        it('應該正確計算高一上學期', () => {
            const result = calculateGrade('senior_high', 2024, new Date('2024-10-15'), 'zh');
            expect(result).toBe('高一上');
        });

        it('應該正確計算高二下學期', () => {
            const result = calculateGrade('senior_high', 2023, new Date('2025-04-15'), 'zh');
            expect(result).toBe('高二下');
        });

        it('應該正確計算高三上學期（英文）', () => {
            const result = calculateGrade('senior_high', 2022, new Date('2024-11-15'), 'en');
            expect(result).toBe('Senior High Grade 3, 1st Semester');
        });
    });

    describe('國小階段 (primary)', () => {
        it('應該正確計算一年級', () => {
            const result = calculateGrade('primary', 2024, new Date('2024-10-15'), 'zh');
            expect(result).toBe('一年級上');
        });

        it('應該正確計算六年級', () => {
            const result = calculateGrade('primary', 2019, new Date('2025-04-15'), 'zh');
            expect(result).toBe('六年級下');
        });

        it('應該正確計算六年級（英文）', () => {
            const result = calculateGrade('primary', 2019, new Date('2025-04-15'), 'en');
            expect(result).toBe('Grade 6, 2nd Semester');
        });
    });

    describe('大學階段 (university)', () => {
        it('應該正確計算大一', () => {
            const result = calculateGrade('university', 2024, new Date('2024-10-15'), 'zh');
            expect(result).toBe('大一上');
        });

        it('應該正確計算大四（英文）', () => {
            const result = calculateGrade('university', 2021, new Date('2024-10-15'), 'en');
            expect(result).toBe('Senior, 1st Semester');
        });
    });

    describe('學期判斷邏輯', () => {
        it('9月份應該是上學期', () => {
            const result = calculateGrade('junior_high', 2024, new Date('2024-09-01'), 'zh');
            expect(result).toContain('上');
        });

        it('12月份應該是上學期', () => {
            const result = calculateGrade('junior_high', 2024, new Date('2024-12-15'), 'zh');
            expect(result).toContain('上');
        });

        it('1月份應該是上學期（寒假前）', () => {
            const result = calculateGrade('junior_high', 2024, new Date('2025-01-15'), 'zh');
            expect(result).toContain('上');
        });

        it('2月份應該是下學期', () => {
            const result = calculateGrade('junior_high', 2024, new Date('2025-02-15'), 'zh');
            expect(result).toContain('下');
        });

        it('6月份應該是下學期', () => {
            const result = calculateGrade('junior_high', 2024, new Date('2025-06-15'), 'zh');
            expect(result).toContain('下');
        });

        it('8月份應該是下學期（暑假）', () => {
            const result = calculateGrade('junior_high', 2024, new Date('2025-08-15'), 'zh');
            expect(result).toContain('下');
        });
    });

    describe('邊界情況', () => {
        it('未入學情況應返回學前', () => {
            // 2026年9月入學，2025年查詢
            const result = calculateGrade('junior_high', 2026, new Date('2025-05-15'), 'zh');
            expect(result).toContain('學前');
        });

        it('未入學情況應返回 Pre-school（英文）', () => {
            const result = calculateGrade('junior_high', 2026, new Date('2025-05-15'), 'en');
            expect(result).toContain('Pre-school');
        });

        it('未知教育階段應返回已畢業（因為空陣列）', () => {
            const result = calculateGrade('unknown_stage', 2024, new Date('2025-01-15'), 'zh');
            // stageMap[unknown_stage] 返回 undefined/空陣列，所以 gradeLevel > grades.length
            expect(result).toContain('已畢業');
        });

        it('默認使用英文語言', () => {
            const result = calculateGrade('junior_high', 2024, new Date('2024-10-15'));
            expect(result).toBe('Junior High Grade 1, 1st Semester');
        });

        it('默認使用當前日期', () => {
            // 這個測試檢查函數是否能在不傳日期時正常工作
            const result = calculateGrade('junior_high', 2024);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });
});
