/**
 * ShareToggle Component
 * Toggle for sharing/unsharing cycles with other agents
 * 
 * Features:
 * - Visual toggle switch
 * - Confirmation dialog with privacy explanation
 * - View count display
 * - Success/error toasts
 */

import React, { useState } from 'react';
import { Share2, Eye, Shield, Users, Lock, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { User } from '../../types';

interface ShareToggleProps {
  cycleId: string;
  cycleType: 'sell' | 'rent';
  isShared: boolean;
  viewCount?: number;
  viewedBy?: string[];
  user: User;
  onToggle: (isShared: boolean, userId: string, userName: string) => void;
}

export const ShareToggle: React.FC<ShareToggleProps> = ({
  cycleId,
  cycleType,
  isShared,
  viewCount = 0,
  viewedBy = [],
  user,
  onToggle,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingState, setPendingState] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleClick = () => {
    if (isShared) {
      // Unsharing - just confirm
      setPendingState(false);
      setShowConfirmDialog(true);
    } else {
      // Sharing - show privacy info and confirm
      setPendingState(true);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirm = async () => {
    if (pendingState === null) return;

    setIsLoading(true);
    
    try {
      onToggle(pendingState, user.id, user.name);
      
      setShowConfirmDialog(false);
      setPendingState(null);

      toast.success(
        pendingState
          ? '✅ Cycle shared successfully!'
          : '✅ Cycle unshared successfully',
        {
          description: pendingState
            ? 'Other agents can now see this property and submit offers'
            : 'This cycle is now private to your portfolio',
        }
      );
    } catch (error) {
      console.error('Error toggling share:', error);
      toast.error('Failed to update sharing settings', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setPendingState(null);
  };

  return (
    <>
      {/* Share Toggle Button */}
      <div className="flex items-center gap-3">
        <Button
          variant={isShared ? 'default' : 'outline'}
          size="sm"
          onClick={handleToggleClick}
          className="gap-2"
        >
          {isShared ? (
            <>
              <Share2 className="h-4 w-4" />
              Shared
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Private
            </>
          )}
        </Button>

        {/* View Count (only show if shared and has views) */}
        {isShared && viewCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Eye className="h-4 w-4" />
            <span>{viewCount} view{viewCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingState ? (
                <>
                  <Share2 className="h-5 w-5 text-[#2D6A54]" />
                  Share this {cycleType === 'sell' ? 'Sell' : 'Rent'} Cycle?
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 text-gray-600" />
                  Unshare this {cycleType === 'sell' ? 'Sell' : 'Rent'} Cycle?
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {pendingState ? (
                <span>
                  Make this property visible to other agents in your organization
                </span>
              ) : (
                <span>
                  Remove this property from the shared listings pool
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {pendingState ? (
              // Sharing - Show what's shared and what's protected
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-900">What agents will see:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Property details (type, location, size, features)</li>
                        <li>• Asking price / monthly rent</li>
                        <li>• Property images and description</li>
                        <li>• Number of interested buyers (count only)</li>
                        <li>• Ability to submit offers for their buyers</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900">What's protected:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Owner/Seller contact details</li>
                        <li>• Buyer/Tenant contact details</li>
                        <li>• Offer amounts and negotiations</li>
                        <li>• Your private notes and CRM data</li>
                        <li>• Financial and commission details</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> Agents who submit offers through matches will need to coordinate with you to finalize any deals.
                  </p>
                </div>
              </>
            ) : (
              // Unsharing
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Current visibility:</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>• {viewCount} agent{viewCount !== 1 ? 's have' : ' has'} viewed this listing</p>
                        <p>• This cycle is currently in the shared pool</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> Unsharing will remove this from other agents' matched properties and they won't be able to submit new offers.
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              style={{
                backgroundColor: pendingState ? '#2D6A54' : undefined,
              }}
              disabled={isLoading}
            >
              {pendingState ? 'Share Cycle' : 'Unshare Cycle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};