import { Property } from "../types/properties";
import { Contact } from "../types/contacts";
import {
  JournalEntry,
  Expense,
  Lead,
  CRMTask,
  CRMInteraction,
  PropertyPayment,
} from "../types";
import { City, Area, Block, Building } from "../types/locations";

// Constants
const PROPERTIES_KEY = "aaraazi_properties_v4";
const CONTACTS_KEY = "aaraazi_contacts_v4";
const LEADS_KEY = "aaraazi_leads_v4";
const JOURNAL_ENTRIES_KEY = "journal_entries";
const EXPENSES_KEY = "expenses";

// Helper to get from storage
const getFromStorage = <T>(key: string, defaultVal: T): T => {
  if (typeof window === "undefined") return defaultVal;
  const stored = localStorage.getItem(key);
  if (!stored) return defaultVal;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultVal;
  }
};

const saveToStorage = (key: string, data: any) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
};

// ================= PROPERTIES =================

const TASKS_KEY = "crm_tasks";
const INTERACTIONS_KEY = "crm_interactions";

// ================= PROPERTIES =================

export const getProperties = (userId?: string, role?: string): Property[] => {
  const properties = getFromStorage<Property[]>(PROPERTIES_KEY, []);
  if (role === "admin") return properties;
  if (userId) return properties.filter((p) => p.agentId === userId);
  return properties;
};

export const getPropertyById = (id: string): Property | undefined => {
  const properties = getProperties();
  return properties.find((p) => p.id === id);
};

export const addProperty = (
  property: Omit<Property, "id" | "createdAt" | "updatedAt">,
): Property => {
  const properties = getProperties();
  const newProperty: Property = {
    ...property,
    id: `prop_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Property;

  properties.push(newProperty);
  saveToStorage(PROPERTIES_KEY, properties);
  window.dispatchEvent(
    new CustomEvent("propertyAdded", { detail: newProperty }),
  );
  return newProperty;
};

export const updateProperty = (
  id: string,
  updates: Partial<Property>,
): Property | null => {
  const properties = getProperties();
  const index = properties.findIndex((p) => p.id === id);
  if (index !== -1) {
    properties[index] = {
      ...properties[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(PROPERTIES_KEY, properties);
    window.dispatchEvent(
      new CustomEvent("propertyUpdated", { detail: properties[index] }),
    );
    return properties[index] || null;
  }
  return null;
};

export const deleteProperty = (id: string): void => {
  const properties = getProperties();
  const filtered = properties.filter((p) => p.id !== id);
  saveToStorage(PROPERTIES_KEY, filtered);
  window.dispatchEvent(new CustomEvent("propertyDeleted", { detail: id }));
};

// ================= CONTACTS =================

export const getContacts = (userId?: string, role?: string): Contact[] => {
  return getFromStorage<Contact[]>(CONTACTS_KEY, []);
};

export const getContactById = (id: string): Contact | undefined => {
  const contacts = getContacts();
  return contacts.find((c) => c.id === id);
};

/** Input for adding a contact - id, createdBy, createdAt, updatedAt are auto-generated if omitted */
export const addContact = (
  contact: Omit<Contact, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> &
    Partial<Pick<Contact, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
): Contact => {
  const contacts = getContacts();
  const now = new Date().toISOString();
  const newContact: Contact = {
    ...contact,
    id: contact.id ?? `contact_${Date.now()}`,
    createdBy: contact.createdBy ?? contact.agentId ?? 'system',
    createdAt: contact.createdAt ?? now,
    updatedAt: contact.updatedAt ?? now,
  } as Contact;
  contacts.push(newContact);
  saveToStorage(CONTACTS_KEY, contacts);
  window.dispatchEvent?.(new CustomEvent('contactAdded', { detail: newContact }));
  return newContact;
};

export const updateContact = (id: string, updates: Partial<Contact>): void => {
  const contacts = getContacts();
  const index = contacts.findIndex((c) => c.id === id);
  if (index !== -1) {
    contacts[index] = { ...contacts[index], ...updates };
    saveToStorage(CONTACTS_KEY, contacts);
  }
};

export const deleteContact = (id: string): void => {
  const contacts = getContacts();
  const filtered = contacts.filter((c) => c.id !== id);
  saveToStorage(CONTACTS_KEY, filtered);
};

// ================= LEADS =================

export const getLeads = (userId?: string, role?: string): Lead[] => {
  return getFromStorage<Lead[]>(LEADS_KEY, []);
};

export const getLeadById = (id: string): Lead | undefined => {
  const leads = getLeads();
  return leads.find((l) => l.id === id);
};

// ================= ACCOUNTING & FINANCIALS =================

export const getJournalEntries = (
  userId?: string,
  role?: string,
): JournalEntry[] => {
  return getFromStorage<JournalEntry[]>(JOURNAL_ENTRIES_KEY, []);
};

export const getExpenses = (userId?: string, role?: string): Expense[] => {
  return getFromStorage<Expense[]>(EXPENSES_KEY, []);
};

export const addExpense = (expense: Expense): void => {
  const expenses = getExpenses();
  expenses.push(expense);
  saveToStorage(EXPENSES_KEY, expenses);
};

export const updateExpense = (id: string, updates: Partial<Expense>): void => {
  const expenses = getExpenses();
  const index = expenses.findIndex((e) => e.id === id);
  if (index !== -1) {
    expenses[index] = { ...expenses[index], ...updates };
    saveToStorage(EXPENSES_KEY, expenses);
  }
};

export const deleteExpense = (id: string): void => {
  const expenses = getExpenses();
  const filtered = expenses.filter((e) => e.id !== id);
  saveToStorage(EXPENSES_KEY, filtered);
};

export const getCommissions = (userId?: string, role?: string): any[] => {
  // Mocking commissions for now
  return [];
};

export const getAccountPayments = (userId?: string, role?: string): any[] => {
  return [];
};

// ================= CRM =================

export const getAllTasks = (userId?: string, role?: string): CRMTask[] => {
  const tasks = getFromStorage<CRMTask[]>(TASKS_KEY, []);
  if (role === "admin") return tasks;
  if (userId) return tasks.filter((t) => t.agentId === userId);
  return tasks;
};

export const getAllInteractions = (
  userId?: string,
  role?: string,
): CRMInteraction[] => {
  const interactions = getFromStorage<CRMInteraction[]>(INTERACTIONS_KEY, []);
  if (role === "admin") return interactions;
  if (userId) return interactions.filter((i) => i.agentId === userId);
  return interactions;
};

export const getContactInteractions = (contactId: string): CRMInteraction[] => {
  return getFromStorage<CRMInteraction[]>(INTERACTIONS_KEY, []).filter(
    (i) => i.contactId === contactId,
  );
};

export const getContactTasks = (contactId: string): CRMTask[] => {
  return getFromStorage<CRMTask[]>(TASKS_KEY, []).filter(
    (t) => t.contactId === contactId,
  );
};

export const deleteInteraction = (id: string): void => {
  const interactions = getFromStorage<CRMInteraction[]>(INTERACTIONS_KEY, []);
  const filtered = interactions.filter((i) => i.id !== id);
  saveToStorage(INTERACTIONS_KEY, filtered);
};

export const deleteTask = (id: string): void => {
  const tasks = getFromStorage<CRMTask[]>(TASKS_KEY, []);
  const filtered = tasks.filter((t) => t.id !== id);
  saveToStorage(TASKS_KEY, filtered);
};

export const updateTask = (
  id: string,
  updates: Partial<CRMTask>,
): CRMTask | undefined => {
  const tasks = getFromStorage<CRMTask[]>(TASKS_KEY, []);
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return undefined;
  tasks[index] = { ...tasks[index], ...updates };
  saveToStorage(TASKS_KEY, tasks);
  return tasks[index];
};

// ================= INITIALIZATION =================

export const initializeData = (): void => {
  if (typeof window === "undefined") return;

  // Seed initial data if empty
  const cities = getCities();
  if (cities.length === 0) {
    saveToStorage(CITIES_KEY, MOCK_CITIES);
  }
  const areas = getAreas();
  if (areas.length === 0) {
    saveToStorage(AREAS_KEY, MOCK_AREAS);
  }
};

// ================= LOCATIONS =================

const CITIES_KEY = "aaraazi_cities_v4";
const AREAS_KEY = "aaraazi_areas_v4";
const BLOCKS_KEY = "aaraazi_blocks_v4";
const BUILDINGS_KEY = "aaraazi_buildings_v4";

const MOCK_CITIES: City[] = [
  {
    id: "city_karachi",
    name: "Karachi",
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
  {
    id: "city_lahore",
    name: "Lahore",
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
];

const MOCK_AREAS: Area[] = [
  {
    id: "area_dha_karachi",
    cityId: "city_karachi",
    name: "DHA Karachi",
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
  {
    id: "area_bahria_town",
    cityId: "city_karachi",
    name: "Bahria Town",
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
];

// --- CITIES ---
export const getCities = (): City[] => getFromStorage<City[]>(CITIES_KEY, []);
export const getActiveCities = (): City[] =>
  getCities().filter((c) => c.isActive);
export const getCityById = (id: string): City | undefined =>
  getCities().find((c) => c.id === id);
export const addCity = (city: Omit<City, "id" | "createdAt">) => {
  const list = getCities();
  const newCity: City = {
    ...city,
    id: `city_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  list.push(newCity);
  saveToStorage(CITIES_KEY, list);
};
export const updateCity = (id: string, updates: Partial<City>) => {
  const list = getCities();
  const index = list.findIndex((c) => c.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updates };
    saveToStorage(CITIES_KEY, list);
  }
};
export const deleteCity = (id: string) => {
  const list = getCities();
  saveToStorage(
    CITIES_KEY,
    list.filter((c) => c.id !== id),
  );
};
export const toggleCityStatus = (id: string) => {
  const list = getCities();
  const index = list.findIndex((c) => c.id === id);
  if (index !== -1) {
    list[index].isActive = !list[index].isActive;
    saveToStorage(CITIES_KEY, list);
    return list[index];
  }
  return null;
};

// --- AREAS ---
export const getAreas = (): Area[] => getFromStorage<Area[]>(AREAS_KEY, []);
export const getActiveAreasByCity = (cityId: string): Area[] =>
  getAreas().filter((a) => a.cityId === cityId && a.isActive);
export const getAreaById = (id: string): Area | undefined =>
  getAreas().find((a) => a.id === id);
export const addArea = (area: Omit<Area, "id" | "createdAt">) => {
  const list = getAreas();
  const newArea: Area = {
    ...area,
    id: `area_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  list.push(newArea);
  saveToStorage(AREAS_KEY, list);
};
export const updateArea = (id: string, updates: Partial<Area>) => {
  const list = getAreas();
  const index = list.findIndex((c) => c.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updates };
    saveToStorage(AREAS_KEY, list);
  }
};
export const deleteArea = (id: string) => {
  const list = getAreas();
  saveToStorage(
    AREAS_KEY,
    list.filter((c) => c.id !== id),
  );
};
export const toggleAreaStatus = (id: string) => {
  const list = getAreas();
  const index = list.findIndex((c) => c.id === id);
  if (index !== -1) {
    list[index].isActive = !list[index].isActive;
    saveToStorage(AREAS_KEY, list);
    return list[index];
  }
  return null;
};

// --- BLOCKS ---
export const getBlocks = (): Block[] => getFromStorage<Block[]>(BLOCKS_KEY, []);
export const getActiveBlocksByArea = (areaId: string): Block[] =>
  getBlocks().filter((b) => b.areaId === areaId && b.isActive);
export const getBlockById = (id: string): Block | undefined =>
  getBlocks().find((b) => b.id === id);
export const addBlock = (block: Omit<Block, "id" | "createdAt">) => {
  const list = getBlocks();
  const newBlock: Block = {
    ...block,
    id: `block_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  list.push(newBlock);
  saveToStorage(BLOCKS_KEY, list);
};
export const updateBlock = (id: string, updates: Partial<Block>) => {
  const list = getBlocks();
  const index = list.findIndex((c) => c.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updates };
    saveToStorage(BLOCKS_KEY, list);
  }
};
export const deleteBlock = (id: string) => {
  const list = getBlocks();
  saveToStorage(
    BLOCKS_KEY,
    list.filter((c) => c.id !== id),
  );
};
export const toggleBlockStatus = (id: string) => {
  const list = getBlocks();
  const index = list.findIndex((c) => c.id === id);
  if (index !== -1) {
    list[index].isActive = !list[index].isActive;
    saveToStorage(BLOCKS_KEY, list);
    return list[index];
  }
  return null;
};

// --- BUILDINGS ---
export const getBuildings = (): Building[] =>
  getFromStorage<Building[]>(BUILDINGS_KEY, []);
export const getActiveBuildingsByArea = (
  areaId: string,
  blockId?: string,
): Building[] => {
  return getBuildings().filter(
    (b) =>
      b.areaId === areaId &&
      (blockId ? b.blockId === blockId : true) &&
      b.isActive,
  );
};
export const getBuildingById = (id: string): Building | undefined =>
  getBuildings().find((b) => b.id === id);
export const addBuilding = (building: Omit<Building, "id" | "createdAt">) => {
  const list = getBuildings();
  const newBuilding: Building = {
    ...building,
    id: `bldg_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  list.push(newBuilding);
  saveToStorage(BUILDINGS_KEY, list);
};
export const updateBuilding = (id: string, updates: Partial<Building>) => {
  const list = getBuildings();
  const index = list.findIndex((c) => c.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updates };
    saveToStorage(BUILDINGS_KEY, list);
  }
};
export const deleteBuilding = (id: string) => {
  const list = getBuildings();
  saveToStorage(
    BUILDINGS_KEY,
    list.filter((c) => c.id !== id),
  );
};
export const toggleBuildingStatus = (id: string) => {
  const list = getBuildings();
  const index = list.findIndex((c) => c.id === id);
  if (index !== -1) {
    list[index].isActive = !list[index].isActive;
    saveToStorage(BUILDINGS_KEY, list);
    return list[index];
  }
  return null;
};

// ================= PROPERTY PAYMENTS =================

const PROPERTY_PAYMENTS_KEY = "aaraazi_property_payments_v4";

export const getPropertyPayments = (propertyId: string): PropertyPayment[] => {
  if (typeof window === "undefined") return [];
  const allPayments = getFromStorage<PropertyPayment[]>(
    PROPERTY_PAYMENTS_KEY,
    [],
  );
  return allPayments.filter((p) => p.propertyId === propertyId);
};

export const addPropertyPayment = async (
  input: Omit<PropertyPayment, "id" | "createdAt" | "updatedAt">,
): Promise<PropertyPayment> => {
  if (typeof window === "undefined") throw new Error("Cannot run on server");
  const allPayments = getFromStorage<PropertyPayment[]>(
    PROPERTY_PAYMENTS_KEY,
    [],
  );

  const newPayment: PropertyPayment = {
    ...input,
    id: `pay_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  allPayments.push(newPayment);
  saveToStorage(PROPERTY_PAYMENTS_KEY, allPayments);

  return newPayment;
};

export const updatePropertyPaymentSummary = (propertyId: string): void => {
  if (typeof window === "undefined") return;
  const payments = getPropertyPayments(propertyId);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  window.dispatchEvent(
    new CustomEvent("propertyPaymentUpdated", {
      detail: { propertyId, totalPaid },
    }),
  );
};
