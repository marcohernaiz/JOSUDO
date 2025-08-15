import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Persona } from './PersonaSelector';
import type { RoleCustomization } from './RoleCustomization';

interface FirstConversationProps {
  persona: Persona;
  customization: RoleCustomization;
  onOnboardingComplete: (onboardingData: OnboardingData) => void;
  onBack: () => void;
}

export interface OnboardingData {
  companyName: string;
  userRole: string;
  mainGoals: string[];
  conversationHistory: ConversationMessage[];
  dayOnePlan: TaskItem[];
}

interface ConversationMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
}

const getPersonaGreeting = (persona: Persona, customization: RoleCustomization) => {
  const styleMap = {
    formal: 'Good day! I am delighted to be working with you.',
    friendly: 'Hi there! I\'m really excited to be part of your team.',
    casual: 'Hey! Great to meet you - looking forward to working together.',
    enthusiastic: 'Hello! I\'m absolutely thrilled to be joining your team!'
  };

  const personaIntros = {
    closer: `As your dedicated Sales & Revenue Specialist, I'm here to help you turn leads into loyal customers and drive your revenue growth.`,
    connector: `As your Networking & Partnership Expert, I'm here to help you build valuable relationships and strategic partnerships that will grow your business.`,
    guardian: `As your Operations & Security Specialist, I'm here to help protect and optimize your business operations.`,
    bridge: `As your Communication & Integration Expert, I'm here to help connect your teams and streamline your workflows.`,
    visionary: `As your Strategy & Innovation Leader, I'm here to help you see opportunities and create the future of your business.`,
    analyst: `As your Data & Insights Specialist, I'm here to help you turn data into actionable insights for better decision making.`,
    innovator: `As your Product & Technology Expert, I'm here to help you create solutions for tomorrow's challenges.`
  };

  return `${styleMap[customization.workStyle as keyof typeof styleMap]} ${personaIntros[persona.id as keyof typeof personaIntros]}

I'm particularly focused on helping you with: ${customization.taskFocus.slice(0, 3).join(', ')}.

To get started, I'd love to learn more about you and your business. Could you tell me:
1. What's your company name?
2. What's your role in the organization?
3. What are your main goals I can help you achieve?`;
};

export const FirstConversation: React.FC<FirstConversationProps> = ({
  persona,
  customization,
  onOnboardingComplete,
  onBack
}) => {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'greeting' | 'company' | 'role' | 'goals' | 'summary'>('greeting');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  useEffect(() => {
    // Initial greeting
    const greeting = getPersonaGreeting(persona, customization);
    addMessage('assistant', greeting);
    setCurrentStep('company');
  }, []);

  const addMessage = (role: 'assistant' | 'user', content: string) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, message]);
  };

  const simulateTyping = (callback: () => void, delay = 1500) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  };

  const handleSendMessage = () => {
    if (!currentInput.trim()) return;

    addMessage('user', currentInput);
    const userMessage = currentInput;
    setCurrentInput('');

    simulateTyping(() => {
      handleAIResponse(userMessage);
    });
  };

  const handleAIResponse = (userMessage: string) => {
    switch (currentStep) {
      case 'company':
        setCompanyName(userMessage);
        addMessage('assistant', `Great! So you're with ${userMessage}. What's your role there?`);
        setCurrentStep('role');
        break;

      case 'role':
        setUserRole(userMessage);
        addMessage('assistant', `Perfect! As ${userMessage} at ${companyName}, what are the main goals or challenges you'd like me to help you with? Feel free to list as many as you'd like.`);
        setCurrentStep('goals');
        break;

      case 'goals':
        const goals = userMessage.split(/[,\n]/).map(g => g.trim()).filter(g => g.length > 0);
        setMainGoals(goals);
        
        const summary = generateSummaryAndPlan(companyName, userRole, goals);
        addMessage('assistant', summary);
        setCurrentStep('summary');
        break;

      default:
        addMessage('assistant', "I understand. Let me help you with that!");
    }
  };

  const generateSummaryAndPlan = (company: string, role: string, goals: string[]) => {
    const dayOnePlan = generateDayOnePlan(goals);
    
    return `Excellent! Let me summarize what I understand:

**Company:** ${company}
**Your Role:** ${role}
**Main Goals:**
${goals.map(goal => `• ${goal}`).join('\n')}

Based on this information, I've created your Day 1 action plan:

**🎯 Today's Priorities:**
${dayOnePlan.map((task, index) => `${index + 1}. **${task.title}** (${task.priority} priority, ~${task.estimatedTime})
   ${task.description}`).join('\n\n')}

Ready to get started? Click "Let's Begin!" below to access your personalized dashboard.`;
  };

  const generateDayOnePlan = (goals: string[]): TaskItem[] => {
    // This would normally be generated by AI based on persona and goals
    const basePlan: TaskItem[] = [
      {
        id: '1',
        title: 'Initial Business Assessment',
        description: 'Conduct a comprehensive review of current business status and immediate opportunities',
        priority: 'high',
        estimatedTime: '30 min'
      },
      {
        id: '2',
        title: 'Priority Goal Analysis',
        description: 'Deep dive into your top goals and create actionable next steps',
        priority: 'high',
        estimatedTime: '45 min'
      },
      {
        id: '3',
        title: 'Quick Win Identification',
        description: 'Identify immediate actions that can generate fast results',
        priority: 'medium',
        estimatedTime: '20 min'
      }
    ];

    return basePlan;
  };

  const handleComplete = () => {
    const dayOnePlan = generateDayOnePlan(mainGoals);
    
    const onboardingData: OnboardingData = {
      companyName,
      userRole,
      mainGoals,
      conversationHistory,
      dayOnePlan
    };

    onOnboardingComplete(onboardingData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-full ${persona.color} flex items-center justify-center text-xl`}>
            {persona.avatar}
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Meet {persona.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              First conversation & onboarding
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Getting to Know You</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="h-96 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border space-y-4"
            style={{ scrollBehavior: 'smooth' }}
          >
            {conversationHistory.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full ${persona.color} flex items-center justify-center text-sm`}>
                        {persona.avatar}
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {persona.name}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                    {message.content}
                  </p>
                  <div className="text-xs text-slate-400 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full ${persona.color} flex items-center justify-center text-sm`}>
                      {persona.avatar}
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {persona.name}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {currentStep !== 'summary' && (
            <div className="mt-4 flex gap-2">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Type your response..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isTyping}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!currentInput.trim() || isTyping}
              >
                Send
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          Back to Customization
        </Button>
        
        {currentStep === 'summary' && (
          <Button 
            onClick={handleComplete}
            className="bg-primary hover:bg-primary/90"
          >
            Let's Begin! 🚀
          </Button>
        )}
      </div>
    </div>
  );
};