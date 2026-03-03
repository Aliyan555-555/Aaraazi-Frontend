/** InteractionsTab — Log, edit and delete contact interactions */

import React from 'react';
import { Phone, Mail, Users, MessageSquare, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Interaction } from '@/services/interactions.service';
import type { CRMInteraction } from '@/types/crm';
import type { UseContactDetailReturn } from '@/hooks/useContactDetail';

interface InteractionsTabProps {
    interactions: (Interaction | CRMInteraction)[];
    detail: UseContactDetailReturn;
}

export const InteractionsTab: React.FC<InteractionsTabProps> = ({ interactions, detail }) => {
    const {
        setEditingInteraction,
        setShowInteractionForm,
        deleteInteractionMutation,
        refetchInteractions,
    } = detail;

    const openNew = () => { setEditingInteraction(undefined); setShowInteractionForm(true); };

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Interactions History</h3>
                <Button onClick={openNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Interaction
                </Button>
            </div>

            {interactions.length === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">No interactions recorded yet</p>
                        <Button variant="outline" onClick={openNew}>Log Your First Interaction</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {interactions.map((interaction) => {
                        const t = 'summary' in interaction
                            ? (interaction as Interaction).type?.toLowerCase()
                            : (interaction as CRMInteraction).type;
                        const subject = 'summary' in interaction
                            ? (interaction as Interaction).summary
                            : (interaction as CRMInteraction).subject;
                        const notes = 'summary' in interaction
                            ? (interaction as Interaction).notes ?? ''
                            : (interaction as CRMInteraction).notes;
                        const outcome = !('summary' in interaction) ? (interaction as CRMInteraction).outcome : undefined;
                        const typeLabel = 'summary' in interaction
                            ? (interaction as Interaction).type
                            : (interaction as CRMInteraction).type;

                        return (
                            <Card key={interaction.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {t === 'call' && <Phone className="h-4 w-4 text-blue-500" />}
                                                {t === 'email' && <Mail className="h-4 w-4 text-green-500" />}
                                                {t === 'meeting' && <Users className="h-4 w-4 text-purple-500" />}
                                                {t === 'sms' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                                                {t === 'note' && <FileText className="h-4 w-4 text-gray-500" />}
                                                {!['call', 'email', 'meeting', 'sms', 'note'].includes(String(t)) && <MessageSquare className="h-4 w-4 text-gray-500" />}
                                                <span className="font-medium">{subject}</span>
                                                <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{notes}</p>
                                            {outcome && <p className="text-sm text-gray-500"><span className="font-medium">Outcome:</span> {outcome}</p>}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(interaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => { setEditingInteraction(interaction); setShowInteractionForm(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={deleteInteractionMutation.isPending}
                                                onClick={async () => {
                                                    if (confirm('Delete this interaction?')) {
                                                        try {
                                                            await deleteInteractionMutation.mutateAsync(interaction.id);
                                                            refetchInteractions();
                                                        } catch { /* toast handled by store */ }
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
