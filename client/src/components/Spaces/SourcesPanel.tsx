import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Source, Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, FileText, BookOpen, ToggleLeft, ToggleRight, MessageSquare } from 'lucide-react';
import { GoogleDriveChatHistory } from '@/components/Sidebar/GoogleDriveChatHistory';

interface SourcesPanelProps {
  spaceId: number;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({ spaceId }) => {
  const [activeTab, setActiveTab] = useState("knowledge-base");

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
      <div className="flex-1 overflow-hidden" style={{marginTop: '10px'}}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="chat-history">Chat History</TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge-base" className="flex-1 p-4 mt-0">
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
                    <p className="text-sm">
                      Saved sources will appear here. Click Add to upload PDFs, websites, text, videos, or audio files. 
                      Or import directly from Google Drive.
                    </p>
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
                    <p className="text-sm">
                      No notes yet. Create your first note to get started.
                    </p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <NoteItem key={note.id} note={note} />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat-history" className="flex-1 p-4 mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat History
                </h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <GoogleDriveChatHistory />
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