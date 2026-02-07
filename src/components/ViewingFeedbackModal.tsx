import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Star } from 'lucide-react';
import { Property } from '../types';
import { addViewingFeedback } from '../lib/buyCycle';
import { toast } from 'sonner';

interface ViewingFeedbackModalProps {
  property: Property;
  requirement: Property;
  onClose: () => void;
}

export function ViewingFeedbackModal({
  property,
  requirement,
  onClose,
}: ViewingFeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing feedback if available
  useEffect(() => {
    const existingFeedback = requirement.viewingFeedback?.find(
      (f) => f.propertyId === property.id
    );

    if (existingFeedback) {
      setFeedback(existingFeedback.feedback);
      setRating(existingFeedback.rating || 0);
    }
  }, [property.id, requirement.viewingFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = addViewingFeedback(requirement.id, {
        propertyId: property.id,
        date: new Date().toISOString().split('T')[0],
        feedback: feedback.trim(),
        rating: rating > 0 ? rating : undefined,
      });

      if (success) {
        toast.success('Viewing feedback saved successfully');
        onClose();
      } else {
        toast.error('Failed to save feedback');
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Viewing Feedback</DialogTitle>
          <DialogDescription>
            Provide feedback on the property viewing experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Property Info */}
          <div className="bg-[#f8f9fa] p-4 rounded-lg">
            <h3 className="text-[#030213] mb-1">{property.title}</h3>
            <p className="text-[#666] text-sm">{property.address}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <Label>Overall Rating (Optional)</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-[#666] text-sm ml-2">
                    {rating} out of 5
                  </span>
                )}
              </div>
            </div>

            {/* Feedback */}
            <div>
              <Label>Viewing Feedback *</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What did the buyer think of this property? (Location, condition, price, any concerns, etc.)"
                className="border-[#e9ebef] min-h-[150px] mt-2"
              />
              <p className="text-[#666] text-sm mt-1">
                Record the buyer's impressions and any concerns raised during the viewing
              </p>
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
                {isSubmitting ? 'Saving...' : 'Save Feedback'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}