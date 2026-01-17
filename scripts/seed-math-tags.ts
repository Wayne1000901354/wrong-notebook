/**
 * 數學標籤導入腳本
 * 將數學課程大綱導入到 KnowledgeTag 表
 * 
 * 使用方法: npx tsx scripts/seed-math-tags.ts
 */

import { PrismaClient } from '@prisma/client';
import { MATH_CURRICULUM, MATH_GRADE_ORDER } from '../src/lib/tag-data/math';

const prisma = new PrismaClient();

async function main() {
    console.log('📐 開始導入數學標籤...');

    // 清空現有數學系統標籤
    console.log('🗑️  清空現有數學系統標籤...');
    await prisma.knowledgeTag.deleteMany({
        where: { isSystem: true, subject: 'math' }
    });

    let totalCreated = 0;

    for (const [gradeSemester, chapters] of Object.entries(MATH_CURRICULUM)) {
        console.log(`\n📚 處理年級: ${gradeSemester}`);

        // 創建年級節點
        const gradeNode = await prisma.knowledgeTag.create({
            data: {
                name: gradeSemester,
                subject: 'math',
                parentId: null,
                isSystem: true,
                order: MATH_GRADE_ORDER[gradeSemester] || 99,
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
                    subject: 'math',
                    parentId: gradeNode.id,
                    isSystem: true,
                    order: chapterIdx + 1,
                },
            });
            totalCreated++;

            // 創建節和知識點
            for (let sectionIdx = 0; sectionIdx < chapter.sections.length; sectionIdx++) {
                const section = chapter.sections[sectionIdx];

                // 創建節節點
                const sectionNode = await prisma.knowledgeTag.create({
                    data: {
                        name: section.section,
                        subject: 'math',
                        parentId: chapterNode.id,
                        isSystem: true,
                        order: sectionIdx + 1,
                    },
                });
                totalCreated++;

                // 創建知識點
                for (let tagIdx = 0; tagIdx < section.tags.length; tagIdx++) {
                    const tagName = section.tags[tagIdx];
                    await prisma.knowledgeTag.create({
                        data: {
                            name: tagName,
                            subject: 'math',
                            parentId: sectionNode.id,
                            isSystem: true,
                            order: tagIdx + 1,
                        },
                    });
                    totalCreated++;
                }
            }
        }
    }

    console.log(`\n✅ 數學標籤導入完成! 共創建 ${totalCreated} 個標籤`);
}

main()
    .catch((e) => {
        console.error('❌ 導入失敗:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
