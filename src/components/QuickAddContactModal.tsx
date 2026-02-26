import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Contact, User } from '../types';
// [STUBBED] import { addContact } from '../lib/data';
import { toast } from 'sonner';
import { Phone, Mail, User as UserIcon } from 'lucide-react';

// ===== STUBS for removed prototype functions =====
const addContact = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface QuickAddContactModalProps {
  user: User;
  onClose: () => void;
  onSuccess: (contact: Contact) => void;
  defaultCategory?: Contact['category'];
}

export const QuickAddContactModal: React.FC<QuickAddContactModalProps> = ({
  user,
  onClose,
  onSuccess,
  defaultCategory = 'seller',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'client' as Contact['type'],
    category: defaultCategory as Contact['category'],
    address: '',
    company: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | Contact['type'] | Contact['category']) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Contact name is required');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const newContact = addContact({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        type: formData.type,
        category: formData.category,
        status: 'active',
        source: 'direct-entry',
        address: formData.address.trim() || undefined,
        company: formData.company.trim() || undefined,
        notes: formData.notes.trim(),
        tags: [],
        agentId: user.id,
        interestedProperties: [],
        totalTransactions: 0,
        totalCommissionEarned: 0
      });

      toast.success(`Contact "${newContact.name}" added successfully`);
      onSuccess(newContact);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        type: 'client',
        category: defaultCategory,
        address: '',
        company: '',
        notes: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: '',
      phone: '',
      email: '',
      type: 'client',
      category: defaultCategory,
      address: '',
      company: '',
      notes: ''
    });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Quick Add Contact
          </DialogTitle>
          <DialogDescription>
            Add a new contact to your CRM without leaving this form
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">
                Contact Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactName"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Ahmed Khan"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactPhone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="e.g., 0300-1234567"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email (Optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="e.g., ahmed@example.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactType">Contact Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger id="contactType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactCategory">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger id="contactCategory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="renter">Renter</SelectItem>
                    <SelectItem value="landlord">Landlord</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="both">Both (Buyer & Seller)</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactAddress">Address (Optional)</Label>
              <Input
                id="contactAddress"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="e.g., DHA Phase 5, Karachi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactCompany">Company (Optional)</Label>
              <Input
                id="contactCompany"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="e.g., ABC Corporation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNotes">Notes (Optional)</Label>
              <Textarea
                id="contactNotes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes about this contact..."
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.phone.trim()}
            >
              {isSubmitting ? 'Adding Contact...' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};