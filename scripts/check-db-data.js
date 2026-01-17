/**
 * 資料庫數據檢查腳本
 * 功能：統計 ErrorItem (錯題) 表的總記錄數，並列出最近 3 條錯題的簡要資訊。
 * 用途：用於快速確認資料庫連線正常以及數據寫入是否成功。
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkData() {
    try {
        const count = await prisma.errorItem.count();
        console.log(`Total ErrorItems in DB: ${count}`);

        const items = await prisma.errorItem.findMany({
            take: 3,
            select: {
                id: true,
                questionText: true,
                userId: true,
                createdAt: true,
            },
        });

        console.log('\nRecent ErrorItems:');
        items.forEach(item => {
            console.log(`- ID: ${item.id}, User: ${item.userId}`);
            console.log(`  Question: ${item.questionText?.substring(0, 50)}...`);
            console.log(`  Created: ${item.createdAt}`);
        });
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
