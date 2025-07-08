import React, { useState } from 'react';
import { MultiSelectDropdown, SelectOption } from '@/components/ui/multi-select-dropdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageWrapper, ResponsiveContainer, SectionWrapper } from '@/components/responsive';

const MultiSelectDemo = () => {
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // 部門選項
  const departmentOptions: SelectOption[] = [
    { value: 'chinese', label: '中文系', count: 45 },
    { value: 'english', label: '英文系', count: 32 },
    { value: 'history', label: '歷史系', count: 28 },
    { value: 'philosophy', label: '哲學系', count: 15 },
    { value: 'translation', label: '翻譯系', count: 22 },
  ];

  // 科目選項
  const subjectOptions: SelectOption[] = [
    { value: 'CHIN1234', label: 'CHIN1234 - 基礎中文', count: 12 },
    { value: 'ENGL2345', label: 'ENGL2345 - English Literature', count: 18 },
    { value: 'HIST3456', label: 'HIST3456 - 世界史概論', count: 8 },
    { value: 'PHIL4567', label: 'PHIL4567 - 邏輯學', count: 6 },
  ];

  // 語言選項
  const languageOptions: SelectOption[] = [
    { value: 'chinese', label: '中文', count: 85 },
    { value: 'english', label: 'English', count: 92 },
    { value: 'mixed', label: '雙語', count: 23 },
  ];

  return (
    <PageWrapper>
      <ResponsiveContainer size="lg">
        <SectionWrapper spacing="lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">多選下拉組件演示</h1>
            <p className="text-xl text-muted-foreground">
              展示「全選」邏輯：當所有個別選項都被選中時，自動切換到「全選」狀態
            </p>
          </div>

          <div className="space-y-8">
            {/* 邏輯說明 */}
            <Card>
              <CardHeader>
                <CardTitle>邏輯說明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">✅ 正確行為</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• 點擊「全部」→ 清除所有個別選項，只顯示「全部」</li>
                      <li>• 當「全部」選中時，點擊個別選項 → 取消「全部」，只選中該項目</li>
                      <li>• 逐個選中所有選項 → 自動切換到「全部」狀態</li>
                      <li>• 當「全部」選中時，個別選項都不會顯示勾選</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">❌ 避免的情況</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• 「全部」和個別選項同時被選中</li>
                      <li>• 所有個別選項都選中但「全部」不顯示選中</li>
                      <li>• 狀態不一致的情況</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 測試案例 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 部門選擇 */}
              <Card>
                <CardHeader>
                  <CardTitle>部門選擇 (5個選項)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MultiSelectDropdown
                    options={departmentOptions}
                    selectedValues={selectedDepartments}
                    onSelectionChange={setSelectedDepartments}
                    placeholder="選擇部門..."
                    showCounts={true}
                  />
                  
                  <div>
                    <h5 className="font-medium mb-2">當前選中值：</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedDepartments.length === 0 ? (
                        <Badge variant="outline">無選擇</Badge>
                      ) : selectedDepartments.map(value => (
                        <Badge key={value} variant="secondary">{value}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <strong>測試步驟：</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>嘗試選中所有5個部門</li>
                      <li>觀察是否自動切換到「全部」</li>
                      <li>點擊「全部」後再點擊個別選項</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* 科目選擇 */}
              <Card>
                <CardHeader>
                  <CardTitle>科目選擇 (4個選項)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MultiSelectDropdown
                    options={subjectOptions}
                    selectedValues={selectedSubjects}
                    onSelectionChange={setSelectedSubjects}
                    placeholder="選擇科目..."
                    showCounts={true}
                  />
                  
                  <div>
                    <h5 className="font-medium mb-2">當前選中值：</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedSubjects.length === 0 ? (
                        <Badge variant="outline">無選擇</Badge>
                      ) : selectedSubjects.map(value => (
                        <Badge key={value} variant="secondary">{value}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <strong>測試步驟：</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>先選中2個科目</li>
                      <li>再選中第3個科目</li>
                      <li>選中第4個科目，觀察切換</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* 語言選擇 */}
              <Card>
                <CardHeader>
                  <CardTitle>語言選擇 (3個選項)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MultiSelectDropdown
                    options={languageOptions}
                    selectedValues={selectedLanguages}
                    onSelectionChange={setSelectedLanguages}
                    placeholder="選擇語言..."
                    showCounts={true}
                  />
                  
                  <div>
                    <h5 className="font-medium mb-2">當前選中值：</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedLanguages.length === 0 ? (
                        <Badge variant="outline">無選擇</Badge>
                      ) : selectedLanguages.map(value => (
                        <Badge key={value} variant="secondary">{value}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <strong>測試步驟：</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>點擊「全部」</li>
                      <li>觀察個別選項狀態</li>
                      <li>點擊任意個別選項</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 狀態總覽 */}
            <Card>
              <CardHeader>
                <CardTitle>狀態總覽</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">部門狀態</h5>
                    <div className="text-sm text-muted-foreground">
                      選中數量: {selectedDepartments.length}<br />
                      總選項數: {departmentOptions.length}<br />
                      是否為「全部」: {selectedDepartments.includes('all') ? '是' : '否'}<br />
                      狀態: {
                        selectedDepartments.length === 0 ? '無選擇' :
                        selectedDepartments.includes('all') ? '全選' :
                        selectedDepartments.length === departmentOptions.length ? '個別全選' :
                        '部分選擇'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">科目狀態</h5>
                    <div className="text-sm text-muted-foreground">
                      選中數量: {selectedSubjects.length}<br />
                      總選項數: {subjectOptions.length}<br />
                      是否為「全部」: {selectedSubjects.includes('all') ? '是' : '否'}<br />
                      狀態: {
                        selectedSubjects.length === 0 ? '無選擇' :
                        selectedSubjects.includes('all') ? '全選' :
                        selectedSubjects.length === subjectOptions.length ? '個別全選' :
                        '部分選擇'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">語言狀態</h5>
                    <div className="text-sm text-muted-foreground">
                      選中數量: {selectedLanguages.length}<br />
                      總選項數: {languageOptions.length}<br />
                      是否為「全部」: {selectedLanguages.includes('all') ? '是' : '否'}<br />
                      狀態: {
                        selectedLanguages.length === 0 ? '無選擇' :
                        selectedLanguages.includes('all') ? '全選' :
                        selectedLanguages.length === languageOptions.length ? '個別全選' :
                        '部分選擇'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 技術說明 */}
            <Card>
              <CardHeader>
                <CardTitle>技術實現</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <h4>核心邏輯</h4>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
{`// 當選擇個別選項時
if (checked) {
  if (safeSelectedValues.includes('all') || safeSelectedValues.length === 0) {
    // 如果當前是「全選」狀態，開始新的個別選擇
    newValues = [optionValue];
  } else {
    // 添加到現有選擇
    newValues = [...safeSelectedValues.filter(v => v !== 'all'), optionValue];
    
    // 檢查是否所有選項都被選中了
    if (newValues.length === selectableOptions.length) {
      // 自動切換到「全選」狀態
      newValues = ['all'];
    }
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </SectionWrapper>
      </ResponsiveContainer>
    </PageWrapper>
  );
};

export default MultiSelectDemo;