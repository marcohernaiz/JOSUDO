import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { DigitalPersona } from '@/types';

// Import organized avatars for path resolution
import executiveAssistantAvatar from '@assets/avatars/executive-assistant.gif';
import salesMarketingAvatar from '@assets/avatars/sales-marketing.gif';
import customerSupportAvatar from '@assets/avatars/customer-support.gif';
import elderlyCareAvatar from '@assets/avatars/elderly-care.gif';
import digitalBuddyAvatar from '@assets/avatars/digital-buddy.gif';
import aiGirlfriendAvatar from '@assets/avatars/ai-girlfriend.gif';

// Avatar mapping for asset imports
const avatarAssets: Record<string, string> = {
  'executive-assistant.gif': executiveAssistantAvatar,
  'sales-marketing.gif': salesMarketingAvatar,
  'customer-support.gif': customerSupportAvatar,
  'elderly-care.gif': elderlyCareAvatar,
  'digital-buddy.gif': digitalBuddyAvatar,
  'ai-girlfriend.gif': aiGirlfriendAvatar,
};

// Helper function to resolve avatar path to actual image URL
const resolveAvatarPath = (avatarPath: string): string => {
  if (!avatarPath) return executiveAssistantAvatar;
  
  // If it's an asset import path like @assets/avatars/filename
  if (avatarPath.startsWith('@assets/avatars/')) {
    const filename = avatarPath.replace('@assets/avatars/', '');
    return avatarAssets[filename] || executiveAssistantAvatar;
  }
  
  // If it's an API URL, use it directly
  if (avatarPath.startsWith('/api/avatar-library/')) {
    return avatarPath;
  }
  
  // If it's already a resolved asset path, use it
  return avatarPath;
};

interface PersonaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonaSelectionModal: React.FC<PersonaSelectionModalProps> = ({ isOpen, onClose }) => {
  const { selectedPersona, setSelectedPersona } = useAppContext();
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch user's digital personas
  const { data: personas = [], isLoading: isLoadingPersonas } = useQuery<DigitalPersona[]>({
    queryKey: ['/api/digital-personas'],
    enabled: isAuthenticated && isOpen,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch admin persona templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<any[]>({
    queryKey: ['/api/admin/persona-templates'],
    enabled: isOpen,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const isLoading = isLoadingPersonas || isLoadingTemplates;

  // Combine templates and personas for filtering
  const allOptions = [
    ...templates.map(template => ({ ...template, isTemplate: true })),
    ...personas.map(persona => ({ ...persona, isTemplate: false }))
  ];

  const filteredOptions = allOptions.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPersona = (option: any) => {
    // Convert template to persona-like object if needed
    const persona = option.isTemplate ? {
      ...option,
      id: `template-${option.id}`,
      userId: 0, // Templates don't have userId
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } : option;
    
    setSelectedPersona(persona);
    onClose();
  };

  const handleUseDefault = () => {
    setSelectedPersona(null); // Reset to default JOSUDO AI
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Choose Digital Persona
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <Input
              placeholder="Search personas by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {/* Default JOSUDO AI Option */}
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all mb-4 ${
                !selectedPersona 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
              onClick={handleUseDefault}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">JOSUDO AI Assistant</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Default AI assistant</p>
                </div>
                {!selectedPersona && (
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                )}
              </div>
            </div>

            {/* Available Digital Personas and Templates */}
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading available personas...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No personas match your search.' : 'No digital personas available.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOptions.map((option, index) => {
                  const isSelected = selectedPersona && (
                    (option.isTemplate && selectedPersona.id === `template-${option.id}`) ||
                    (!option.isTemplate && selectedPersona.id === option.id.toString())
                  );
                  
                  return (
                    <div
                      key={option.isTemplate ? `template-${option.id}` : option.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                      onClick={() => handleSelectPersona(option)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0">
                          <img
                            src={resolveAvatarPath(option.avatar || '')}
                            alt={option.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {option.name}
                            </h3>
                            {option.isTemplate && (
                              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">
                                Template
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {option.role}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {allOptions.length} option{allOptions.length !== 1 ? 's' : ''} available ({templates.length} template{templates.length !== 1 ? 's' : ''}, {personas.length} persona{personas.length !== 1 ? 's' : ''})
              </p>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};