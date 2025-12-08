# Question Mapping System - How It Works

## Overview
The question mapping system allows you to create hierarchical question structures where certain answers can trigger follow-up (sub) questions. This is useful for conditional logic in questionnaires.

## Architecture

### 1. Data Model

**Question Structure:**
```javascript
{
  id: "question-id",
  code: "Q01",
  text: { en: "...", hi: "...", hiEn: "..." },
  category: "USAGE",
  questionType: "SINGLE_SELECT",
  displayOrder: 0,
  isActive: true,
  answers: [
    {
      id: "answer-id",
      text: { en: "...", hi: "...", hiEn: "..." },
      displayOrder: 0,
      benefitMapping: { B01: 2.5, B04: 1.0, ... },
      triggersSubQuestion: true,  // ← Key field
      subQuestionId: "sub-question-id"  // ← Key field
    }
  ]
}
```

### 2. How Sub-Questions Work

**Answer-Level Configuration:**
- Each answer has two fields:
  - `triggersSubQuestion` (boolean): Whether this answer should trigger a follow-up question
  - `subQuestionId` (string | null): The ID of the question to show as a follow-up

**Example Flow:**
1. Question 1: "How much screen time do you have?"
   - Answer A: "4-8 hours" → `triggersSubQuestion: true`, `subQuestionId: "Q02"`
   - Answer B: "Less than 4 hours" → `triggersSubQuestion: false`, `subQuestionId: null`

2. If user selects Answer A, Question 2 (Q02) appears as a follow-up.

### 3. Question Tree Building

**Main Questions vs Sub-Questions:**
- **Main Questions**: Questions that are NOT referenced as `subQuestionId` by any answer
- **Sub-Questions**: Questions that ARE referenced as `subQuestionId` by at least one answer

**Tree Building Algorithm:**
1. Find all questions referenced as sub-questions (by checking all answers' `subQuestionId` fields)
2. Filter out these referenced questions from the main list
3. Remaining questions are "main questions"
4. For each main question, recursively find its sub-questions by:
   - Looking at all answers in the main question
   - Finding answers where `triggersSubQuestion === true`
   - Getting the `subQuestionId` from those answers
   - Finding the question with that ID
   - Recursively building sub-trees for those questions

### 4. API Flow

**Fetching Questions:**
```
Frontend → GET /api/admin/questionnaire/questions
         → API returns: { success: true, data: { questions: [...] } }
         → API Client extracts: { questions: [...] }
         → Service returns: questions array
         → Frontend builds tree structure
```

**Creating/Updating Questions:**
```
Frontend → POST /api/admin/questionnaire/questions
         → Body includes answers with triggersSubQuestion and subQuestionId
         → Backend saves to MongoDB
         → Returns created question with all fields
```

### 5. UI Components

**Tree View:**
- Shows hierarchical structure of questions
- Main questions can be dragged to reorder (updates `displayOrder`)
- Sub-questions are indented and shown under their parent
- Click to expand/collapse sub-questions

**Answer Form:**
- Each answer has a checkbox: "Triggers Sub-question?"
- When checked, a dropdown appears to select which question to trigger
- Dropdown excludes the current question (prevents self-reference)
- Validates for circular references (A → B → A)

### 6. Validation Rules

1. **Self-Reference Prevention**: A question cannot be its own sub-question
2. **Circular Reference Detection**: Prevents chains like Q1 → Q2 → Q1
3. **Sub-Question ID Validation**: Must reference an existing question ID

### 7. Common Issues & Fixes

**Issue: Questions not displaying in tree**
- **Cause**: API not returning `triggersSubQuestion` and `subQuestionId` fields
- **Fix**: Updated API endpoint to include these fields in answer objects

**Issue: All questions filtered out**
- **Cause**: If all questions are marked as sub-questions but no main questions exist
- **Fix**: Ensure at least one question is not referenced as a sub-question

**Issue: Tree structure incorrect**
- **Cause**: `subQuestionId` values don't match actual question IDs
- **Fix**: Verify question IDs match between answers and questions

## Debugging

Console logs have been added to help debug:
- `fetchQuestions`: Logs fetched data and questions list
- `buildQuestionTree`: Logs sub-question IDs, main questions, and final tree structure

Check browser console for these logs when loading the questions page.

