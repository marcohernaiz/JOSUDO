import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EmployeeCreationData } from './VirtualEmployeeOrchestrator';

interface EmployeeDashboardProps {
  employeeData: EmployeeCreationData;
  onBackToSelection: () => void;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
  assignedDate: Date;
}

interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_completed' | 'conversation' | 'integration';
  title: string;
  description: string;
  timestamp: Date;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  employeeData,
  onBackToSelection
}) => {
  const { persona, customization, onboardingData } = employeeData;
  const [newTaskInput, setNewTaskInput] = useState('');
  const [tasks, setTasks] = useState<Task[]>(
    onboardingData.dayOnePlan.map(task => ({
      ...task,
      status: 'pending' as const,
      assignedDate: new Date()
    }))
  );

  const [recentActivity] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'conversation',
      title: 'Onboarding Completed',
      description: `Had initial conversation with ${persona.name}`,
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'task_created',
      title: 'Day 1 Plan Created',
      description: `${tasks.length} tasks added to your agenda`,
      timestamp: new Date()
    }
  ]);

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskInput,
      description: `Custom task requested by user`,
      status: 'pending',
      priority: 'medium',
      estimatedTime: '30 min',
      assignedDate: new Date()
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskInput('');
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' as const }
        : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full ${persona.color} flex items-center justify-center text-2xl`}>
            {persona.avatar}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Working with {persona.name}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {persona.title} • {onboardingData.companyName}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {customization.workStyle} style
              </Badge>
              <Badge variant="outline" className="text-xs">
                {customization.workingHours.replace('-', ' ')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {customization.taskFocus.length} focus areas
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={onBackToSelection}>
          Change Employee
        </Button>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">Today's Tasks</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="chat">Ask {persona.name}</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          {/* Quick Add Task */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">➕</span>
                Add New Task
              </CardTitle>
              <CardDescription>
                Ask {persona.name} to help you with something specific
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder={`What would you like ${persona.name} to help you with?`}
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <Button onClick={handleAddTask} disabled={!newTaskInput.trim()}>
                  Add Task
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTaskStatus(task.id)}
                          className="p-1 h-6 w-6"
                        >
                          {task.status === 'completed' ? '✅' : '⭕'}
                        </Button>
                        <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                          {task.title}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 ml-9">
                        {task.description}
                      </p>
                      
                      <div className="flex items-center gap-2 ml-9">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority} priority
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          ~{task.estimatedTime}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-400">
                      {task.assignedDate.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your collaboration history with {persona.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="mt-1">
                    {activity.type === 'task_created' && '📝'}
                    {activity.type === 'task_completed' && '✅'}
                    {activity.type === 'conversation' && '💬'}
                    {activity.type === 'integration' && '🔗'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {activity.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {activity.description}
                    </p>
                    <span className="text-xs text-slate-500">
                      {activity.timestamp.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${persona.color} flex items-center justify-center text-sm`}>
                  {persona.avatar}
                </div>
                Chat with {persona.name}
              </CardTitle>
              <CardDescription>
                Continue your conversation and get personalized assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p>Enhanced chat interface coming soon...</p>
                <p className="text-sm mt-2">For now, use the general chat to interact with AI models</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};