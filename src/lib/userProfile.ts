/**
 * User Profile Management Service
 * Handles user profile data, preferences, and metadata
 */

import type { User } from '../types';

const PROFILE_STORAGE_KEY = 'estatemanager_user_profiles';

export interface UserProfile {
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    alternatePhone?: string;
    dateOfBirth?: string;
    cnic?: string; // Pakistani National ID
  };
  professionalInfo: {
    designation?: string;
    department?: string;
    employeeId?: string;
    joiningDate?: string;
    licenseNumber?: string; // For real estate agents
    specialization?: string[];
    experience?: number; // Years of experience
  };
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  preferences: {
    language: 'en' | 'ur'; // English or Urdu
    timezone: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    currency: 'PKR';
    measurementUnit: 'sqft' | 'sqm' | 'marla' | 'kanal';
  };
  avatar?: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  bankDetails?: {
    accountTitle?: string;
    accountNumber?: string;
    bankName?: string;
    branchCode?: string;
    iban?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
    profileCompleteness: number; // Percentage
  };
}

// Initialize profiles storage
export const initializeProfiles = (): void => {
  if (!localStorage.getItem(PROFILE_STORAGE_KEY)) {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify([]));
  }
};

// Get all profiles
export const getAllProfiles = (): UserProfile[] => {
  const profiles = localStorage.getItem(PROFILE_STORAGE_KEY);
  return profiles ? JSON.parse(profiles) : [];
};

// Save profiles
const saveProfiles = (profiles: UserProfile[]): void => {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
};

// Get profile by user ID
export const getUserProfile = (userId: string): UserProfile | null => {
  const profiles = getAllProfiles();
  return profiles.find(p => p.userId === userId) || null;
};

// Calculate profile completeness
const calculateProfileCompleteness = (profile: UserProfile): number => {
  let completed = 0;
  let total = 0;

  // Personal Info (30 points)
  total += 30;
  if (profile.personalInfo.firstName) completed += 5;
  if (profile.personalInfo.lastName) completed += 5;
  if (profile.personalInfo.email) completed += 5;
  if (profile.personalInfo.phone) completed += 5;
  if (profile.personalInfo.dateOfBirth) completed += 5;
  if (profile.personalInfo.cnic) completed += 5;

  // Professional Info (25 points)
  total += 25;
  if (profile.professionalInfo.designation) completed += 5;
  if (profile.professionalInfo.department) completed += 5;
  if (profile.professionalInfo.licenseNumber) completed += 5;
  if (profile.professionalInfo.specialization?.length) completed += 5;
  if (profile.professionalInfo.experience) completed += 5;

  // Address (15 points)
  total += 15;
  if (profile.address.street) completed += 3;
  if (profile.address.city) completed += 3;
  if (profile.address.state) completed += 3;
  if (profile.address.country) completed += 3;
  if (profile.address.postalCode) completed += 3;

  // Avatar & Bio (10 points)
  total += 10;
  if (profile.avatar) completed += 5;
  if (profile.bio) completed += 5;

  // Bank Details (10 points)
  total += 10;
  if (profile.bankDetails?.accountNumber) completed += 5;
  if (profile.bankDetails?.iban) completed += 5;

  // Emergency Contact (10 points)
  total += 10;
  if (profile.emergencyContact?.name) completed += 5;
  if (profile.emergencyContact?.phone) completed += 5;

  return Math.round((completed / total) * 100);
};

// Create or update profile
export const saveUserProfile = (profile: Partial<UserProfile> & { userId: string }): UserProfile => {
  const profiles = getAllProfiles();
  const existingIndex = profiles.findIndex(p => p.userId === profile.userId);

  const now = new Date().toISOString();
  
  let updatedProfile: UserProfile;

  if (existingIndex >= 0) {
    // Update existing profile
    updatedProfile = {
      ...profiles[existingIndex],
      ...profile,
      personalInfo: {
        ...profiles[existingIndex].personalInfo,
        ...profile.personalInfo,
      },
      professionalInfo: {
        ...profiles[existingIndex].professionalInfo,
        ...profile.professionalInfo,
      },
      address: {
        ...profiles[existingIndex].address,
        ...profile.address,
      },
      preferences: {
        ...profiles[existingIndex].preferences,
        ...profile.preferences,
      },
      socialLinks: {
        ...profiles[existingIndex].socialLinks,
        ...profile.socialLinks,
      },
      bankDetails: {
        ...profiles[existingIndex].bankDetails,
        ...profile.bankDetails,
      },
      emergencyContact: {
        ...profiles[existingIndex].emergencyContact,
        ...profile.emergencyContact,
      },
      metadata: {
        ...profiles[existingIndex].metadata,
        updatedAt: now,
      },
    };
    
    // Recalculate completeness
    updatedProfile.metadata.profileCompleteness = calculateProfileCompleteness(updatedProfile);
    
    profiles[existingIndex] = updatedProfile;
  } else {
    // Create new profile
    updatedProfile = {
      userId: profile.userId,
      personalInfo: {
        firstName: profile.personalInfo?.firstName || '',
        lastName: profile.personalInfo?.lastName || '',
        email: profile.personalInfo?.email || '',
        phone: profile.personalInfo?.phone,
        alternatePhone: profile.personalInfo?.alternatePhone,
        dateOfBirth: profile.personalInfo?.dateOfBirth,
        cnic: profile.personalInfo?.cnic,
      },
      professionalInfo: {
        designation: profile.professionalInfo?.designation,
        department: profile.professionalInfo?.department,
        employeeId: profile.professionalInfo?.employeeId,
        joiningDate: profile.professionalInfo?.joiningDate,
        licenseNumber: profile.professionalInfo?.licenseNumber,
        specialization: profile.professionalInfo?.specialization || [],
        experience: profile.professionalInfo?.experience,
      },
      address: {
        street: profile.address?.street,
        city: profile.address?.city,
        state: profile.address?.state,
        country: profile.address?.country || 'Pakistan',
        postalCode: profile.address?.postalCode,
      },
      preferences: {
        language: profile.preferences?.language || 'en',
        timezone: profile.preferences?.timezone || 'Asia/Karachi',
        dateFormat: profile.preferences?.dateFormat || 'DD/MM/YYYY',
        currency: 'PKR',
        measurementUnit: profile.preferences?.measurementUnit || 'sqft',
      },
      avatar: profile.avatar,
      bio: profile.bio,
      socialLinks: profile.socialLinks,
      bankDetails: profile.bankDetails,
      emergencyContact: profile.emergencyContact,
      metadata: {
        createdAt: now,
        updatedAt: now,
        lastLogin: profile.metadata?.lastLogin,
        profileCompleteness: 0,
      },
    };

    // Calculate completeness for new profile
    updatedProfile.metadata.profileCompleteness = calculateProfileCompleteness(updatedProfile);
    
    profiles.push(updatedProfile);
  }

  saveProfiles(profiles);
  return updatedProfile;
};

// Update last login
export const updateLastLogin = (userId: string): void => {
  const profiles = getAllProfiles();
  const profileIndex = profiles.findIndex(p => p.userId === userId);
  
  if (profileIndex >= 0) {
    profiles[profileIndex].metadata.lastLogin = new Date().toISOString();
    saveProfiles(profiles);
  }
};

// Update avatar
export const updateAvatar = (userId: string, avatarUrl: string): void => {
  const profile = getUserProfile(userId);
  if (profile) {
    saveUserProfile({ ...profile, avatar: avatarUrl });
  }
};

// Delete profile
export const deleteUserProfile = (userId: string): void => {
  const profiles = getAllProfiles();
  const filtered = profiles.filter(p => p.userId !== userId);
  saveProfiles(filtered);
};

// Get profile statistics for admin
export const getProfileStats = () => {
  const profiles = getAllProfiles();
  
  const totalProfiles = profiles.length;
  const completeProfiles = profiles.filter(p => p.metadata.profileCompleteness >= 80).length;
  const averageCompleteness = profiles.reduce((sum, p) => sum + p.metadata.profileCompleteness, 0) / totalProfiles || 0;
  
  return {
    totalProfiles,
    completeProfiles,
    incompleteProfiles: totalProfiles - completeProfiles,
    averageCompleteness: Math.round(averageCompleteness),
  };
};

// Sync profile with user data (for migration/initialization)
export const syncProfileFromUser = (user: User): UserProfile => {
  const existingProfile = getUserProfile(user.id);
  
  const nameParts = user.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  return saveUserProfile({
    userId: user.id,
    personalInfo: {
      firstName: existingProfile?.personalInfo.firstName || firstName,
      lastName: existingProfile?.personalInfo.lastName || lastName,
      email: user.email,
      phone: existingProfile?.personalInfo.phone,
    },
    avatar: user.avatar || existingProfile?.avatar,
    metadata: {
      ...existingProfile?.metadata,
      lastLogin: new Date().toISOString(),
    } as any,
  });
};

// Export default initialization
export const initializeUserProfiles = (): void => {
  initializeProfiles();
};
