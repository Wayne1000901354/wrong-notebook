
import { PrismaClient } from '@prisma/client';

import path from 'path';
import fs from 'fs';
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


const dbPath = path.resolve(__dirname, '../prisma/dev.db');
if (!process.env.DATABASE_URL && fs.existsSync(dbPath)) {
    console.log(`Using fallback database: ${dbPath}`);
    process.env.DATABASE_URL = `file:${dbPath}`;
}

import {
    MATH_CURRICULUM, MATH_GRADE_ORDER,
    PHYSICS_CURRICULUM, PHYSICS_GRADE_ORDER,
    ENGLISH_CURRICULUM, ENGLISH_GRADE_ORDER,
    CHEMISTRY_CURRICULUM, CHEMISTRY_GRADE_ORDER,
    BIOLOGY_CURRICULUM, BIOLOGY_GRADE_ORDER,
    CHINESE_CURRICULUM, CHINESE_GRADE_ORDER,
    HISTORY_CURRICULUM, HISTORY_GRADE_ORDER,
    GEOGRAPHY_CURRICULUM, GEOGRAPHY_GRADE_ORDER,
    POLITICS_CURRICULUM, POLITICS_GRADE_ORDER
} from '../src/lib/tag-data';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting in-place tag localization update...');
    try {
        await prisma.$connect();
        console.log('Connected to database.');
    } catch (err) {
        console.error('Failed to connect to database:', err);
        throw err;
    }

    await updateSubject('math', MATH_CURRICULUM, MATH_GRADE_ORDER, true);
    await updateSubject('physics', PHYSICS_CURRICULUM, PHYSICS_GRADE_ORDER, false);
    await updateSubject('english', ENGLISH_CURRICULUM, ENGLISH_GRADE_ORDER, false);
    await updateSubject('chemistry', CHEMISTRY_CURRICULUM, CHEMISTRY_GRADE_ORDER, false);
    await updateSubject('biology', BIOLOGY_CURRICULUM, BIOLOGY_GRADE_ORDER, false);
    await updateSubject('chinese', CHINESE_CURRICULUM, CHINESE_GRADE_ORDER, false);
    await updateSubject('history', HISTORY_CURRICULUM, HISTORY_GRADE_ORDER, false);
    await updateSubject('geography', GEOGRAPHY_CURRICULUM, GEOGRAPHY_GRADE_ORDER, false);
    await updateSubject('politics', POLITICS_CURRICULUM, POLITICS_GRADE_ORDER, false);

    console.log('Tag update completed.');
}

async function updateSubject(subject: string, curriculum: any, gradeOrder: any, isMath: boolean) {
    console.log(`Processing subject: ${subject}...`);
    let updatedCount = 0;
    let createdCount = 0;

    for (const [gradeSemester, chapters] of Object.entries(curriculum) as any) {
        const order = gradeOrder[gradeSemester] || 99;

        // 1. Grade Level
        const gradeNode = await upsertTag(subject, gradeSemester, null, order);
        if (gradeNode.wasUpdated) updatedCount++;
        if (gradeNode.wasCreated) createdCount++;

        if (!gradeNode.id) continue;

        for (let chapterIdx = 0; chapterIdx < chapters.length; chapterIdx++) {
            const chapter = chapters[chapterIdx];
            // 2. Chapter
            const chapterNode = await upsertTag(subject, chapter.chapter, gradeNode.id, chapterIdx + 1);
            if (chapterNode.wasUpdated) updatedCount++;
            if (chapterNode.wasCreated) createdCount++;

            if (!chapterNode.id) continue;

            if (isMath) {
                // Math has Sections
                for (let sectionIdx = 0; sectionIdx < chapter.sections.length; sectionIdx++) {
                    const section = chapter.sections[sectionIdx];
                    // 3. Section
                    const sectionNode = await upsertTag(subject, section.section, chapterNode.id, sectionIdx + 1);
                    if (sectionNode.wasUpdated) updatedCount++;
                    if (sectionNode.wasCreated) createdCount++;

                    if (!sectionNode.id) continue;

                    for (let tagIdx = 0; tagIdx < section.tags.length; tagIdx++) {
                        const tagName = section.tags[tagIdx];
                        // 4. Tag (under Section)
                        const tagNode = await upsertTag(subject, tagName, sectionNode.id, tagIdx + 1);
                        if (tagNode.wasUpdated) updatedCount++;
                        if (tagNode.wasCreated) createdCount++;
                    }
                }
            } else {
                // Standard has Tags directly under Chapter
                for (let tagIdx = 0; tagIdx < chapter.tags.length; tagIdx++) {
                    const tagName = chapter.tags[tagIdx];
                    // 3. Tag (under Chapter)
                    const tagNode = await upsertTag(subject, tagName, chapterNode.id, tagIdx + 1);
                    if (tagNode.wasUpdated) updatedCount++;
                    if (tagNode.wasCreated) createdCount++;
                }
            }
        }
    }
    console.log(`  - ${subject}: Updated ${updatedCount}, Created ${createdCount}`);
}

async function upsertTag(subject: string, name: string, parentId: string | null, order: number) {
    // Strategy: Find by (subject, parentId, order) because we assume structure integrity.
    // If we find it, update name.
    // If not, try finding by name (maybe order changed?). No, stick to structure or we get duplicates.
    // Actually, create if missing.

    const existing = await prisma.knowledgeTag.findFirst({
        where: {
            subject,
            parentId,
            isSystem: true,
            order
        }
    });

    if (existing) {
        if (existing.name !== name) {
            console.log(`    Rename: "${existing.name}" -> "${name}"`);
            await prisma.knowledgeTag.update({
                where: { id: existing.id },
                data: { name }
            });
            return { id: existing.id, wasUpdated: true, wasCreated: false };
        }
        return { id: existing.id, wasUpdated: false, wasCreated: false };
    } else {
        // Not found by order. Try finding by name?
        // If we find by name, we update order?
        // For localization, let's just CREATE it if it's missing from current slot. 
        // But checking name first might save duplicates if order shifted.
        // Let's assume order is correct key.

        console.log(`    Create: "${name}"`);
        const created = await prisma.knowledgeTag.create({
            data: {
                name,
                subject,
                parentId,
                isSystem: true,
                order
            }
        });
        return { id: created.id, wasUpdated: false, wasCreated: true };
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
