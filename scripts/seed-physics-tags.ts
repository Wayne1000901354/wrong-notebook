/**
 * 物理標籤導入腳本
 * 將物理課程大綱導入到 KnowledgeTag 表
 * 
 * 使用方法: npx tsx scripts/seed-physics-tags.ts
 */

import { PrismaClient } from '@prisma/client';
import { PHYSICS_CURRICULUM, PHYSICS_GRADE_ORDER } from '../src/lib/tag-data/physics';

const prisma = new PrismaClient();

async function main() {
    console.log('🔬 開始導入物理標籤...');

    // 清空現有物理系統標籤
    console.log('🗑️  清空現有物理系統標籤...');
    await prisma.knowledgeTag.deleteMany({
        where: { isSystem: true, subject: 'physics' }
    });

    let totalCreated = 0;

    for (const [gradeSemester, chapters] of Object.entries(PHYSICS_CURRICULUM)) {
        console.log(`\n📚 處理年級: ${gradeSemester}`);

        // 創建年級節點
        const gradeNode = await prisma.knowledgeTag.create({
            data: {
                name: gradeSemester,
                subject: 'physics',
                parentId: null,
                isSystem: true,
                order: PHYSICS_GRADE_ORDER[gradeSemester] || 99,
            },
        });
        totalCreated++;

        for (let chapterIdx = 0; chapterIdx < chapters.length; chapterIdx++) {
            const chapter = chapters[chapterIdx];
            console.log(`  📖 章節: ${chapter.chapter}`);

            // 創建章節節點
            const chapterNode = await prisma.knowledgeTag.create({
                data: {
                    name: chapter.chapter,
                    subject: 'physics',
                    parentId: gradeNode.id,
                    isSystem: true,
                    order: chapterIdx + 1,
                },
            });
            totalCreated++;

            // 創建知識點
            for (let tagIdx = 0; tagIdx < chapter.tags.length; tagIdx++) {
                const tagName = chapter.tags[tagIdx];
                await prisma.knowledgeTag.create({
                    data: {
                        name: tagName,
                        subject: 'physics',
                        parentId: chapterNode.id,
                        isSystem: true,
                        order: tagIdx + 1,
                    },
                });
                totalCreated++;
            }
        }
    }

    console.log(`\n✅ 物理標籤導入完成! 共創建 ${totalCreated} 個標籤`);
}

main()
    .catch((e) => {
        console.error('❌ 導入失敗:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
