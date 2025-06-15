# 評論提交功能實現

## 功能概述

已成功實現完整的評論提交表單系統，允許用戶對課程和教師進行詳細評價。

## 主要功能

### 1. 評論提交表單 (`ReviewSubmissionForm`)
- **位置**: `src/components/features/reviews/ReviewSubmissionForm.tsx`
- **功能**: 完整的評論提交界面，包含所有必要的輸入欄位和驗證

### 2. 評論提交頁面 (`WriteReview`)
- **位置**: `src/pages/WriteReview.tsx`
- **路由**: `/write-review` 和 `/write-review/:courseCode`
- **功能**: 包裝評論提交表單，支援預選課程

### 3. 數據庫服務擴展
- **位置**: `src/services/api/courseService.ts`
- **新增方法**: `createReview()` - 創建新的評論記錄

## 表單結構

### 課程選擇部分
- **課程選擇**: 下拉選單，顯示所有可用課程
- **學期選擇**: 根據選定課程動態載入對應學期
- **教師選擇**: 根據課程和學期組合載入對應教師（支援多選）

### 課程評價部分
- **課程工作量**: 1-5星評分
- **課程難度**: 1-5星評分  
- **課程實用性**: 1-5星評分
- **最終成績**: 文字輸入
- **課程評論**: 可選的文字評論
- **服務學習**: 可選的服務學習相關資訊

### 教師評價部分（每位選定教師）
- **教學評分**: 1-5星評分（必填）
- **評分公平性**: 1-5星評分（可選）
- **課程要求**: 多選框（期中考、小測、小組專案等）
- **教學評論**: 可選的文字評論

### 提交選項
- **匿名提交**: 可選擇匿名發布評論
- **表單驗證**: 完整的前端驗證確保必填欄位已填寫

## 導航整合

### 課程詳情頁面
- **位置**: `src/pages/CourseDetail.tsx`
- **更新**: 「撰寫評論」按鈕導航到 `/write-review/:courseCode`

### 課程卡片
- **位置**: `src/components/features/reviews/CourseCard.tsx`
- **更新**: 「撰寫評論」按鈕導航到 `/write-review/:courseCode`

## 多語言支援

### 翻譯鍵值
已在三種語言文件中添加完整的評論相關翻譯：

#### 主要翻譯鍵值
- `review.title`: 撰寫評論
- `review.subtitle`: 分享您的課程體驗說明
- `review.selectCourse`: 選擇課程
- `review.selectTerm`: 選擇學期
- `review.selectInstructors`: 選擇教師
- `review.workload`: 課程工作量
- `review.difficulty`: 課程難度
- `review.usefulness`: 課程實用性
- `review.teachingScore`: 教學評分
- `review.gradingScore`: 評分公平性
- `review.courseRequirements`: 課程要求
- `review.submitReview`: 提交評論

#### 課程要求翻譯
- `review.hasMidterm`: 期中考試
- `review.hasQuiz`: 小測驗
- `review.hasGroupProject`: 小組專案
- `review.hasIndividualAssignment`: 個人作業
- `review.hasPresentation`: 口頭報告
- `review.hasReading`: 指定閱讀
- `review.hasAttendanceRequirement`: 出席要求

## 數據結構

### 評論數據格式
```typescript
interface ReviewData {
  user_id: string;
  is_anon: boolean;
  username: string;
  course_code: string;
  term_code: string;
  course_workload: number;
  course_difficulties: number;
  course_usefulness: number;
  course_final_grade: string;
  course_comments: string;
  has_service_learning: boolean;
  service_learning_description?: string;
  submitted_at: string;
  instructor_details: string; // JSON字符串
}
```

### 教師評價數據格式
```typescript
interface InstructorDetail {
  instructor_name: string;
  session_type: string;
  grading: number | null;
  teaching: number;
  has_midterm: boolean;
  has_quiz: boolean;
  has_group_project: boolean;
  has_individual_assignment: boolean;
  has_presentation: boolean;
  has_reading: boolean;
  has_attendance_requirement: boolean;
  comments: string;
}
```

## 安全性和驗證

### 前端驗證
- 必填欄位檢查（課程、學期、教師、評分、成績）
- 星級評分範圍驗證（1-5）
- 表單完整性驗證

### 用戶認證
- 需要用戶登入才能訪問評論提交功能
- 未登入用戶會看到登入提示頁面

### SEO配置
- 在 `robots.txt` 中禁止搜尋引擎索引 `/write-review` 路由
- 評論提交頁面不包含在 sitemap 中（需要登入的功能）

## 用戶體驗

### 智能預填
- 從課程詳情頁面或課程卡片點擊「撰寫評論」時，自動預選對應課程
- 動態載入相關數據（學期、教師）

### 載入狀態
- 各個階段都有適當的載入指示器
- 錯誤處理和用戶友好的錯誤訊息

### 響應式設計
- 支援桌面和手機設備
- 適當的間距和佈局調整

## 技術實現

### 狀態管理
- 使用 React hooks 管理表單狀態
- 智能的依賴載入（課程→學期→教師）

### API整合
- 與現有的 Appwrite 數據庫集成
- 使用現有的 CourseService API

### 錯誤處理
- 完整的錯誤捕獲和用戶反饋
- Toast 通知系統整合

## 測試狀態

- ✅ 構建測試通過
- ✅ TypeScript 類型檢查通過
- ✅ 多語言翻譯完整
- ✅ 路由配置正確
- ✅ 組件整合成功

## 使用方式

1. 用戶登入系統
2. 從課程詳情頁面或課程列表點擊「撰寫評論」
3. 選擇課程、學期和教師
4. 填寫課程評價（工作量、難度、實用性、成績）
5. 為每位教師填寫教學評價
6. 選擇是否匿名提交
7. 提交評論

評論將保存到 `reviews` 集合中，包含完整的課程和教師評價信息。 