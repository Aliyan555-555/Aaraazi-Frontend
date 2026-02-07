import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  getUserProfile, 
  saveUserProfile, 
  UserProfile as UserProfileType,
  syncProfileFromUser 
} from '../lib/userProfile';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  Award,
  CreditCard,
  AlertCircle,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileProps {
  user: User;
  onBack?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfileType | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user.id]);

  const loadProfile = () => {
    let userProfile = getUserProfile(user.id);
    
    if (!userProfile) {
      // Create profile from user data
      userProfile = syncProfileFromUser(user);
    }
    
    setProfile(userProfile);
    setEditedProfile(userProfile);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const handleSave = () => {
    if (!editedProfile) return;
    
    try {
      const updated = saveUserProfile(editedProfile);
      setProfile(updated);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const updateEditedProfile = (section: keyof UserProfileType, data: any) => {
    if (!editedProfile) return;
    
    setEditedProfile({
      ...editedProfile,
      [section]: {
        ...editedProfile[section],
        ...data,
      },
    });
  };

  if (!profile || !editedProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const completeness = profile.metadata.profileCompleteness;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
            </div>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Profile Completeness Banner */}
        {completeness < 80 && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-blue-900 mb-1">Complete your profile</h3>
                  <p className="text-sm text-blue-700">
                    Your profile is {completeness}% complete. Add more information to help your team connect with you.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{completeness}%</p>
                  <p className="text-xs text-blue-700">Complete</p>
                </div>
              </div>
            </div>
            <div className="mt-3 bg-white rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Card */}
            <Card className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{profile.personalInfo.firstName[0]}{profile.personalInfo.lastName[0]}</span>
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <h2 className="mt-4 text-xl text-gray-900">
                  {profile.personalInfo.firstName} {profile.personalInfo.lastName}
                </h2>
                <p className="text-gray-600">{profile.personalInfo.email}</p>
                <Badge className="mt-2">
                  {user.role ? String(user.role).charAt(0).toUpperCase() + String(user.role).slice(1) : 'User'}
                </Badge>
              </div>

              {profile.bio && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600 text-center">{profile.bio}</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Member Since</span>
                  <span className="text-gray-900">
                    {new Date(profile.metadata.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                {profile.metadata.lastLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Login</span>
                    <span className="text-gray-900">
                      {new Date(profile.metadata.lastLogin).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {profile.professionalInfo.experience && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Experience</span>
                    <span className="text-gray-900">{profile.professionalInfo.experience} years</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Contact Card */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="space-y-3">
                {profile.personalInfo.phone && (
                  <div>
                    <p className="text-xs text-gray-500">Primary Phone</p>
                    <p className="text-sm text-gray-900">{profile.personalInfo.phone}</p>
                  </div>
                )}
                {profile.personalInfo.alternatePhone && (
                  <div>
                    <p className="text-xs text-gray-500">Alternate Phone</p>
                    <p className="text-sm text-gray-900">{profile.personalInfo.alternatePhone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{profile.personalInfo.email}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.personalInfo.firstName}
                      onChange={(e) => updateEditedProfile('personalInfo', { firstName: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.personalInfo.firstName}</p>
                  )}
                </div>
                <div>
                  <Label>Last Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.personalInfo.lastName}
                      onChange={(e) => updateEditedProfile('personalInfo', { lastName: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.personalInfo.lastName}</p>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-gray-900 mt-1">{profile.personalInfo.email}</p>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.personalInfo.phone || ''}
                      onChange={(e) => updateEditedProfile('personalInfo', { phone: e.target.value })}
                      placeholder="+92 300 1234567"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.personalInfo.phone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.personalInfo.dateOfBirth || ''}
                      onChange={(e) => updateEditedProfile('personalInfo', { dateOfBirth: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {profile.personalInfo.dateOfBirth 
                        ? new Date(profile.personalInfo.dateOfBirth).toLocaleDateString()
                        : 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>CNIC Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.personalInfo.cnic || ''}
                      onChange={(e) => updateEditedProfile('personalInfo', { cnic: e.target.value })}
                      placeholder="12345-1234567-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.personalInfo.cnic || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Label>Bio</Label>
                {isEditing ? (
                  <Textarea
                    value={editedProfile.bio || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{profile.bio || 'Not provided'}</p>
                )}
              </div>
            </Card>

            {/* Professional Information */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Professional Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Designation</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.professionalInfo.designation || ''}
                      onChange={(e) => updateEditedProfile('professionalInfo', { designation: e.target.value })}
                      placeholder="e.g., Senior Agent"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.professionalInfo.designation || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>Department</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.professionalInfo.department || ''}
                      onChange={(e) => updateEditedProfile('professionalInfo', { department: e.target.value })}
                      placeholder="e.g., Sales"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.professionalInfo.department || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>Employee ID</Label>
                  <p className="text-sm text-gray-900 mt-1">{profile.professionalInfo.employeeId || 'Not assigned'}</p>
                </div>
                <div>
                  <Label>License Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.professionalInfo.licenseNumber || ''}
                      onChange={(e) => updateEditedProfile('professionalInfo', { licenseNumber: e.target.value })}
                      placeholder="Real estate license"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.professionalInfo.licenseNumber || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>Experience (Years)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedProfile.professionalInfo.experience || ''}
                      onChange={(e) => updateEditedProfile('professionalInfo', { experience: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.professionalInfo.experience || '0'} years</p>
                  )}
                </div>
                <div>
                  <Label>Joining Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.professionalInfo.joiningDate || ''}
                      onChange={(e) => updateEditedProfile('professionalInfo', { joiningDate: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {profile.professionalInfo.joiningDate 
                        ? new Date(profile.professionalInfo.joiningDate).toLocaleDateString()
                        : 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Address */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Street Address</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.address.street || ''}
                      onChange={(e) => updateEditedProfile('address', { street: e.target.value })}
                      placeholder="House/Plot number, Street name"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.address.street || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>City</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.address.city || ''}
                      onChange={(e) => updateEditedProfile('address', { city: e.target.value })}
                      placeholder="Karachi"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.address.city || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>State/Province</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.address.state || ''}
                      onChange={(e) => updateEditedProfile('address', { state: e.target.value })}
                      placeholder="Sindh"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.address.state || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>Postal Code</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.address.postalCode || ''}
                      onChange={(e) => updateEditedProfile('address', { postalCode: e.target.value })}
                      placeholder="75000"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{profile.address.postalCode || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>Country</Label>
                  <p className="text-sm text-gray-900 mt-1">{profile.address.country || 'Pakistan'}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
