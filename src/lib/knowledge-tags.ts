/**
 * 知识点标签工具函数
 * 
 * 注意：課程數據已遷移到數據庫，通過 seed scripts 導入。
 * 此文件僅保留通用工具函數。
 */

/**
 * 根据教育阶段和入学年份计算当前年级数字
 * @param educationStage 教育阶段 ('junior_high' | 'senior_high')
 * @param enrollmentYear 入学年份
 * @returns 年级 (7-12) 或 null
 */
export function calculateGradeNumber(
    educationStage: string | null,
    enrollmentYear: number | null
): 7 | 8 | 9 | 10 | 11 | 12 | null {
    if (!enrollmentYear) {
        return null;
    }

    // 只处理初中和高中
    if (educationStage !== 'junior_high' && educationStage !== 'senior_high') {
        return null;
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // 计算入学后的年数
    let yearsInSchool = currentYear - enrollmentYear;

    // 如果当前月份在9月之前,说明还没开学,年级要减1
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
 * 从错题本名称推断学科
 * @param subjectName 错题本名称
 * @returns 学科标识
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
