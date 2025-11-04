import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ApiKey {
  id: number;
  key: string;
  value: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function ApiKeysTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    isEncrypted: true,
  });
  const [visibleValues, setVisibleValues] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['/api/admin/api-keys'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/api-keys', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-keys'] });
      toast({ title: 'Success', description: 'API key saved successfully' });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save API key',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest('PATCH', `/api/admin/api-keys/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-keys'] });
      toast({ title: 'Success', description: 'API key updated successfully' });
      setIsEditOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update API key',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-keys'] });
      toast({ title: 'Success', description: 'API key deleted successfully' });
      setIsDeleteOpen(false);
      setSelectedKey(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete API key',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({ key: '', value: '', isEncrypted: true });
    setSelectedKey(null);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (selectedKey) {
      updateMutation.mutate({ id: selectedKey.id, data: formData });
    }
  };

  const handleDelete = () => {
    if (selectedKey) {
      deleteMutation.mutate(selectedKey.id);
    }
  };

  const openEditDialog = (key: ApiKey) => {
    setSelectedKey(key);
    setFormData({
      key: key.key,
      value: key.value,
      isEncrypted: key.isEncrypted,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (key: ApiKey) => {
    setSelectedKey(key);
    setIsDeleteOpen(true);
  };

  const toggleValueVisibility = (id: number) => {
    setVisibleValues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const maskValue = (value: string) => {
    if (value.length <= 8) return '••••••••';
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
  };

  // Define LLM provider keys
  const LLM_KEYS = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GOOGLE_API_KEY',
    'GROK_API_KEY',
    'PERPLEXITY_API_KEY',
    'DEEPSEEK_API_KEY',
    'OPENROUTER_API_KEY',
    'REPLICATE_API_TOKEN',
    'GROQ_API_KEY',
  ];

  // Categorize API keys
  const llmKeys = apiKeys.filter((key) => LLM_KEYS.includes(key.key));
  const otherKeys = apiKeys.filter((key) => !LLM_KEYS.includes(key.key));

  const renderKeyTable = (keys: ApiKey[], emptyMessage: string) => (
    <Table>
      <TableHeader className="sticky top-0 bg-white z-10">
        <TableRow>
          <TableHead>Key Name</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Encrypted</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((apiKey) => (
          <TableRow key={apiKey.id}>
            <TableCell className="font-medium font-mono text-sm">{apiKey.key}</TableCell>
            <TableCell className="font-mono text-sm">
              <div className="flex items-center space-x-2">
                <span>
                  {visibleValues.has(apiKey.id) ? apiKey.value : maskValue(apiKey.value)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleValueVisibility(apiKey.id)}
                  className="h-6 w-6 p-0"
                >
                  {visibleValues.has(apiKey.id) ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </TableCell>
            <TableCell>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  apiKey.isEncrypted
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {apiKey.isEncrypted ? 'Yes' : 'No'}
              </span>
            </TableCell>
            <TableCell>{new Date(apiKey.updatedAt).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(apiKey)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  data-testid={`button-edit-api-key-${apiKey.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteDialog(apiKey)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  data-testid={`button-delete-api-key-${apiKey.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {keys.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* LLM Keys Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">LLM Keys</h2>
            <p className="text-sm text-gray-500 mt-1">
              API keys for AI language model providers (ChatGPT, Claude, Gemini, Grok, Perplexity, DeepSeek, OpenRouter, Replicate)
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-api-key">
            <Plus className="w-4 h-4 mr-2" />
            Add API Key
          </Button>
        </div>

        <div className="overflow-y-auto overflow-x-auto max-h-[50vh] border rounded-lg">
          {renderKeyTable(llmKeys, 'No LLM keys yet. Click "Add API Key" to create one.')}
        </div>
      </div>

      {/* Other Keys Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Other Keys</h2>
            <p className="text-sm text-gray-500 mt-1">
              Platform infrastructure keys (Stripe, Database, Admin credentials, etc.)
            </p>
          </div>
        </div>

        <div className="overflow-y-auto overflow-x-auto max-h-[50vh] border rounded-lg">
          {renderKeyTable(otherKeys, 'No other keys yet.')}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New API Key</DialogTitle>
            <DialogDescription>
              Add a new API key to the database. If the key already exists, it will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., OPENAI_API_KEY"
                className="font-mono"
                data-testid="input-api-key-name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use uppercase with underscores (e.g., OPENAI_API_KEY, STRIPE_SECRET_KEY)
              </p>
            </div>
            <div>
              <Label htmlFor="key-value">Value</Label>
              <Input
                id="key-value"
                type="password"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Enter API key value"
                className="font-mono"
                data-testid="input-api-key-value"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is-encrypted"
                checked={formData.isEncrypted}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isEncrypted: checked })
                }
              />
              <Label htmlFor="is-encrypted" className="cursor-pointer">
                Store as encrypted
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-api-key">
              {createMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
            <DialogDescription>
              Update the value or settings for this API key.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-key-name">Key Name</Label>
              <Input
                id="edit-key-name"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., OPENAI_API_KEY"
                className="font-mono"
                data-testid="input-edit-api-key-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-key-value">Value</Label>
              <Input
                id="edit-key-value"
                type="password"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Enter API key value"
                className="font-mono"
                data-testid="input-edit-api-key-value"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is-encrypted"
                checked={formData.isEncrypted}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isEncrypted: checked })
                }
              />
              <Label htmlFor="edit-is-encrypted" className="cursor-pointer">
                Store as encrypted
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending} data-testid="button-submit-edit-api-key">
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className="font-mono">{selectedKey?.key}</strong>? 
              This action cannot be undone and may break functionality that depends on this key.
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

