/**
 * 錯題知識點遷移腳本
 * 將現有 ErrorItem.knowledgePoints (JSON string) 遷移到 KnowledgeTag 關聯
 * 
 * 使用: npx tsx scripts/migrate-error-tags.ts
 */

import { PrismaClient } from '@prisma/client';
import { findParentTagIdForGrade } from '../src/lib/tag-recognition';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 開始遷移錯題知識點數據...\n');

    // 獲取所有有 knowledgePoints 的錯題
    const errorItems = await prisma.errorItem.findMany({
        where: {
            knowledgePoints: { not: null }
        },
        select: {
            id: true,
            knowledgePoints: true,
            subject: {
                select: { name: true }
            },
            gradeSemester: true,
        }
    });

    console.log(`📊 找到 ${errorItems.length} 條需要遷移的錯題\n`);

    let migratedCount = 0;
    let createdTagsCount = 0;
    let linkedTagsCount = 0;

    for (const item of errorItems) {
        if (!item.knowledgePoints) continue;

        // 解析知識點 (可能是 JSON 陣列或逗號分隔字串)
        let tags: string[] = [];
        try {
            const parsed = JSON.parse(item.knowledgePoints);
            if (Array.isArray(parsed)) {
                tags = parsed.filter((t): t is string => typeof t === 'string');
            }
        } catch {
            // 嘗試逗號分隔
            tags = item.knowledgePoints.split(',').map(t => t.trim()).filter(Boolean);
        }

        if (tags.length === 0) continue;

        // 推斷學科
        const subject = item.subject?.name?.toLowerCase() || 'math';
        const subjectKey = subject.includes('math') || subject.includes('數學') ? 'math' :
            subject.includes('english') || subject.includes('英語') ? 'english' :
                subject.includes('physics') || subject.includes('物理') ? 'physics' :
                    subject.includes('chemistry') || subject.includes('化學') ? 'chemistry' : 'other';

        // 為每個標籤找到或創建對應的 KnowledgeTag
        const tagIds: string[] = [];
        for (const tagName of tags) {
            // 先查找是否存在
            let tag = await prisma.knowledgeTag.findFirst({
                where: {
                    name: tagName,
                    subject: subjectKey,
                }
            });

            // 不存在則創建為自定義標籤 (系統級)
            if (!tag) {
                // 嘗試根據錯題的年級學期查找 parentId
                const gradeStr = item.gradeSemester;
                const parentId = await findParentTagIdForGrade(gradeStr, subjectKey);

                tag = await prisma.knowledgeTag.create({
                    data: {
                        name: tagName,
                        subject: subjectKey,
                        isSystem: false, // 標記為非系統標籤，但無用戶歸屬
                        parentId: parentId || null
                    }
                });
                createdTagsCount++;
            }

            tagIds.push(tag.id);
        }

        // 關聯到錯題
        if (tagIds.length > 0) {
            await prisma.errorItem.update({
                where: { id: item.id },
                data: {
                    tags: {
                        connect: tagIds.map(id => ({ id }))
                    }
                }
            });
            linkedTagsCount += tagIds.length;
        }

        migratedCount++;
        if (migratedCount % 50 === 0) {
            console.log(`  已處理 ${migratedCount}/${errorItems.length} 條...`);
        }
    }

    console.log(`\n✅ 遷移完成!`);
    console.log(`   - 處理錯題數: ${migratedCount}`);
    console.log(`   - 新建標籤數: ${createdTagsCount}`);
    console.log(`   - 創建關聯數: ${linkedTagsCount}`);
}

main()
    .catch((e) => {
        console.error('❌ 遷移失敗:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
