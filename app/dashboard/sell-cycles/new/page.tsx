"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { SellCycleForm } from '@/components/SellCycleForm';
import { mapAuthUserToUIUser } from '@/types';
import { useProperty, useProperties } from '@/hooks/useProperties';
import { formatPropertyAddress } from '@/lib/utils';
import { formatPKR } from '@/lib/currency';
import { Loader2, AlertCircle, Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewSellCyclePage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();
    const [propertyId, setPropertyId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const storedId = sessionStorage.getItem('cycle_property_id');
        if (storedId) {
            setPropertyId(storedId);
        }
    }, []);

    const { properties, isLoading: listLoading } = useProperties({ page: 1, limit: 500 });
    const { property, isLoading: propertyLoading, error } = useProperty(propertyId ?? undefined, !!propertyId);
    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    const filteredProperties = useMemo(() => {
        if (!search.trim()) return properties;
        const q = search.toLowerCase();
        return properties.filter(
            (p) =>
                (typeof p.address === 'string' ? p.address : formatPropertyAddress(p.address)).toLowerCase().includes(q) ||
                (p.title || '').toLowerCase().includes(q) ||
                (p.currentOwnerName || '').toLowerCase().includes(q)
        );
    }, [properties, search]);

    if (!propertyId) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">Start Sell Cycle</h1>
                    <p className="text-gray-500 mt-1">Select a property to list for sale and create a sell cycle.</p>
                </div>
                <div className="mb-4">
                    <Input
                        placeholder="Search by address, title, or owner..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-md"
                    />
                </div>
                {listLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-500">Loading properties...</p>
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                        <Home className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-amber-900 mb-2">No properties found</h3>
                        <p className="text-amber-700 mb-6">
                            {search ? 'Try a different search or' : 'Add a property first to start a sell cycle.'}
                        </p>
                        <Button onClick={() => router.push('/dashboard/properties')}>
                            Go to Properties
                        </Button>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {filteredProperties.map((p) => {
                            const addr = typeof p.address === 'string' ? p.address : formatPropertyAddress(p.address);
                            return (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPropertyId(p.id);
                                            sessionStorage.setItem('cycle_property_id', p.id);
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-200 text-left transition-colors"
                                    >
                                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                            {p.images?.[0] ? (
                                                <img src={p.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <Home className="h-6 w-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{p.title || addr}</p>
                                            <p className="text-sm text-gray-500 truncate">{addr}</p>
                                            {p.price > 0 && (
                                                <p className="text-sm text-gray-600 mt-0.5">{formatPKR(p.price)}</p>
                                            )}
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        );
    }

    if (propertyLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading property details...</p>
            </div>
        );
    }

    if (error || !property || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center max-w-md text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Property</h3>
                    <p className="text-red-700 mb-6">{error || 'Property not found or access denied'}</p>
                    <Button variant="outline" onClick={() => router.push('/dashboard/properties')}>
                        Back to Properties
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <SellCycleForm
            property={property}
            user={user}
            onBack={() => {
                sessionStorage.removeItem('cycle_property_id');
                router.push(`/dashboard/properties/${propertyId}`);
            }}
            onSuccess={() => {
                sessionStorage.removeItem('cycle_property_id');
                router.push(`/dashboard/properties/${propertyId}`);
            }}
        />
    );
}
