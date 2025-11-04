import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { PersonaTemplate } from '@shared/schema';

export default function PersonaTemplatesTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PersonaTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    category: 'virtual_employees',
    avatar: '',
    skills: '',
    systemPrompt: '',
    greeting: '',
  });
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery<PersonaTemplate[]>({
    queryKey: ['/api/admin/persona-templates-full'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/persona-templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/persona-templates-full'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/persona-templates'] });
      toast({ title: 'Success', description: 'Persona template created successfully' });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create persona template',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest('PATCH', `/api/admin/persona-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/persona-templates-full'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/persona-templates'] });
      toast({ title: 'Success', description: 'Persona template updated successfully' });
      setIsEditOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update persona template',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/persona-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/persona-templates-full'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/persona-templates'] });
      toast({ title: 'Success', description: 'Persona template deleted successfully' });
      setIsDeleteOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete persona template',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      category: 'virtual_employees',
      avatar: '',
      skills: '',
      systemPrompt: '',
      greeting: '',
    });
    setSelectedTemplate(null);
  };

  const handleCreate = () => {
    const templateData = {
      ...formData,
      skills: formData.skills.split(',').map((s) => s.trim()).filter((s) => s),
      isActive: true,
    };
    createMutation.mutate(templateData);
  };

  const handleEdit = () => {
    if (selectedTemplate) {
      // Preserve all existing fields and only update the ones from the form
      // Exclude id, createdAt, updatedAt as these are managed by the database
      const { id, createdAt, updatedAt, ...existingData } = selectedTemplate;
      const templateData = {
        ...existingData, // Keep all existing fields except timestamps
        ...formData, // Override with form data
        skills: formData.skills.split(',').map((s) => s.trim()).filter((s) => s),
      };
      updateMutation.mutate({ id: selectedTemplate.id, data: templateData });
    }
  };

  const handleDelete = () => {
    if (selectedTemplate) {
      deleteMutation.mutate(selectedTemplate.id);
    }
  };

  const openEditDialog = (template: PersonaTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      role: template.role,
      category: template.category,
      avatar: template.avatar || '',
      skills: template.skills?.join(', ') || '',
      systemPrompt: template.systemPrompt || '',
      greeting: template.greeting || '',
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (template: PersonaTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Digital Persona Templates</h2>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-persona-template">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="overflow-y-auto overflow-x-auto max-h-[70vh] border rounded-lg">
      <Table>
        <TableHeader className="sticky top-0 bg-white z-10">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Skills</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell className="font-medium">{template.name}</TableCell>
              <TableCell>{template.role}</TableCell>
              <TableCell className="capitalize">{template.category.replace('_', ' ')}</TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {template.skills?.slice(0, 2).join(', ')}
                  {template.skills && template.skills.length > 2 && ` +${template.skills.length - 2}`}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    template.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(template)}
                  data-testid={`button-edit-persona-template-${template.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteDialog(template)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  data-testid={`button-delete-persona-template-${template.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Persona Template</DialogTitle>
            <DialogDescription>
              Define a new digital persona template that users can customize.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-name">Name</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sophia"
                  data-testid="input-create-template-name"
                />
              </div>
              <div>
                <Label htmlFor="create-role">Role</Label>
                <Input
                  id="create-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Executive Assistant"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="create-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="create-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual_employees">Virtual Employees</SelectItem>
                  <SelectItem value="industry_experts">Industry Experts</SelectItem>
                  <SelectItem value="personal_companion">Personal Companion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="create-avatar">Avatar Path</Label>
              <Input
                id="create-avatar"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="/api/avatar-library/filename.gif"
              />
              <p className="text-xs text-gray-500 mt-1">
                Path to avatar image (e.g., /api/avatar-library/executive-assistant.gif)
              </p>
            </div>

            <div>
              <Label htmlFor="create-skills">Skills (comma-separated)</Label>
              <Input
                id="create-skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="email, calendar, scheduling, CRM"
              />
            </div>

            <div>
              <Label htmlFor="create-greeting">Greeting Message</Label>
              <Textarea
                id="create-greeting"
                value={formData.greeting}
                onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                placeholder="Enter the initial greeting message"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="create-prompt">System Prompt</Label>
              <Textarea
                id="create-prompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="Enter the system prompt that defines the persona's behavior"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-create-template">
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Persona Template</DialogTitle>
            <DialogDescription>
              Update the digital persona template configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sophia"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Executive Assistant"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual_employees">Virtual Employees</SelectItem>
                  <SelectItem value="industry_experts">Industry Experts</SelectItem>
                  <SelectItem value="personal_companion">Personal Companion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-avatar">Avatar Path</Label>
              <Input
                id="edit-avatar"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="/api/avatar-library/filename.gif"
              />
            </div>

            <div>
              <Label htmlFor="edit-skills">Skills (comma-separated)</Label>
              <Input
                id="edit-skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="email, calendar, scheduling, CRM"
              />
            </div>

            <div>
              <Label htmlFor="edit-greeting">Greeting Message</Label>
              <Textarea
                id="edit-greeting"
                value={formData.greeting}
                onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                placeholder="Enter the initial greeting message"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="edit-prompt">System Prompt</Label>
              <Textarea
                id="edit-prompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="Enter the system prompt that defines the persona's behavior"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Persona Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedTemplate?.name}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
