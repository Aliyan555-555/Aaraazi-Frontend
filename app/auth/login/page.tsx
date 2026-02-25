'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, ArrowRight, AlertCircle, Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogin } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { LoginDto } from '@/types/auth.types';
import Image from 'next/image';
import { AARAAZI_BRAND } from '@/lib/brand';

/**
 * Professional Login Page
 * White-label branded authentication with agency selection
 */
export default function LoginPage() {
    const router = useRouter();
    const { branding, tenantId, agencies } = useAuthStore();
    const { login, isLoading, error, clearError } = useLogin();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
    const [validationError, setValidationError] = useState('');

    // Redirect if no tenant selected
    useEffect(() => {
        if (!tenantId) {
            router.replace('/auth/agency-code');
        } else if (agencies.length === 1) {
            setSelectedAgencyId(agencies[0].id);
        }
    }, [tenantId, router, agencies]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setValidationError('');

        if (!tenantId) {
            setValidationError('Session expired. Please start from agency code page.');
            return;
        }

        if (agencies.length > 1 && !selectedAgencyId) {
            setValidationError('Please select an agency branch');
            return;
        }

        const agencyIdToUse = selectedAgencyId || agencies[0]?.id;

        try {
            const credentials: LoginDto = {
                tenantId,
                agencyId: agencyIdToUse,
                email: email.trim(),
                password,
            };

            await login(credentials);
        } catch (err) {
            console.error('Login failed:', err);
        }
    };

    const handleBackToAgencyCode = () => {
        router.push('/auth/agency-code');
    };

    // Show loader while checking tenant
    if (!branding || !tenantId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen  flex items-center justify-center p-4">
            <div className="w-full max-w-6xl">
                {/* Header with Branding */}
                <div className="text-center mb-8 transition-all duration-300">
                    <div className="flex items-center justify-center  mb-4">

                        {branding.logoUrl ? (
                            <Image src={branding.logoUrl} alt="Logo" className="object-contain" width={80} height={80} />
                        ) : (
                            <Image src={AARAAZI_BRAND.fullLogo} alt={AARAAZI_BRAND.displayName} className="object-contain" width={80} height={80} />
                        )}

                        <h1 className="text-3xl font-semibold text-gray-900">
                            {branding.companyName || 'Aaraazi'}
                        </h1>
                    </div>
                    <p className="text-lg text-gray-600">
                        {branding.portalTitle || 'Your Premium Real Estate Management Portal'}
                    </p>
                </div>

                <div className="max-w-lg mx-auto">
                    {/* Login Form */}
                    <Card className="shadow-xl ">
                        <CardHeader>
                            <CardTitle className="text-2xl">Sign In</CardTitle>
                            <CardDescription>
                                Enter your credentials to access {branding.companyName}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Agency Context Display */}
                            <div className="p-4 bg-primary/10 rounded-lg mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                        style={{ backgroundColor: branding.primaryColor }}
                                    >
                                        {branding.companyName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium" style={{ color: branding.primaryColor }}>
                                            {branding.companyName}
                                        </div>
                                        <div className="text-gray-600 text-xs">
                                            {agencies.length} {agencies.length === 1 ? 'branch' : 'branches'}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleBackToAgencyCode}
                                    className="hover:bg-primary/10"
                                    style={{ color: branding.primaryColor }}
                                >
                                    Change
                                </Button>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                {/* Agency Selection if multiple */}
                                {agencies.length > 1 && (
                                    <div className="space-y-2">
                                        <Label htmlFor="agency">Select Branch / Agency</Label>
                                        <select
                                            id="agency"
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                            value={selectedAgencyId}
                                            onChange={(e) => setSelectedAgencyId(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Agency</option>
                                            {agencies.map(ag => (
                                                <option key={ag.id} value={ag.id}>
                                                    {ag.name} ({ag.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                            placeholder="name@company.com"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <a
                                            href="#"
                                            className="text-sm text-muted-foreground hover:underline"
                                            style={{ color: branding.primaryColor }}
                                        >
                                            Forgot?
                                        </a>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            placeholder="••••••••"
                                            className="pl-10 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {(error || validationError) && (
                                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <span>{validationError || getErrorMessage(error)}</span>
                                    </div>
                                )}

                                <div className="space-y-3 pt-2">
                                    <Button
                                        type="submit"
                                        className="w-full transition-all hover:scale-[1.02]"
                                        disabled={isLoading || !email.trim() || !password}
                                        style={{ backgroundColor: branding.primaryColor }}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Signing In...
                                            </>
                                        ) : (
                                            <>
                                                Sign In
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full text-gray-500"
                                        onClick={handleBackToAgencyCode}
                                        disabled={isLoading}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Agency Code
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Branding Banner or Features */}
                    <div className="hidden lg:flex flex-col justify-center p-8 rounded-2xl relative overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, ${branding.primaryColor}10, ${branding.primaryColor}05)`,
                            border: `1px solid ${branding.primaryColor}20`
                        }}>
                        {branding.loginBannerUrl && (
                            <div
                                className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage: `url(${branding.loginBannerUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                        )}

                        <div className="relative z-10 space-y-6">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold text-gray-900">
                                    Welcome Back!
                                </h2>
                                <p className="text-lg text-gray-600">
                                    Access your complete real estate management platform
                                </p>
                            </div>

                            <div className="space-y-4 mt-8">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${branding.primaryColor}20` }}>
                                        <span style={{ color: branding.primaryColor }}>✓</span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Manage Properties</h3>
                                        <p className="text-sm text-gray-600">List and track all your properties</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${branding.primaryColor}20` }}>
                                        <span style={{ color: branding.primaryColor }}>✓</span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Track Leads</h3>
                                        <p className="text-sm text-gray-600">Nurture and convert prospects</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${branding.primaryColor}20` }}>
                                        <span style={{ color: branding.primaryColor }}>✓</span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Analytics & Reports</h3>
                                        <p className="text-sm text-gray-600">Data-driven insights</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${branding.primaryColor}20` }}>
                                        <span style={{ color: branding.primaryColor }}>✓</span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Team Collaboration</h3>
                                        <p className="text-sm text-gray-600">Work together seamlessly</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} {branding.companyName}. Powered by Aaraazi.</p>
                    <p className="mt-1">Protected by Aaraazi Secure Auth</p>
                </div>
            </div>
        </div>
    );
}
