'use client';

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './alert-dialog';
import { useConfirmStore } from '@/store/useConfirmStore';
import { Button } from './button';

export function GlobalConfirmDialog() {
    const { isOpen, options, close } = useConfirmStore();

    if (!options) return null;

    const handleConfirm = async () => {
        if (options.onConfirm) {
            await options.onConfirm();
        }
        close();
    };

    const handleCancel = () => {
        if (options.onCancel) {
            options.onCancel();
        }
        close();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={close}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{options.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {options.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        {options.cancelText || 'Cancel'}
                    </Button>
                    <Button
                        variant={options.variant || 'default'}
                        onClick={handleConfirm}
                    >
                        {options.confirmText || 'Confirm'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
