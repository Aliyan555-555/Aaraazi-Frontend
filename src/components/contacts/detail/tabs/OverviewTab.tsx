/** OverviewTab — Contact information, tags, follow-up alert, and quick stats */

import React from 'react';
import { Edit, Tag, MapPin, Bell, Plus, X, Home, Briefcase, TrendingUp, Activity, Clock, Calendar, Phone, Mail, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ContactStatus } from '@/types/schema';
import { getTagArray } from '@/lib/contacts.utils';
import { formatPKR } from '@/lib/currency';
import type { Contact } from '@/types/schema';
import type { UseContactDetailReturn } from '@/hooks/useContactDetail';

type ContactWithLegacy = Contact & {
    totalCommissionEarned?: number;
    totalTransactions?: number;
    source?: string;
    notes?: string;
};

interface OverviewTabProps {
    contact: Contact;
    detail: UseContactDetailReturn;
    relatedProperties: { id: string }[];
    relatedDeals: { id?: string }[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ contact, detail, relatedProperties, relatedDeals }) => {
    const {
        followUpStatus,
        nextFollowUpValue,
        lastContactDateValue,
        setShowFollowUpDialog,
        setShowTagDialog,
        handleEditClick,
        handleRemoveTag,
    } = detail;

    const tags = getTagArray(contact.tags);

    return (
        <div className="p-6 space-y-6">
            {/* Follow-up Alert */}
            {followUpStatus && (
                <Card className={`border-2 ${followUpStatus === 'overdue' ? 'border-red-500 bg-red-50' : followUpStatus === 'due' ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'}`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Bell className={`h-5 w-5 ${followUpStatus === 'overdue' ? 'text-red-600' : followUpStatus === 'due' ? 'text-yellow-600' : 'text-blue-600'}`} />
                            <div>
                                <p className="font-medium">
                                    {followUpStatus === 'overdue' ? 'Overdue Follow-up' : followUpStatus === 'due' ? 'Follow-up Due Today' : 'Upcoming Follow-up'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Scheduled for {nextFollowUpValue && new Date(nextFollowUpValue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setShowFollowUpDialog(true)}>
                                Reschedule
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Contact Information */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Contact Information</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleEditClick()}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{contact.name}</p></div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div><p className="text-sm text-muted-foreground">Phone</p><p className="font-medium">{contact.phone}</p></div>
                        </div>
                        {contact.email && (
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{contact.email}</p></div>
                            </div>
                        )}
                        <div className="flex items-start gap-3">
                            <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div><p className="text-sm text-muted-foreground">Type</p><Badge variant="outline">{contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}</Badge></div>
                        </div>
                        {contact.category && (
                            <div className="flex items-start gap-3">
                                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div><p className="text-sm text-muted-foreground">Category</p><Badge variant="secondary">{contact.category.charAt(0).toUpperCase() + contact.category.slice(1)}</Badge></div>
                            </div>
                        )}
                        <div className="flex items-start gap-3">
                            <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={contact.status === ContactStatus.ACTIVE ? 'default' : contact.status === ContactStatus.INACTIVE ? 'secondary' : 'outline'}>
                                    {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                                </Badge>
                            </div>
                        </div>
                        {(contact as ContactWithLegacy).source && (
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div><p className="text-sm text-muted-foreground">Source</p><p className="font-medium">{(contact as ContactWithLegacy).source}</p></div>
                            </div>
                        )}
                        {lastContactDateValue && (
                            <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Last Contact</p>
                                    <p className="font-medium">{new Date(lastContactDateValue).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                </div>
                            </div>
                        )}
                        {nextFollowUpValue && (
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Next Follow-up</p>
                                    <p className="font-medium">{new Date(nextFollowUpValue).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <Separator />
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">Tags</p>
                            <Button variant="ghost" size="sm" onClick={() => setShowTagDialog(true)}>
                                <Plus className="h-4 w-4 mr-1" />Add Tag
                            </Button>
                        </div>
                        {tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, i) => (
                                    <Badge key={i} variant="outline" className="gap-1">
                                        {tag}
                                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No tags yet</p>
                        )}
                    </div>

                    {/* Notes */}
                    {((contact.preferences as Record<string, unknown>)?.['notes'] ?? (contact as ContactWithLegacy).notes) && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                                <p className="text-sm">{String((contact.preferences as Record<string, unknown>)?.['notes'] ?? (contact as ContactWithLegacy).notes)}</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div><p className="text-sm text-muted-foreground">Properties</p><p className="text-2xl font-bold">{relatedProperties.length}</p></div>
                            <Home className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div><p className="text-sm text-muted-foreground">Transactions</p><p className="text-2xl font-bold">{relatedDeals.length}</p></div>
                            <Briefcase className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Commission</p>
                                <p className="text-2xl font-bold">{formatPKR((contact as ContactWithLegacy).totalCommissionEarned ?? 0).replace('PKR ', '')}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
