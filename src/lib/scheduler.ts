import { addDays } from "date-fns";

// Ebbinghaus intervals in days: 1, 2, 4, 7, 15, 30
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

export function calculateNextReviewDate(currentStage: number): Date {
    const interval = REVIEW_INTERVALS[currentStage] || 30; // Default to 30 if stage exceeds
    return addDays(new Date(), interval);
}

export function getReviewStageDescription(stage: number): string {
    switch (stage) {
        case 0: return "第一次複習 (1 天)";
        case 1: return "第二次複習 (2 天)";
        case 2: return "第三次複習 (4 天)";
        case 3: return "第四次複習 (7 天)";
        case 4: return "第五次複習 (15 天)";
        default: return "定期維護複習 (30 天)";
    }
}
