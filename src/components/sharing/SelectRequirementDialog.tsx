/**
 * SelectRequirementDialog Component
 * Let agents select one of their buyer/rent requirements to match with a property
 * before submitting an offer.
 */

import React, { useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
// [STUBBED] import {
// [STUBBED]     getBuyerRequirements
// [STUBBED] } from '../../lib/buyerRequirements';
// [STUBBED] import {
// [STUBBED]     getRentRequirements
// [STUBBED] } from '../../lib/rentRequirements';
import {
    User,
    Property,
    BuyerRequirement,
    RentRequirement
} from '../../types';
// [STUBBED] import {
// [STUBBED]     findMatchingPropertiesForBuyer,
// [STUBBED]     findMatchingPropertiesForRent
// [STUBBED] } from '../../lib/propertyMatching';
import { Badge } from '../ui/badge';
import { formatPKR } from '../../lib/currency';
import { Search, User as UserIcon, Plus } from 'lucide-react';
import { Input } from '../ui/input';

// ===== STUBS for removed prototype functions =====
const getBuyerRequirements = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getRentRequirements = (..._args: any[]): any => { /* stub - prototype function removed */ };
const findMatchingPropertiesForBuyer = (..._args: any[]): any => { /* stub - prototype function removed */ };
const findMatchingPropertiesForRent = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface SelectRequirementDialogProps {
    open: boolean;
    onClose: () => void;
    property: Property;
    user: User;
    onSelect: (requirement: any, match: any) => void;
}

export const SelectRequirementDialog: React.FC<SelectRequirementDialogProps> = ({
    open,
    onClose,
    property,
    user,
    onSelect,
}) => {
    const [searchQuery, setSearchQuery] = React.useState('');

    // Determine if property is for sale or rent
    const isForSale = property.activeSellCycleIds?.length > 0;
    const isForRent = property.activeRentCycleIds?.length > 0;

    // Load requirements
    const requirements = useMemo(() => {
        let list: any[] = [];
        if (isForSale) {
            list = [...list, ...getBuyerRequirements(user.id, user.role)];
        }
        if (isForRent) {
            list = [...list, ...getRentRequirements(user.id, user.role)];
        }
        return list;
    }, [user.id, user.role, isForSale, isForRent]);

    // Filter and calculate matches
    const filteredRequirements = useMemo(() => {
        let filtered = requirements;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.buyerName?.toLowerCase().includes(query) ||
                r.additionalNotes?.toLowerCase().includes(query)
            );
        }

        return filtered.map(req => {
            let match: any = null;
            if (req.minBudget !== undefined) { // Buyer
                const matches = findMatchingPropertiesForBuyer(req, user.id, user.role);
                match = matches.find(m => m.propertyId === property.id);
            } else { // Rent
                const matches = findMatchingPropertiesForRent(req, user.id, user.role);
                match = matches.find(m => m.propertyId === property.id);
            }
            return { req, match };
        });
    }, [requirements, searchQuery, property.id, user.id, user.role]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Select Requirement</DialogTitle>
                    <DialogDescription>
                        Choose a buyer or tenant requirement to associate with this offer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search requirements..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                        {filteredRequirements.length > 0 ? (
                            filteredRequirements.map(({ req, match }) => (
                                <button
                                    key={req.id}
                                    onClick={() => onSelect(req, match || {
                                        matchId: `match_${Date.now()}`,
                                        matchScore: 0,
                                        cycleType: isForSale ? 'sell' : 'rent',
                                        requirementId: req.id,
                                        requirementType: req.minBudget !== undefined ? 'buyer' : 'rent'
                                    })}
                                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <UserIcon className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{req.buyerName || req.tenantName}</div>
                                            <div className="text-xs text-gray-500">
                                                Budget: {formatPKR(req.minBudget || req.minRent)} - {formatPKR(req.maxBudget || req.maxRent)}
                                            </div>
                                        </div>
                                    </div>
                                    {match && (
                                        <Badge variant={match.matchScore >= 80 ? 'success' : match.matchScore >= 60 ? 'info' : 'secondary'}>
                                            {match.matchScore}% Match
                                        </Badge>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No suitable requirements found.</p>
                                <Button variant="link" size="sm" className="mt-2 h-auto p-0 flex items-center gap-1 mx-auto text-[#2D6A54]">
                                    <Plus className="h-3 w-3" />
                                    Create New Requirement
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
