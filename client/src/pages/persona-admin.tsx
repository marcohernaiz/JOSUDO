import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonaTemplate } from '@shared/schema';
import { Settings, User, Save, Plus } from 'lucide-react';

const PersonaAdmin = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<PersonaTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<PersonaTemplate[]>({
    queryKey: ['/api/admin/persona-templates'],
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (template: PersonaTemplate) => {
      const response = await fetch(`/api/admin/persona-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/persona-templates'] });
      setIsEditing(false);
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: Omit<PersonaTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/admin/persona-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/persona-templates'] });
    },
  });

  const handleSave = () => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate(selectedTemplate);
    }
  };

  const handleCreateNew = () => {
    const newTemplate = {
      name: 'New Persona',
      role: 'New Role',
      category: 'virtual_employees',
      avatar: '/avatars/default.jpg',
      voiceId: 'default',
      greeting: 'Hello! I\'m ready to help you.',
      systemPrompt: 'You are a helpful assistant.',
      behaviorText: '',
      capabilitiesText: '',
      contextualText: '',
      guardrailsText: '',
      multimodalConfig: {
        webChat: true,
        webAudio: false,
        webVideo: false,
        phoneCalls: false,
        whatsapp: false,
        email: false,
      },
      resourcesConfig: {
        ownResources: false,
        otherResources: false,
      },
      skills: [],
      isActive: true,
    };
    createTemplateMutation.mutate(newTemplate);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Persona Templates Admin
          </h1>
          <Badge variant="destructive" className="ml-2">ADMIN ONLY</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Templates ({templates.length})
                </CardTitle>
                <Button 
                  size="sm" 
                  onClick={handleCreateNew}
                  disabled={createTemplateMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {templates.map((template: PersonaTemplate) => (
                    <div
                      key={template.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedTemplate?.id === template.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsEditing(false);
                      }}
                    >
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.role}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {template.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Edit Template: {selectedTemplate.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                    {isEditing && (
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateTemplateMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {updateTemplateMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="basic" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="configuration">Configuration</TabsTrigger>
                      <TabsTrigger value="multimodal">Multimodal</TabsTrigger>
                      <TabsTrigger value="skills">Skills</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <Input
                            value={selectedTemplate.name}
                            onChange={(e) => isEditing && setSelectedTemplate({
                              ...selectedTemplate,
                              name: e.target.value
                            })}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Role</label>
                          <Input
                            value={selectedTemplate.role}
                            onChange={(e) => isEditing && setSelectedTemplate({
                              ...selectedTemplate,
                              role: e.target.value
                            })}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Category</label>
                          <Select 
                            value={selectedTemplate.category} 
                            onValueChange={(value) => isEditing && setSelectedTemplate({
                              ...selectedTemplate,
                              category: value
                            })}
                            disabled={!isEditing}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="virtual_employees">Virtual Employees</SelectItem>
                              <SelectItem value="industry_experts">Industry Experts</SelectItem>
                              <SelectItem value="personal_companion">Personal Companion</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Avatar Path</label>
                          <Input
                            value={selectedTemplate.avatar || ''}
                            onChange={(e) => isEditing && setSelectedTemplate({
                              ...selectedTemplate,
                              avatar: e.target.value
                            })}
                            disabled={!isEditing}
                            placeholder="/avatars/persona.jpg"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Greeting</label>
                        <Textarea
                          value={selectedTemplate.greeting || ''}
                          onChange={(e) => isEditing && setSelectedTemplate({
                            ...selectedTemplate,
                            greeting: e.target.value
                          })}
                          disabled={!isEditing}
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="configuration" className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">System Prompt</label>
                        <Textarea
                          value={selectedTemplate.systemPrompt || ''}
                          onChange={(e) => isEditing && setSelectedTemplate({
                            ...selectedTemplate,
                            systemPrompt: e.target.value
                          })}
                          disabled={!isEditing}
                          rows={6}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Behavior & Communication</label>
                          <Textarea
                            value={selectedTemplate.behaviorText || ''}
                            onChange={(e) => isEditing && setSelectedTemplate({
                              ...selectedTemplate,
                              behaviorText: e.target.value
                            })}
                            disabled={!isEditing}
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Capabilities</label>
                          <Textarea
                            value={selectedTemplate.capabilitiesText || ''}
                            onChange={(e) => isEditing && setSelectedTemplate({
                              ...selectedTemplate,
                              capabilitiesText: e.target.value
                            })}
                            disabled={!isEditing}
                            rows={4}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Contextual Intelligence</label>
                          <Textarea
                            value={selectedTemplate.contextualText || ''}
                            onChange={(e) => isEditing && setSelectedTemplate({
                              ...selectedTemplate,
                              contextualText: e.target.value
                            })}
                            disabled={!isEditing}
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Guardrails</label>
                          <Textarea
                            value={selectedTemplate.guardrailsText || ''}
                            onChange={(e) => isEditing && setSelectedTemplate({
                              ...selectedTemplate,
                              guardrailsText: e.target.value
                            })}
                            disabled={!isEditing}
                            rows={4}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="multimodal" className="space-y-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Configure multimodal conversation capabilities
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Multimodal configuration would go here */}
                        <div className="text-sm text-gray-500">
                          Multimodal settings: {JSON.stringify(selectedTemplate.multimodalConfig)}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="skills" className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Skills (comma-separated)</label>
                        <Input
                          value={selectedTemplate.skills?.join(', ') || ''}
                          onChange={(e) => isEditing && setSelectedTemplate({
                            ...selectedTemplate,
                            skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          disabled={!isEditing}
                          placeholder="email, calendar, CRM, analytics"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a template to edit</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaAdmin;