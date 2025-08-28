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
      <div className="p-4 border-b border-gray-200" style={{marginTop: '10px'}}>
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
          <div className="mt-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-800">📁 {space.name}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload a source to get started</h3>
              <p className="text-gray-600 max-w-sm">
                Add sources to your Knowledge Base or create notes to start a conversation with context.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <ChatArea />
          </div>
        )}

        <div className="border-t border-gray-200 p-4">
          <MessageInput />
        </div>
      </div>
    </div>
  );
};