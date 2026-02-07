import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { X, Plus } from 'lucide-react';
import { User, Contact } from '../types';
import { addProperty } from '../lib/data';
import { toast } from 'sonner';

interface RequirementFormModalProps {
  user: User;
  contacts: Contact[];
  onClose: () => void;
}

export function RequirementFormModal({
  user,
  contacts,
  onClose,
}: RequirementFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    budgetMin: '',
    budgetMax: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    areaUnit: 'sqft' as 'sqft' | 'sqyards' | 'marla' | 'kanal',
    currentOwnerId: '', // Buyer contact ID
    description: '',
    preferredLocations: [] as string[],
  });

  const [locationInput, setLocationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter for buyer contacts
  const buyerContacts = contacts.filter(
    (c) => c.category === 'buyer' || c.category === 'both' || !c.category
  );

  const handleAddLocation = () => {
    if (locationInput.trim() && !formData.preferredLocations.includes(locationInput.trim())) {
      setFormData({
        ...formData,
        preferredLocations: [...formData.preferredLocations, locationInput.trim()],
      });
      setLocationInput('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    setFormData({
      ...formData,
      preferredLocations: formData.preferredLocations.filter((l) => l !== location),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a requirement title');
      return;
    }

    if (!formData.currentOwnerId) {
      toast.error('Please select a buyer contact');
      return;
    }

    if (!formData.budgetMin || !formData.budgetMax) {
      toast.error('Please enter budget range');
      return;
    }

    const minBudget = parseFloat(formData.budgetMin);
    const maxBudget = parseFloat(formData.budgetMax);

    if (isNaN(minBudget) || isNaN(maxBudget)) {
      toast.error('Budget amounts must be valid numbers');
      return;
    }

    if (minBudget >= maxBudget) {
      toast.error('Maximum budget must be greater than minimum budget');
      return;
    }

    if (formData.preferredLocations.length === 0) {
      toast.error('Please add at least one preferred location');
      return;
    }

    setIsSubmitting(true);

    try {
      const buyer = contacts.find((c) => c.id === formData.currentOwnerId);

      // Create the wanted listing (buyer requirement)
      addProperty({
        title: formData.title,
        address: formData.preferredLocations.join(', '), // Store as comma-separated
        price: maxBudget, // Use max budget as the price field
        listingType: 'wanted',
        propertyType: formData.propertyType as any,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        areaUnit: formData.areaUnit,
        description: formData.description,
        budgetMin: minBudget,
        budgetMax: maxBudget,
        preferredLocations: formData.preferredLocations,
        shortlistedProperties: [],
        viewingFeedback: [],
        currentOwnerId: formData.currentOwnerId,
        agentId: user.id,
        agentName: user.name,
        status: 'available', // Active search
        sharedWith: [],
        isPublished: false,
        isAnonymous: false,
        commissionRate: 2, // Default 2% for buyer representation
      });

      toast.success('Buyer requirement created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating requirement:', error);
      toast.error('Failed to create requirement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Buyer Requirement</DialogTitle>
          <DialogDescription>
            Enter the details of the buyer requirement to create a new listing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Buyer Selection */}
          <div>
            <Label>Buyer Contact *</Label>
            <Select
              value={formData.currentOwnerId}
              onValueChange={(value) =>
                setFormData({ ...formData, currentOwnerId: value })
              }
            >
              <SelectTrigger className="border-[#e9ebef]">
                <SelectValue placeholder="Select buyer..." />
              </SelectTrigger>
              <SelectContent>
                {buyerContacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} - {contact.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <Label>Requirement Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., 3 Bed Apartment in DHA Phase 5"
              className="border-[#e9ebef]"
            />
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Minimum Budget (PKR) *</Label>
              <Input
                type="number"
                value={formData.budgetMin}
                onChange={(e) =>
                  setFormData({ ...formData, budgetMin: e.target.value })
                }
                placeholder="e.g., 10000000"
                className="border-[#e9ebef]"
              />
            </div>
            <div>
              <Label>Maximum Budget (PKR) *</Label>
              <Input
                type="number"
                value={formData.budgetMax}
                onChange={(e) =>
                  setFormData({ ...formData, budgetMax: e.target.value })
                }
                placeholder="e.g., 15000000"
                className="border-[#e9ebef]"
              />
            </div>
          </div>

          {/* Preferred Locations */}
          <div>
            <Label>Preferred Locations *</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLocation();
                  }
                }}
                placeholder="e.g., DHA Phase 5, Clifton Block 4"
                className="border-[#e9ebef]"
              />
              <Button
                type="button"
                onClick={handleAddLocation}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.preferredLocations.map((location, idx) => (
                <Badge
                  key={idx}
                  className="bg-[#fb8500] text-white gap-2 pr-2"
                >
                  {location}
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(location)}
                    className="hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Property Type */}
          <div>
            <Label>Property Type</Label>
            <Select
              value={formData.propertyType}
              onValueChange={(value) =>
                setFormData({ ...formData, propertyType: value })
              }
            >
              <SelectTrigger className="border-[#e9ebef]">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="plot">Plot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Bedrooms</Label>
              <Input
                type="number"
                value={formData.bedrooms}
                onChange={(e) =>
                  setFormData({ ...formData, bedrooms: e.target.value })
                }
                placeholder="e.g., 3"
                className="border-[#e9ebef]"
              />
            </div>
            <div>
              <Label>Bathrooms</Label>
              <Input
                type="number"
                value={formData.bathrooms}
                onChange={(e) =>
                  setFormData({ ...formData, bathrooms: e.target.value })
                }
                placeholder="e.g., 3"
                className="border-[#e9ebef]"
              />
            </div>
          </div>

          {/* Area */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label>Area</Label>
              <Input
                type="number"
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
                placeholder="e.g., 1500"
                className="border-[#e9ebef]"
              />
            </div>
            <div>
              <Label>Unit</Label>
              <Select
                value={formData.areaUnit}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, areaUnit: value })
                }
              >
                <SelectTrigger className="border-[#e9ebef]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">Sq Ft</SelectItem>
                  <SelectItem value="sqyards">Sq Yards</SelectItem>
                  <SelectItem value="marla">Marla</SelectItem>
                  <SelectItem value="kanal">Kanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Additional Requirements / Notes</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Any specific requirements, urgency, timeline, etc."
              className="border-[#e9ebef] min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[#e9ebef]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#fb8500] hover:bg-[#fb8500]/90 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Requirement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}