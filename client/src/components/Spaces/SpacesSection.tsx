import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/contexts/AppContext';
import { Space } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Users, FileText, Wrench } from 'lucide-react';

interface SpacesSectionProps {
  onSpaceSelect: (space: Space) => void;
}

export const SpacesSection: React.FC<SpacesSectionProps> = ({ onSpaceSelect }) => {
  const { user } = useAppContext();

  const { data: spaces = [], isLoading } = useQuery<Space[]>({
    queryKey: ['/api/spaces'],
    enabled: true, // Allow fetching spaces even when not authenticated for demo
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading spaces...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Spaces</h1>
        <p className="text-gray-600">Organize your work into focused spaces with dedicated tools and resources.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {spaces.map((space) => (
          <SpaceCard
            key={space.id}
            space={space}
            onSelect={() => onSpaceSelect(space)}
          />
        ))}
        
        {/* Add New Space Card */}
        <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center h-32">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Add Space</h3>
              <p className="text-sm text-gray-500 mt-1">Create a new workspace</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface SpaceCardProps {
  space: Space;
  onSelect: () => void;
}

const SpaceCard: React.FC<SpaceCardProps> = ({ space, onSelect }) => {
  // Mock resource counts for now - in real implementation, these would come from API
  const resourceCounts = {
    sources: 0,
    notes: 0,
    knowledgeBase: 0,
  };
  
  const totalResources = resourceCounts.sources + resourceCounts.notes + resourceCounts.knowledgeBase;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          {space.isDefault && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Default
            </span>
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2">{space.name}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {space.description || "No description provided"}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              <span>{resourceCounts.sources}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              <span>1</span> {/* Default Sophia */}
            </div>
            <div className="flex items-center">
              <Wrench className="w-3 h-3 mr-1" />
              <span>4</span> {/* Default tools */}
            </div>
          </div>
          <span className="font-medium">{totalResources} items</span>
        </div>
      </CardContent>
    </Card>
  );
};