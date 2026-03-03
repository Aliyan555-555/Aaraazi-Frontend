/**
 * contacts/index.ts — Public barrel for the Contacts feature module.
 *
 * Import from here instead of individual file paths.
 * This makes refactoring safe: internal file moves only need to update this file.
 *
 * @example
 *   import { ContactDetails, ContactsWorkspace } from '@/components/contacts';
 */

// ── List page ─────────────────────────────────────────────────────────────────
export { ContactsWorkspace } from "./ContactsWorkspace";
export type { ContactsWorkspaceProps } from "./ContactsWorkspace";

// ── Detail page ───────────────────────────────────────────────────────────────
export { ContactDetails } from "./ContactDetails";
export type { ContactDetailsProps } from "./ContactDetails";

// ── Sub-components ────────────────────────────────────────────────────────────
export { ContactTaskList } from "./ContactTaskList";
export { InteractionForm } from "./InteractionForm";
export { TaskForm } from "./TaskForm";

// ── Schemas ───────────────────────────────────────────────────────────────────
export {
  InteractionFormSchema,
  interactionFormDefaultValues,
} from "./interaction-form.schema";
export type { InteractionFormValues } from "./interaction-form.schema";

export {
  TaskFormSchema,
  taskFormDefaultValues,
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
} from "./task-form.schema";
export type { TaskFormValues } from "./task-form.schema";

// ── Mappers ───────────────────────────────────────────────────────────────────
export { mapApiContactToUIContact } from "./mappers/contact.mappers";
export type { UIContact } from "./mappers/contact.mappers";
