import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertTriangle, CreditCard, Key, ExternalLink } from 'lucide-react';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
  title: string;
  description: string;
  actionText: string;
  actionIcon?: React.ReactNode;
  type: 'credits' | 'api_key' | 'general';
}

export const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  onClose,
  onAction,
  title,
  description,
  actionText,
  actionIcon,
  type
}) => {
  const getIcon = () => {
    switch (type) {
      case 'credits':
        return <CreditCard className="w-6 h-6 text-orange-500" />;
      case 'api_key':
        return <Key className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getActionIcon = () => {
    if (actionIcon) return actionIcon;
    switch (type) {
      case 'credits':
        return <CreditCard className="w-4 h-4" />;
      case 'api_key':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={onAction}
            className="w-full flex items-center gap-2"
            variant={type === 'credits' ? 'default' : 'outline'}
          >
            {getActionIcon()}
            {actionText}
          </Button>
          
          <Button 
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
