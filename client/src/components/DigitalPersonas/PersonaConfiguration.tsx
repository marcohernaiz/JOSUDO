import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, Phone, Video, Mail, MessageSquare, Calendar, Slack, Users, Settings, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PersonaTemplate } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Import organized avatars for path resolution
import executiveAssistantAvatar from '@assets/avatars/executive-assistant.png';
import salesMarketingAvatar from '@assets/avatars/sales-marketing.png';
import customerSupportAvatar from '@assets/avatars/customer-support.png';
import elderlyCareAvatar from '@assets/avatars/elderly-care.gif';
import digitalBuddyAvatar from '@assets/avatars/digital-buddy.gif';
import aiGirlfriendAvatar from '@assets/avatars/ai-girlfriend.gif';

// Avatar mapping for asset imports
const avatarAssets: Record<string, string> = {
  'executive-assistant.png': executiveAssistantAvatar,
  'sales-marketing.png': salesMarketingAvatar,
  'customer-support.png': customerSupportAvatar,
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

interface PersonaConfigurationProps {
  personaId: string;
  onClose: () => void;
  isExistingPersona?: boolean; // To distinguish between template configuration and existing persona editing
}

export const PersonaConfiguration: React.FC<PersonaConfigurationProps> = ({ personaId, onClose, isExistingPersona = false }) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [greeting, setGreeting] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [behaviorText, setBehaviorText] = useState("");
  const [capabilitiesText, setCapabilitiesText] = useState("");
  const [contextualText, setContextualText] = useState("");
  const [guardrailsText, setGuardrailsText] = useState("");
  const [showOwnResources, setShowOwnResources] = useState(false);
  const [showOtherResources, setShowOtherResources] = useState(false);
  const [showAvatarLibrary, setShowAvatarLibrary] = useState(false);

  // Load templates from admin database
  const { data: templates = [] } = useQuery<PersonaTemplate[]>({
    queryKey: ['/api/admin/persona-templates'],
  });

  // Load avatar library
  const { data: avatarLibrary = [] } = useQuery<{ filename: string; url: string }[]>({
    queryKey: ['/api/avatar-library'],
  });
  
  // Find the selected template
  const selectedTemplate = templates.find(template => template.id.toString() === personaId);
  
  // Load template data into form fields when template is found
  useEffect(() => {
    if (selectedTemplate) {
      setPersonaData(prev => ({
        ...prev,
        name: selectedTemplate.name,
        role: selectedTemplate.role,
        avatar: selectedTemplate.avatar || '',
        voiceId: selectedTemplate.voiceId || '',
      }));
      setGreeting(selectedTemplate.greeting || '');
      setSystemPrompt(selectedTemplate.systemPrompt || '');
      setBehaviorText(selectedTemplate.behaviorText || '');
      setCapabilitiesText(selectedTemplate.capabilitiesText || '');
      setContextualText(selectedTemplate.contextualText || '');
      setGuardrailsText(selectedTemplate.guardrailsText || '');
    }
  }, [selectedTemplate]);
  
  const [personaData, setPersonaData] = useState({
    name: '',
    role: '',
    avatar: '',
    voiceId: '',
    
    // Multimodal toggles
    webChat: true,
    webAudio: true,
    webVideo: false,
    phoneCalls: true,
    whatsapp: true,
    email: true,
    
    // Persona's own resources
    phoneNumber: '',
    emailAddress: '',
    knowledgeBase: [],
    connectedResources: [],
    
    // Configuration panels
    roleIdentity: {
      role: 'Professional Executive Assistant AI specialized in calendar & meeting management.',
      identity: 'Dedicated scheduling specialist for one primary user.',
      personality: 'Professional, approachable, proactive.',
      style: 'Blend polished competence with warmth and clarity.'
    },
    
    behaviorCommunication: {
      styleMatching: 'Simple → concise & direct. Complex → collaborative & detailed.',
      proactivity: 'Be proactive: flag conflicts, suggest alternatives, optimize schedules.',
      tone: 'Professional yet personable.',
      responseLength: 'Scale from short (routine tasks) to long (strategic planning).',
      contextHandling: 'Avoid repeating user input; build on context.'
    },
    
    capabilities: {
      primary: 'Optimize schedules & layouts.',
      conflict: 'Resolve conflicts & propose rescheduling.',
      recommendations: 'Recommend buffers, prep needs, priorities.',
      management: 'Manage multi–time zone, platform, and logistics scenarios.',
      tracking: 'Track recurring events & deadlines.'
    },
    
    contextualIntelligence: {
      awareness: 'Maintain awareness of preferences, routines, and patterns.',
      personalization: 'Personalize based on past input & context.',
      adaptation: 'Adapt to seasonal/business factors & workload.',
      efficiency: 'Avoid re-asking for known details.'
    },
    
    guardrails: {
      boundaries: 'Cannot access external calendars directly. Cannot share confidential info. Cannot infer user\'s personal demographics. Cannot judge importance of meetings.',
      ethics: 'Treat all data as confidential. Use discretion in all recommendations. Avoid unnecessary speculation. Maintain professional boundaries.',
      technical: 'Responses are spoken aloud. Do not read code, URLs, or symbols aloud. If asked: reply "It\'s hard to read out code in plain English, but you can check [website name] for examples." For lists: pause naturally between items.'
    }
  });

  // Mutation for saving digital persona
  const savePersonaMutation = useMutation({
    mutationFn: async (personaData: any) => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to save persona');
      }
      return await apiRequest('POST', '/api/digital-personas', personaData);
    },
    onSuccess: () => {
      // Invalidate queries to refresh the digital personas list
      queryClient.invalidateQueries({ queryKey: ['/api/digital-personas'] });
      
      toast({
        title: 'Success',
        description: 'Digital persona saved to your profile successfully!',
        variant: 'default',
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to save persona: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting digital persona
  const deletePersonaMutation = useMutation({
    mutationFn: async (personaId: string) => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to delete persona');
      }
      return await apiRequest('DELETE', `/api/digital-personas/${personaId}`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh the digital personas list
      queryClient.invalidateQueries({ queryKey: ['/api/digital-personas'] });
      
      toast({
        title: 'Success',
        description: 'Digital persona deleted successfully!',
        variant: 'default',
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete persona: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to delete personas.',
        variant: 'destructive',
      });
      return;
    }

    if (!isExistingPersona) {
      toast({
        title: 'Cannot Delete',
        description: 'This is a template configuration. You can only delete saved personas.',
        variant: 'destructive',
      });
      return;
    }

    // Confirm deletion
    if (window.confirm('Are you sure you want to delete this digital persona? This action cannot be undone.')) {
      deletePersonaMutation.mutate(personaId);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save personas to your profile.',
        variant: 'destructive',
      });
      return;
    }

    // Prepare the persona data for saving
    const personaToSave = {
      name: personaData.name,
      role: personaData.role,
      avatar: personaData.avatar,
      voiceId: personaData.voiceId,
      greeting,
      systemPrompt,
      behaviorText,
      capabilitiesText,
      contextualText,
      guardrailsText,
      multimodalConfig: {
        webChat: personaData.webChat,
        webAudio: personaData.webAudio,
        webVideo: personaData.webVideo,
        phoneCalls: personaData.phoneCalls,
        whatsapp: personaData.whatsapp,
        email: personaData.email,
      },
      resourcesConfig: {
        ownResources: showOwnResources,
        otherResources: showOtherResources,
      },
    };

    savePersonaMutation.mutate(personaToSave);
  };

  const availableResources = [
    { id: 'phone', name: 'Phone Number', icon: Phone },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'knowledge', name: 'Knowledge Base', icon: Settings },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'slack', name: 'Slack', icon: Slack },
    { id: 'teams', name: 'Teams', icon: Users },
    { id: 'discord', name: 'Discord', icon: MessageSquare },
  ];

  return (
    <div className="h-full bg-gray-50 overflow-hidden">

      {/* Main Content */}
      <div className="h-full flex overflow-hidden relative">
        {/* Close Button - Floating */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="absolute top-4 left-4 z-10"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        {/* Left Area - Persona Basics */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 pt-16 overflow-y-auto">
          {/* Avatar */}
          <div className="mb-6">
            <div 
              className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowAvatarLibrary(true)}
            >
              <img
                src={resolveAvatarPath(personaData.avatar)}
                alt={personaData.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">Click to change avatar</p>
          </div>

          {/* Voice Button */}
          <div className="mb-6">
            <Button variant="outline" className="w-full justify-start">
              <Mic className="w-4 h-4 mr-2" />
              {personaData.voiceId}
            </Button>
          </div>

          {/* Name */}
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700 w-12">Name</Label>
              <Input
                id="name"
                value={personaData.name}
                onChange={(e) => setPersonaData(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>

          {/* Role */}
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              <Label htmlFor="role" className="text-sm font-medium text-gray-700 w-12">Role</Label>
              <Input
                id="role"
                value={personaData.role}
                onChange={(e) => setPersonaData(prev => ({ ...prev, role: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>

          {/* Multimodal Conversations */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Multimodal Conversations</Label>
            <div className="space-y-3">
              {[
                { key: 'webChat', label: 'Web Chat', icon: MessageSquare },
                { key: 'webAudio', label: 'Web Audio', icon: Mic },
                { key: 'webVideo', label: 'Web Video', icon: Video },
                { key: 'phoneCalls', label: 'Phone Calls', icon: Phone },
                { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                { key: 'email', label: 'Email', icon: Mail },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                  <Switch
                    checked={personaData[key as keyof typeof personaData] as boolean}
                    onCheckedChange={(checked) => setPersonaData(prev => ({ ...prev, [key]: checked }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Persona's Own Resources */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-700">Persona's Own Resources</Label>
              <Button variant="ghost" size="sm" onClick={() => setShowOwnResources(!showOwnResources)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {showOwnResources && (
              <div className="space-y-2">
                {availableResources.slice(0, 4).map((resource) => (
                  <div key={resource.id} className="flex items-center space-x-2 text-sm text-gray-600">
                    <resource.icon className="w-4 h-4" />
                    <span>{resource.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connect to Other Resources */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-700">Connect to Other Resources</Label>
              <Button variant="ghost" size="sm" onClick={() => setShowOtherResources(!showOtherResources)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {showOtherResources && (
              <div className="space-y-2">
                {availableResources.slice(4).map((resource) => (
                  <div key={resource.id} className="flex items-center space-x-2 text-sm text-gray-600">
                    <resource.icon className="w-4 h-4" />
                    <span>{resource.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Area - Configuration Panels */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            {/* Box 1: GREETING */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">GREETING</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="min-h-[80px] resize-none border-0 p-0 text-base"
                  placeholder="Enter greeting message..."
                />
              </CardContent>
            </Card>

            {/* Box 2: ROLE & IDENTITY DEFINITION */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">ROLE & IDENTITY DEFINITION</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-[120px] resize-none border-0 p-0 text-base"
                  placeholder="Enter role and identity definition..."
                />
              </CardContent>
            </Card>

            {/* Box 3: Behavior & Communication */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">BEHAVIOR & COMMUNICATION</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={behaviorText}
                  onChange={(e) => setBehaviorText(e.target.value)}
                  className="min-h-[120px] resize-none border-0 p-0 text-base"
                  placeholder="Enter behavior and communication guidelines..."
                />
              </CardContent>
            </Card>

            {/* Box 4: Capabilities & Objectives */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">CAPABILITIES & OBJECTIVES</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={capabilitiesText}
                  onChange={(e) => setCapabilitiesText(e.target.value)}
                  className="min-h-[120px] resize-none border-0 p-0 text-base"
                  placeholder="Enter capabilities and objectives..."
                />
              </CardContent>
            </Card>

            {/* Box 4: Contextual Intelligence */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">CONTEXTUAL INTELLIGENCE</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={contextualText}
                  onChange={(e) => setContextualText(e.target.value)}
                  className="min-h-[120px] resize-none border-0 p-0 text-base"
                  placeholder="Enter contextual intelligence guidelines..."
                />
              </CardContent>
            </Card>

            {/* Box 5: Guardrails */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">GUARDRAILS</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={guardrailsText}
                  onChange={(e) => setGuardrailsText(e.target.value)}
                  className="min-h-[150px] resize-none border-0 p-0 text-base"
                  placeholder="Enter guardrails and constraints..."
                />
              </CardContent>
            </Card>
            
            {/* Save and Delete Buttons at Bottom */}
            <div className="pt-6 flex gap-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 flex-1" 
                onClick={handleSave}
                disabled={savePersonaMutation.isPending}
              >
                {savePersonaMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
              
              {isExistingPersona && (
                <Button 
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deletePersonaMutation.isPending}
                  className="flex-shrink-0"
                >
                  {deletePersonaMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Library Modal */}
      {showAvatarLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Choose Avatar</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAvatarLibrary(false)}
              >
                ×
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {avatarLibrary.map((avatar) => (
                  <div
                    key={avatar.filename}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    onClick={() => {
                      // Convert API URL to asset import path
                      const assetPath = `@assets/avatars/${avatar.filename}`;
                      setPersonaData(prev => ({ ...prev, avatar: assetPath }));
                      setShowAvatarLibrary(false);
                    }}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {avatarLibrary.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No avatars available in the library
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};