import * as React from 'react';
import { useState, useEffect } from 'react';
import { User } from '../../types';
import { TaskAutomationRule } from '../../types/tasks';
import { getAutomationRules, saveAutomationRules } from '../../lib/tasks';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import {
    Repeat,
    Plus,
    Trash2,
    CheckCircle2,
    Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface TaskAutomationDashboardProps {
    user: User;
    open: boolean;
    onClose: () => void;
}

export const TaskAutomationDashboard: React.FC<TaskAutomationDashboardProps> = ({
    user,
    open,
    onClose,
}: TaskAutomationDashboardProps) => {
    const [rules, setRules] = useState<TaskAutomationRule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            const allRules = getAutomationRules();
            setRules(allRules);
            setLoading(false);
        }
    }, [open]);

    const handleToggleRule = (ruleId: string) => {
        const updatedRules = rules.map((rule: TaskAutomationRule) =>
            rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
        );
        setRules(updatedRules);
        saveAutomationRules(updatedRules);

        const rule = updatedRules.find((r: TaskAutomationRule) => r.id === ruleId);
        toast.success(`${rule?.name} ${rule?.enabled ? 'enabled' : 'disabled'}`);
    };

    const handleDeleteRule = (ruleId: string) => {
        const updatedRules = rules.filter((rule: TaskAutomationRule) => rule.id !== ruleId);
        setRules(updatedRules);
        saveAutomationRules(updatedRules);
        toast.success('Automation rule deleted');
    };

    const handleAddSampleRule = () => {
        const newRule: TaskAutomationRule = {
            id: `rule_${Date.now()}`,
            name: 'New Custom Automation',
            description: 'Sample rule created from dashboard',
            enabled: true,
            trigger: {
                type: 'entity-created',
                entityType: 'deal',
            },
            taskTemplate: {
                title: 'Review New Deal Documentation',
                description: 'A new deal has been created. Please review all shared documents within 24 hours.',
                category: 'legal',
                priority: 'high',
                dueInDays: 1,
                assignTo: 'agent',
                tags: ['automation', 'deal', 'review'],
            },
            createdBy: user.id || 'current-user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            triggerCount: 0,
        };

        const updatedRules = [...rules, newRule];
        setRules(updatedRules);
        saveAutomationRules(updatedRules);
        toast.success('Sample automation rule added');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Repeat className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-gray-900">Task Automation Dashboard</DialogTitle>
                                <DialogDescription className="text-gray-500">
                                    Manage rules that automatically create tasks based on system triggers.
                                </DialogDescription>
                            </div>
                        </div>
                        <Button onClick={handleAddSampleRule}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Sample Rule
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Zap className="h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No automation rules</h3>
                            <p className="text-gray-500 max-w-sm mt-1">
                                Automation rules help you save time by creating tasks automatically when events occur.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 pr-2">
                            {rules.map((rule: TaskAutomationRule) => (
                                <div
                                    key={rule.id}
                                    className={`border rounded-xl p-5 transition-all ${rule.enabled ? 'border-indigo-100 bg-white shadow-sm' : 'border-gray-200 bg-gray-50/50 grayscale'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                                                {!rule.enabled && (
                                                    <Badge variant="outline" className="text-gray-500 bg-gray-100">Paused</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                {rule.description}
                                            </p>

                                            <div className="flex flex-wrap gap-4 text-xs font-medium">
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-700 rounded-md uppercase tracking-wider">
                                                    <Zap className="h-3 w-3" />
                                                    Trigger: {rule.trigger.type.replace(/-/g, ' ')}
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md uppercase tracking-wider">
                                                    <Plus className="h-3 w-3" />
                                                    Creates Task: {rule.taskTemplate.title}
                                                </div>
                                                {rule.lastTriggered && (
                                                    <div className="text-gray-500 flex items-center">
                                                        Last triggered: {new Date(rule.lastTriggered).toLocaleDateString()}
                                                    </div>
                                                )}
                                                <div className="text-gray-500 flex items-center">
                                                    Hits: {rule.triggerCount}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center gap-2 px-3 py-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                <Switch
                                                    checked={rule.enabled}
                                                    onCheckedChange={() => handleToggleRule(rule.id)}
                                                />
                                                <span className="text-[10px] font-bold uppercase text-gray-400">Status</span>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDeleteRule(rule.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span>Automations are currently active</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="hover:text-indigo-600 font-medium transition-colors">Documentation</button>
                        <button className="hover:text-indigo-600 font-medium transition-colors">Audit Logs</button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
