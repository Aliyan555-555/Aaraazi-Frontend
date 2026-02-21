"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { TaskDetails } from '@/components/tasks/TaskDetails';
import { mapAuthUserToUIUser } from '@/types';
import { toast } from 'sonner';

export default function TaskDetailPage() {
    const { id } = useParams();
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!id || typeof id !== 'string' || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-gray-500 mb-4">Task not found</p>
                <button
                    onClick={() => router.push('/dashboard/tasks')}
                    className="text-primary hover:underline"
                >
                    Back to Tasks
                </button>
            </div>
        );
    }

    const handleNavigate = (page: string, navigateId?: string) => {
        if (navigateId) {
            router.push(`/dashboard/${page}/${navigateId}`);
        } else {
            router.push(`/dashboard/${page}`);
        }
    };

    return (
        <TaskDetails
            taskId={id}
            user={user}
            onBack={() => router.push('/dashboard/tasks')}
            onNavigate={handleNavigate}
            onEdit={(taskId) => toast.info(`Edit task: ${taskId}`)}
        />
    );
}
