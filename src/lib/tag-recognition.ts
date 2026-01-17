
import { prisma } from "@/lib/prisma";

export async function findParentTagIdForGrade(gradeSemester: string | null | undefined, subjectKey: string): Promise<string | null> {
    if (!gradeSemester || !subjectKey) return null;

    // Fetch all system root tags for the subject (which are typically Grades)
    // We filter by parentId: null to get only the top level (Grades)
    const rootTags = await prisma.knowledgeTag.findMany({
        where: {
            subject: subjectKey,
            isSystem: true,
            parentId: null
        },
        select: { id: true, name: true }
    });

    if (rootTags.length === 0) return null;

    const normalizedInput = gradeSemester.trim();

    // 1. Try Exact Match
    const exactMatch = rootTags.find(t => t.name === normalizedInput);
    if (exactMatch) return exactMatch.id;

    // 2. Try Mapped Match (Text Heuristics)
    // Convert input specifically to match the likely seed data format (e.g. "七年級上")
    // Input might be "初一，上期", "Grade 7, 1st Semester", etc.

    // Helper map for Chinese Grade names
    const gradeLevelMap: Record<string, string> = {
        "一年级": "一年級", "Grade 1": "一年級", "一年級": "一年級",
        "二年级": "二年級", "Grade 2": "二年級", "二年級": "二年級",
        "三年级": "三年級", "Grade 3": "三年級", "三年級": "三年級",
        "四年级": "四年級", "Grade 4": "四年級", "四年級": "四年級",
        "五年级": "五年級", "Grade 5": "五年級", "五年級": "五年級",
        "六年级": "六年級", "Grade 6": "六年級", "六年級": "六年級",
        "初一": "國一", "Grade 7": "國一", "七年级": "國一", "七年級": "國一", "國一": "國一",
        "初二": "國二", "Grade 8": "國二", "八年级": "國二", "八年級": "國二", "國二": "國二",
        "初三": "國三", "Grade 9": "國三", "九年级": "國三", "九年級": "國三", "國三": "國三",
        "高一": "高一", "Grade 10": "高一", "Senior 1": "高一",
        "高二": "高二", "Grade 11": "高二", "Senior 2": "高二",
        "高三": "高三", "Grade 12": "高三", "Senior 3": "高三",
    };

    let targetGradePrefix = "";
    for (const [key, value] of Object.entries(gradeLevelMap)) {
        if (normalizedInput.includes(key)) {
            targetGradePrefix = value;
            break; // Found the grade level
        }
    }

    if (!targetGradePrefix) return null; // Couldn't identify grade level

    // Special case: "高三" in seed data often doesn't have semesters (based on previous check)
    // But let's check what root tags are available.

    // Determine Semester
    let targetSemester = "";
    if (normalizedInput.includes("上") || normalizedInput.includes("1st") || normalizedInput.includes("First")) {
        targetSemester = "上";
    } else if (normalizedInput.includes("下") || normalizedInput.includes("2nd") || normalizedInput.includes("Second")) {
        targetSemester = "下";
    }

    // Construct candidates
    // Candidate 1: Grade + Semester (e.g. "七年級上")
    // Candidate 2: Grade (e.g. "一年級", or "高三")

    const candidates = [];
    if (targetSemester) {
        candidates.push(`${targetGradePrefix}${targetSemester}`); // e.g. "七年級上"
    }
    candidates.push(targetGradePrefix); // e.g. "一年級", "高三"

    for (const candidate of candidates) {
        const match = rootTags.find(t => t.name === candidate);
        if (match) return match.id;
    }



    return null;
}
