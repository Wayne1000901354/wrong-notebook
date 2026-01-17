/**
 * 年級計算功能測試腳本
 * 
 * 功能：
 * 1. 測試 calculateGrade 函數的各種場景
 * 2. 驗證不同教育階段(國小、國中)的年級計算
 * 3. 驗證不同時間點的學期計算
 * 4. 輸出測試結果統計
 * 
 * 用途：用於確保年級和學期計算邏輯的正確性
 */
import { calculateGrade } from "../src/lib/grade-calculator";

const testCases = [
    {
        stage: "junior_high",
        enrolled: 2024,
        date: new Date("2024-09-01"),
        expected: "Junior High Grade 1, 1st Semester"
    },
    {
        stage: "junior_high",
        enrolled: 2024,
        date: new Date("2025-01-15"),
        expected: "Junior High Grade 1, 1st Semester"
    },
    {
        stage: "junior_high",
        enrolled: 2024,
        date: new Date("2025-03-01"),
        expected: "Junior High Grade 1, 2nd Semester"
    },
    {
        stage: "junior_high",
        enrolled: 2024,
        date: new Date("2025-09-01"),
        expected: "Junior High Grade 2, 1st Semester"
    },
    {
        stage: "primary",
        enrolled: 2020,
        date: new Date("2025-11-30"),
        // 2025 - 2020 = 5. Month 11 >= 9. Grade 5+1 = 6.
        expected: "Primary School Grade 6, 1st Semester"
    }
];

console.log("Running Grade Calculation Tests...");
let passed = 0;
testCases.forEach((tc, i) => {
    const result = calculateGrade(tc.stage, tc.enrolled, tc.date);
    if (result === tc.expected) {
        console.log(`Test Case ${i + 1}: PASS`);
        passed++;
    } else {
        console.error(`Test Case ${i + 1}: FAIL`);
        console.error(`  Expected: ${tc.expected}`);
        console.error(`  Got:      ${result}`);
    }
});

console.log(`\nPassed ${passed}/${testCases.length} tests.`);
if (passed === testCases.length) {
    process.exit(0);
} else {
    process.exit(1);
}
