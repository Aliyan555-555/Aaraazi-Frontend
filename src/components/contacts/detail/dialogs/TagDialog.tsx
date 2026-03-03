/** TagDialog — Add a new tag to a contact */

import React from 'react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface TagDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: string;
    onChange: (v: string) => void;
    onAdd: () => void;
}

export const TagDialog: React.FC<TagDialogProps> = ({ open, onOpenChange, value, onChange, onAdd }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add Tag</DialogTitle>
                <DialogDescription>Add a tag to organise and categorise this contact</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="tag">Tag Name</Label>
                    <Input
                        id="tag"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="e.g., VIP, Hot Lead, Investor"
                        onKeyDown={(e) => { if (e.key === 'Enter') onAdd(); }}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={onAdd} disabled={!value.trim()}>Add Tag</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);
