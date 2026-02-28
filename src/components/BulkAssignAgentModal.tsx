/**
 * Bulk Assign Agent Modal
 * Assign an agent to multiple properties at once
 */

import React, { useState } from 'react';
import { Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { User, Property } from '../types';
// [STUBBED] import { updateProperty } from '../lib/data';
import { toast } from 'sonner';
import { logger } from '../lib/logger';

// ===== STUBS for removed prototype functions =====
const updateProperty = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface BulkAssignAgentModalProps {
  open: boolean;
  onClose: () => void;
  properties: Property[];
  agents: User[];
  onSuccess?: () => void;
}

export default function BulkAssignAgentModal({
  open,
  onClose,
  properties,
  agents,
  onSuccess,
}: BulkAssignAgentModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    if (!selectedAgentId) {
      toast.error('Please select an agent');
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedAgent = agents.find(a => a.id === selectedAgentId);
      if (!selectedAgent) {
        toast.error('Invalid agent selected');
        return;
      }

      // Update all properties
      let successCount = 0;
      let errorCount = 0;

      for (const property of properties) {
        try {
          updateProperty(property.id, {
            agentId: selectedAgentId,
          });
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(
          `Successfully assigned ${selectedAgent.name} to ${successCount} ${successCount === 1 ? 'property' : 'properties'}`,
          { duration: 5000 }
        );
      } else if (successCount > 0) {
        toast.warning(
          `Assigned agent to ${successCount} properties. ${errorCount} failed.`,
          { duration: 5000 }
        );
      } else {
        toast.error('Failed to assign agent to any properties');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error('Error in bulk agent assignment:', error);
      toast.error('Failed to assign agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Assign Agent to {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
          </DialogTitle>
          <DialogDescription>
            Select an agent to assign to the selected properties
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected Properties */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-3">Selected Properties ({properties.length})</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {properties.map((property) => (
                  <div 
                    key={property.id} 
                    className="flex items-center justify-between text-sm py-2 px-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{property.title || property.address}</p>
                      <p className="text-xs text-muted-foreground">{property.propertyType}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {property.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agent Selection */}
          <div className="space-y-2">
            <Label htmlFor="agent">
              Select Agent <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger id="agent">
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent>
                {agents.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No agents available
                  </div>
                ) : (
                  agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <span>{agent.name}</span>
                        <span className="text-xs text-muted-foreground">({agent.email})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Warning */}
          {properties.length > 10 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <AlertCircle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-900">Large Bulk Operation</p>
                <p className="text-amber-700">
                  You are about to assign an agent to {properties.length} properties. This action cannot be undone.
                </p>
              </div>
            </div>
          )}

          {/* Success Preview */}
          {selectedAgentId && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-start gap-2">
              <CheckCircle className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-900">Ready to Assign</p>
                <p className="text-green-700">
                  {agents.find(a => a.id === selectedAgentId)?.name} will be assigned to {properties.length} properties.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedAgentId}>
              {isSubmitting ? 'Assigning...' : `Assign to ${properties.length} Properties`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}