/** TasksTab — Quick-add widget + task list for a contact */

import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { TaskQuickAddWidget } from '@/components/tasks/TaskQuickAddWidget';
import { ContactTaskList } from '../../ContactTaskList';
import type { Task } from '@/services/tasks.service';
import type { User } from '@/types';
import type { UseContactDetailReturn } from '@/hooks/useContactDetail';

interface TasksTabProps {
    contactId: string;
    contactName: string;
    user: User;
    tasks: Task[];
    detail: UseContactDetailReturn;
}

export const TasksTab: React.FC<TasksTabProps> = ({ contactId, contactName, user, tasks, detail }) => {
    const {
        tenantId,
        agencyId,
        createTaskMutation,
        updateTaskMutation,
        deleteTaskMutation,
        setEditingTask,
        setShowTaskForm,
        refetchSilent,
    } = detail;

    const canCreate = Boolean(tenantId && agencyId);

    return (
        <div className="space-y-6">
            {canCreate && tenantId && agencyId && (
                <TaskQuickAddWidget
                    user={user}
                    entityType="contact"
                    entityId={contactId}
                    entityName={contactName}
                    onCreateTaskApi={async (payload) => {
                        await createTaskMutation.mutateAsync({
                            title: payload.title,
                            description: payload.description,
                            type: (payload.type as 'FOLLOW_UP' | 'VIEWING' | 'MEETING' | 'DOCUMENT' | 'CALL' | 'EMAIL' | 'INSPECTION' | 'OTHER') ?? 'FOLLOW_UP',
                            priority: (payload.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') ?? 'MEDIUM',
                            dueDate: payload.dueDate,
                            assignedToId: payload.assignedToId,
                            contactId,
                            tenantId,
                            agencyId,
                        });
                        refetchSilent();
                    }}
                    onTaskCreated={() => refetchSilent()}
                />
            )}

            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Contact Tasks ({tasks.length})
                </h3>
                {tasks.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-500">No tasks for this contact yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {canCreate ? 'Tasks will appear here when created' : 'Sign in to add tasks'}
                        </p>
                    </div>
                ) : (
                    <ContactTaskList
                        tasks={tasks}
                        contactName={contactName}
                        onEdit={(task) => { setEditingTask(task); setShowTaskForm(true); }}
                        onDelete={async (taskId) => {
                            if (confirm('Delete this task?')) {
                                try {
                                    await deleteTaskMutation.mutateAsync(taskId);
                                    refetchSilent();
                                    toast.success('Task deleted');
                                } catch { toast.error('Failed to delete task'); }
                            }
                        }}
                        onStatusChange={async (taskId: string, status) => {
                            try {
                                await updateTaskMutation.mutateAsync({ id: taskId, data: { status } });
                                refetchSilent();
                                toast.success('Task status updated');
                            } catch { toast.error('Failed to update status'); }
                        }}
                        isDeleting={deleteTaskMutation.isPending}
                    />
                )}
            </div>
        </div>
    );
};
