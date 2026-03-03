import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

const DOC_TYPES = [
  'SALES_AGREEMENT',
  'FINAL_SALE_DEED',
  'RENTAL_AGREEMENT',
  'PROPERTY_DISCLOSURE',
  'PAYMENT_RECEIPT',
  'ID_PROOF',
  'INSPECTION_REPORT',
  'APPRAISAL',
  'OTHER',
];

const DOC_CATEGORIES = ['AGREEMENT', 'PAYMENT', 'LEGAL', 'TRANSFER', 'IDENTITY', 'INSPECTION', 'OTHER'];

interface AddDealDocumentModalProps {
  open: boolean;
  onClose: () => void;
  dealId: string;
  onCreateDocument: (payload: { name: string; url: string; type: string; category: string }) => Promise<void>;
}

export const AddDealDocumentModal: React.FC<AddDealDocumentModalProps> = ({
  open,
  onClose,
  dealId,
  onCreateDocument,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('OTHER');
  const [category, setCategory] = useState('OTHER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !url.trim()) {
      toast.error('Name and URL are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreateDocument({ name: name.trim(), url: url.trim(), type, category });
      toast.success('Document added');
      setName('');
      setUrl('');
      setType('OTHER');
      setCategory('OTHER');
      onClose();
    } catch (e) {
      toast.error('Failed to add document');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Document
          </DialogTitle>
          <DialogDescription>
            Add a document link. Upload the file elsewhere and paste the URL here.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="doc-name">Document Name *</Label>
            <Input
              id="doc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales Agreement"
            />
          </div>
          <div>
            <Label htmlFor="doc-url">Document URL *</Label>
            <Input
              id="doc-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Add Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
