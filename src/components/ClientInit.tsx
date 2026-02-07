'use client';

import { useEffect } from 'react';
import { initializeData } from '@/lib/data';
import { initializeUsers } from '@/lib/auth';
import { initializeInvestorData } from '@/lib/investors';
import { saveSystemTemplates } from '@/lib/reportTemplates';
import { initializeMasterScheduler } from '@/lib/clientScheduler';

export function ClientInit() {
    useEffect(() => {
        try {
            initializeUsers();

            // Initialize Core Data
            initializeData();

            // Initialize Module-specific data
            initializeInvestorData();

            // Save initial report templates
            saveSystemTemplates();

            // Start background schedulers
            initializeMasterScheduler();

            console.log('Aaraazi Platform Initialized Successfully');
        } catch (error) {
            console.error('Failed to initialize platform data:', error);
        }
    }, []);

    return null;
}
