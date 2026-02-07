/**
 * Dashboard Data Access Layer
 * 
 * Provides data access functions specifically for the dashboard.
 * These are stub implementations that return empty arrays for now.
 * 
 * TODO: Implement proper CRM task and interaction storage
 */

// Stub type definitions (until we have proper CRM types)
export interface CRMTask {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  dueDate: Date | string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface CRMInteraction {
  id: string;
  contactId: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  date: Date | string;
  notes?: string;
  createdBy: string;
  createdAt: Date | string;
}

/**
 * Get all CRM tasks
 * 
 * @param userId - Optional user ID for filtering
 * @param userRole - User role (admin or agent)
 * @returns Array of CRM tasks
 */
export function getAllTasks(userId?: string, userRole?: string): CRMTask[] {
  try {
    const tasksJson = localStorage.getItem('crm_tasks');
    if (!tasksJson) return [];
    
    const allTasks: CRMTask[] = JSON.parse(tasksJson);
    
    // Filter by user role
    if (userRole === 'agent' && userId) {
      return allTasks.filter(task => task.assignedTo === userId);
    }
    
    // Admins see all
    return allTasks;
  } catch (error) {
    console.error('Error loading CRM tasks:', error);
    return [];
  }
}

/**
 * Get all CRM interactions
 * 
 * @param userId - Optional user ID for filtering
 * @param userRole - User role (admin or agent)
 * @returns Array of CRM interactions
 */
export function getAllInteractions(userId?: string, userRole?: string): CRMInteraction[] {
  try {
    const interactionsJson = localStorage.getItem('crm_interactions');
    if (!interactionsJson) return [];
    
    const allInteractions: CRMInteraction[] = JSON.parse(interactionsJson);
    
    // Filter by user role
    if (userRole === 'agent' && userId) {
      return allInteractions.filter(interaction => interaction.createdBy === userId);
    }
    
    // Admins see all
    return allInteractions;
  } catch (error) {
    console.error('Error loading CRM interactions:', error);
    return [];
  }
}

/**
 * Create a CRM task
 */
export function createTask(task: Omit<CRMTask, 'id' | 'createdAt'>): CRMTask {
  try {
    const newTask: CRMTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    const tasks = getAllTasks();
    tasks.push(newTask);
    localStorage.setItem('crm_tasks', JSON.stringify(tasks));
    
    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

/**
 * Create a CRM interaction
 */
export function createInteraction(interaction: Omit<CRMInteraction, 'id' | 'createdAt'>): CRMInteraction {
  try {
    const newInteraction: CRMInteraction = {
      ...interaction,
      id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    const interactions = getAllInteractions();
    interactions.push(newInteraction);
    localStorage.setItem('crm_interactions', JSON.stringify(interactions));
    
    return newInteraction;
  } catch (error) {
    console.error('Error creating interaction:', error);
    throw error;
  }
}
