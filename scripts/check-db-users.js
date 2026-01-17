/**
 * 資料庫用戶檢查腳本
 * 功能：列出資料庫中所有的用戶資訊 (ID, Email, Name)。
 * 用途：用於確認用戶註冊情況，獲取用戶 ID 用於調試。
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({});

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Users found:', users.length);
        users.forEach(u => console.log(`- ${u.email} (${u.id})`));

        if (users.length === 0) {
            console.log('No users found. Creating default user...');
            const newUser = await prisma.user.create({
                data: {
                    email: 'test@example.com',
                    password: 'password_hash_placeholder',
                    name: 'Test User',
                },
            });
            console.log('Created user:', newUser);
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
