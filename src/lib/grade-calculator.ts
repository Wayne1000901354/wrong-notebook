export function calculateGrade(
    educationStage: string,
    enrollmentYear: number,
    currentDate: Date = new Date(),
    language: 'zh' | 'en' = 'en'
): string {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    let gradeLevel = currentYear - enrollmentYear;
    let semesterKey = "2nd"; // 1st or 2nd

    if (currentMonth >= 9) {
        gradeLevel += 1;
        semesterKey = "1st";
    } else if (currentMonth < 2) {
        semesterKey = "1st";
    } else {
        semesterKey = "2nd";
    }

    const isZh = language === 'zh';

    const semesterName = isZh
        ? (semesterKey === "1st" ? "上學期" : "下學期")
        : (semesterKey === "1st" ? "1st Semester" : "2nd Semester");

    const stageMapZh: Record<string, string[]> = {
        primary: ["一年級", "二年級", "三年級", "四年級", "五年級", "六年級"],
        junior_high: ["國一", "國二", "國三"],
        senior_high: ["高一", "高二", "高三"],
        university: ["大一", "大二", "大三", "大四"],
    };

    const stageMapEn: Record<string, string[]> = {
        primary: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
        junior_high: ["Junior High Grade 1", "Junior High Grade 2", "Junior High Grade 3"],
        senior_high: ["Senior High Grade 1", "Senior High Grade 2", "Senior High Grade 3"],
        university: ["Freshman", "Sophomore", "Junior", "Senior"],
    };

    const stageMap = isZh ? stageMapZh : stageMapEn;

    const grades = stageMap[educationStage] || [];

    // Handle out of bounds
    let gradeStr = `${gradeLevel}`;
    if (gradeLevel > 0 && gradeLevel <= grades.length) {
        gradeStr = grades[gradeLevel - 1];
    } else if (gradeLevel > grades.length) {
        gradeStr = isZh ? "已畢業" : "Graduated";
    } else {
        gradeStr = isZh ? "學前" : "Pre-school";
    }

    if (isZh) {
        // Match UI tag format: "高一上", "國一下" instead of "高一，上學期"
        // Semester suffix: "上" or "下"
        const suffix = semesterKey === "1st" ? "上" : "下";
        return `${gradeStr}${suffix}`;
    } else {
        return `${gradeStr}, ${semesterName}`;
    }
}
