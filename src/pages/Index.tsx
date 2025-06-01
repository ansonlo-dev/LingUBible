
import { useState } from 'react';
import { CourseCard } from '@/components/CourseCard';
import { LecturerCard } from '@/components/LecturerCard';
import { StatsCard } from '@/components/StatsCard';
import { BookOpen, Users, Star, TrendingUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const courses = [
    {
      title: "Introduction to Computer Science",
      code: "CS101",
      lecturer: "Dr. Sarah Johnson",
      rating: 4.5,
      reviewCount: 24,
      studentCount: 156,
      department: "Computer Science",
      difficulty: "Medium" as const
    },
    {
      title: "Advanced Mathematics",
      code: "MATH301",
      lecturer: "Prof. Michael Chen",
      rating: 4.2,
      reviewCount: 18,
      studentCount: 89,
      department: "Mathematics",
      difficulty: "Hard" as const
    },
    {
      title: "English Literature",
      code: "ENG201",
      lecturer: "Dr. Emily Davis",
      rating: 4.8,
      reviewCount: 32,
      studentCount: 203,
      department: "English",
      difficulty: "Easy" as const
    }
  ];

  const lecturers = [
    {
      name: "Sarah Johnson",
      department: "Computer Science",
      title: "Dr.",
      rating: 4.6,
      reviewCount: 45,
      courseCount: 3,
      specialties: ["Programming", "Data Structures", "Algorithms", "Machine Learning"]
    },
    {
      name: "Michael Chen",
      department: "Mathematics",
      title: "Prof.",
      rating: 4.3,
      reviewCount: 28,
      courseCount: 4,
      specialties: ["Calculus", "Linear Algebra", "Statistics"]
    },
    {
      name: "Emily Davis",
      department: "English",
      title: "Dr.",
      rating: 4.7,
      reviewCount: 52,
      courseCount: 5,
      specialties: ["Literature", "Creative Writing", "Poetry", "Drama"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center py-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to <span className="gradient-text">LingUBible</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your platform for honest course and lecturer reviews. Help fellow students make informed decisions.
          </p>
          
          {/* Mobile Search */}
          <div className="md:hidden max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses, lecturers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>
          
          <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white font-medium px-8">
            Get Started
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <StatsCard
            title="Total Courses"
            value="1,247"
            change="+12% this month"
            icon={BookOpen}
            trend="up"
          />
          <StatsCard
            title="Lecturers"
            value="342"
            change="+5% this month"
            icon={Users}
            trend="up"
          />
          <StatsCard
            title="Reviews"
            value="8,943"
            change="+23% this month"
            icon={Star}
            trend="up"
          />
          <StatsCard
            title="Active Students"
            value="2,156"
            change="+8% this month"
            icon={TrendingUp}
            trend="up"
          />
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Popular Courses
            </TabsTrigger>
            <TabsTrigger value="lecturers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Lecturers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Popular Courses</h2>
              <Button variant="outline">View All</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <div key={course.code} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CourseCard {...course} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lecturers" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Top Rated Lecturers</h2>
              <Button variant="outline">View All</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lecturers.map((lecturer, index) => (
                <div key={lecturer.name} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <LecturerCard {...lecturer} />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
