import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Persona } from './PersonaSelector';

export interface RoleCustomization {
  taskFocus: string[];
  workStyle: string;
  workingHours: string;
  customHours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

interface RoleCustomizationProps {
  persona: Persona;
  onCustomizationComplete: (customization: RoleCustomization) => void;
  onBack: () => void;
}

const taskFocusOptions = {
  closer: [
    'Lead Generation & Qualification',
    'Sales Pipeline Management', 
    'Client Relationship Building',
    'Proposal & Quote Creation',
    'Follow-up & Nurturing',
    'Revenue Forecasting',
    'Competitor Analysis',
    'Sales Performance Analytics'
  ],
  connector: [
    'Partnership Development',
    'Network Expansion',
    'Strategic Alliances',
    'Stakeholder Communication',
    'Event Networking',
    'Collaboration Facilitation',
    'Relationship Mapping',
    'Community Building'
  ],
  guardian: [
    'Risk Assessment & Management',
    'Security Protocol Implementation',
    'Compliance Monitoring',
    'Process Optimization',
    'Quality Assurance',
    'Emergency Response Planning',
    'Audit & Documentation',
    'Business Continuity'
  ],
  bridge: [
    'Team Coordination',
    'Cross-Department Communication',
    'Workflow Automation',
    'Project Management',
    'Meeting Facilitation',
    'Information Flow Optimization',
    'Conflict Resolution',
    'Process Integration'
  ],
  visionary: [
    'Strategic Planning',
    'Market Trend Analysis',
    'Innovation Strategy',
    'Vision Development',
    'Future Opportunity Identification',
    'Competitive Intelligence',
    'Business Model Innovation',
    'Growth Strategy Planning'
  ],
  analyst: [
    'Data Analysis & Interpretation',
    'Performance Metrics Tracking',
    'Business Intelligence Reports',
    'Market Research',
    'KPI Development',
    'Trend Analysis',
    'Predictive Modeling',
    'Dashboard Creation'
  ],
  innovator: [
    'Product Development Strategy',
    'Technology Integration',
    'Creative Problem Solving',
    'Innovation Pipeline Management',
    'R&D Coordination',
    'Patent & IP Strategy',
    'Prototype Development',
    'Technology Roadmapping'
  ]
};

const workStyleOptions = [
  { value: 'formal', label: 'Formal', description: 'Professional and structured communication' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable interaction style' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and informal communication' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and motivating approach' }
];

const workingHoursOptions = [
  { value: 'always-on', label: 'Always Available', description: '24/7 availability for any requests' },
  { value: 'business-hours', label: 'Business Hours', description: '9 AM - 5 PM in your timezone' },
  { value: 'extended-hours', label: 'Extended Hours', description: '7 AM - 8 PM in your timezone' },
  { value: 'custom', label: 'Custom Schedule', description: 'Set your own preferred hours' }
];

export const RoleCustomization: React.FC<RoleCustomizationProps> = ({ 
  persona, 
  onCustomizationComplete, 
  onBack 
}) => {
  const [taskFocus, setTaskFocus] = useState<string[]>([]);
  const [workStyle, setWorkStyle] = useState<string>('');
  const [workingHours, setWorkingHours] = useState<string>('');
  const [customHours, setCustomHours] = useState({
    start: '09:00',
    end: '17:00',
    timezone: 'America/New_York'
  });

  const availableTasks = taskFocusOptions[persona.id as keyof typeof taskFocusOptions] || [];

  const handleTaskFocusChange = (task: string, checked: boolean) => {
    if (checked) {
      setTaskFocus(prev => [...prev, task]);
    } else {
      setTaskFocus(prev => prev.filter(t => t !== task));
    }
  };

  const handleComplete = () => {
    const customization: RoleCustomization = {
      taskFocus,
      workStyle,
      workingHours,
      ...(workingHours === 'custom' && { customHours })
    };
    onCustomizationComplete(customization);
  };

  const isValid = taskFocus.length > 0 && workStyle && workingHours;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className={`w-16 h-16 rounded-full ${persona.color} flex items-center justify-center text-2xl`}>
            {persona.avatar}
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Customize {persona.name}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {persona.title}
            </p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Tailor your virtual employee's focus areas, communication style, and availability to match your business needs.
        </p>
      </div>

      <div className="space-y-8">
        {/* Task Focus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              Task Focus Areas
            </CardTitle>
            <CardDescription>
              Select the areas where you want {persona.name} to focus their expertise. Choose at least 3 areas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTasks.map((task) => (
                <div key={task} className="flex items-center space-x-2">
                  <Checkbox
                    id={task}
                    checked={taskFocus.includes(task)}
                    onCheckedChange={(checked) => handleTaskFocusChange(task, checked as boolean)}
                  />
                  <label
                    htmlFor={task}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {task}
                  </label>
                </div>
              ))}
            </div>
            {taskFocus.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Selected focus areas:</p>
                <div className="flex flex-wrap gap-2">
                  {taskFocus.map((task) => (
                    <Badge key={task} variant="secondary">
                      {task}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Style */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              Communication Style
            </CardTitle>
            <CardDescription>
              Choose how you'd like {persona.name} to communicate with you and your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={workStyle} onValueChange={setWorkStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select communication style" />
              </SelectTrigger>
              <SelectContent>
                {workStyleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-slate-500">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">⏰</span>
              Working Hours
            </CardTitle>
            <CardDescription>
              Set when {persona.name} should be available to assist you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={workingHours} onValueChange={setWorkingHours}>
              <SelectTrigger>
                <SelectValue placeholder="Select working hours" />
              </SelectTrigger>
              <SelectContent>
                {workingHoursOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-slate-500">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {workingHours === 'custom' && (
              <div className="mt-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                <h4 className="font-medium mb-3">Custom Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={customHours.start}
                      onChange={(e) => setCustomHours(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full p-2 border rounded-md bg-white dark:bg-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={customHours.end}
                      onChange={(e) => setCustomHours(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full p-2 border rounded-md bg-white dark:bg-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Timezone</label>
                    <Select 
                      value={customHours.timezone} 
                      onValueChange={(value) => setCustomHours(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">GMT</SelectItem>
                        <SelectItem value="Europe/Berlin">CET</SelectItem>
                        <SelectItem value="Asia/Tokyo">JST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          Back to Personas
        </Button>
        
        <div className="flex gap-4">
          <Button 
            onClick={handleComplete}
            disabled={!isValid}
            className="bg-primary hover:bg-primary/90"
          >
            Continue to Onboarding
          </Button>
        </div>
      </div>

      {!isValid && (
        <p className="text-sm text-slate-500 text-center mt-4">
          Please select at least one task focus area, communication style, and working hours to continue.
        </p>
      )}
    </div>
  );
};