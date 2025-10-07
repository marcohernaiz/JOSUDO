import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Plus, ChevronDown, ChevronRight, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PersonaConfiguration } from '@/components/DigitalPersonas/PersonaConfiguration';
import { PersonaTemplate, DigitalPersona } from '@shared/schema';
import { useLocation } from 'wouter';
import { useAppContext } from '@/contexts/AppContext';


interface PersonaTool {
  name: string;
  color: string;
}

interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  tools: PersonaTool[];
  category: 'virtual_employees' | 'industry_experts' | 'personal_companion';
}

// Helper function to assign colors to skills
const getSkillColor = (skill: string): string => {
  const colorMap: Record<string, string> = {
    'email': 'bg-blue-100 text-blue-800',
    'calendar': 'bg-green-100 text-green-800',
    'drive': 'bg-yellow-100 text-yellow-800',
    'phone': 'bg-purple-100 text-purple-800',
    'CRM': 'bg-red-100 text-red-800',
    'analytics': 'bg-orange-100 text-orange-800',
    'social media': 'bg-pink-100 text-pink-800',
    'ticketing': 'bg-teal-100 text-teal-800',
    'chat': 'bg-indigo-100 text-indigo-800',
    'knowledge base': 'bg-cyan-100 text-cyan-800',
    'HRIS': 'bg-rose-100 text-rose-800',
    'docs': 'bg-gray-100 text-gray-800',
    'medical records': 'bg-red-100 text-red-800',
    'scheduling': 'bg-blue-100 text-blue-800',
    'reminders': 'bg-amber-100 text-amber-800',
    'portfolio': 'bg-green-100 text-green-800',
    'reports': 'bg-blue-100 text-blue-800',
    'contracts': 'bg-indigo-100 text-indigo-800',
    'research': 'bg-green-100 text-green-800',
    'lesson plans': 'bg-yellow-100 text-yellow-800',
    'progress tracking': 'bg-green-100 text-green-800',
    'resources': 'bg-blue-100 text-blue-800',
    'troubleshooting': 'bg-red-100 text-red-800',
    'documentation': 'bg-blue-100 text-blue-800',
    'remote access': 'bg-purple-100 text-purple-800',
    'maps': 'bg-lime-100 text-lime-800',
    'translation db': 'bg-sky-100 text-sky-800',
    'video': 'bg-violet-100 text-violet-800',
    'lessons': 'bg-blue-100 text-blue-800',
    'pronunciation': 'bg-green-100 text-green-800',
    'grammar': 'bg-yellow-100 text-yellow-800',
    'goal setting': 'bg-orange-100 text-orange-800',
    'motivation': 'bg-green-100 text-green-800',
    'meditation app': 'bg-green-100 text-green-800',
    'health tracker': 'bg-red-100 text-red-800',
    'voice': 'bg-pink-100 text-pink-800',
    'parental control': 'bg-orange-100 text-orange-800',
    'camera': 'bg-gray-100 text-gray-800',
    'games': 'bg-purple-100 text-purple-800',
    'music': 'bg-pink-100 text-pink-800',
    'meditation': 'bg-purple-100 text-purple-800',
    'prayer': 'bg-blue-100 text-blue-800',
    'guidance': 'bg-green-100 text-green-800',
    'legal db': 'bg-slate-100 text-slate-800',
    'spreadsheets': 'bg-emerald-100 text-emerald-800',
    'video call': 'bg-violet-100 text-violet-800',
  };
  return colorMap[skill] || 'bg-gray-100 text-gray-800';
};

// Import organized avatars from attached_assets/avatars folder
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

// Helper function to map template names to organized avatars
const getAvatarForTemplate = (name: string): string => {
  const avatarMap: Record<string, string> = {
    'Sophia': executiveAssistantAvatar,
    'Carlos': salesMarketingAvatar,
    'Carlitos': salesMarketingAvatar,
    'Aisha': salesMarketingAvatar,
    'Liam': customerSupportAvatar,
    'Emma': executiveAssistantAvatar,
    'Maya': elderlyCareAvatar,
    'Ben': salesMarketingAvatar,
    'Priya': executiveAssistantAvatar,
    'David': digitalBuddyAvatar,
    'Zara': customerSupportAvatar,
    'Lucia': salesMarketingAvatar,
    'Hassan': digitalBuddyAvatar,
    'Maria': executiveAssistantAvatar,
    'Alex': digitalBuddyAvatar,
    'Ryan': digitalBuddyAvatar,
    'Jordan': digitalBuddyAvatar,
    'Riley': digitalBuddyAvatar,
    'Sam': elderlyCareAvatar,
    'Taylor': aiGirlfriendAvatar,
    // Additional mappings from existing personas
    'Diego': digitalBuddyAvatar,
    'Amira': executiveAssistantAvatar,
    'John': digitalBuddyAvatar,
    'Yuki': aiGirlfriendAvatar,
    'Marta': elderlyCareAvatar,
    'Arun': digitalBuddyAvatar,
    'Luna': aiGirlfriendAvatar,
    'Sofia': aiGirlfriendAvatar,
    'Max': digitalBuddyAvatar,
    'Gabriel': elderlyCareAvatar,
  };
  return avatarMap[name] || executiveAssistantAvatar;
};

const DigitalPersonas: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedPersonaType, setSelectedPersonaType] = useState<'template' | 'existing'>('template');
  const [, setLocation] = useLocation();
  const { setSelectedPersona: setActivePersona } = useAppContext();

  // Load user's configured personas from database
  const { data: userPersonas = [] } = useQuery<DigitalPersona[]>({
    queryKey: ['/api/digital-personas'],
  });

  // Load templates from admin database
  const { data: templates = [] } = useQuery<PersonaTemplate[]>({
    queryKey: ['/api/admin/persona-templates'],
  });

  // Convert user personas to display format (user personas don't have skills, just basic info)
  const configuredPersonas: Persona[] = userPersonas.map(persona => ({
    id: persona.id.toString(),
    name: persona.name,
    role: persona.role,
    avatar: resolveAvatarPath(persona.avatar || ''),
    tools: [], // User personas don't have predefined tools
    category: 'virtual_employees', // Default category for user personas
  }));

  // Convert templates to display format
  const templatePersonas: Persona[] = templates.map(template => ({
    id: template.id.toString(),
    name: template.name,
    role: template.role,
    avatar: resolveAvatarPath(template.avatar || getAvatarForTemplate(template.name)),
    tools: (template.skills || []).map((skill: string) => ({
      name: skill,
      color: getSkillColor(skill)
    })),
    category: template.category as 'virtual_employees' | 'industry_experts' | 'personal_companion',
  }));

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'virtual_employees': true,
    'industry_experts': true,
    'personal_companion': true,
  });

  const categories = [
    {
      id: 'virtual_employees',
      title: 'Virtual Employees',
      count: templatePersonas.filter(p => p.category === 'virtual_employees').length,
    },
    {
      id: 'industry_experts',
      title: 'Industry Experts',
      count: templatePersonas.filter(p => p.category === 'industry_experts').length,
    },
    {
      id: 'personal_companion',
      title: 'Personal Companion',
      count: templatePersonas.filter(p => p.category === 'personal_companion').length,
    },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const filteredTemplates = templatePersonas.filter(persona =>
    persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    persona.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUseTemplate = (persona: Persona, isTemplate: boolean = true) => {
    // When user clicks "use", activate the persona and go to chat
    const personaData = {
      id: isTemplate ? `template-${persona.id}` : persona.id,
      name: persona.name,
      role: persona.role,
      avatar: persona.avatar,
      isTemplate
    };
    setActivePersona(personaData);
    setLocation('/');
  };

  const handleConfigureTemplate = (persona: Persona) => {
    // When user clicks "configure" on a template, open configuration
    setSelectedPersona(persona.id);
    setSelectedPersonaType('template');
  };

  const handleConfigurePersona = (personaId: string) => {
    setSelectedPersona(personaId);
    setSelectedPersonaType('existing');
  };

  // Show configuration if a persona is selected
  if (selectedPersona) {
    return (
      <PersonaConfiguration 
        personaId={selectedPersona} 
        onClose={() => setSelectedPersona(null)}
        isExistingPersona={selectedPersonaType === 'existing'}
      />
    );
  }

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Digital Personas</h1>
          <p className="text-gray-600">Manage and configure your AI assistants</p>
        </motion.div>

        {/* Configured Personas Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-3">
            {/* Existing User Personas */}
            {configuredPersonas.map((persona) => (
              <PersonaCard 
                key={persona.id} 
                persona={persona} 
                isConfigured 
                onUse={() => handleUseTemplate(persona, false)}
                onConfigure={() => handleConfigurePersona(persona.id)}
              />
            ))}

            {/* Create New Persona Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 aspect-square"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Create New</h3>
              <p className="text-xs text-gray-500">Custom assistant</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Templates Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Choose from Existing Templates</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search personas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full md:w-80"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-6">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {expandedCategories[category.id] ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {category.count}
                    </Badge>
                  </div>
                </button>

                {expandedCategories[category.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-3">
                      {filteredTemplates
                        .filter(persona => persona.category === category.id)
                        .map((persona) => (
                          <PersonaCard 
                            key={persona.id} 
                            persona={persona} 
                            onUse={() => handleUseTemplate(persona, true)}
                            onConfigure={() => handleConfigureTemplate(persona)}
                          />
                        ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

interface PersonaCardProps {
  persona: Persona;
  isConfigured?: boolean;
  onUse?: () => void;
  onConfigure?: () => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, isConfigured = false, onUse, onConfigure }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative bg-white border rounded-lg p-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
        isConfigured ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square w-full mb-2 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={persona.avatar}
          alt={persona.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="space-y-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{persona.name}</h3>
          <p className="text-xs text-gray-600 leading-tight">{persona.role}</p>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {persona.tools.slice(0, 2).map((tool, index) => (
            <Badge
              key={index}
              variant="secondary"
              className={`text-xs px-1 py-0.5 ${tool.color}`}
            >
              {tool.name}
            </Badge>
          ))}
          {persona.tools.length > 2 && (
            <Badge variant="secondary" className="text-xs px-1 py-0.5 bg-gray-100 text-gray-600">
              +{persona.tools.length - 2}
            </Badge>
          )}
        </div>
      </div>

      {/* Hover overlay with action buttons */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center gap-2 p-2"
        >
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUse?.();
            }}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
            data-testid={`button-use-persona-${persona.id}`}
          >
            <MessageSquare className="w-3 h-3" />
            Use
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure?.();
            }}
            className="flex items-center gap-1"
            data-testid={`button-configure-persona-${persona.id}`}
          >
            <Settings className="w-3 h-3" />
            Configure
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DigitalPersonas;