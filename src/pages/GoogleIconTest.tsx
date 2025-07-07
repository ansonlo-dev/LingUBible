import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GoogleIconTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">Google Icon Test</h1>
        
        {/* Different sizes test */}
        <Card>
          <CardHeader>
            <CardTitle>Different Sizes</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <GoogleIcon size={16} />
              <span className="text-sm">16px</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <GoogleIcon size={20} />
              <span className="text-sm">20px</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <GoogleIcon size={24} />
              <span className="text-sm">24px</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <GoogleIcon size={32} />
              <span className="text-sm">32px</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <GoogleIcon size={48} />
              <span className="text-sm">48px</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <GoogleIcon size={64} />
              <span className="text-sm">64px</span>
            </div>
          </CardContent>
        </Card>

        {/* Variants test */}
        <Card>
          <CardHeader>
            <CardTitle>Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-20">Color:</span>
              <GoogleIcon size={32} variant="color" />
            </div>
            <div className="flex items-center gap-4 bg-black p-2 rounded">
              <span className="w-20 text-white">White:</span>
              <GoogleIcon size={32} variant="white" />
            </div>
          </CardContent>
        </Card>

        {/* In button contexts */}
        <Card>
          <CardHeader>
            <CardTitle>In Button Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <GoogleIcon size={20} />
              <span>Sign in with Google</span>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <GoogleIcon size={16} variant="white" />
              <span>Continue with Google</span>
            </button>
          </CardContent>
        </Card>

        {/* Direct image test */}
        <Card>
          <CardHeader>
            <CardTitle>Direct Image Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Testing direct access to the image file:</p>
            <img 
              src="/Google_Favicon_2025.svg.png" 
              alt="Google Icon Direct" 
              width={64} 
              height={64}
              className="border rounded"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoogleIconTest;