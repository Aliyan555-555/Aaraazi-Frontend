/** ActivityTab — Timeline of follow-ups, creation, last contact, and deals */

import React from 'react';
import { Bell, User as UserIcon, Phone, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPKR } from '@/lib/currency';
import type { Contact } from '@/types/schema';
import type { Deal } from '@/types/deals';
import type { UseContactDetailReturn } from '@/hooks/useContactDetail';

type DealWithLegacy = Deal & {
    propertyAddress?: string;
    finalPrice?: number;
    createdAt?: string;
    status?: string;
};

interface ActivityTabProps {
    contact: Contact;
    relatedDeals: Deal[];
    detail: UseContactDetailReturn;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ contact, relatedDeals, detail }) => {
    const { followUpStatus, nextFollowUpValue, lastContactDateValue } = detail;

    return (
        <div className="p-6">
            <Card>
                <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {nextFollowUpValue && (
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${followUpStatus === 'overdue' ? 'bg-red-100' : followUpStatus === 'due' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                        <Bell className={`h-4 w-4 ${followUpStatus === 'overdue' ? 'text-red-600' : followUpStatus === 'due' ? 'text-yellow-600' : 'text-blue-600'}`} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Follow-up Scheduled</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(nextFollowUpValue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <UserIcon className="h-4 w-4 text-blue-600" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Contact Created</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(contact.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {lastContactDateValue && (
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <Phone className="h-4 w-4 text-green-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Last Contact</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(lastContactDateValue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        )}

                        {relatedDeals.map((deal) => (
                            <div key={deal.id} className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <DollarSign className="h-4 w-4 text-purple-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Transaction: {(deal as DealWithLegacy).propertyAddress || deal.cycles?.sellCycle?.propertyId || 'Property'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatPKR((deal as DealWithLegacy).finalPrice || deal.financial?.agreedPrice || 0)} • {deal.lifecycle?.status || (deal as DealWithLegacy).status || 'active'}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {relatedDeals.length === 0 && !lastContactDateValue && (
                            <div className="text-center py-4">
                                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
