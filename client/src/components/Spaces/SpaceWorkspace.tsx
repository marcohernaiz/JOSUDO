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