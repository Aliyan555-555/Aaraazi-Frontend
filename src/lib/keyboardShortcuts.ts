/**
 * Keyboard Shortcuts System
 * Global hotkey management for improved productivity
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'forms' | 'general';
  enabled?: boolean;
}

export interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

// ============================================================================
// KEYBOARD SHORTCUT MANAGER
// ============================================================================

class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private enabled: boolean = true;
  private activeInputs: Set<string> = new Set(['input', 'textarea', 'select']);

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, { ...shortcut, enabled: shortcut.enabled !== false });
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(shortcut: Partial<KeyboardShortcut>): void {
    const key = this.getShortcutKey(shortcut as KeyboardShortcut);
    this.shortcuts.delete(key);
  }

  /**
   * Handle keyboard event
   */
  handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) return;

    // Don't trigger shortcuts when typing in inputs (unless explicitly allowed)
    const target = event.target as HTMLElement;
    const isInput = this.activeInputs.has(target.tagName.toLowerCase());
    const isContentEditable = target.isContentEditable;

    if (isInput || isContentEditable) {
      // Only allow certain shortcuts in inputs (like Ctrl+S for save)
      if (!event.ctrlKey && !event.metaKey) return;
    }

    const key = this.getEventKey(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut && shortcut.enabled !== false) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
    }
  };

  /**
   * Enable/disable all shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Enable/disable specific shortcut
   */
  setShortcutEnabled(shortcut: Partial<KeyboardShortcut>, enabled: boolean): void {
    const key = this.getShortcutKey(shortcut as KeyboardShortcut);
    const existing = this.shortcuts.get(key);
    if (existing) {
      existing.enabled = enabled;
    }
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): ShortcutCategory[] {
    const categories: { [key: string]: KeyboardShortcut[] } = {
      navigation: [],
      actions: [],
      forms: [],
      general: []
    };

    this.shortcuts.forEach(shortcut => {
      categories[shortcut.category].push(shortcut);
    });

    return [
      { name: 'Navigation', shortcuts: categories.navigation },
      { name: 'Actions', shortcuts: categories.actions },
      { name: 'Forms', shortcuts: categories.forms },
      { name: 'General', shortcuts: categories.general }
    ].filter(cat => cat.shortcuts.length > 0);
  }

  /**
   * Get shortcut key string
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.meta) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Get key string from keyboard event
   */
  private getEventKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Initialize keyboard listener
   */
  init(): void {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Cleanup keyboard listener
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.shortcuts.clear();
  }
}

// Singleton instance
export const shortcutManager = new KeyboardShortcutManager();

// ============================================================================
// PREDEFINED SHORTCUTS
// ============================================================================

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  // Use platform-specific modifier
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  
  // Capitalize key
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
}

/**
 * Check if shortcut is valid
 */
export function isValidShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    !!event.ctrlKey === !!shortcut.ctrl &&
    !!event.shiftKey === !!shortcut.shift &&
    !!event.altKey === !!shortcut.alt &&
    !!event.metaKey === !!shortcut.meta
  );
}

// ============================================================================
// REACT HOOK
// ============================================================================

/**
 * Hook for using keyboard shortcuts in React components
 */
export function useKeyboardShortcut(shortcut: KeyboardShortcut) {
  const register = () => {
    shortcutManager.register(shortcut);
  };

  const unregister = () => {
    shortcutManager.unregister(shortcut);
  };

  return { register, unregister };
}

/**
 * Hook for component-specific shortcuts (auto cleanup)
 */
export function useComponentShortcuts(shortcuts: KeyboardShortcut[]) {
  const registerAll = () => {
    shortcuts.forEach(shortcut => shortcutManager.register(shortcut));
  };

  const unregisterAll = () => {
    shortcuts.forEach(shortcut => shortcutManager.unregister(shortcut));
  };

  return { registerAll, unregisterAll };
}

// ============================================================================
// DEFAULT SHORTCUTS CONFIGURATION
// ============================================================================

export const DEFAULT_SHORTCUTS = {
  // Navigation
  GOTO_DASHBOARD: {
    key: 'd',
    ctrl: true,
    description: 'Go to Dashboard',
    category: 'navigation' as const
  },
  GOTO_PROPERTIES: {
    key: 'p',
    ctrl: true,
    description: 'Go to Properties',
    category: 'navigation' as const
  },
  GOTO_LEADS: {
    key: 'l',
    ctrl: true,
    description: 'Go to Leads',
    category: 'navigation' as const
  },
  GOTO_CRM: {
    key: 'c',
    ctrl: true,
    description: 'Go to CRM',
    category: 'navigation' as const
  },
  GOTO_ANALYTICS: {
    key: 'a',
    ctrl: true,
    description: 'Go to Analytics',
    category: 'navigation' as const
  },

  // Actions
  NEW_PROPERTY: {
    key: 'n',
    ctrl: true,
    shift: true,
    description: 'New Property',
    category: 'actions' as const
  },
  NEW_LEAD: {
    key: 'l',
    ctrl: true,
    shift: true,
    description: 'New Lead',
    category: 'actions' as const
  },
  NEW_CONTACT: {
    key: 'c',
    ctrl: true,
    shift: true,
    description: 'New Contact',
    category: 'actions' as const
  },
  SEARCH: {
    key: 'k',
    ctrl: true,
    description: 'Open Search',
    category: 'actions' as const
  },
  REFRESH: {
    key: 'r',
    ctrl: true,
    shift: true,
    description: 'Refresh Data',
    category: 'actions' as const
  },

  // Forms
  SAVE: {
    key: 's',
    ctrl: true,
    description: 'Save',
    category: 'forms' as const
  },
  CANCEL: {
    key: 'Escape',
    description: 'Cancel/Close',
    category: 'forms' as const
  },

  // General
  HELP: {
    key: '?',
    shift: true,
    description: 'Show Keyboard Shortcuts',
    category: 'general' as const
  },
  TOGGLE_SIDEBAR: {
    key: 'b',
    ctrl: true,
    description: 'Toggle Sidebar',
    category: 'general' as const
  }
};
