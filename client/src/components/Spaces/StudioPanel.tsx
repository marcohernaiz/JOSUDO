import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tool, Task, VirtualEmployee } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Wrench, CheckSquare, Users, Play, Settings } from 'lucide-react';

interface StudioPanelProps {
  spaceId: number;
}

export const StudioPanel: React.FC<StudioPanelProps> = ({ spaceId }) => {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200" style={{marginTop: '10px'}}>
        <h2 className="text-lg font-semibold text-gray-900">Studio</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <ToolsSection spaceId={spaceId} />
        <TasksSection spaceId={spaceId} />
        <VirtualEmployeesSection spaceId={spaceId} />
      </div>
    </div>
  );
};

interface ToolsSectionProps {
  spaceId: number;
}

const ToolsSection: React.FC<ToolsSectionProps> = ({ spaceId }) => {
  // Mock data for now - in real implementation, this would come from API
  const defaultTools = [
    { id: 1, name: 'Audio Summary', type: 'audio_summary', isActive: true },
    { id: 2, name: 'Video Summary', type: 'video_summary', isActive: true },
    { id: 3, name: 'Mind Map', type: 'mind_map', isActive: true },
    { id: 4, name: 'Reports', type: 'report', isActive: true },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <Wrench className="w-4 h-4 mr-2" />
          Tools
        </h3>
        <Button size="sm" variant="ghost" className="h-6 px-2">
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {defaultTools.map((tool) => (
          <Card key={tool.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <Play className="w-4 h-4 text-blue-600" />
                <Settings className="w-3 h-3 text-gray-400" />
              </div>
              <h4 className="text-xs font-medium text-gray-900">{tool.name}</h4>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface TasksSectionProps {
  spaceId: number;
}

const TasksSection: React.FC<TasksSectionProps> = ({ spaceId }) => {
  // Mock empty tasks for now
  const tasks: Task[] = [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <CheckSquare className="w-4 h-4 mr-2" />
          Tasks
        </h3>
        <Button size="sm" variant="ghost" className="h-6 px-2">
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <CheckSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="text-xs">
            No tasks yet. Add a new one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

interface VirtualEmployeesSectionProps {
  spaceId: number;
}

const VirtualEmployeesSection: React.FC<VirtualEmployeesSectionProps> = ({ spaceId }) => {
  // Mock default employee data
  const defaultEmployee = {
    id: 1,
    name: 'Sophia',
    role: 'Executive Assistant',
    avatar: null,
    assignedTools: ['task_management', 'calendar', 'notes'],
    isActive: true
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Virtual Employees
        </h3>
        <Button size="sm" variant="ghost" className="h-6 px-2">
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">S</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900">{defaultEmployee.name}</h4>
              <p className="text-xs text-gray-600 mb-2">{defaultEmployee.role}</p>
              <div className="flex flex-wrap gap-1">
                {defaultEmployee.assignedTools.slice(0, 2).map((tool) => (
                  <Badge key={tool} variant="secondary" className="text-xs px-1 py-0">
                    {tool.replace('_', ' ')}
                  </Badge>
                ))}
                {defaultEmployee.assignedTools.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{defaultEmployee.assignedTools.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-sm transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs px-2 py-0 ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </Badge>
              {task.priority !== 'medium' && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {task.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};