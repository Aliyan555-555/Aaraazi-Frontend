/** TransactionsTab — Placeholder for related deals/transactions */

import React from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/currency';
import type { Deal } from '@/types/deals';

type DealWithLegacy = Deal & {
    propertyAddress?: string;
    finalPrice?: number;
    createdAt?: string;
    status?: string;
};

interface TransactionsTabProps {
    deals: Deal[];
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ deals }) => (
    <div className="p-6">
        {deals.length === 0 ? (
            <Card>
                <CardContent className="pt-6 text-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No transactions yet</p>
                    <p className="text-sm text-gray-400">Deals associated with this contact will appear here</p>
                </CardContent>
            </Card>
        ) : (
            <div className="space-y-3">
                {deals.map((deal) => {
                    const d = deal as DealWithLegacy;
                    const price = d.finalPrice ?? deal.financial?.agreedPrice ?? 0;
                    const status = deal.lifecycle?.status ?? d.status ?? 'active';
                    return (
                        <Card key={deal.id}>
                            <CardContent className="p-4 flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{d.propertyAddress ?? deal.cycles?.sellCycle?.propertyId ?? 'Property'}</p>
                                    <p className="text-sm text-muted-foreground">{formatPKR(price)}</p>
                                </div>
                                <Badge variant="outline">{status}</Badge>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )}
    </div>
);
