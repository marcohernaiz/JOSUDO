import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Import GIF assets from the virtual employees section
import executiveAssistantGif from '@assets/Executive Assistant_1756066629512.gif';
import salesMarketingGif from '@assets/Sales & Marketing_1756066629511.gif';
import customerSupportGif from '@assets/Customer Support_1756066629511.gif';
import elderlyCareGif from '@assets/Elderly Care_1756066629513.gif';
import digitalBuddyGif from '@assets/Digital Buddy_1756066629512.gif';
import aiGirlfriendGif from '@assets/AI Girlfriend GIF_1756066629513.gif';

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
  category: 'virtual-employees' | 'industry-experts' | 'personal-companion';
}

const DigitalPersonas: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'virtual-employees': true,
    'industry-experts': false,
    'personal-companion': false,
  });

  // Pre-configured personas
  const configuredPersonas: Persona[] = [
    {
      id: 'sophia',
      name: 'Sophia',
      role: 'Executive Assistant',
      avatar: executiveAssistantGif,
      tools: [
        { name: 'email', color: 'bg-blue-100 text-blue-800' },
        { name: 'calendar', color: 'bg-green-100 text-green-800' },
        { name: 'drive', color: 'bg-yellow-100 text-yellow-800' },
        { name: 'phone', color: 'bg-purple-100 text-purple-800' },
      ],
      category: 'virtual-employees',
    },
  ];

  // Template personas
  const templatePersonas: Persona[] = [
    // Virtual Employees
    {
      id: 'sophia-template',
      name: 'Sophia',
      role: 'Executive Assistant',
      avatar: executiveAssistantGif,
      tools: [
        { name: 'email', color: 'bg-blue-100 text-blue-800' },
        { name: 'calendar', color: 'bg-green-100 text-green-800' },
        { name: 'drive', color: 'bg-yellow-100 text-yellow-800' },
        { name: 'phone', color: 'bg-purple-100 text-purple-800' },
      ],
      category: 'virtual-employees',
    },
    {
      id: 'carlos',
      name: 'Carlos',
      role: 'Sales Manager',
      avatar: salesMarketingGif,
      tools: [
        { name: 'CRM', color: 'bg-red-100 text-red-800' },
        { name: 'email', color: 'bg-blue-100 text-blue-800' },
        { name: 'phone', color: 'bg-purple-100 text-purple-800' },
        { name: 'calendar', color: 'bg-green-100 text-green-800' },
      ],
      category: 'virtual-employees',
    },
    {
      id: 'aisha',
      name: 'Aisha',
      role: 'Marketing Manager',
      avatar: salesMarketingGif,
      tools: [
        { name: 'analytics', color: 'bg-orange-100 text-orange-800' },
        { name: 'social media', color: 'bg-pink-100 text-pink-800' },
        { name: 'drive', color: 'bg-yellow-100 text-yellow-800' },
        { name: 'email', color: 'bg-blue-100 text-blue-800' },
      ],
      category: 'virtual-employees',
    },
    {
      id: 'liam',
      name: 'Liam',
      role: 'Head of Customer Support',
      avatar: customerSupportGif,
      tools: [
        { name: 'ticketing', color: 'bg-teal-100 text-teal-800' },
        { name: 'chat', color: 'bg-indigo-100 text-indigo-800' },
        { name: 'knowledge base', color: 'bg-cyan-100 text-cyan-800' },
        { name: 'phone', color: 'bg-purple-100 text-purple-800' },
      ],
      category: 'virtual-employees',
    },
    {
      id: 'emma',
      name: 'Emma',
      role: 'Head of Human Resources',
      avatar: executiveAssistantGif,
      tools: [
        { name: 'HRIS', color: 'bg-rose-100 text-rose-800' },
        { name: 'email', color: 'bg-blue-100 text-blue-800' },
        { name: 'calendar', color: 'bg-green-100 text-green-800' },
        { name: 'docs', color: 'bg-gray-100 text-gray-800' },
      ],
      category: 'virtual-employees',
    },

    // Industry Experts
    {
      id: 'diego',
      name: 'Diego',
      role: 'Coach',
      avatar: digitalBuddyGif,
      tools: [
        { name: 'calendar', color: 'bg-green-100 text-green-800' },
        { name: 'chat', color: 'bg-indigo-100 text-indigo-800' },
        { name: 'docs', color: 'bg-gray-100 text-gray-800' },
      ],
      category: 'industry-experts',
    },
    {
      id: 'amira',
      name: 'Amira',
      role: 'Legal Counsel',
      avatar: executiveAssistantGif,
      tools: [
        { name: 'legal db', color: 'bg-slate-100 text-slate-800' },
        { name: 'email', color: 'bg-blue-100 text-blue-800' },
        { name: 'drive', color: 'bg-yellow-100 text-yellow-800' },
      ],
      category: 'industry-experts',
    },
    {
      id: 'john',
      name: 'John',
      role: 'Tax Consultant',
      avatar: digitalBuddyGif,
      tools: [
        { name: 'spreadsheets', color: 'bg-emerald-100 text-emerald-800' },
        { name: 'email', color: 'bg-blue-100 text-blue-800' },
        { name: 'drive', color: 'bg-yellow-100 text-yellow-800' },
      ],
      category: 'industry-experts',
    },
    {
      id: 'yuki',
      name: 'Yuki',
      role: 'Language Teacher',
      avatar: aiGirlfriendGif,
      tools: [
        { name: 'chat', color: 'bg-indigo-100 text-indigo-800' },
        { name: 'docs', color: 'bg-gray-100 text-gray-800' },
        { name: 'video call', color: 'bg-violet-100 text-violet-800' },
      ],
      category: 'industry-experts',
    },
    {
      id: 'lucia',
      name: 'Lucía',
      role: 'Real Estate Assistant',
      avatar: salesMarketingGif,
      tools: [
        { name: 'CRM', color: 'bg-red-100 text-red-800' },
        { name: 'email', color: 'bg-blue-100 text-blue-800' },
        { name: 'phone', color: 'bg-purple-100 text-purple-800' },
        { name: 'maps', color: 'bg-lime-100 text-lime-800' },
      ],
      category: 'industry-experts',
    },
    {
      id: 'hassan',
      name: 'Hassan',
      role: 'Interpreter',
      avatar: digitalBuddyGif,
      tools: [
        { name: 'chat', color: 'bg-indigo-100 text-indigo-800' },
        { name: 'video', color: 'bg-violet-100 text-violet-800' },
        { name: 'translation db', color: 'bg-sky-100 text-sky-800' },
      ],
      category: 'industry-experts',
    },

    // Personal Companion
    {
      id: 'marta',
      name: 'Marta',
      role: 'Elderly Care',
      avatar: elderlyCareGif,
      tools: [
        { name: 'reminders', color: 'bg-amber-100 text-amber-800' },
        { name: 'calendar', color: 'bg-green-100 text-green-800' },
        { name: 'chat', color: 'bg-indigo-100 text-indigo-800' },
        { name: 'phone', color: 'bg-purple-100 text-purple-800' },
      ],
      category: 'personal-companion',
    },
    {
      id: 'arun',
      name: 'Arun',
      role: 'Wellness Companion',
      avatar: digitalBuddyGif,
      tools: [
        { name: 'meditation app', color: 'bg-green-100 text-green-800' },
        { name: 'health tracker', color: 'bg-red-100 text-red-800' },
        { name: 'calendar', color: 'bg-green-100 text-green-800' },
      ],
      category: 'personal-companion',
    },
    {
      id: 'luna',
      name: 'Luna',
      role: 'AI Girlfriend',
      avatar: aiGirlfriendGif,
      tools: [
        { name: 'chat', color: 'bg-indigo-100 text-indigo-800' },
        { name: 'voice', color: 'bg-pink-100 text-pink-800' },
        { name: 'calendar', color: 'bg-green-100 text-green-800' },
      ],
      category: 'personal-companion',
    },
    {
      id: 'sofia',
      name: 'Sofia',
      role: 'Digital Nanny',
      avatar: aiGirlfriendGif,
      tools: [
        { name: 'parental control', color: 'bg-orange-100 text-orange-800' },
        { name: 'calendar', color: 'bg-green-100 text-green-800' },
        { name: 'chat', color: 'bg-indigo-100 text-indigo-800' },
        { name: 'camera', color: 'bg-gray-100 text-gray-800' },
      ],
      category: 'personal-companion',
    },
    {
      id: 'max',
      name: 'Max',
      role: 'Digital Buddy',
      avatar: digitalBuddyGif,
      tools: [
        { name: 'chat', color: 'bg-indigo-100 text-indigo-800' },
        { name: 'games', color: 'bg-purple-100 text-purple-800' },
        { name: 'music', color: 'bg-pink-100 text-pink-800' },
      ],
      category: 'personal-companion',
    },
  ];

  const categories = [
    {
      id: 'virtual-employees',
      title: 'Virtual Employees',
      count: templatePersonas.filter(p => p.category === 'virtual-employees').length,
    },
    {
      id: 'industry-experts',
      title: 'Industry Experts',
      count: templatePersonas.filter(p => p.category === 'industry-experts').length,
    },
    {
      id: 'personal-companion',
      title: 'Personal Companion',
      count: templatePersonas.filter(p => p.category === 'personal-companion').length,
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

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Existing Personas */}
            {configuredPersonas.map((persona) => (
              <PersonaCard key={persona.id} persona={persona} isConfigured />
            ))}

            {/* Create New Persona Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 min-h-[300px]"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Create New Digital Persona</h3>
              <p className="text-sm text-gray-500">Add a custom AI assistant tailored to your needs</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredTemplates
                        .filter(persona => persona.category === category.id)
                        .map((persona) => (
                          <PersonaCard key={persona.id} persona={persona} />
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
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, isConfigured = false }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white border rounded-2xl p-4 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
        isConfigured ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="aspect-square w-full mb-4 rounded-xl overflow-hidden bg-gray-100">
        <img
          src={persona.avatar}
          alt={persona.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{persona.name}</h3>
          <p className="text-sm text-gray-600">{persona.role}</p>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {persona.tools.map((tool, index) => (
            <Badge
              key={index}
              variant="secondary"
              className={`text-xs px-2 py-1 ${tool.color}`}
            >
              {tool.name}
            </Badge>
          ))}
        </div>

        {isConfigured && (
          <div className="pt-2">
            <Button size="sm" className="w-full">
              Configure
            </Button>
          </div>
        )}

        {!isConfigured && (
          <div className="pt-2">
            <Button size="sm" variant="outline" className="w-full">
              Use Template
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DigitalPersonas;