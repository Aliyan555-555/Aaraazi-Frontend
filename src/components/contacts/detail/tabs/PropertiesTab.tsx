/** PropertiesTab — Placeholder for related properties */

import React from 'react';
import { Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RelatedProperty {
    id: string;
    address?: string;
    propertyType?: string;
    area?: number;
    areaUnit?: string;
    status?: string;
}

interface PropertiesTabProps {
    properties: RelatedProperty[];
}

export const PropertiesTab: React.FC<PropertiesTabProps> = ({ properties }) => (
    <div className="p-6">
        {properties.length === 0 ? (
            <Card>
                <CardContent className="pt-6 text-center py-12">
                    <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No properties linked yet</p>
                    <p className="text-sm text-gray-400">Properties associated with this contact will appear here</p>
                </CardContent>
            </Card>
        ) : (
            <div className="space-y-3">
                {properties.map((p) => (
                    <Card key={p.id}>
                        <CardContent className="p-4">
                            <p className="font-medium">{p.address ?? 'Unknown address'}</p>
                            <p className="text-sm text-muted-foreground">{p.propertyType} {p.area ? `· ${p.area} ${p.areaUnit ?? ''}` : ''} {p.status ? `· ${p.status}` : ''}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
    </div>
);
