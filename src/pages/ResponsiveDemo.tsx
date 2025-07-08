import { useResponsive } from '@/hooks/use-responsive';
import { 
  Mobile, 
  Tablet, 
  Desktop, 
  NotMobile,
  CourseGrid,
  InstructorGrid
} from '@/components/responsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Tablet as TabletIcon, Monitor } from 'lucide-react';

const ResponsiveDemo = () => {
  const responsive = useResponsive();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="py-8 md:py-12">
          <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">
            Responsive Design Demo
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            This page demonstrates the responsive features powered by react-responsive
          </p>
          
          {/* Current Device Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Device Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Breakpoint:</span>
                  <Badge variant="secondary">{responsive.currentBreakpoint}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Device Type:</span>
                  {responsive.isMobile && <Badge><Smartphone className="w-3 h-3 mr-1" /> Mobile</Badge>}
                  {responsive.isTablet && <Badge><TabletIcon className="w-3 h-3 mr-1" /> Tablet</Badge>}
                  {responsive.isDesktop && <Badge><Monitor className="w-3 h-3 mr-1" /> Desktop</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Orientation:</span>
                  <Badge variant="outline">
                    {responsive.isPortrait ? 'Portrait' : 'Landscape'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Touch Device:</span>
                  <Badge variant="outline">
                    {responsive.isTouchDevice ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Conditional Rendering Demo */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Conditional Rendering</h2>
            
            <Mobile>
              <Card className="mb-4 border-blue-500">
                <CardContent className="pt-6">
                  <p className="text-blue-600">📱 This card only shows on mobile devices</p>
                </CardContent>
              </Card>
            </Mobile>
            
            <Tablet>
              <Card className="mb-4 border-purple-500">
                <CardContent className="pt-6">
                  <p className="text-purple-600">📱 This card only shows on tablets</p>
                </CardContent>
              </Card>
            </Tablet>
            
            <Desktop>
              <Card className="mb-4 border-green-500">
                <CardContent className="pt-6">
                  <p className="text-green-600">🖥️ This card only shows on desktop</p>
                </CardContent>
              </Card>
            </Desktop>
            
            <NotMobile>
              <Card className="mb-4 border-orange-500">
                <CardContent className="pt-6">
                  <p className="text-orange-600">💻 This card shows on tablet and desktop (not mobile)</p>
                </CardContent>
              </Card>
            </NotMobile>
          </div>
          
          {/* Orientation Demo */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Device Detection</h2>
            
            <div className="grid gap-4">
              <Card className="border-indigo-500">
                <CardContent className="pt-6">
                  <p className="text-indigo-600">
                    🌐 Orientation: {responsive.isPortrait ? 'Portrait' : 'Landscape'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-teal-500">
                <CardContent className="pt-6">
                  <p className="text-teal-600">
                    📱 Touch Device: {responsive.isTouchDevice ? 'Yes' : 'No'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Responsive Grid Demo */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Responsive Grid System</h2>
            
            <h3 className="text-lg font-semibold mb-2">Course Grid</h3>
            <CourseGrid className="mb-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <p>Course Card {i}</p>
                  </CardContent>
                </Card>
              ))}
            </CourseGrid>
            
            <h3 className="text-lg font-semibold mb-2">Instructor Grid</h3>
            <InstructorGrid>
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <p>Instructor Card {i}</p>
                  </CardContent>
                </Card>
              ))}
            </InstructorGrid>
          </div>
          
          {/* Debug Information */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto bg-muted p-4 rounded">
                {JSON.stringify(responsive, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveDemo;