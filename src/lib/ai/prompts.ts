/**
 * Shared AI prompt templates
 * This module provides centralized prompt management
 */

/**
 * Options for customizing prompts
 */
export interface PromptOptions {
  providerHints?: string; // Provider-specific instructions
  additionalTags?: {
    subject: string;
    tags: string[];
  }[];
  customTemplate?: string; // Custom template to override default
  // Pre-fetched tags from database (optional, per subject)
  prefetchedMathTags?: string[];
  prefetchedPhysicsTags?: string[];
  prefetchedChemistryTags?: string[];
  prefetchedBiologyTags?: string[];
  prefetchedEnglishTags?: string[];
}

export const DEFAULT_ANALYZE_TEMPLATE = `【角色與核心任務 (ROLE AND CORE TASK)】
你是一位世界頂尖的、經驗豐富的、專業的跨學科考試分析專家（Interdisciplinary Exam Analysis Expert）。你的核心任務是極致準確地分析用戶提供的考試題目圖片，全面理解所有文本、圖表和隱含約束，並提供一個完整、高度結構化且專業的解決方案。

{{language_instruction}}

【核心輸出要求 (OUTPUT REQUIREMENTS)】
你的回應輸出**必須嚴格遵循以下自定義標籤格式**。**嚴禁**使用 JSON 或 Markdown 程式碼區塊。**嚴禁**對 LaTeX 公式中的反斜線進行二次跳脫（如 "\\frac" 是錯誤的，必須是 "\frac"）。

請嚴格按照以下結構輸出內容：

<subject>
在此處填寫學科，必須是以下之一："數學", "物理", "化學", "生物", "英語", "國文", "歷史", "地理", "公民", "其他"。
</subject>

<knowledge_points>
在此處填寫知識點，使用逗號分隔，例如：知識點1, 知識點2, 知識點3
</knowledge_points>

<requires_image>
判斷這道題是否需要依賴圖片才能正確解答。如果題目包含幾何圖形、函數圖像、實驗裝置圖、電路圖等必須看圖才能理解的內容，填寫 true；如果只需要文字描述即可理解（如英語題、純文字數學題），填寫 false。
</requires_image>

<question_text>
在此處填寫題目的完整文本。使用 Markdown 格式。所有數學公式使用 LaTeX 符號（行內 $...$，塊級 $$...$$）。
</question_text>

<answer_text>
在此處填寫正確答案。使用 Markdown 和 LaTeX 符號。
</answer_text>

<analysis>
在此處填寫詳細的步驟解析。
* 必須使用繁體中文（台灣）。
* **直接使用標準的 LaTeX 符號**（如 $\frac{1}{2}$），**不要**進行 JSON 跳脫（不要寫成 \\frac）。
</analysis>

【知識點標籤列表（KNOWLEDGE POINT LIST）】
{{knowledge_points_list}}

【標籤使用規則 (TAG RULES)】
- 標籤必須與題目實際考查的知識點精準匹配。
- 每題最多 5 個標籤。

【!!! 關鍵格式與內容約束 (CRITICAL RULES) !!!】
1. **格式嚴格**：必須嚴格包含上述 6 個 XML 標籤，除此之外不要輸出任何其他“開場白”或“結束語”。
2. **純文字**：內容作為純文字處理，**不要跳脫反斜線**。
3. **內容完整**：如果包含子問題，請在 question_text 中完整列出。
4. **禁止圖片**：嚴禁包含任何圖片連結或 markdown 圖片語法。

{{provider_hints}}`;

export const DEFAULT_SIMILAR_TEMPLATE = `你是一位資深的K12教育題目生成專家，具備跨學科的題目創作能力。你的核心任務是**根據以下原題和知識點，舉一反三生成高品質教學題目**，幫助學生鞏固知識並拓展解題思路。
### 角色定義
1. **學科全能專家**  
   - 精通K12階段所有學科（數學/國文/英語/物理/化學/生物/歷史/地理/公民）
   - 熟悉各年級課程標準與知識點分佈
   - 能準確識別題目考察的核心能力點（計算/推理/分析/應用/創新）
2. **題目變異大師**  
   - 掌握12種變式技法：條件替換/情境遷移/問題轉化/數據重構/圖形變形/角色反轉/跨學科融合/難度階梯/開放拓展/陷阱設計/逆向思維/生活應用
   - 確保變式題目保持原題核心考點，改變題目表現形式
3. **學情分析師**  
   - 預判學生易錯點（認知盲區/概念混淆/計算失誤/審題偏差）
   - 在變式題目中針對性強化易錯點訓練
### 執行流程
1. **接收任務**  
	原題: "{{original_question}}"
	{{language_instruction}}
	DIFFICULTY LEVEL: {{difficulty_level}}
	{{difficulty_instruction}}
	Knowledge Points: {{knowledge_points}}  
2. **解構分析**  
   - 提取核心考點與能力要求
   - 分析題目陷阱與解題路徑
3.  **品質管控**  
   - 確保每道題：  
     ✓ 覆蓋相同核心知識點  
     ✓ 保持解題邏輯一致性  
     ✓ 答案唯一且可驗證  
     ✓ 無知識性錯誤
### 輸出規範
你的回應輸出**必須嚴格遵循以下自定義標籤格式**。**嚴禁**使用 JSON 或 Markdown 程式碼區塊。**嚴禁**返回 \`\`\`json ... \`\`\`。

請嚴格按照以下結構輸出內容（不要包含任何其他文字）：

<question_text>
在此處填寫新生成的題目文本。包含選項（如果是選擇題）。
</question_text>

<answer_text>
在此處填寫新題目的正確答案。
</answer_text>

<analysis>
在此處填寫新題目的詳細解析。
* 必須使用繁體中文。
* **直接使用標準的 LaTeX 符號**（如 $\frac{1}{2}$），**不要**進行 JSON 跳脫。
</analysis>

###關鍵格式與內容約束 (CRITICAL RULES) !!!
1. **純文字**：內容作為純文字處理，**不要跳脫反斜線**。

{{provider_hints}}`;

/**
 * Helper to replace placeholders in template
 */
function replaceVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || "";
  });
}

/**
 * 獲取指定年級的累進數學標籤
 * 初一(7)：只包含七年級標籤
 * 初二(8)：包含七年級+八年級標籤
 * 初三(9)：包含七年級+八年級+九年級標籤
 * 高一(10)：只包含高一標籤（不含國中）
 * 高二(11)：包含高一+高二標籤
 * 高三(12)：包含高一+高二+高三標籤
 * @param grade - 年級 (7-9:國中, 10-12:高中) 或 null
 * @returns 標籤陣列
 */
/**
 * 獲取指定年級的數學標籤
 * 必須由調用方預先從資料庫獲取標籤並通過 prefetchedTags 傳入
 * @param grade - 年級（已棄用，保留介面兼容）
 * @param prefetchedTags - 從資料庫預獲取的標籤陣列
 * @returns 標籤陣列
 */
export function getMathTagsForGrade(
  grade: 7 | 8 | 9 | 10 | 11 | 12 | null,
  prefetchedTags?: string[]
): string[] {
  // 必须使用预获取的数据库标签
  if (prefetchedTags && prefetchedTags.length > 0) {
    return prefetchedTags;
  }

  // 如果沒有預獲取標籤，返回空陣列（AI 將自由標註）
  console.warn('[prompts] No prefetched tags provided, AI will tag freely');
  return [];
}

/**
 * Generates the analyze image prompt
 * @param language - Target language for analysis ('zh' or 'en')
 * @param grade - Optional grade level (7-9:國中, 10-12:高中) for cumulative tag filtering
 * @param options - Optional customizations
 */
export function generateAnalyzePrompt(
  language: 'zh' | 'en',
  grade?: 7 | 8 | 9 | 10 | 11 | 12 | null,
  subject?: string | null,
  options?: PromptOptions
): string {
  const langInstruction = language === 'zh'
    ? "IMPORTANT: For the 'analysis' field, use Traditional Chinese (Taiwan). For 'questionText' and 'answerText', YOU MUST USE THE SAME LANGUAGE AS THE ORIGINAL QUESTION. If the original question is in Chinese, the new question MUST be in Traditional Chinese. If the original is in English, keep it in English. If the original question is in English, the new 'questionText' and 'answerText' MUST be in English, but the 'analysis' MUST be in Traditional Chinese (to help the student understand). "
    : "Please ensure all text fields are in English.";

  // 獲取各學科標籤（優先使用預獲取的資料庫標籤）
  const mathTags = getMathTagsForGrade(grade || null, options?.prefetchedMathTags);
  const mathTagsString = mathTags.length > 0 ? mathTags.map(tag => `"${tag}"`).join(", ") : '（無可用標籤）';

  const physicsTags = options?.prefetchedPhysicsTags || [];
  const physicsTagsString = physicsTags.length > 0 ? physicsTags.map(tag => `"${tag}"`).join(", ") : '（無可用標籤）';

  const chemistryTags = options?.prefetchedChemistryTags || [];
  const chemistryTagsString = chemistryTags.length > 0 ? chemistryTags.map(tag => `"${tag}"`).join(", ") : '（無可用標籤）';

  const biologyTags = options?.prefetchedBiologyTags || [];
  const biologyTagsString = biologyTags.length > 0 ? biologyTags.map(tag => `"${tag}"`).join(", ") : '（無可用標籤）';

  const englishTags = options?.prefetchedEnglishTags || [];
  const englishTagsString = englishTags.length > 0 ? englishTags.map(tag => `"${tag}"`).join(", ") : '（無可用標籤）';

  // 根據科目決定顯示哪些標籤（節省 token，提高準確性）
  let tagsSection = "";

  if (subject === '數學') {
    tagsSection = `**數學標籤 (Math Tags):**
使用課程大綱中的**精確標籤名稱**，可選標籤如下：
${mathTagsString}

**重要提示**：
- 必須從上述列表中選擇精確匹配的標籤
- 每題最多 5 個標籤`;
  } else if (subject === '物理') {
    tagsSection = `**物理標籤 (Physics Tags):**
使用課程大綱中的**精確標籤名稱**，可選標籤如下：
${physicsTagsString}

**重要提示**：
- 必須從上述列表中選擇精確匹配的標籤
- 每題最多 5 個標籤`;
  } else if (subject === '化學') {
    tagsSection = `**化學標籤 (Chemistry Tags):**
使用課程大綱中的**精確標籤名稱**，可選標籤如下：
${chemistryTagsString}

**重要提示**：
- 必須從上述列表中選擇精確匹配的標籤
- 每題最多 5 個標籤`;
  } else if (subject === '生物') {
    tagsSection = `**生物標籤 (Biology Tags):**
使用課程大綱中的**精確標籤名稱**，可選標籤如下：
${biologyTagsString}

**重要提示**：
- 必須從上述列表中選擇精確匹配的標籤
- 每題最多 5 個標籤`;
  } else if (subject === '英語') {
    tagsSection = `**英語標籤 (English Tags):**
使用課程大綱中的**精確標籤名稱**，可選標籤如下：
${englishTagsString}

**重要提示**：
- 必須從上述列表中選擇精確匹配的標籤
- 每題最多 5 個標籤`;
  } else {
    // 未知科目：顯示所有標籤讓 AI 判斷
    tagsSection = `**數學標籤 (Math Tags):**
${mathTagsString}

**物理標籤 (Physics Tags):**
${physicsTagsString}

**化學標籤 (Chemistry Tags):**
${chemistryTagsString}

**生物標籤 (Biology Tags):**
${biologyTagsString}

**英語標籤 (English Tags):**
${englishTagsString}`;
  }

  const template = options?.customTemplate || DEFAULT_ANALYZE_TEMPLATE;

  return replaceVariables(template, {
    language_instruction: langInstruction,
    knowledge_points_list: tagsSection,
    provider_hints: options?.providerHints || ''
  }).trim();
}

/**
 * Generates the "similar question" prompt
 * @param language - Target language ('zh' or 'en')
 * @param originalQuestion - The original question text
 * @param knowledgePoints - Knowledge points to test
 * @param difficulty - Difficulty level
 * @param options - Optional customizations
 */
export function generateSimilarQuestionPrompt(
  language: 'zh' | 'en',
  originalQuestion: string,
  knowledgePoints: string[],
  difficulty: 'easy' | 'medium' | 'hard' | 'harder' = 'medium',
  options?: PromptOptions
): string {
  const langInstruction = language === 'zh'
    ? "IMPORTANT: Provide the output based on the 'Original Question' language. If the original question is in English, the new 'questionText' and 'answerText' MUST be in English, but the 'analysis' MUST be in Traditional Chinese (Taiwan standard, to help the student understand). If the original is in Chinese, everything MUST be in Traditional Chinese."
    : "Please ensure the generated question is in English.";

  const difficultyInstruction = {
    'easy': "Make the new question EASIER than the original. Use simpler numbers and more direct concepts.",
    'medium': "Keep the difficulty SIMILAR to the original question.",
    'hard': "Make the new question HARDER than the original. Combine multiple concepts or use more complex numbers.",
    'harder': "Make the new question MUCH HARDER (Challenge Level). Require deeper understanding and multi-step reasoning."
  }[difficulty];

  const template = options?.customTemplate || DEFAULT_SIMILAR_TEMPLATE;

  return replaceVariables(template, {
    difficulty_level: difficulty.toUpperCase(),
    difficulty_instruction: difficultyInstruction,
    language_instruction: langInstruction,
    original_question: originalQuestion.replace(/"/g, '\\"').replace(/\n/g, '\\n'), // Escape for template safety
    knowledge_points: knowledgePoints.join(", "),
    provider_hints: options?.providerHints || ''
  }).trim();
}

/**
 * 重新解題提示詞模板
 * 用於根據校正後的題目文本重新生成答案和解析
 */
export const DEFAULT_REANSWER_TEMPLATE = `【角色與核心任務 (ROLE AND CORE TASK)】
你是一位經驗豐富的專業教師。用戶已經提供了一道**校正後的題目文本**，請你為這道題目提供正確的答案和詳細的解析。

{{language_instruction}}

【題目內容 (QUESTION)】
{{question_text}}

【學科提示 (SUBJECT HINT)】
{{subject_hint}}

【核心輸出要求 (OUTPUT REQUIREMENTS)】
你的回應輸出**必須嚴格遵循以下自定義標籤格式**。**嚴禁**使用 JSON 或 Markdown 程式碼區塊。

請嚴格按照以下結構輸出內容（不要包含任何其他文字）：

<answer_text>
在此處填寫正確答案。使用 Markdown 和 LaTeX 符號。
</answer_text>

<analysis>
在此處填寫詳細的步驟解析。
* 必須使用繁體中文。
* **直接使用標準的 LaTeX 符號**（如 $\\frac{1}{2}$），**不要**進行 JSON 跳脫。
* 解析要清晰、完整，適合學生理解。
</analysis>

<knowledge_points>
在此處填寫知識點，使用逗號分隔，例如：知識點1, 知識點2, 知識點3
</knowledge_points>

【!!! 關鍵格式與內容約束 (CRITICAL RULES) !!!】
1. **格式嚴格**：必須嚴格包含上述 3 個 XML 標籤，不要輸出其他內容。
2. **純文字**：內容作為純文字處理，**不要跳脫反斜線**。
3. **題目不變**：不要修改或重複題目內容，只提供答案和解析。

{{provider_hints}}`;

/**
 * 生成重新解題提示詞
 * @param language - 語言 ('zh' 或 'en')
 * @param questionText - 校正後的題目文本
 * @param subject - 學科提示（可選）
 * @param options - 自定義選項
 */
export function generateReanswerPrompt(
  language: 'zh' | 'en',
  questionText: string,
  subject?: string | null,
  options?: PromptOptions
): string {
  const langInstruction = language === 'zh'
    ? "IMPORTANT: 解析必須使用繁體中文。如果題目是英文，答案保持英文，但解析用中文。"
    : "Please ensure all text fields are in English.";

  const subjectHint = subject
    ? `本題學科：${subject}`
    : "請根據題目內容判斷學科。";

  const template = options?.customTemplate || DEFAULT_REANSWER_TEMPLATE;

  return replaceVariables(template, {
    language_instruction: langInstruction,
    question_text: questionText,
    subject_hint: subjectHint,
    provider_hints: options?.providerHints || ''
  }).trim();
}
