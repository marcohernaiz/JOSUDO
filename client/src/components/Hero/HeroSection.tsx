
import josudoLogo from "@assets/josudo light background_1756031061697.webp";
import brainImage from "@assets/20250824_1046_Digital Brain Dashboard_remix_01k3dm048gfq7892ekr6rvskxn_1756031958536.png";

export const HeroSection: React.FC = () => {
  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <section className="bg-white pt-0 pb-0 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
          {/* Left Column - Text Content with JOSUDO Logo */}
          <div className="order-1 lg:order-1 lg:col-span-3 text-left flex flex-col justify-start">
            <div className="mb-0">
              <img
                src={josudoLogo}
                alt="JOSUDO - Own Your Data"
                className="h-40 w-auto object-contain"
              />
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4 -mt-8">
              The brain that powers your{" "}
              <span className="text-blue-500">AI Ecosystem</span>
            </h1>
            
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mb-6">
              All your AI models and tools in one subscription—chats, images, videos, workflows, 
              and even virtual employees—while your data stays safe in your own cloud.
            </p>

            <div className="flex justify-center">
              <button
                onClick={handleGoogleSignIn}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                Get Started for Free
              </button>
            </div>
          </div>

          {/* Right Column - Brain Image */}
          <div className="order-2 lg:order-2 lg:col-span-2 flex justify-center items-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={brainImage}
                alt="AI Brain with Connected Services"
                className="w-full h-full max-h-80 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
