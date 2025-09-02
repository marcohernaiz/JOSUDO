import React from 'react';
import { Space } from '@/types';
import { useChat } from '@/hooks/useChat';
import { ChatArea } from '@/components/Chat/ChatArea';
import { MessageInput } from '@/components/Chat/MessageInput';
import { Upload } from 'lucide-react';

interface ChatPanelProps {
  space: Space;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ space }) => {
  const { messages } = useChat();

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-gray-200" style={{marginTop: '10px'}}>
        <h1 className="text-2xl font-bold text-gray-900">{space.name}</h1>
        <p className="text-sm text-gray-600">Chat with context from this space</p>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload a source to get started</h3>
                <p className="text-gray-600 max-w-sm">
                  Add sources to your Knowledge Base or create notes to start a conversation with context.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <ChatArea />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <MessageInput />
        </div>
      </div>
    </div>
  );
};