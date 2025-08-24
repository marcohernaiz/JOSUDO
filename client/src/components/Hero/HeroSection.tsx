import React from 'react';
import brainDashboardImage from '@assets/20250824_1046_Digital Brain Dashboard_remix_01k3dm048gfq7892ekr6rvskxn_1756038659549.png';

export const HeroSection: React.FC = () => {
  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <section className="bg-white pt-2.5 pb-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[60vh]">
          {/* Left Column - Text Content */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
              The brain that powers your{" "}
              <span className="text-blue-500">AI Ecosystem</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
              All your AI models and tools in one subscription—chats, images, videos, workflows,
              and even virtual employees—while your data stays safe in your own cloud.
            </p>

            <div className="flex">
              <button
                onClick={handleGoogleSignIn}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                Get Started for Free
              </button>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="flex justify-center lg:justify-end">
            <img
              src={brainDashboardImage}
              alt="Digital Brain Dashboard - AI Ecosystem"
              className="w-full max-w-lg h-auto object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};