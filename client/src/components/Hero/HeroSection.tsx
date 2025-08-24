import React from 'react';
import josudoLogoOrange from '../assets/josudo-logo-orange.svg'; // Assuming this import is correct

export const HeroSection: React.FC = () => {
  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <section className="bg-white pt-0 pb-0 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center min-h-[60vh]">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={josudoLogoOrange}
              alt="JOSUDO - Own Your Data"
              className="w-full h-full max-h-48 object-contain drop-shadow-2xl"
            />
          </div>
          {/* Text Content */}
          <div className="text-center flex flex-col justify-center max-w-4xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4">
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
        </div>
      </div>
    </section>
  );
};