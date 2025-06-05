import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LecturerAvatar } from '@/components/ui/lecturer-avatar';
import { Badge } from '@/components/ui/badge';
import { Star, BookOpen, Users } from 'lucide-react';

// 示例講師數據
const sampleLecturers = [
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'e.davis@university.edu',
    department: 'English',
    rating: 4.7,
    reviews: 52,
    courses: 5
  },
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'j.smith@university.edu',
    department: 'Computer Science',
    rating: 4.5,
    reviews: 38,
    courses: 3
  },
  {
    firstName: 'Maria',
    lastName: 'Rodriguez',
    email: 'm.rodriguez@university.edu',
    department: 'Mathematics',
    rating: 4.8,
    reviews: 67,
    courses: 4
  },
  {
    firstName: 'David',
    lastName: 'Chen',
    email: 'd.chen@university.edu',
    department: 'Physics',
    rating: 4.6,
    reviews: 29,
    courses: 2
  }
];

export default function LecturerDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 頁面標題 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">講師頭像系統演示</h1>
          <p className="text-muted-foreground text-lg">
            統一紅色主題的專業講師頭像設計
          </p>
        </div>

        {/* 尺寸演示 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>頭像尺寸演示</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6 text-center">
              {['sm', 'md', 'lg', 'xl'].map(size => (
                <div key={size} className="space-y-3">
                  <LecturerAvatar
                    firstName="Emily"
                    lastName="Davis"
                    size={size as 'sm' | 'md' | 'lg' | 'xl'}
                    className="mx-auto"
                  />
                  <div>
                    <p className="font-medium">{size.toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">
                      {size === 'sm' ? '32px' : 
                       size === 'md' ? '40px' : 
                       size === 'lg' ? '64px' : '80px'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 講師列表演示 */}
        <Card>
          <CardHeader>
            <CardTitle>講師列表演示</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sampleLecturers.map((lecturer, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <LecturerAvatar
                    firstName={lecturer.firstName}
                    lastName={lecturer.lastName}
                    email={lecturer.email}
                    size="lg"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Prof. {lecturer.firstName} {lecturer.lastName}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {lecturer.department}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{lecturer.rating}</span>
                        <span>({lecturer.reviews} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{lecturer.courses} courses</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 緊湊列表演示 */}
        <Card>
          <CardHeader>
            <CardTitle>緊湊列表演示</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sampleLecturers.map((lecturer, index) => (
                <div key={index} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-md transition-colors">
                  <LecturerAvatar
                    firstName={lecturer.firstName}
                    lastName={lecturer.lastName}
                    email={lecturer.email}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Prof. {lecturer.firstName} {lecturer.lastName}</p>
                    <p className="text-sm text-muted-foreground">{lecturer.department}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{lecturer.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 設計說明 */}
        <Card>
          <CardHeader>
            <CardTitle>設計特點</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold mx-auto">
                  ED
                </div>
                <h4 className="font-medium">統一紅色主題</h4>
                <p className="text-sm text-muted-foreground">
                  與網站主色調保持一致，營造專業感
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="h-12 w-12 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold mx-auto border-2 border-red-200">
                  JS
                </div>
                <h4 className="font-medium">精緻邊框</h4>
                <p className="text-sm text-muted-foreground">
                  淺色邊框增強視覺層次感
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="h-12 w-12 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold mx-auto">
                  MR
                </div>
                <h4 className="font-medium">清晰易讀</h4>
                <p className="text-sm text-muted-foreground">
                  白色文字確保最佳對比度和可讀性
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 