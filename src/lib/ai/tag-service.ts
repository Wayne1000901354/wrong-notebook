/**
 * 從資料庫獲取 AI 分析所需的標籤
 * 替代原有的 getMathTagsByGrade 函數
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ai:tag-service');

interface TagTreeNode {
    id: string;
    name: string;
    parentId: string | null;
    children?: TagTreeNode[];
}

/**
 * 從資料庫獲取指定年級的數學標籤
 * @param grade - 年級 (7-9:國中, 10-12:高中) 或 null
 * @returns 標籤名稱數組
 */
export async function getMathTagsFromDB(grade: 7 | 8 | 9 | 10 | 11 | 12 | null): Promise<string[]> {
    const gradeToSemesterMap: Record<number, string[]> = {
        7: ['七年級上', '七年級下'],
        8: ['八年級上', '八年級下'],
        9: ['九年級上', '九年級下'],
        10: ['高一上', '高一下'],
        11: ['高二上', '高二下'],
        12: ['高三上', '高三下'],
    };

    // 確定要查詢的年級學期
    let semesterNames: string[] = [];

    if (!grade) {
        // 無年級資訊，返回所有標籤
        semesterNames = Object.values(gradeToSemesterMap).flat();
    } else if (grade >= 7 && grade <= 9) {
        // 國中累進式：當前年級及之前
        for (let g = 7; g <= grade; g++) {
            semesterNames.push(...(gradeToSemesterMap[g] || []));
        }
    } else {
        // 高中累進式：從高一開始
        for (let g = 10; g <= grade; g++) {
            semesterNames.push(...(gradeToSemesterMap[g] || []));
        }
    }

    try {
        // 獲取所有頂層節點（年級學期）
        const topLevelTags = await prisma.knowledgeTag.findMany({
            where: {
                subject: 'math',
                parentId: null,
                name: { in: semesterNames },
            },
            select: { id: true },
        });

        const topLevelIds = topLevelTags.map(t => t.id);

        // 遞歸獲取所有葉子節點標籤
        const allTags = await prisma.knowledgeTag.findMany({
            where: {
                subject: 'math',
                isSystem: true,
            },
            select: {
                id: true,
                name: true,
                parentId: true,
            },
        });

        // 構建父子關係映射
        const childMap = new Map<string, string[]>();
        allTags.forEach(tag => {
            if (tag.parentId) {
                const children = childMap.get(tag.parentId) || [];
                children.push(tag.id);
                childMap.set(tag.parentId, children);
            }
        });

        // 遞歸收集所有後代ID
        const collectDescendants = (nodeId: string): string[] => {
            const children = childMap.get(nodeId) || [];
            if (children.length === 0) return [nodeId]; // 葉子節點
            return children.flatMap(cid => collectDescendants(cid));
        };

        // 收集所有目標年級的葉子節點
        const leafIds = new Set<string>();
        topLevelIds.forEach(id => {
            collectDescendants(id).forEach(leafId => leafIds.add(leafId));
        });

        // 獲取葉子節點名稱
        const tagNameMap = new Map(allTags.map(t => [t.id, t.name]));
        const result = Array.from(leafIds)
            .map(id => tagNameMap.get(id))
            .filter((name): name is string => !!name);

        return result;
    } catch (error) {
        logger.error({ error }, 'getMathTagsFromDB error');
        return [];
    }
}

/**
 * 從資料庫獲取指定學科的標籤
 * @param subject - 學科 (math, physics, chemistry, english, etc.)
 * @returns 標籤名稱數組
 */
export async function getTagsFromDB(subject: string): Promise<string[]> {
    try {
        const tags = await prisma.knowledgeTag.findMany({
            where: {
                subject,
                isSystem: true,
                // 只獲取葉子節點
                children: { none: {} },
            },
            select: { name: true },
            orderBy: { order: 'asc' },
        });

        return tags.map(t => t.name);
    } catch (error) {
        logger.error({ error }, 'getTagsFromDB error');
        return [];
    }
}
