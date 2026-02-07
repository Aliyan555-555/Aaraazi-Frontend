/**
 * Bulk Edit Properties Modal
 * Edit multiple properties at once (common fields only)
 */

import React, { useState } from 'react';
import { Edit3, CheckCircle, AlertCircle } from 'lucide-react';
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
import { Checkbox } from './ui/checkbox';
import { Property } from '../types';
import { updateProperty } from '../lib/data';
import { toast } from 'sonner';
import { logger } from '../lib/logger';

interface BulkEditPropertiesModalProps {
  open: boolean;
  onClose: () => void;
  properties: Property[];
  onSuccess?: () => void;
}

interface EditFields {
  status?: string;
  propertyType?: string;
  areaUnit?: string;
  features?: string[];
}

export default function BulkEditPropertiesModal({
  open,
  onClose,
  properties,
  onSuccess,
}: BulkEditPropertiesModalProps) {
  const [selectedFields, setSelectedFields] = useState<Set<keyof EditFields>>(new Set());
  const [editData, setEditData] = useState<EditFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldToggle = (field: keyof EditFields) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(field)) {
      newSelected.delete(field);
      const newData = { ...editData };
      delete newData[field];
      setEditData(newData);
    } else {
      newSelected.add(field);
    }
    setSelectedFields(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (selectedFields.size === 0) {
      toast.error('Please select at least one field to edit');
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare update data
      // Prepare update data
      const updateData: any = {};

      if (selectedFields.has('status') && editData.status) {
        updateData.status = editData.status;
      }
      if (selectedFields.has('propertyType') && editData.propertyType) {
        updateData.type = editData.propertyType;
      }
      if (selectedFields.has('areaUnit') && editData.areaUnit) {
        updateData.areaUnit = editData.areaUnit;
      }
      if (selectedFields.has('features') && editData.features) {
        updateData.features = editData.features;
      }

      // Update all properties
      let successCount = 0;
      let errorCount = 0;

      for (const property of properties) {
        try {
          updateProperty(property.id, updateData);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(
          `Successfully updated ${successCount} ${successCount === 1 ? 'property' : 'properties'}`,
          { duration: 5000 }
        );
      } else if (successCount > 0) {
        toast.warning(
          `Updated ${successCount} properties. ${errorCount} failed.`,
          { duration: 5000 }
        );
      } else {
        toast.error('Failed to update any properties');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error('Error in bulk property edit:', error);
      toast.error('Failed to update properties. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="size-5" />
            Bulk Edit {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
          </DialogTitle>
          <DialogDescription>
            Select fields to edit and new values will be applied to all selected properties
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected Properties */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-3">Selected Properties ({properties.length})</h3>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {properties.slice(0, 5).map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between text-sm py-1 px-2 rounded border"
                  >
                    <span className="truncate">{property.title || property.address}</span>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {property.status}
                    </Badge>
                  </div>
                ))}
                {properties.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    ... and {properties.length - 5} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Editable Fields */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <h3 className="font-medium">Fields to Edit</h3>
              <p className="text-sm text-muted-foreground">
                Select the fields you want to update across all selected properties
              </p>

              {/* Status Field */}
              <div className="flex items-start gap-3 py-3 border-b">
                <Checkbox
                  id="status-field"
                  checked={selectedFields.has('status')}
                  onCheckedChange={() => handleFieldToggle('status')}
                />
                <div className="flex-1">
                  <Label htmlFor="status-field" className="font-medium">
                    Status
                  </Label>
                  {selectedFields.has('status') && (
                    <Select
                      value={editData.status || ''}
                      onValueChange={(value) => setEditData({ ...editData, status: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="listed">Listed</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="off-market">Off Market</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Property Type Field */}
              <div className="flex items-start gap-3 py-3 border-b">
                <Checkbox
                  id="propertyType-field"
                  checked={selectedFields.has('propertyType')}
                  onCheckedChange={() => handleFieldToggle('propertyType')}
                />
                <div className="flex-1">
                  <Label htmlFor="propertyType-field" className="font-medium">
                    Property Type
                  </Label>
                  {selectedFields.has('propertyType') && (
                    <Select
                      value={editData.propertyType || ''}
                      onValueChange={(value) => setEditData({ ...editData, propertyType: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select property type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="penthouse">Penthouse</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="plot">Plot</SelectItem>
                        <SelectItem value="farmhouse">Farmhouse</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Area Unit Field */}
              <div className="flex items-start gap-3 py-3">
                <Checkbox
                  id="areaUnit-field"
                  checked={selectedFields.has('areaUnit')}
                  onCheckedChange={() => handleFieldToggle('areaUnit')}
                />
                <div className="flex-1">
                  <Label htmlFor="areaUnit-field" className="font-medium">
                    Area Unit
                  </Label>
                  {selectedFields.has('areaUnit') && (
                    <Select
                      value={editData.areaUnit || ''}
                      onValueChange={(value) => setEditData({ ...editData, areaUnit: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select area unit..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sq ft">Square Feet</SelectItem>
                        <SelectItem value="sq yd">Square Yards</SelectItem>
                        <SelectItem value="sq m">Square Meters</SelectItem>
                        <SelectItem value="marla">Marla</SelectItem>
                        <SelectItem value="kanal">Kanal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
            <AlertCircle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-900">Bulk Edit Warning</p>
              <p className="text-amber-700">
                This will update {selectedFields.size} {selectedFields.size === 1 ? 'field' : 'fields'} across {properties.length} properties. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Success Preview */}
          {selectedFields.size > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-start gap-2">
              <CheckCircle className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-900">Ready to Update</p>
                <p className="text-green-700">
                  {selectedFields.size} {selectedFields.size === 1 ? 'field' : 'fields'} will be updated across {properties.length} properties.
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
            <Button type="submit" disabled={isSubmitting || selectedFields.size === 0}>
              {isSubmitting ? 'Updating...' : `Update ${properties.length} Properties`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}