/**
 * 額外學科（國文、歷史、地理、公民）標籤導入腳本
 * 僅導入年級結構，以支持自定義標籤的年級選擇
 * 
 * 使用方法: npx tsx scripts/seed-additional-subjects.ts
 */

import { PrismaClient } from '@prisma/client';
import { CHINESE_CURRICULUM, CHINESE_GRADE_ORDER } from '../src/lib/tag-data/chinese';
import { HISTORY_CURRICULUM, HISTORY_GRADE_ORDER } from '../src/lib/tag-data/history';
import { GEOGRAPHY_CURRICULUM, GEOGRAPHY_GRADE_ORDER } from '../src/lib/tag-data/geography';
import { POLITICS_CURRICULUM, POLITICS_GRADE_ORDER } from '../src/lib/tag-data/politics';

const prisma = new PrismaClient();

async function seedSubject(
    subjectKey: string,
    subjectName: string,
    curriculum: Record<string, any[]>,
    gradeOrder: Record<string, number>
) {
    console.log(`\n📚 處理學科: ${subjectName} (${subjectKey})`);

    // 清空現有系統標籤
    console.log(`  🗑️  清空現有系統標籤...`);
    await prisma.knowledgeTag.deleteMany({
        where: { isSystem: true, subject: subjectKey }
    });

    let count = 0;
    for (const [gradeSemester, _] of Object.entries(curriculum)) {
        // 創建年級節點
        await prisma.knowledgeTag.create({
            data: {
                name: gradeSemester,
                subject: subjectKey,
                parentId: null,
                isSystem: true,
                order: gradeOrder[gradeSemester] || 99,
            },
        });
        count++;
    }
    console.log(`  ✅ ${subjectName} 年級節點創建完成: ${count} 個`);
}

async function main() {
    console.log('🚀 開始導入額外學科標籤結構...');

    await seedSubject('chinese', '國文', CHINESE_CURRICULUM, CHINESE_GRADE_ORDER);
    await seedSubject('history', '歷史', HISTORY_CURRICULUM, HISTORY_GRADE_ORDER);
    await seedSubject('geography', '地理', GEOGRAPHY_CURRICULUM, GEOGRAPHY_GRADE_ORDER);
    await seedSubject('politics', '公民', POLITICS_CURRICULUM, POLITICS_GRADE_ORDER);

    console.log('\n✨ 所有額外學科標籤導入完成!');
}

main()
    .catch((e) => {
        console.error('❌ 導入失敗:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
