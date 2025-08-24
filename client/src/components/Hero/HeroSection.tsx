import React from 'react';
import brainDashboardImage from '@assets/20250824_1046_Digital Brain Dashboard_remix_01k3dm048gfq7892ekr6rvskxn_1756038659549.png';

export const HeroSection: React.FC = () => {
  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <section className="bg-white px-4 sm:px-6 lg:px-8 pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end pb-12">
          {/* Left Column - Text Content */}
          <div className="flex flex-col justify-end items-center text-center lg:items-start lg:text-left lg:col-span-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-2">
              The brain that powers your{" "}
              <span className="text-blue-500">AI Ecosystem</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              All your AI models and tools in one subscription—chats, images, videos, workflows,
              and even virtual employees—while your data stays safe in your own cloud.
            </p>
          </div>

          {/* Right Column - Image */}
          <div className="flex justify-center lg:justify-end lg:col-span-1">
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