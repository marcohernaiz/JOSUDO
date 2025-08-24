
import josudoLogo from "@assets/josudo light background_1756031061697.webp";
import brainImage from "@assets/20250824_1046_Digital Brain Dashboard_remix_01k3dm048gfq7892ekr6rvskxn_1756031958536.png";

export const HeroSection: React.FC = () => {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content with JOSUDO Logo */}
          <div className="order-1 lg:order-1 text-left">
            <div className="flex items-center mb-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mr-6">
                The brain that powers your{" "}
                <span className="text-blue-500">AI Ecosystem</span>
              </h1>
              <img
                src={josudoLogo}
                alt="JOSUDO - Own Your Data"
                className="h-16 w-auto object-contain"
              />
            </div>
            
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl">
              All your AI models and tools in one subscription—chats, images, videos, workflows, 
              and even virtual employees—while your data stays safe in your own cloud.
            </p>
          </div>

          {/* Right Column - Brain Image */}
          <div className="order-2 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-md">
              <img
                src={brainImage}
                alt="AI Brain with Connected Services"
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
