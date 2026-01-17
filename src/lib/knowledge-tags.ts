/**
 * 知識點標籤工具函數
 * 
 * 注意：課程數據已遷移到數據庫，通過 seed scripts 導入。
 * 此文件僅保留通用工具函數。
 */

/**
 * 根據教育階段和入學年份計算當前年級數字
 * @param educationStage 教育階段 ('junior_high' | 'senior_high')
 * @param enrollmentYear 入學年份
 * @returns 年級 (7-12) 或 null
 */
export function calculateGradeNumber(
    educationStage: string | null,
    enrollmentYear: number | null
): 7 | 8 | 9 | 10 | 11 | 12 | null {
    if (!enrollmentYear) {
        return null;
    }

    // 只處理國中和高中
    if (educationStage !== 'junior_high' && educationStage !== 'senior_high') {
        return null;
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // 計算入學後的年數
    let yearsInSchool = currentYear - enrollmentYear;

    // 如果當前月份在9月之前,說明還沒開學,年級要減1
    if (currentMonth < 9) {
        yearsInSchool -= 1;
    }

    if (educationStage === 'junior_high') {
        // 國中: 入學第1年=7年級, 第2年=8年級, 第3年=9年級
        const grade = 7 + yearsInSchool;
        if (grade >= 7 && grade <= 9) {
            return grade as 7 | 8 | 9;
        }
    } else if (educationStage === 'senior_high') {
        // 高中: 入學第1年=10年級(高一), 第2年=11年級(高二), 第3年=12年級(高三)
        const grade = 10 + yearsInSchool;
        if (grade >= 10 && grade <= 12) {
            return grade as 10 | 11 | 12;
        }
    }

    return null;
}

/**
 * 從錯題本名稱推斷學科
 * @param subjectName 錯題本名稱
 * @returns 學科標識
 */
export function inferSubjectFromName(subjectName: string | null): 'math' | 'physics' | 'chemistry' | 'biology' | 'english' | 'chinese' | 'history' | 'geography' | 'politics' | null {
    if (!subjectName) return null;

    const lowerName = subjectName.toLowerCase();

    if (lowerName.includes('math') || lowerName.includes('數學') || lowerName.includes('数学')) return 'math';
    if (lowerName.includes('physics') || lowerName.includes('物理')) return 'physics';
    if (lowerName.includes('chemistry') || lowerName.includes('化學') || lowerName.includes('化学')) return 'chemistry';
    if (lowerName.includes('biology') || lowerName.includes('生物')) return 'biology';
    if (lowerName.includes('english') || lowerName.includes('英語') || lowerName.includes('英语')) return 'english';
    if (lowerName.includes('chinese') || lowerName.includes('國文') || lowerName.includes('語文') || lowerName.includes('语文')) return 'chinese';
    if (lowerName.includes('history') || lowerName.includes('歷史') || lowerName.includes('历史')) return 'history';
    if (lowerName.includes('geography') || lowerName.includes('地理')) return 'geography';
    if (lowerName.includes('politics') || lowerName.includes('公民') || lowerName.includes('政治')) return 'politics';

    return null;
}
