import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Persona {
  id: string;
  name: string;
  title: string;
  tagline: string;
  description: string;
  skills: string[];
  avatar: string;
  color: string;
}

const personas: Persona[] = [
  {
    id: 'closer',
    name: 'The Closer',
    title: 'Sales & Revenue Specialist',
    tagline: 'I turn leads into loyal customers',
    description: 'Expert in sales optimization, client relationship management, and revenue growth strategies.',
    skills: ['Sales Strategy', 'CRM Management', 'Lead Qualification', 'Pipeline Optimization'],
    avatar: '🎯',
    color: 'bg-red-500'
  },
  {
    id: 'connector',
    name: 'The Connector', 
    title: 'Networking & Partnership Expert',
    tagline: 'I build bridges that grow your business',
    description: 'Specializes in relationship building, strategic partnerships, and network expansion.',
    skills: ['Partnership Development', 'Network Building', 'Stakeholder Management', 'Collaboration'],
    avatar: '🤝',
    color: 'bg-blue-500'
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    title: 'Operations & Security Specialist', 
    tagline: 'I protect and optimize your business',
    description: 'Focuses on operational excellence, risk management, and business protection.',
    skills: ['Risk Management', 'Process Optimization', 'Security Protocols', 'Compliance'],
    avatar: '🛡️',
    color: 'bg-green-500'
  },
  {
    id: 'bridge',
    name: 'The Bridge',
    title: 'Communication & Integration Expert',
    tagline: 'I connect teams and streamline workflows',
    description: 'Expert in internal communication, team coordination, and workflow optimization.',
    skills: ['Team Coordination', 'Workflow Automation', 'Internal Communication', 'Project Management'],
    avatar: '🌉',
    color: 'bg-purple-500'
  },
  {
    id: 'visionary',
    name: 'The Visionary',
    title: 'Strategy & Innovation Leader',
    tagline: 'I see opportunities and create the future',
    description: 'Specializes in strategic planning, innovation management, and future-focused thinking.',
    skills: ['Strategic Planning', 'Innovation Management', 'Market Analysis', 'Vision Development'],
    avatar: '🔮',
    color: 'bg-indigo-500'
  },
  {
    id: 'analyst',
    name: 'The Analyst',
    title: 'Data & Insights Specialist',
    tagline: 'I turn data into actionable insights',
    description: 'Expert in data analysis, performance metrics, and evidence-based decision making.',
    skills: ['Data Analysis', 'Performance Metrics', 'Research', 'Business Intelligence'],
    avatar: '📊',
    color: 'bg-yellow-500'
  },
  {
    id: 'innovator',
    name: 'The Innovator',
    title: 'Product & Technology Expert',
    tagline: 'I create solutions for tomorrow\'s challenges',
    description: 'Focuses on product development, technological advancement, and creative problem-solving.',
    skills: ['Product Development', 'Technology Integration', 'Creative Solutions', 'Innovation Strategy'],
    avatar: '💡',
    color: 'bg-orange-500'
  }
];

interface PersonaSelectorProps {
  onPersonaSelect: (persona: Persona) => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({ onPersonaSelect }) => {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const handlePersonaClick = (persona: Persona) => {
    setSelectedPersona(persona);
  };

  const handleHireClick = () => {
    if (selectedPersona) {
      onPersonaSelect(selectedPersona);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Hire Your Virtual Employee
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Choose a specialized AI assistant that matches your business needs. Each persona brings unique expertise and working style.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {personas.map((persona) => (
          <Card 
            key={persona.id}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
              selectedPersona?.id === persona.id 
                ? 'ring-2 ring-primary border-primary shadow-lg' 
                : 'hover:border-slate-400 dark:hover:border-slate-600'
            }`}
            onClick={() => handlePersonaClick(persona)}
          >
            <CardHeader className="text-center pb-4">
              <div className={`w-16 h-16 rounded-full ${persona.color} flex items-center justify-center text-2xl mx-auto mb-3`}>
                {persona.avatar}
              </div>
              <CardTitle className="text-lg font-semibold">{persona.name}</CardTitle>
              <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {persona.title}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 italic">
                "{persona.tagline}"
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                {persona.description}
              </p>
              
              <div className="flex flex-wrap gap-1">
                {persona.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {persona.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{persona.skills.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-4">
              <Button 
                className="w-full"
                variant={selectedPersona?.id === persona.id ? "default" : "outline"}
              >
                {selectedPersona?.id === persona.id ? "Selected" : "Select"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedPersona && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="bg-white dark:bg-slate-800 shadow-xl border-2 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${selectedPersona.color} flex items-center justify-center text-lg`}>
                    {selectedPersona.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {selectedPersona.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedPersona.title}
                    </p>
                  </div>
                </div>
                <Button onClick={handleHireClick} className="bg-primary hover:bg-primary/90">
                  Hire {selectedPersona.name}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};