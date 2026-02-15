import { create } from "zustand";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmStore {
  isOpen: boolean;
  options: ConfirmOptions | null;
  ask: (options: ConfirmOptions) => void;
  close: () => void;
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  isOpen: false,
  options: null,
  ask: (options) => set({ isOpen: true, options }),
  close: () => set({ isOpen: false, options: null }),
}));
