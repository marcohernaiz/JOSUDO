
import josudoLogo from "@assets/josudo light background_1756031061697.webp";

export const HeroSection: React.FC = () => {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="order-1 lg:order-1 text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              The brain that powers your{" "}
              <span className="text-blue-500">AI Ecosystem</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl">
              All your AI models and tools in one subscription—chats, images, videos, workflows, 
              and even virtual employees—while your data stays safe in your own cloud.
            </p>
          </div>

          {/* Right Column - JOSUDO Logo */}
          <div className="order-2 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-md">
              <img
                src={josudoLogo}
                alt="JOSUDO - Own Your Data"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
