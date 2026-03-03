/** FollowUpDialog — Schedule a follow-up reminder for a contact */

import React from 'react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface FollowUpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    followUpDate: string;
    setFollowUpDate: (v: string) => void;
    followUpNotes: string;
    setFollowUpNotes: (v: string) => void;
    onSet: () => void;
}

export const FollowUpDialog: React.FC<FollowUpDialogProps> = ({
    open, onOpenChange, followUpDate, setFollowUpDate, followUpNotes, setFollowUpNotes, onSet,
}) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Set Follow-up Reminder</DialogTitle>
                <DialogDescription>Schedule a follow-up date to stay on top of your contacts</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="followUpDate">Follow-up Date</Label>
                    <Input
                        id="followUpDate"
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <div>
                    <Label htmlFor="followUpNotes">Notes (Optional)</Label>
                    <Input
                        id="followUpNotes"
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        placeholder="Reminder notes..."
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={onSet} disabled={!followUpDate}>Set Follow-up</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);
