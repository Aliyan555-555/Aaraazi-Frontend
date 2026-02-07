import { User } from "../types";

const USERS_KEY = "estate_users";
const CURRENT_USER_KEY = "current_user";

// Mock users for demonstration - matches LoginForm demo accounts
const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@agency.com",
    name: "Sarah Johnson",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    id: "2",
    email: "agent1@agency.com",
    name: "Mike Chen",
    role: "agent",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
  },
  {
    id: "3",
    email: "agent2@agency.com",
    name: "Emily Rodriguez",
    role: "agent",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
  },
];

// Track if users initialization has already been done
let isUsersInitialized = false;

export const initializeUsers = () => {
  // Skip if already initialized in this session
  if (isUsersInitialized) {
    return;
  }

  try {
    // Force reset users to match LoginForm demo accounts
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
    console.log("Users initialized with updated demo accounts");
  } catch (error) {
    console.error("Error initializing users, resetting to defaults:", error);
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  } finally {
    // Mark as initialized
    isUsersInitialized = true;
  }
};

export const login = (email: string, password: string): User | null => {
  try {
    // Input validation
    if (!email || !password) {
      return null;
    }

    initializeUsers();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const user = users.find((u: User) => u.email === email);

    // For demo purposes, accept any password. In production, use proper authentication
    if (user && password.length > 0) {
      // Validate user object structure
      if (!user.id || !user.name || !user.role) {
        console.error("Invalid user data structure");
        return null;
      }
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  } catch (error) {
    console.error("Error during login:", error);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    // Validate user object structure
    if (!user.id || !user.name || !user.role || !user.email) {
      console.error("Invalid current user data, clearing session");
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    return user;
  } catch (error) {
    console.error("Error parsing current user data:", error);
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
};

export const getAllAgents = (): User[] => {
  try {
    initializeUsers();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return users.filter((u: User) => u && u.role === "agent");
  } catch (error) {
    console.error("Error getting agents:", error);
    return [];
  }
};

export const getUserById = (id: string): User | null => {
  try {
    initializeUsers();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return users.find((u: User) => u && u.id === id) || null;
  } catch (error) {
    console.error("Error getting user by id:", error);
    return null;
  }
};
