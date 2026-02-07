import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Star, MessageSquare, ShieldCheck, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { saveAgentRating } from '../../lib/agentRatings';

interface AgentRatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetAgentId: string;
    targetAgentName: string;
    fromAgentId: string;
    fromAgentName: string;
    dealId: string;
}

export function AgentRatingModal({
    isOpen,
    onClose,
    targetAgentId,
    targetAgentName,
    fromAgentId,
    fromAgentName,
    dealId
}: AgentRatingModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [category, setCategory] = useState<'communication' | 'professionalism' | 'cooperation' | 'timing'>('communication');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            saveAgentRating({
                targetAgentId,
                targetAgentName,
                fromAgentId,
                fromAgentName,
                dealId,
                rating,
                comment,
                category
            });

            toast.success('Thank you for your feedback!');
            onClose();
        } catch (error) {
            toast.error('Failed to save rating');
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = [
        { id: 'communication', label: 'Communication', icon: MessageSquare },
        { id: 'professionalism', label: 'Professionalism', icon: ShieldCheck },
        { id: 'cooperation', label: 'Cooperation', icon: Users },
        { id: 'timing', label: 'Timing', icon: Clock },
    ] as const;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-width-[500px]">
                <DialogHeader>
                    <DialogTitle>Rate Collaborative Agent</DialogTitle>
                    <DialogDescription>
                        Your feedback helps maintain a high standard of professional collaboration in the aaraazi network.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-sm font-medium text-gray-500 mb-3">Overall performance for {targetAgentName}</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    onClick={() => setRating(star)}
                                    className="transition-transform active:scale-95"
                                >
                                    <Star
                                        className={`w-10 h-10 ${(hoveredRating || rating) >= star
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-sm font-semibold text-amber-600 mt-3 animate-in fade-in zoom-in duration-300">
                                {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label>Top Performance Area</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${category === cat.id
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 ${category === cat.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Detailed Feedback (Optional)</Label>
                        <Textarea
                            id="comment"
                            placeholder="What was it like working with this agent?"
                            className="resize-none h-24"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Skip for Now
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                        {isSubmitting ? 'Saving...' : 'Submit Review'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
