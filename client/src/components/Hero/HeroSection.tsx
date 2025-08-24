
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import brainImage from "@assets/20250824_1046_Digital Brain Dashboard_remix_01k3dm048gfq7892ekr6rvskxn_1756029501198.png";

export const HeroSection: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      window.location.href = '/api/auth/google';
    } else {
      // Scroll to chat area or focus on input
      const chatInput = document.querySelector('textarea');
      if (chatInput) {
        chatInput.focus();
      }
    }
  };

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              JOSUDO - The brain that powers your{" "}
              <span className="text-blue-500">AI Ecosystem</span>
            </h1>
            
            <h2 className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
              All your AI models and tools in one subscription—chats, images, videos, workflows, 
              and even virtual employees—while your data stays safe in your own cloud.
            </h2>
            
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Get Started
            </Button>
          </div>

          {/* Right Column - Brain Image */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-lg">
              <img
                src={brainImage}
                alt="AI Brain with Connected Services"
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-3xl scale-110 -z-10"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
