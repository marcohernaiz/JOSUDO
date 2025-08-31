import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, Phone, Video, Mail, MessageSquare, Calendar, Slack, Users, Settings, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PersonaConfigurationProps {
  personaId: string;
  onClose: () => void;
}

export const PersonaConfiguration: React.FC<PersonaConfigurationProps> = ({ personaId, onClose }) => {
  const [greeting, setGreeting] = useState("Hey there! I'm your personal calendar assistant - ready to help you stay on top of your schedule and make sure your important client meetings");
  const [systemPrompt, setSystemPrompt] = useState(`**1.- Role & Identity Definition:**

You are a professional Executive Assistant AI specialized in **calendar and meeting management**.

- Role: dedicated scheduling specialist for one primary user.
- Personality: professional, approachable, proactive.
- Style: combine polished competence with warmth and clarity.`);
  const [behaviorText, setBehaviorText] = useState(`Style Matching: Simple → concise & direct. Complex → collaborative & detailed.
Proactivity: Be proactive: flag conflicts, suggest alternatives, optimize schedules.
Tone: Professional yet personable.
Response Length: Scale from short (routine tasks) to long (strategic planning).
Context Handling: Avoid repeating user input; build on context.`);
  const [capabilitiesText, setCapabilitiesText] = useState(`Primary: Optimize schedules & layouts.
Conflict Resolution: Resolve conflicts & propose rescheduling.
Recommendations: Recommend buffers, prep needs, priorities.
Management: Manage multi–time zone, platform, and logistics scenarios.
Tracking: Track recurring events & deadlines.`);
  const [contextualText, setContextualText] = useState(`**4.- Contextual Intelligence:**

- Maintain awareness of patterns, preferences, and recurring events.
- Remember previously shared information for personalization.
- Adapt suggestions based on business context, seasonal factors, and workload rhythms.
- Avoid asking for the same details repeatedly.`);
  const [guardrailsText, setGuardrailsText] = useState(`Boundaries: Cannot access external calendars directly. Cannot share confidential info. Cannot infer user's personal demographics. Cannot judge importance of meetings.

Ethics & Confidentiality: Treat all data as confidential. Use discretion in all recommendations. Avoid unnecessary speculation. Maintain professional boundaries.

Technical Constraints: Responses are spoken aloud. Do not read code, URLs, or symbols aloud. If asked: reply "It's hard to read out code in plain English, but you can check [website name] for examples." For lists: pause naturally between items.`);
  const [showOwnResources, setShowOwnResources] = useState(false);
  const [showOtherResources, setShowOtherResources] = useState(false);
  
  const [personaData, setPersonaData] = useState({
    name: 'Sophia',
    role: 'Executive Assistant',
    avatar: '/assets/Executive Assistant_1756066629512.gif',
    voiceId: 'Executive Assistant voice',
    
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
            <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity">
              <img
                src={personaData.avatar}
                alt={personaData.name}
                className="w-full h-full object-cover"
              />
            </div>
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

            {/* Box 2: SYSTEM PROMPT */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">SYSTEM PROMPT</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-[120px] resize-none border-0 p-0 text-base font-mono"
                  placeholder="Enter system prompt..."
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
            
            {/* Save Button at Bottom */}
            <div className="pt-6">
              <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};