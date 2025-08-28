import React, { useState } from 'react';
import { Space } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Upload, Image } from 'lucide-react';
import { SourcesPanel } from '@/components/Spaces/SourcesPanel';
import { ChatPanel } from '@/components/Spaces/ChatPanel';
import { StudioPanel } from '@/components/Spaces/StudioPanel';

interface SpaceWorkspaceProps {
  space: Space;
  onBack: () => void;
}

export const SpaceWorkspace: React.FC<SpaceWorkspaceProps> = ({ space, onBack }) => {
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Workspace Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Spaces
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingHeader(!isEditingHeader)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Cover Image */}
          <div className="relative mb-6">
            <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              {space.coverImage ? (
                <img 
                  src={space.coverImage} 
                  alt="Space cover" 
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="flex items-center text-white">
                  <Image className="w-8 h-8 mr-2" />
                  <span className="text-lg font-medium">Add Cover Image</span>
                </div>
              )}
            </div>
            {isEditingHeader && (
              <Button
                size="sm"
                className="absolute top-2 right-2 bg-white text-gray-900 hover:bg-gray-100"
              >
                <Upload className="w-4 h-4 mr-1" />
                Change
              </Button>
            )}
          </div>

          {/* Workspace Details */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isEditingHeader ? (
                <input
                  type="text"
                  defaultValue={space.name}
                  className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                />
              ) : (
                space.name
              )}
            </h1>
            <p className="text-gray-600">
              {isEditingHeader ? (
                <textarea
                  defaultValue={space.description || "Add a description for this space..."}
                  className="w-full bg-transparent border border-gray-300 rounded p-2 focus:border-blue-500 outline-none resize-none"
                  rows={2}
                />
              ) : (
                space.description || "Add a description for this space..."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sources Panel - Left */}
        <div className="w-1/4 border-r border-gray-200">
          <SourcesPanel spaceId={space.id} />
        </div>

        {/* Chat Panel - Center */}
        <div className="flex-1">
          <ChatPanel space={space} />
        </div>

        {/* Studio Panel - Right */}
        <div className="w-1/4 border-l border-gray-200">
          <StudioPanel spaceId={space.id} />
        </div>
      </div>
    </div>
  );
};