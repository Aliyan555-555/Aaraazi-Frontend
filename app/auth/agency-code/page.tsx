'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Search, AlertCircle, ArrowRight, CircuitBoard } from 'lucide-react';
import { useTenantLookup, useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

/**
 * Professional Agency Code Lookup Page
 * Beautiful UI with feature showcase
 */
export default function AgencyCodeScreen() {
    const router = useRouter();
    const [domain, setDomain] = useState('');
    const { lookupTenant, isLoading, error, clearError } = useTenantLookup();
    const { isAuthenticated } = useAuth();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, router]);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (!domain.trim()) {
            return;
        }

        try {
            await lookupTenant({ domain: domain.trim() });
            // Hook automatically navigates to /auth/login on success
        } catch (err) {
            console.error('Tenant lookup failed:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl">
                {/* Header */}
                <div className="text-center mb-8 transition-all duration-300">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-semibold text-gray-900">Aaraazi</h1>
                    </div>
                    <p className="text-lg text-gray-600">
                        Real Estate & Development Management Platform
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Agency Code Form */}
                    <Card className="shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-2xl">Enter Agency Code</CardTitle>
                            <CardDescription>
                                Please enter your agency domain or code to access your workspace
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLookup} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="domain">Agency Domain / Code</Label>
                                    <div className="relative">
                                        <CircuitBoard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="domain"
                                            type="text"
                                            placeholder="e.g., premium-realty.com or PREMIUM"
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            className="pl-10"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Enter the domain or code provided by your administrator
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <span>{getErrorMessage(error)}</span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90"
                                    disabled={isLoading || !domain.trim()}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Feature Overview */}
                    <div className="space-y-6">
                        <Card className="border-blue-200 bg-blue-50">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                    <CardTitle className="text-blue-900">Agency Module</CardTitle>
                                </div>
                                <CardDescription className="text-blue-700">
                                    Complete real estate management system for agencies and agents
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-blue-800">
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-0.5">✓</span>
                                        <span>Property listing management</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-0.5">✓</span>
                                        <span>Lead tracking and nurturing</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-0.5">✓</span>
                                        <span>Commission tracking and payouts</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-0.5">✓</span>
                                        <span>Agent performance analytics</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-0.5">✓</span>
                                        <span>Document management system</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    🎯 Platform Features
                                </CardTitle>
                                <CardDescription>
                                    Enterprise-grade platform capabilities
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-gray-600">
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Role-based access control</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Multi-branch organization support</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Customizable subscription plans</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Module-based pricing</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Advanced analytics and reporting</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} Aaraazi. Built for the Pakistani Real Estate Market.</p>
                    <p className="mt-1">All financial values are displayed in Pakistani Rupees (PKR).</p>
                </div>
            </div>
        </div>
    );
}
