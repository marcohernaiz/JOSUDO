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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PersonaConfigurationProps {
  personaId: string;
  onClose: () => void;
}

export const PersonaConfiguration: React.FC<PersonaConfigurationProps> = ({ personaId, onClose }) => {
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Digital Personas
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Configure {personaData.name}</h1>
              <p className="text-sm text-gray-600">{personaData.role}</p>
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full flex overflow-hidden">
        {/* Left Area - Persona Basics */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          {/* Avatar */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Avatar</Label>
            <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-gray-100 mb-3">
              <img
                src={personaData.avatar}
                alt={personaData.name}
                className="w-full h-full object-cover"
              />
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Change Avatar
            </Button>
          </div>

          {/* Voice Button */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Voice</Label>
            <Button variant="outline" className="w-full justify-start">
              <Mic className="w-4 h-4 mr-2" />
              {personaData.voiceId}
            </Button>
          </div>

          {/* Name */}
          <div className="mb-6">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">Name</Label>
            <Input
              id="name"
              value={personaData.name}
              onChange={(e) => setPersonaData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Role */}
          <div className="mb-6">
            <Label htmlFor="role" className="text-sm font-medium text-gray-700 mb-2 block">Role</Label>
            <Input
              id="role"
              value={personaData.role}
              onChange={(e) => setPersonaData(prev => ({ ...prev, role: e.target.value }))}
            />
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
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {availableResources.slice(0, 4).map((resource) => (
                <div key={resource.id} className="flex items-center space-x-2 text-sm text-gray-600">
                  <resource.icon className="w-4 h-4" />
                  <span>{resource.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connect to Other Resources */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-700">Connect to Other Resources</Label>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {availableResources.slice(4).map((resource) => (
                <div key={resource.id} className="flex items-center space-x-2 text-sm text-gray-600">
                  <resource.icon className="w-4 h-4" />
                  <span>{resource.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area - Configuration Panels */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Tabs defaultValue="role" className="h-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="role">Role & Identity</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
              <TabsTrigger value="context">Context</TabsTrigger>
              <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
            </TabsList>

            {/* Panel 1: Role & Identity Definition */}
            <TabsContent value="role" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role & Identity Definition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="role-desc">Role</Label>
                    <Textarea
                      id="role-desc"
                      value={personaData.roleIdentity.role}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        roleIdentity: { ...prev.roleIdentity, role: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="identity-desc">Identity</Label>
                    <Textarea
                      id="identity-desc"
                      value={personaData.roleIdentity.identity}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        roleIdentity: { ...prev.roleIdentity, identity: e.target.value }
                      }))}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="personality">Personality</Label>
                    <Input
                      id="personality"
                      value={personaData.roleIdentity.personality}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        roleIdentity: { ...prev.roleIdentity, personality: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="style">Style</Label>
                    <Input
                      id="style"
                      value={personaData.roleIdentity.style}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        roleIdentity: { ...prev.roleIdentity, style: e.target.value }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Panel 2: Behavior & Communication */}
            <TabsContent value="behavior" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Behavior & Communication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="style-matching">Style Matching</Label>
                    <Textarea
                      id="style-matching"
                      value={personaData.behaviorCommunication.styleMatching}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        behaviorCommunication: { ...prev.behaviorCommunication, styleMatching: e.target.value }
                      }))}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="proactivity">Proactivity</Label>
                    <Input
                      id="proactivity"
                      value={personaData.behaviorCommunication.proactivity}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        behaviorCommunication: { ...prev.behaviorCommunication, proactivity: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Input
                      id="tone"
                      value={personaData.behaviorCommunication.tone}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        behaviorCommunication: { ...prev.behaviorCommunication, tone: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="response-length">Response Length</Label>
                    <Input
                      id="response-length"
                      value={personaData.behaviorCommunication.responseLength}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        behaviorCommunication: { ...prev.behaviorCommunication, responseLength: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="context-handling">Context Handling</Label>
                    <Input
                      id="context-handling"
                      value={personaData.behaviorCommunication.contextHandling}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        behaviorCommunication: { ...prev.behaviorCommunication, contextHandling: e.target.value }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Panel 3: Capabilities & Objectives */}
            <TabsContent value="capabilities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Capabilities & Objectives</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="primary-cap">Primary Capabilities</Label>
                    <Input
                      id="primary-cap"
                      value={personaData.capabilities.primary}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        capabilities: { ...prev.capabilities, primary: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="conflict-res">Conflict Resolution</Label>
                    <Input
                      id="conflict-res"
                      value={personaData.capabilities.conflict}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        capabilities: { ...prev.capabilities, conflict: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recommendations">Recommendations</Label>
                    <Input
                      id="recommendations"
                      value={personaData.capabilities.recommendations}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        capabilities: { ...prev.capabilities, recommendations: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="management">Management</Label>
                    <Input
                      id="management"
                      value={personaData.capabilities.management}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        capabilities: { ...prev.capabilities, management: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tracking">Tracking</Label>
                    <Input
                      id="tracking"
                      value={personaData.capabilities.tracking}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        capabilities: { ...prev.capabilities, tracking: e.target.value }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Panel 4: Contextual Intelligence */}
            <TabsContent value="context" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contextual Intelligence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="awareness">Awareness</Label>
                    <Input
                      id="awareness"
                      value={personaData.contextualIntelligence.awareness}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        contextualIntelligence: { ...prev.contextualIntelligence, awareness: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="personalization">Personalization</Label>
                    <Input
                      id="personalization"
                      value={personaData.contextualIntelligence.personalization}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        contextualIntelligence: { ...prev.contextualIntelligence, personalization: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adaptation">Adaptation</Label>
                    <Input
                      id="adaptation"
                      value={personaData.contextualIntelligence.adaptation}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        contextualIntelligence: { ...prev.contextualIntelligence, adaptation: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="efficiency">Efficiency</Label>
                    <Input
                      id="efficiency"
                      value={personaData.contextualIntelligence.efficiency}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        contextualIntelligence: { ...prev.contextualIntelligence, efficiency: e.target.value }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Panel 5: Guardrails */}
            <TabsContent value="guardrails" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Guardrails</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="boundaries">Boundaries</Label>
                    <Textarea
                      id="boundaries"
                      value={personaData.guardrails.boundaries}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        guardrails: { ...prev.guardrails, boundaries: e.target.value }
                      }))}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ethics">Ethics & Confidentiality</Label>
                    <Textarea
                      id="ethics"
                      value={personaData.guardrails.ethics}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        guardrails: { ...prev.guardrails, ethics: e.target.value }
                      }))}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="technical">Technical Constraints</Label>
                    <Textarea
                      id="technical"
                      value={personaData.guardrails.technical}
                      onChange={(e) => setPersonaData(prev => ({
                        ...prev,
                        guardrails: { ...prev.guardrails, technical: e.target.value }
                      }))}
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};