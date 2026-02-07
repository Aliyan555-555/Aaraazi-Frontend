"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { DocumentCenter } from '@/components/DocumentCenter';

export default function DocumentsPage() {
    const router = useRouter();

    return (
        <DocumentCenter />
    );
}
