import { TransactionTask, Transaction } from '../types';

const TRANSACTIONS_KEY = 'crm_transactions';
const TRANSACTION_TASKS_KEY = 'crm_transaction_tasks';

// ============================================================================
// TRANSACTION MANAGEMENT
// ============================================================================

export function getTransactions(propertyId?: string): Transaction[] {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (!stored) return [];
    
    const transactions = JSON.parse(stored);
    
    if (!Array.isArray(transactions)) {
      console.error('Transactions data is not an array');
      return [];
    }
    
    if (propertyId) {
      return transactions.filter((t: Transaction) => t.propertyId === propertyId);
    }
    
    return transactions;
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
}

export function getTransactionById(transactionId: string): Transaction | null {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (!stored) return null;
    
    const transactions = JSON.parse(stored);
    return transactions.find((t: Transaction) => t.id === transactionId) || null;
  } catch (error) {
    console.error('Error loading transaction:', error);
    return null;
  }
}

export function getActiveTransaction(propertyId: string): Transaction | null {
  const transactions = getTransactions(propertyId);
  return transactions.find(t => t.status === 'active') || null;
}

export function saveTransaction(transaction: Transaction): void {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    const transactions = stored ? JSON.parse(stored) : [];
    
    const existingIndex = transactions.findIndex((t: Transaction) => t.id === transaction.id);
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = transaction;
    } else {
      transactions.push(transaction);
    }
    
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
}

export function deleteTransaction(transactionId: string): void {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (!stored) return;
    
    const transactions = JSON.parse(stored);
    const filtered = transactions.filter((t: Transaction) => t.id !== transactionId);
    
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

// ============================================================================
// TRANSACTION TASKS MANAGEMENT
// ============================================================================

export function getTransactionTasks(propertyId: string): TransactionTask[] {
  try {
    const stored = localStorage.getItem(TRANSACTION_TASKS_KEY);
    if (!stored) return createDefaultTasks(propertyId);
    
    const tasks = JSON.parse(stored);
    
    if (!Array.isArray(tasks)) {
      console.error('Transaction tasks data is not an array');
      return createDefaultTasks(propertyId);
    }
    
    const propertyTasks = tasks.filter((t: TransactionTask) => t.propertyId === propertyId);
    
    // If no tasks exist for this property, create defaults
    if (propertyTasks.length === 0) {
      return createDefaultTasks(propertyId);
    }
    
    // Sort by order
    return propertyTasks.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error loading transaction tasks:', error);
    return createDefaultTasks(propertyId);
  }
}

export function saveTransactionTask(task: TransactionTask): void {
  try {
    const stored = localStorage.getItem(TRANSACTION_TASKS_KEY);
    const tasks = stored ? JSON.parse(stored) : [];
    
    const existingIndex = tasks.findIndex((t: TransactionTask) => t.id === task.id);
    
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }
    
    localStorage.setItem(TRANSACTION_TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving transaction task:', error);
    throw error;
  }
}

export function toggleTaskCompletion(taskId: string, userId: string): void {
  try {
    const stored = localStorage.getItem(TRANSACTION_TASKS_KEY);
    if (!stored) return;
    
    const tasks = JSON.parse(stored);
    const taskIndex = tasks.findIndex((t: TransactionTask) => t.id === taskId);
    
    if (taskIndex >= 0) {
      const task = tasks[taskIndex];
      task.isCompleted = !task.isCompleted;
      task.updatedAt = new Date().toISOString();
      
      if (task.isCompleted) {
        task.completedDate = new Date().toISOString();
        task.completedBy = userId;
        task.status = 'completed';
      } else {
        task.completedDate = undefined;
        task.completedBy = undefined;
        task.status = 'pending';
      }
      
      tasks[taskIndex] = task;
      localStorage.setItem(TRANSACTION_TASKS_KEY, JSON.stringify(tasks));
    }
  } catch (error) {
    console.error('Error toggling task completion:', error);
    throw error;
  }
}

export function updateTaskStatus(taskId: string, status: TransactionTask['status']): void {
  try {
    const stored = localStorage.getItem(TRANSACTION_TASKS_KEY);
    if (!stored) return;
    
    const tasks = JSON.parse(stored);
    const taskIndex = tasks.findIndex((t: TransactionTask) => t.id === taskId);
    
    if (taskIndex >= 0) {
      tasks[taskIndex].status = status;
      tasks[taskIndex].updatedAt = new Date().toISOString();
      localStorage.setItem(TRANSACTION_TASKS_KEY, JSON.stringify(tasks));
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

// ============================================================================
// TASK ANALYTICS
// ============================================================================

export function getTaskProgress(propertyId: string): {
  total: number;
  completed: number;
  percentage: number;
} {
  const tasks = getTransactionTasks(propertyId);
  const completed = tasks.filter(t => t.isCompleted).length;
  
  return {
    total: tasks.length,
    completed,
    percentage: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
  };
}

export function getOverdueTasks(propertyId: string): TransactionTask[] {
  const tasks = getTransactionTasks(propertyId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return tasks.filter(task => {
    if (task.isCompleted) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });
}

// ============================================================================
// DEFAULT TASKS TEMPLATE
// ============================================================================

function createDefaultTasks(propertyId: string): TransactionTask[] {
  // Get property to determine listing type
  const property = getPropertyById(propertyId);
  
  if (!property) {
    console.error('Property not found for task creation:', propertyId);
    return [];
  }
  
  // Create tasks based on listing type
  switch (property.listingType) {
    case 'for-sale':
      return createSaleTasks(propertyId);
    case 'for-rent':
      return createRentTasks(propertyId);
    case 'wanted':
      return createBuyTasks(propertyId);
    default:
      return createSaleTasks(propertyId); // Fallback to sale
  }
}

// ============================================================================
// SALE TRANSACTION TASKS (for-sale properties)
// ============================================================================

function createSaleTasks(propertyId: string): TransactionTask[] {
  const today = new Date();
  const defaultTasks: Omit<TransactionTask, 'id' | 'propertyId' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: 'Receive Biyana (Token Money)',
      description: 'Collect token money from buyer to secure the deal',
      dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'financial',
      order: 1
    },
    {
      title: 'Draft Sale Agreement',
      description: 'Prepare the initial sale agreement document',
      dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 2
    },
    {
      title: 'Title Verification',
      description: 'Verify property title and ownership documents',
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 3
    },
    {
      title: 'Property Inspection',
      description: 'Conduct thorough property inspection with buyer',
      dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'inspection',
      order: 4
    },
    {
      title: 'NOC Verification',
      description: 'Obtain and verify No Objection Certificate',
      dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 5
    },
    {
      title: 'Receive First Installment',
      description: 'Collect first payment installment as per agreement',
      dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'financial',
      order: 6
    },
    {
      title: 'Bank Loan Approval',
      description: 'Ensure buyer\'s bank loan is approved (if applicable)',
      dueDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'financial',
      order: 7
    },
    {
      title: 'Mutation of Property',
      description: 'Complete mutation process at revenue office',
      dueDate: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 8
    },
    {
      title: 'Stamp Duty Payment',
      description: 'Pay stamp duty and registration fees',
      dueDate: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'financial',
      order: 9
    },
    {
      title: 'Registry at Sub-Registrar',
      description: 'Complete property registration at sub-registrar office',
      dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 10
    },
    {
      title: 'Utility Transfer',
      description: 'Transfer electricity, gas, and water connections',
      dueDate: new Date(today.getTime() + 32 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'administrative',
      order: 11
    },
    {
      title: 'Final Payment & Handover',
      description: 'Receive final payment and hand over possession',
      dueDate: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'closing',
      order: 12
    }
  ];

  return saveTasks(propertyId, defaultTasks);
}

// ============================================================================
// RENT TRANSACTION TASKS (for-rent properties)
// ============================================================================

function createRentTasks(propertyId: string): TransactionTask[] {
  const today = new Date();
  const defaultTasks: Omit<TransactionTask, 'id' | 'propertyId' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: 'Tenant Application Received',
      description: 'Collect and review tenant rental application',
      dueDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'administrative',
      order: 1
    },
    {
      title: 'Tenant Screening & Verification',
      description: 'Verify tenant identity, employment, and references',
      dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 2
    },
    {
      title: 'Credit & Background Check',
      description: 'Perform credit check and verify rental history',
      dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 3
    },
    {
      title: 'Property Viewing with Tenant',
      description: 'Conduct property showing and answer tenant questions',
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'inspection',
      order: 4
    },
    {
      title: 'Draft Rental Agreement',
      description: 'Prepare comprehensive rental/lease agreement',
      dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 5
    },
    {
      title: 'Collect Security Deposit',
      description: 'Receive security deposit (usually 1-2 months rent)',
      dueDate: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'financial',
      order: 6
    },
    {
      title: 'Receive First Month Rent',
      description: 'Collect first month\'s rental payment',
      dueDate: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'financial',
      order: 7
    },
    {
      title: 'Sign Rental Agreement',
      description: 'Execute rental agreement with landlord and tenant signatures',
      dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 8
    },
    {
      title: 'Register Rental Agreement',
      description: 'Register lease agreement with local authorities (if required)',
      dueDate: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 9
    },
    {
      title: 'Move-In Inspection',
      description: 'Document property condition with photos and checklist',
      dueDate: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'inspection',
      order: 10
    },
    {
      title: 'Utility Account Transfer',
      description: 'Transfer or set up utility accounts in tenant name',
      dueDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'administrative',
      order: 11
    },
    {
      title: 'Key Handover',
      description: 'Provide keys and possession to tenant',
      dueDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'closing',
      order: 12
    }
  ];

  return saveTasks(propertyId, defaultTasks);
}

// ============================================================================
// BUY TRANSACTION TASKS (wanted/buy properties - agency purchasing)
// ============================================================================

function createBuyTasks(propertyId: string): TransactionTask[] {
  const today = new Date();
  const defaultTasks: Omit<TransactionTask, 'id' | 'propertyId' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: 'Property Sourcing & Identification',
      description: 'Identify suitable property matching buyer requirements',
      dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'inspection',
      order: 1
    },
    {
      title: 'Initial Property Evaluation',
      description: 'Conduct preliminary assessment of property value and condition',
      dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'inspection',
      order: 2
    },
    {
      title: 'Market Comparison Analysis',
      description: 'Compare property price with similar properties in area',
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'administrative',
      order: 3
    },
    {
      title: 'Title Verification & Due Diligence',
      description: 'Verify property ownership, title clearance, and legal status',
      dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 4
    },
    {
      title: 'Property Inspection Report',
      description: 'Hire inspector for detailed structural and systems evaluation',
      dueDate: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'inspection',
      order: 5
    },
    {
      title: 'Submit Purchase Offer',
      description: 'Negotiate and submit formal purchase offer to seller',
      dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 6
    },
    {
      title: 'Pay Token/Earnest Money',
      description: 'Submit token amount to secure the property purchase',
      dueDate: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'financial',
      order: 7
    },
    {
      title: 'Sign Purchase Agreement',
      description: 'Execute formal sale purchase agreement with seller',
      dueDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 8
    },
    {
      title: 'Arrange Financing',
      description: 'Secure financing/loan approval (if required)',
      dueDate: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'financial',
      order: 9
    },
    {
      title: 'Make Down Payment',
      description: 'Transfer agreed down payment amount to seller',
      dueDate: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'financial',
      order: 10
    },
    {
      title: 'Complete Registry & Transfer',
      description: 'Execute property registry and ownership transfer at sub-registrar',
      dueDate: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'legal',
      order: 11
    },
    {
      title: 'Take Possession',
      description: 'Receive keys and take physical possession of property',
      dueDate: new Date(today.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isCompleted: false,
      category: 'closing',
      order: 12
    }
  ];

  return saveTasks(propertyId, defaultTasks);
}

// ============================================================================
// HELPER FUNCTION TO SAVE TASKS
// ============================================================================

function saveTasks(
  propertyId: string, 
  taskTemplates: Omit<TransactionTask, 'id' | 'propertyId' | 'createdAt' | 'updatedAt'>[]
): TransactionTask[] {
  const tasks: TransactionTask[] = taskTemplates.map((task, index) => ({
    ...task,
    id: `task-${propertyId}-${index + 1}-${Date.now()}`,
    propertyId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  // Save the default tasks
  try {
    const stored = localStorage.getItem(TRANSACTION_TASKS_KEY);
    const allTasks = stored ? JSON.parse(stored) : [];
    allTasks.push(...tasks);
    localStorage.setItem(TRANSACTION_TASKS_KEY, JSON.stringify(allTasks));
  } catch (error) {
    console.error('Error saving default tasks:', error);
  }

  return tasks;
}

// ============================================================================
// HELPER TO GET PROPERTY DATA
// ============================================================================

function getPropertyById(propertyId: string): any {
  try {
    const stored = localStorage.getItem('estate_properties');
    if (!stored) return null;
    
    const properties = JSON.parse(stored);
    return properties.find((p: any) => p.id === propertyId) || null;
  } catch (error) {
    console.error('Error loading property:', error);
    return null;
  }
}