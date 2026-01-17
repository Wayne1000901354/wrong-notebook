"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { inferSubjectFromName } from "@/lib/knowledge-tags";

interface TagTreeNode {
    id: string;
    name: string;
    code: string | null;
    isSystem: boolean;
    children: TagTreeNode[];
}

interface KnowledgeFilterProps {
    gradeSemester?: string;
    tag?: string | null;
    subjectName?: string;
    onFilterChange: (filters: {
        gradeSemester?: string;
        chapter?: string;
        tag?: string;
    }) => void;
    className?: string;
}

// 年級編號到學期名稱的映射 (用於根據用戶入學年份計算當前年級)
const EDUCATION_GRADE_MAP: Record<string, number[]> = {
    'primary': [1, 2, 3, 4, 5, 6],
    'junior_high': [7, 8, 9],
    'senior_high': [10, 11, 12],
};

// 年級編號到學期key的映射
// 注意：國小目前資料庫中只存儲了"一年級"這種粒度，沒有分上下冊，後續如果有變化需要更新這裡
const GRADE_TO_SEMESTERS: Record<number, string[]> = {
    1: ['一年級'],
    2: ['二年級'],
    3: ['三年級'],
    4: ['四年級'],
    5: ['五年級'],
    6: ['六年級'],
    7: ['國一上', '國一下', '國一', '七年級上', '七年級下', '七年級'], // 兼容可能存在的不同命名
    8: ['國二上', '國二下', '國二', '八年級上', '八年級下', '八年級'],
    9: ['國三上', '國三下', '國三', '九年級上', '九年級下', '九年級'],
    10: ['高一上', '高一下', '高一'],
    11: ['高二上', '高二下', '高二'],
    12: ['高三上', '高三下', '高三'],
};

export function KnowledgeFilter({
    gradeSemester: initialGrade,
    tag: initialTag,
    subjectName,
    onFilterChange,
    className
}: KnowledgeFilterProps) {
    const [gradeSemester, setGradeSemester] = useState<string>(initialGrade || "");
    const [chapter, setChapter] = useState<string>("");
    const [tag, setTag] = useState<string>(initialTag || "");

    // 從資料庫載入的標籤樹
    const [tagTree, setTagTree] = useState<TagTreeNode[]>([]);
    const [loading, setLoading] = useState(true);

    // 用戶資訊 (教育階段和入學年份)
    const [userInfo, setUserInfo] = useState<{ educationStage?: string; enrollmentYear?: number }>({});

    // 可用的年級學期選項 (根據用戶資訊過濾)
    const [availableGrades, setAvailableGrades] = useState<string[]>([]);

    // Sync with props
    useEffect(() => {
        if (initialGrade !== undefined) setGradeSemester(initialGrade);
    }, [initialGrade]);

    useEffect(() => {
        if (initialTag !== undefined) setTag(initialTag || "");
    }, [initialTag]);

    // 計算用戶當前年級 (返回原始年級數值，不進行範圍截斷，以便判斷由初升高的情況)
    const calculateCurrentGrade = useCallback((educationStage: string, enrollmentYear: number): number => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12

        // 學年從9月開始
        const academicYear = currentMonth >= 9 ? currentYear : currentYear - 1;
        const yearsInSchool = academicYear - enrollmentYear + 1;

        if (educationStage === 'primary') {
            return yearsInSchool;
        } else if (educationStage === 'junior_high') {
            // 國中: 1年級=7, ...
            return yearsInSchool + 6;
        } else if (educationStage === 'senior_high') {
            // 高中: 1年級=10, ...
            return yearsInSchool + 9;
        }
        return 0;
    }, []);

    // 根據用戶資訊生成可用年級列表
    const generateAvailableGrades = useCallback((educationStage?: string, enrollmentYear?: number): string[] => {
        let grades: number[] = [];

        // 默認: 顯示所有年級
        if (!educationStage) {
            grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        } else if (educationStage === 'primary') {
            // 國小生: 顯示國小全部
            grades = [1, 2, 3, 4, 5, 6];
        } else if (educationStage === 'junior_high') {
            // 國中生: 預設顯示國中全部 (7-9)
            grades = [7, 8, 9];

            // 如果有入學年份，且推算年級已達到高中 (>=10)，則追加高中年級
            if (enrollmentYear) {
                const currentGrade = calculateCurrentGrade(educationStage, enrollmentYear);
                if (currentGrade >= 10) {
                    grades.push(10, 11, 12);
                }
            }
        } else if (educationStage === 'senior_high') {
            // 高中生: 僅顯示高中全部
            grades = [10, 11, 12];
        } else {
            // 其他情況
            grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        }

        // 可以在這裡根據 enrollmentYear 做進一步優化，比如高亮當前年級
        // 但目前先返回該階段的所有年級

        return grades.flatMap(g => GRADE_TO_SEMESTERS[g] || []);
    }, [calculateCurrentGrade]);

    // 載入用戶資訊和標籤樹
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. 獲取用戶資訊
                const user = await apiClient.get<{ educationStage?: string; enrollmentYear?: number }>('/api/user');
                setUserInfo(user);

                // 2. 生成可用年級
                const grades = generateAvailableGrades(user.educationStage, user.enrollmentYear);
                setAvailableGrades(grades);

                // 3. 獲取標籤樹 (所有科目)
                const subject = subjectName ? inferSubjectFromName(subjectName) : 'math';
                // 移除僅 math 的限制，嘗試獲取當前科目的標籤
                try {
                    const data = await apiClient.get<{ tags: TagTreeNode[] }>(`/api/tags?subject=${subject}`);
                    setTagTree(data.tags);
                } catch (e) {
                    console.warn(`Failed to fetch tags for subject ${subject}`, e);
                    setTagTree([]);
                }
            } catch (error) {
                console.error("Failed to load filter data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [subjectName, generateAvailableGrades]);

    const handleGradeChange = (val: string) => {
        setGradeSemester(val);
        setChapter("");
        setTag("");
        onFilterChange({
            gradeSemester: val === "all" ? undefined : val,
            chapter: undefined,
            tag: undefined
        });
    };

    const handleChapterChange = (val: string) => {
        setChapter(val);
        setTag("");
        onFilterChange({
            gradeSemester: gradeSemester === "all" ? undefined : gradeSemester,
            chapter: val === "all" ? undefined : val,
            tag: undefined
        });
    };

    const handleTagChange = (val: string) => {
        setTag(val);
        onFilterChange({
            gradeSemester: gradeSemester === "all" ? undefined : gradeSemester,
            chapter: chapter === "all" ? undefined : chapter,
            tag: val === "all" ? undefined : val
        });
    };

    // 從標籤樹中找到當前年級節點
    const currentGradeNode = tagTree.find(node => node.name === gradeSemester);
    const chapters = currentGradeNode?.children || [];

    // 從標籤樹中找到當前章節節點
    const currentChapterNode = chapters.find(node => node.name === chapter);

    // 遞歸獲取所有葉子標籤
    const getLeafTags = (node: TagTreeNode): string[] => {
        if (node.children.length === 0) return [node.name];
        return node.children.flatMap(child => getLeafTags(child));
    };
    // 去重標籤，避免 React key 衝突
    const tags = currentChapterNode
        ? [...new Set(getLeafTags(currentChapterNode))]
        : [];

    // 過濾可用年級 (只顯示資料庫中存在的)
    // 對於非數學科目，如果不按照年級結構存儲，這裡可能會被清空
    // 我們檢查 tagTree 的頂層節點是否包含 gradeSemester
    const filteredGrades = availableGrades.filter(g =>
        tagTree.some(node => node.name === g)
    );

    // 如果過濾後沒有年級（可能是因為該科目標籤結構不同，比如沒有按年級分類），
    // 或者 tagTree 為空，我們至少應該顯示 availableGrades 或者不顯示
    // 但根據現在的 seed 腳本，所有科目都是按年級分類的，所以應該沒問題。

    return (
        <div className={`flex gap-2 ${className}`}>
            <Select value={gradeSemester} onValueChange={handleGradeChange} disabled={loading}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="年級/學期" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">全部年級</SelectItem>
                    {filteredGrades.map(gs => (
                        <SelectItem key={gs} value={gs}>{gs}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={chapter} onValueChange={handleChapterChange} disabled={!gradeSemester || gradeSemester === "all"}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="章節" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">全部章節</SelectItem>
                    {chapters.map(c => (
                        <SelectItem key={c.id} value={c.name}>
                            {c.name.replace(/^第\d+章\s*/, '')}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={tag} onValueChange={handleTagChange} disabled={!chapter || chapter === "all"}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="知識點" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">全部知識點</SelectItem>
                    {tags.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
