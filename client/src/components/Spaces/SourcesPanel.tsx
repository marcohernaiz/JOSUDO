import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Source, Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, FileText, BookOpen, ToggleLeft, ToggleRight, MoreVertical, Edit, FolderPlus, Settings, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SourcesPanelProps {
  spaceId: number;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({ spaceId }) => {
  const [activeTab, setActiveTab] = useState("sources");
  const [expandedSubspaces, setExpandedSubspaces] = useState<Record<string, boolean>>({});
  
  // Mock subspaces data
  const subspaces = [
    { id: 'research', name: 'Research', parentId: spaceId },
    { id: 'projects', name: 'Projects', parentId: spaceId },
  ];
  
  const toggleSubspace = (subspaceId: string) => {
    setExpandedSubspaces(prev => ({
      ...prev,
      [subspaceId]: !prev[subspaceId]
    }));
  };

  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: ['/api/spaces', spaceId, 'sources'],
    enabled: !!spaceId,
  });

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['/api/spaces', spaceId, 'notes'],
    enabled: !!spaceId,
  });

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Space Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{spaceId === 1 ? 'My Personal Space' : 'My Workspace'}</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="flex items-center cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                Rename space
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center cursor-pointer">
                <FolderPlus className="w-4 h-4 mr-2" />
                Create subspace
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Configuration
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Subspaces Section */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="space-y-1">
          {subspaces.map((subspace) => (
            <div key={subspace.id} className="flex items-center justify-between group">
              <div
                className="flex items-center flex-1 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                onClick={() => toggleSubspace(subspace.id)}
              >
                {expandedSubspaces[subspace.id] ? (
                  <ChevronDown className="w-3 h-3 mr-2 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 mr-2 text-gray-400" />
                )}
                <Folder className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-700">{subspace.name}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="flex items-center cursor-pointer">
                    <Edit className="w-4 h-4 mr-2" />
                    Rename space
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center cursor-pointer">
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Create subspace
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuration
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="chats">Chats</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="flex-1 p-4 mt-0">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Button size="sm" className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Source
                </Button>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  Discover
                </Button>
              </div>

              {sources.length > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Include All Sources</span>
                  <ToggleRight className="w-5 h-5 text-blue-500" />
                </div>
              )}

              <div className="space-y-3">
                {sources.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm mb-4">
                      No sources yet
                    </p>
                    <Button size="sm" className="flex items-center mx-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Add new source
                    </Button>
                  </div>
                ) : (
                  sources.map((source) => (
                    <SourceItem key={source.id} source={source} />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="flex-1 p-4 mt-0">
            <div className="space-y-4">
              <Button size="sm" className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>

              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm mb-4">
                      No notes yet
                    </p>
                    <Button size="sm" className="flex items-center mx-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Create new note
                    </Button>
                  </div>
                ) : (
                  notes.map((note) => (
                    <NoteItem key={note.id} note={note} />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chats" className="flex-1 p-4 mt-0">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-4">
                    No chats yet
                  </p>
                  <Button size="sm" className="flex items-center mx-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Start a new chat
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface SourceItemProps {
  source: Source;
}

const SourceItem: React.FC<SourceItemProps> = ({ source }) => {
  return (
    <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">{source.title}</h4>
              <p className="text-xs text-gray-500 capitalize">{source.type}</p>
            </div>
          </div>
          {source.isInKnowledgeBase ? (
            <ToggleRight className="w-4 h-4 text-blue-500" />
          ) : (
            <ToggleLeft className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface NoteItemProps {
  note: Note;
}

const NoteItem: React.FC<NoteItemProps> = ({ note }) => {
  return (
    <Card className="border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 mb-1">{note.title}</h4>
            <p className="text-xs text-gray-600 line-clamp-2">
              {note.content ? note.content.substring(0, 100) + '...' : 'No content'}
            </p>
          </div>
          <div className="ml-2">
            {note.isInKnowledgeBase ? (
              <ToggleRight className="w-4 h-4 text-blue-500" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};