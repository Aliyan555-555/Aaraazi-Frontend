/**
 * ReportDistributionModal Component
 * 
 * Configure automated report distribution via email.
 * 
 * Features:
 * - Add individual email recipients
 * - Select distribution lists
 * - Choose export format
 * - Configure schedule (optional)
 * - Send immediately or schedule
 * 
 * Design System V4.1 Compliant
 */

import React, { useState, useEffect } from 'react';
import { User } from '../../../../types';
import { CustomReportTemplate } from '../../../../types/custom-reports';
import { ExportFormat } from '../../../../lib/report-export';
import {
  getDistributionLists,
  createReportDistribution,
  sendReport,
  getAllRecipients,
  isValidEmail,
  DistributionList,
  ReportDistribution,
} from '../../../../lib/report-distribution';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Badge } from '../../../ui/badge';
import { Checkbox } from '../../../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../ui/select';
import {
  Mail,
  Users,
  X,
  Plus,
  Send,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReportDistributionModalProps {
  open: boolean;
  onClose: () => void;
  template: CustomReportTemplate;
  reportData: any[];
  user: User;
}

export const ReportDistributionModal: React.FC<ReportDistributionModalProps> = ({
  open,
  onClose,
  template,
  reportData,
  user,
}) => {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [enableSchedule, setEnableSchedule] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [isSending, setIsSending] = useState(false);

  const [distributionLists, setDistributionLists] = useState<DistributionList[]>([]);

  // Load distribution lists
  useEffect(() => {
    if (open) {
      setDistributionLists(getDistributionLists());
    }
  }, [open]);

  // Add email recipient
  const handleAddRecipient = () => {
    const email = currentEmail.trim();
    
    if (!email) {
      return;
    }
    
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (recipients.includes(email)) {
      toast.error('Email already added');
      return;
    }
    
    setRecipients([...recipients, email]);
    setCurrentEmail('');
  };

  // Remove email recipient
  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  // Toggle distribution list
  const handleToggleList = (listId: string) => {
    if (selectedLists.includes(listId)) {
      setSelectedLists(selectedLists.filter(id => id !== listId));
    } else {
      setSelectedLists([...selectedLists, listId]);
    }
  };

  // Calculate total recipients
  const getTotalRecipients = (): number => {
    const allRecipients = new Set(recipients);
    
    selectedLists.forEach(listId => {
      const list = distributionLists.find(l => l.id === listId);
      if (list) {
        list.recipients.forEach(r => allRecipients.add(r));
      }
    });
    
    return allRecipients.size;
  };

  // Handle send
  const handleSend = async (saveForSchedule: boolean = false) => {
    const totalRecipients = getTotalRecipients();
    
    if (totalRecipients === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    
    setIsSending(true);
    
    try {
      // Create distribution
      const distribution = createReportDistribution(
        template,
        recipients,
        selectedLists,
        format,
        enableSchedule ? {
          frequency: scheduleFrequency,
          enabled: true,
          nextSend: new Date().toISOString(),
        } : undefined,
        user.id
      );
      
      if (!saveForSchedule) {
        // Send immediately
        const result = await sendReport(distribution, reportData);
        
        if (result.success) {
          toast.success(`Report sent to ${totalRecipients} recipient${totalRecipients > 1 ? 's' : ''}`);
          onClose();
        } else {
          toast.error(result.error || 'Failed to send report');
        }
      } else {
        toast.success('Distribution schedule saved successfully');
        onClose();
      }
    } catch (error) {
      toast.error('Failed to send report');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Distribute Report</DialogTitle>
          <DialogDescription>
            Send "{template.name}" to one or more recipients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Individual Recipients */}
          <div className="space-y-2">
            <Label>Email Recipients</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRecipient}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Recipients List */}
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map(email => (
                  <Badge key={email} variant="secondary" className="gap-2">
                    <Mail className="h-3 w-3" />
                    {email}
                    <button
                      onClick={() => handleRemoveRecipient(email)}
                      className="hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Distribution Lists */}
          {distributionLists.length > 0 && (
            <div className="space-y-2">
              <Label>Distribution Lists</Label>
              <div className="border border-gray-300 rounded-lg divide-y divide-gray-300">
                {distributionLists.map(list => (
                  <div
                    key={list.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedLists.includes(list.id)}
                        onCheckedChange={() => handleToggleList(list.id)}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-900">{list.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {list.recipients.length} recipient{list.recipients.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Option */}
          <div className="space-y-3 p-4 bg-gray-50 border border-gray-300 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={enableSchedule}
                onCheckedChange={(checked) => setEnableSchedule(checked as boolean)}
              />
              <Label className="cursor-pointer">Enable Scheduled Distribution</Label>
            </div>
            
            {enableSchedule && (
              <div className="space-y-2 ml-6">
                <Label>Frequency</Label>
                <Select value={scheduleFrequency} onValueChange={(value: any) => setScheduleFrequency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">
                  Report will be automatically generated and sent to recipients
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full flex-shrink-0 mt-0.5">
                <span className="text-xs text-blue-600">ℹ️</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-blue-900">
                  Report will be sent to <strong>{getTotalRecipients()}</strong> recipient{getTotalRecipients() !== 1 ? 's' : ''}
                </p>
                <div className="text-xs text-blue-700 space-y-0.5">
                  <p>• Format: {format.toUpperCase()}</p>
                  <p>• Data rows: {reportData.length.toLocaleString()}</p>
                  {enableSchedule && (
                    <p>• Scheduled: {scheduleFrequency}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-300">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          
          {enableSchedule && (
            <Button
              onClick={() => handleSend(true)}
              disabled={isSending || getTotalRecipients() === 0}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Save Schedule
            </Button>
          )}
          
          <Button
            onClick={() => handleSend(false)}
            disabled={isSending || getTotalRecipients() === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
