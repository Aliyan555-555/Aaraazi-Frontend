import React from 'react';
import { AdminLayoutShell } from '../../src/components/AdminLayoutShell';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminLayoutShell>
            {children}
        </AdminLayoutShell>
    );
}
