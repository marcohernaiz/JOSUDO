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
      {/* Simple Header with Back Button */}
      <div className="border-b border-gray-200 bg-white">
        <div className="p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Spaces
          </Button>
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