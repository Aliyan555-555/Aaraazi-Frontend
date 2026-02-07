/**
 * ContactCard - Display contact information with actions
 * 
 * Features:
 * - Name with avatar/initials
 * - Contact details (phone, email, address)
 * - Social links
 * - Quick actions (call, email, message)
 * - Notes section
 * - Last contact date
 * 
 * Usage:
 * <ContactCard
 *   name="John Doe"
 *   role="Buyer"
 *   phone="+92 300 1234567"
 *   email="john@example.com"
 *   onCall={() => window.open('tel:+923001234567')}
 *   onEmail={() => window.open('mailto:john@example.com')}
 * />
 */

import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Edit,
  Building,
  Briefcase,
} from 'lucide-react';

export interface ContactCardProps {
  name: string;
  role?: string; // 'buyer', 'seller', 'agent', 'owner', etc.
  avatar?: string; // URL to avatar image
  phone?: string;
  email?: string;
  address?: string;
  company?: string;
  designation?: string;
  lastContact?: string; // ISO date string
  notes?: string;
  tags?: string[];
  onCall?: () => void;
  onEmail?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  onClick?: () => void; // For navigating to full profile
  className?: string;
}

export function ContactCard({
  name,
  role,
  avatar,
  phone,
  email,
  address,
  company,
  designation,
  lastContact,
  notes,
  tags,
  onCall,
  onEmail,
  onMessage,
  onEdit,
  onClick,
  className = '',
}: ContactCardProps) {
  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Role color mapping
  const getRoleColor = (role?: string) => {
    const colors: Record<string, string> = {
      buyer: 'bg-blue-100 text-blue-800',
      seller: 'bg-green-100 text-green-800',
      agent: 'bg-purple-100 text-purple-800',
      owner: 'bg-yellow-100 text-yellow-800',
      tenant: 'bg-orange-100 text-orange-800',
    };
    return role ? colors[role.toLowerCase()] || 'bg-gray-100 text-gray-800' : '';
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-5 ${
        onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">
                  {getInitials(name)}
                </span>
              </div>
            )}
          </div>

          {/* Name & Role */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-[#030213] truncate">{name}</h3>
              {role && (
                <Badge className={getRoleColor(role)} variant="secondary">
                  {role}
                </Badge>
              )}
            </div>

            {/* Company & Designation */}
            {(company || designation) && (
              <div className="text-sm text-gray-600 space-y-1">
                {designation && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    <span>{designation}</span>
                  </div>
                )}
                {company && (
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    <span>{company}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit Button */}
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Contact Details */}
      <div className="space-y-2 mb-4">
        {phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            <a
              href={`tel:${phone}`}
              className="text-gray-700 hover:text-blue-600"
              onClick={(e) => e.stopPropagation()}
            >
              {phone}
            </a>
          </div>
        )}

        {email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <a
              href={`mailto:${email}`}
              className="text-gray-700 hover:text-blue-600 truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {email}
            </a>
          </div>
        )}

        {address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{address}</span>
          </div>
        )}

        {lastContact && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Last contact: {formatDate(lastContact)}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="text-xs font-medium text-yellow-900 mb-1">Notes:</p>
          <p className="text-yellow-800">{notes}</p>
        </div>
      )}

      {/* Quick Actions */}
      {(onCall || onEmail || onMessage) && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {onCall && phone && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onCall();
              }}
              className="flex-1"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
          )}
          {onEmail && email && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEmail();
              }}
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          )}
          {onMessage && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onMessage();
              }}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
