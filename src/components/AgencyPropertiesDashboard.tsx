import { useState, useMemo, useEffect, useCallback } from 'react';



import {
  Building2,
  DollarSign,
  MapPin,
  Download,
  Eye,
  Users,
  Home,
  CheckCircle2,
  Clock,
  Tag,
  Activity,
  Plus,
  Edit,
  Phone,
  Mail,
  RefreshCw,
  Archive,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { User, Property, Lead, Transaction } from '../types';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddress } from '../lib/utils';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { AdvancedPropertyFilters, AdvancedFilters } from './agency/AdvancedPropertyFilters';
import { BulkPropertyActions } from './agency/BulkPropertyActions';
import { EnhancedPropertyCard } from './agency/EnhancedPropertyCard';
import { SmartPropertySearch } from './agency/SmartPropertySearch';
import { calculateDaysOnMarket, duplicateProperty, incrementPropertyViews } from '../lib/phase3Enhancements';
import { CollaborationMetrics } from './sharing/CollaborationMetrics';
import { runMatchingForAllSharedCycles } from '../lib/smartMatching';
import { PropertyMatch } from '../types/sharing';

interface AgencyPropertiesDashboardProps {
  user: User;
  onNavigate?: (page: string, data?: any) => void;
}

interface PropertyOffer {
  id: string;
  propertyId: string;
  leadId: string;
  leadName: string;
  offerAmount: number;
  offerDate: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  notes?: string;
}

interface PropertyInvestor {
  id: string;
  name: string;
  investmentAmount: number;
  ownership: number;
  joinDate: string;
}

export function AgencyPropertiesDashboard({ user, onNavigate }: AgencyPropertiesDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'price-high' | 'price-low' | 'days-market'>('recent');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Edit states
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [propertyNotes, setPropertyNotes] = useState('');

  // Phase 2: Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});

  // Phase 2: Bulk operations
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

  // Load data from localStorage with refresh capability
  const loadData = useCallback(() => {
    return {
      properties: JSON.parse(localStorage.getItem('properties') || '[]') as Property[],
      leads: JSON.parse(localStorage.getItem('leads') || '[]') as Lead[],
      transactions: JSON.parse(localStorage.getItem('transactions') || '[]') as Transaction[],
      offers: JSON.parse(localStorage.getItem('property-offers') || '[]') as PropertyOffer[],
      investors: JSON.parse(localStorage.getItem('investors') || '[]'),
      propertyInvestments: JSON.parse(localStorage.getItem('property-investments') || '[]')
    };
  }, []);

  const [data, setData] = useState(loadData);

  // Refresh data
  const handleRefresh = useCallback(() => {
    setData(loadData());
    setRefreshKey(prev => prev + 1);
    toast.success('Data refreshed successfully');
  }, [loadData]);

  // Auto-refresh when component mounts or when localStorage changes
  useEffect(() => {
    // Handle storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      // Only refresh if relevant keys changed
      if (e.key === 'properties' ||
        e.key === 'estate_properties' ||
        e.key === 'leads' ||
        e.key === 'estate_leads' ||
        e.key === 'transactions' ||
        e.key === 'property-offers') {
        setData(loadData());
      }
    };

    // Handle custom property update events (from same tab)
    const handlePropertyUpdate = () => {
      setData(loadData());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('propertyUpdated', handlePropertyUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('propertyUpdated', handlePropertyUpdate);
    };
  }, [loadData]);

  // Filter properties based on user role
  const properties = useMemo(() => {
    const allProperties = data.properties;

    // Filter based on user role
    if (user.role === 'admin') {
      return allProperties;
    }
    // Agents see only their properties and shared ones
    return allProperties.filter(p =>
      p.assignedAgent === user.id || p.sharedWith?.includes(user.id)
    );
  }, [data.properties, user, refreshKey]);

  const leads = data.leads;
  const transactions = data.transactions;
  const offers = data.offers;
  const investors = data.investors;
  const propertyInvestments = data.propertyInvestments;

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProperties = properties.length;
    const availableProperties = properties.filter(p => p.status === 'available').length;
    const underContractProperties = properties.filter(p => p.status === 'under-contract').length;
    const soldProperties = properties.filter(p => p.status === 'sold').length;
    const archivedProperties = properties.filter(p => p.archived).length;

    const totalValue = properties.reduce((sum, p) => sum + (p.price || 0), 0);
    const availableValue = properties
      .filter(p => p.status === 'available')
      .reduce((sum, p) => sum + (p.price || 0), 0);

    const rentals = properties.filter(p => p.listingType === 'rent').length;
    const sales = properties.filter(p => p.listingType === 'sale').length;

    // Calculate average days on market
    const activeProperties = properties.filter(p => p.status === 'available');
    const avgDaysOnMarket = activeProperties.length > 0
      ? Math.round(activeProperties.reduce((sum, p) => sum + getDaysOnMarket(p), 0) / activeProperties.length)
      : 0;

    // Calculate properties with offers
    const propertiesWithOffers = new Set(offers.map(o => o.propertyId)).size;

    return {
      totalProperties,
      availableProperties,
      underContractProperties,
      soldProperties,
      archivedProperties,
      totalValue,
      availableValue,
      rentals,
      sales,
      avgDaysOnMarket,
      propertiesWithOffers,
      sharedCount: properties.filter(p => p.sharedWith && p.sharedWith.length > 0).length
    };
  }, [properties, offers]);

  // Load smart matches
  const matches = useMemo(() => {
    return runMatchingForAllSharedCycles(user.id, user.role);
  }, [user.id, user.role, refreshKey]);

  // Filter properties with advanced filters
  const filteredProperties = useMemo(() => {
    let filtered = properties.filter(property => {
      // Don't show archived unless specifically viewing them
      if (statusFilter !== 'archived' && property.archived) {
        return false;
      }

      const matchesSearch = !searchQuery ||
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'archived' && property.archived) ||
        (statusFilter !== 'archived' && property.status === statusFilter);
      const matchesType = typeFilter === 'all' || property.type === typeFilter;
      const matchesAgent = agentFilter === 'all' || property.assignedAgent === agentFilter;

      // Advanced filters
      if (advancedFilters.minPrice && (property.price || 0) < advancedFilters.minPrice) return false;
      if (advancedFilters.maxPrice && (property.price || 0) > advancedFilters.maxPrice) return false;
      if (advancedFilters.minArea && Number(property.area || 0) < advancedFilters.minArea) return false;
      if (advancedFilters.maxArea && Number(property.area || 0) > advancedFilters.maxArea) return false;
      if (advancedFilters.minBedrooms && (property.bedrooms || 0) < advancedFilters.minBedrooms) return false;
      if (advancedFilters.maxBedrooms && (property.bedrooms || 0) > advancedFilters.maxBedrooms) return false;
      if (advancedFilters.minBathrooms && (property.bathrooms || 0) < advancedFilters.minBathrooms) return false;
      if (advancedFilters.maxBathrooms && (property.bathrooms || 0) > advancedFilters.maxBathrooms) return false;

      // Date filters
      if (advancedFilters.listedInDays) {
        const listedDate = new Date(property.listedDate || property.createdAt);
        const daysSinceListed = Math.floor((Date.now() - listedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceListed > advancedFilters.listedInDays) return false;
      }

      if (advancedFilters.updatedInDays && property.updatedAt) {
        const updatedDate = new Date(property.updatedAt);
        const daysSinceUpdated = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdated > advancedFilters.updatedInDays) return false;
      }

      // Performance filters
      if (advancedFilters.hasNoOffers) {
        const propertyOffers = getPropertyOffers(property.id);
        if (propertyOffers.length > 0) return false;
      }

      if (advancedFilters.hasHighInterest) {
        const propertyLeads = getPropertyLeads(property.id);
        if (propertyLeads.length < 3) return false;
      }

      if (advancedFilters.isStale) {
        const daysOnMarket = getDaysOnMarket(property);
        if (daysOnMarket <= 90) return false;
      }

      // Location filter
      if (advancedFilters.cities && advancedFilters.cities.length > 0) {
        if (!property.city || !advancedFilters.cities.includes(property.city)) return false;
      }

      // Listing type filter
      if (advancedFilters.listingTypes && advancedFilters.listingTypes.length > 0) {
        if (!property.listingType || !advancedFilters.listingTypes.includes(property.listingType)) return false;
      }

      // Area units filter
      if (advancedFilters.areaUnits && advancedFilters.areaUnits.length > 0) {
        if (!property.areaUnit || !advancedFilters.areaUnits.includes(property.areaUnit)) return false;
      }

      return matchesSearch && matchesStatus && matchesType && matchesAgent;
    });

    // Sort properties
    switch (sortBy) {
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'days-market':
        filtered.sort((a, b) => getDaysOnMarket(b) - getDaysOnMarket(a));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [properties, searchQuery, statusFilter, typeFilter, agentFilter, sortBy, advancedFilters, offers, leads]);

  // Paginate properties
  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProperties.slice(startIndex, endIndex);
  }, [filteredProperties, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, agentFilter, sortBy]);

  // Get unique agents for filter
  const agents = useMemo(() => {
    const agentMap = new Map();
    properties.forEach(property => {
      if (property.assignedAgent && property.assignedAgentName) {
        agentMap.set(property.assignedAgent, property.assignedAgentName);
      }
    });
    return Array.from(agentMap.entries()).map(([id, name]) => ({ id, name }));
  }, [properties]);

  // Get property-specific data
  const getPropertyLeads = (propertyId: string) => {
    return leads.filter((lead: any) =>
      lead.interestedProperties?.some((p: any) => p.propertyId === propertyId)
    );
  };

  const getPropertyOffers = (propertyId: string) => {
    return offers.filter((offer: PropertyOffer) => offer.propertyId === propertyId);
  };

  const getPropertyTransactions = (propertyId: string) => {
    return transactions.filter((txn: Transaction) => txn.propertyId === propertyId);
  };

  const getPropertyInvestors = (propertyId: string) => {
    const investments = propertyInvestments.filter((pi: any) => pi.propertyId === propertyId);
    return investments.map((inv: any) => {
      const investor = investors.find((i: any) => i.id === inv.investorId);
      return investor ? {
        id: investor.id,
        name: investor.name,
        investmentAmount: inv.amount || 0,
        ownership: inv.ownershipPercentage || 0,
        joinDate: inv.investmentDate || new Date().toISOString()
      } : null;
    }).filter(Boolean);
  };

  const getDaysOnMarket = (property: Property) => {
    return calculateDaysOnMarket(property);
  };

  const getPerformanceScore = (property: Property) => {
    const daysOnMarket = getDaysOnMarket(property);
    const leadsCount = getPropertyLeads(property.id).length;
    const offersCount = getPropertyOffers(property.id).length;

    let score = 100;

    // Reduce score for days on market (max -40)
    if (daysOnMarket > 90) score -= 40;
    else if (daysOnMarket > 60) score -= 30;
    else if (daysOnMarket > 30) score -= 20;
    else if (daysOnMarket > 14) score -= 10;

    // Add score for leads (max +20)
    score += Math.min(leadsCount * 5, 20);

    // Add score for offers (max +30)
    score += Math.min(offersCount * 10, 30);

    return Math.max(0, Math.min(100, score));
  };

  // Actions
  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowDetailModal(true);
    // Increment view count
    incrementPropertyViews(property.id);
  };

  const handleEditProperty = (property: Property) => {
    onNavigate?.('property-detail', property);
  };

  const handleQuickEdit = (property: Property) => {
    setEditingProperty(property);
    setEditPrice(property.price?.toString() || '');
    setShowQuickEditModal(true);
  };

  const handleStatusUpdate = (property: Property) => {
    setEditingProperty(property);
    setEditStatus(property.status);
    setShowStatusUpdateModal(true);
  };

  const handleArchiveProperty = (property: Property) => {
    setEditingProperty(property);
    setShowArchiveModal(true);
  };

  const handleAddNotes = (property: Property) => {
    setEditingProperty(property);
    setPropertyNotes(property.notes || '');
    setShowNotesModal(true);
  };

  const handleCreateLead = (property: Property) => {
    // Navigate to lead form with property pre-selected
    toast.info('Creating lead for ' + property.title);
    onNavigate?.('add-lead', { propertyId: property.id });
  };

  const confirmStatusUpdate = () => {
    if (!editingProperty) return;

    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
    const updatedProperties = allProperties.map((p: Property) =>
      p.id === editingProperty.id ? { ...p, status: editStatus } : p
    );

    localStorage.setItem('properties', JSON.stringify(updatedProperties));
    setData(loadData());
    setShowStatusUpdateModal(false);
    setEditingProperty(null);
    toast.success('Property status updated successfully');
  };

  const confirmQuickEdit = () => {
    if (!editingProperty) return;

    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
    const updatedProperties = allProperties.map((p: Property) =>
      p.id === editingProperty.id ? { ...p, price: parseFloat(editPrice) || p.price } : p
    );

    localStorage.setItem('properties', JSON.stringify(updatedProperties));
    setData(loadData());
    setShowQuickEditModal(false);
    setEditingProperty(null);
    toast.success('Property price updated successfully');
  };

  const confirmArchive = () => {
    if (!editingProperty) return;

    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
    const updatedProperties = allProperties.map((p: Property) =>
      p.id === editingProperty.id ? { ...p, archived: !p.archived } : p
    );

    localStorage.setItem('properties', JSON.stringify(updatedProperties));
    setData(loadData());
    setShowArchiveModal(false);
    setEditingProperty(null);
    toast.success(editingProperty.archived ? 'Property restored' : 'Property archived');
  };

  const saveNotes = () => {
    if (!editingProperty) return;

    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
    const updatedProperties = allProperties.map((p: Property) =>
      p.id === editingProperty.id ? { ...p, notes: propertyNotes } : p
    );

    localStorage.setItem('properties', JSON.stringify(updatedProperties));
    setData(loadData());
    setShowNotesModal(false);
    setEditingProperty(null);
    toast.success('Notes saved successfully');
  };

  const handleExportData = () => {
    const exportData = filteredProperties.map(property => ({
      Title: property.title,
      Type: property.type,
      Status: property.status,
      Price: property.price,
      Area: `${property.area} ${property.areaUnit}`,
      Location: `${formatPropertyAddress(property.address)}, ${property.city}`,
      Agent: property.assignedAgentName,
      Leads: getPropertyLeads(property.id).length,
      Offers: getPropertyOffers(property.id).length,
      DaysOnMarket: getDaysOnMarket(property),
      PerformanceScore: getPerformanceScore(property)
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agency-properties-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Property data exported successfully');
  };

  // Phase 2: Bulk operations handlers
  const handlePropertySelection = (propertyId: string) => {
    setSelectedPropertyIds(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  const handleBulkAction = (action: string, params?: any) => {
    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');

    switch (action) {
      case 'update-status':
        const statusUpdatedProperties = allProperties.map((p: Property) =>
          selectedPropertyIds.includes(p.id) ? { ...p, status: params.status, updatedAt: new Date().toISOString() } : p
        );
        localStorage.setItem('properties', JSON.stringify(statusUpdatedProperties));
        toast.success(`Updated status for ${selectedPropertyIds.length} properties`);
        break;

      case 'assign-agent':
        const agentName = agents.find(a => a.id === params.agentId)?.name || '';
        const agentUpdatedProperties = allProperties.map((p: Property) =>
          selectedPropertyIds.includes(p.id) ? {
            ...p,
            assignedAgent: params.agentId,
            assignedAgentName: agentName,
            updatedAt: new Date().toISOString()
          } : p
        );
        localStorage.setItem('properties', JSON.stringify(agentUpdatedProperties));
        toast.success(`Assigned agent to ${selectedPropertyIds.length} properties`);
        break;

      case 'adjust-price':
        const priceUpdatedProperties = allProperties.map((p: Property) => {
          if (!selectedPropertyIds.includes(p.id)) return p;

          const currentPrice = p.price || 0;
          let newPrice = currentPrice;

          if (params.type === 'percentage') {
            newPrice = currentPrice * (1 + params.adjustment / 100);
          } else {
            newPrice = currentPrice + params.adjustment;
          }

          return { ...p, price: Math.max(0, newPrice), updatedAt: new Date().toISOString() };
        });
        localStorage.setItem('properties', JSON.stringify(priceUpdatedProperties));
        toast.success(`Adjusted prices for ${selectedPropertyIds.length} properties`);
        break;

      case 'archive':
        const archivedProperties = allProperties.map((p: Property) =>
          selectedPropertyIds.includes(p.id) ? {
            ...p,
            archived: true,
            archivedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } : p
        );
        localStorage.setItem('properties', JSON.stringify(archivedProperties));
        toast.success(`Archived ${selectedPropertyIds.length} properties`);
        break;

      case 'delete':
        const remainingProperties = allProperties.filter((p: Property) =>
          !selectedPropertyIds.includes(p.id)
        );
        localStorage.setItem('properties', JSON.stringify(remainingProperties));
        toast.success(`Deleted ${selectedPropertyIds.length} properties`);
        break;

      case 'export':
        const selectedProperties = allProperties.filter((p: Property) =>
          selectedPropertyIds.includes(p.id)
        );
        const exportData = selectedProperties.map((property: Property) => ({
          Title: property.title,
          Type: property.type,
          Status: property.status,
          Price: property.price,
          Area: `${property.area} ${property.areaUnit}`,
          Location: `${formatPropertyAddress(property.address)}, ${property.city}`,
          Agent: property.assignedAgentName,
        }));

        const csv = [
          Object.keys(exportData[0]).join(','),
          ...exportData.map((row: any) => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected-properties-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success(`Exported ${selectedPropertyIds.length} properties`);
        break;

      case 'share':
        toast.info('Bulk sharing feature coming soon');
        break;
    }

    setData(loadData());
    setSelectedPropertyIds([]);
  };

  const handleDuplicateProperty = (property: Property) => {
    const newProperty = duplicateProperty(property.id, user.id, user.name);
    if (newProperty) {
      setData(loadData());
      toast.success('Property duplicated successfully');
    } else {
      toast.error('Failed to duplicate property');
    }
  };

  // Phase 2: Get available cities for filter
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    properties.forEach(p => {
      if (p.city) cities.add(p.city);
    });
    return Array.from(cities).sort();
  }, [properties]);

  // Phase 2: Get selected properties
  const selectedProperties = useMemo(() => {
    return paginatedProperties.filter(p => selectedPropertyIds.includes(p.id));
  }, [paginatedProperties, selectedPropertyIds]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'under-contract':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'house':
        return <Home className="w-4 h-4" />;
      case 'apartment':
        return <Building2 className="w-4 h-4" />;
      case 'commercial':
        return <Building2 className="w-4 h-4" />;
      case 'land':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-gray-900 mb-1">Agency Properties</h1>
              <p className="text-sm text-gray-600">Comprehensive property management and analytics</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={filteredProperties.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={() => onNavigate?.('add-property')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Properties</p>
                  <p className="text-2xl text-gray-900">{stats.totalProperties}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.sales} Sales · {stats.rentals} Rentals
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Available</p>
                  <p className="text-2xl text-gray-900">{stats.availableProperties}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPKR(stats.availableValue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg. Days on Market</p>
                  <p className="text-2xl text-gray-900">{stats.avgDaysOnMarket}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Active listings
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Value</p>
                  <p className="text-2xl text-gray-900">{formatPKR(stats.totalValue)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.propertiesWithOffers} with offers
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* PHASE 6: Collaboration Metrics */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <CollaborationMetrics
              user={user}
              matches={matches}
              sharedListingsCount={stats.sharedCount}
            />
          </div>
        </div>
      </div>

      {/* Filters and Search - Phase 2 Enhanced */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-4">
        {/* Smart Search */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <SmartPropertySearch
              properties={properties}
              value={searchQuery}
              onChange={setSearchQuery}
              onPropertySelect={handleViewProperty}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="under-contract">Under Contract</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="land">Land</SelectItem>
            </SelectContent>
          </Select>

          {agents.length > 0 && (
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="days-market">Days on Market</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        <AdvancedPropertyFilters
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          availableCities={availableCities}
        />

        {/* Results Count and View Mode */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {paginatedProperties.length} of {filteredProperties.length} properties
            {filteredProperties.length !== properties.length && (
              <span className="text-gray-400"> (filtered from {properties.length} total)</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
          </div>
        </div>
      </div>

      {/* Properties List */}
      <div className="p-6">
        {/* Phase 2: Bulk Operations Toolbar */}
        {selectedPropertyIds.length > 0 && (
          <div className="mb-4">
            <BulkPropertyActions
              selectedProperties={selectedProperties}
              allProperties={paginatedProperties}
              onSelectionChange={setSelectedPropertyIds}
              onBulkAction={handleBulkAction}
              availableAgents={agents}
            />
          </div>
        )}

        {filteredProperties.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-900 mb-2">No properties found</h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first property'}
            </p>
            {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
              <Button onClick={() => onNavigate?.('add-property')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedProperties.map(property => {
              const propertyLeads = getPropertyLeads(property.id);
              const propertyOffers = getPropertyOffers(property.id);
              const daysOnMarket = getDaysOnMarket(property);

              return (
                <EnhancedPropertyCard
                  key={property.id}
                  property={property}
                  leadsCount={propertyLeads.length}
                  offersCount={propertyOffers.length}
                  daysOnMarket={daysOnMarket}
                  isSelected={selectedPropertyIds.includes(property.id)}
                  onSelect={handlePropertySelection}
                  onClick={() => handleViewProperty(property)}
                  onQuickEdit={handleQuickEdit}
                  onArchive={handleArchiveProperty}
                  onDuplicate={handleDuplicateProperty}
                />
              );
            })}
          </div>
        ) : (
          // Table view
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-gray-600">Property</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600">Price</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600">Area</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600">Agent</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600">Leads</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600">Offers</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600">Days</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600">Score</th>
                    <th className="px-4 py-3 text-right text-xs text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedProperties.map(property => {
                    const propertyLeads = getPropertyLeads(property.id);
                    const propertyOffers = getPropertyOffers(property.id);
                    const daysOnMarket = getDaysOnMarket(property);
                    const performanceScore = getPerformanceScore(property);

                    return (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900">{property.title}</p>
                            <p className="text-xs text-gray-600">{property.city}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(property.status)}>
                            {property.status.replace('-', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatPKR(property.price)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{property.area} {property.areaUnit}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{property.assignedAgentName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{propertyLeads.length}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{propertyOffers.length}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{daysOnMarket}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${getPerformanceColor(performanceScore)}`}>
                            {performanceScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProperty(property)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditProperty(property)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(property)}>
                                  <Activity className="w-4 h-4 mr-2" />
                                  Change Status
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleArchiveProperty(property)}>
                                  <Archive className="w-4 h-4 mr-2" />
                                  {property.archived ? 'Restore' : 'Archive'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {filteredProperties.length > itemsPerPage && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProperties.length)} of {filteredProperties.length} properties
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={i}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* Items per page selector */}
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-4 border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Property View Modal */}
      {selectedProperty && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProperty.title}</DialogTitle>
              <DialogDescription>View detailed information about this property</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="leads">
                  Leads ({getPropertyLeads(selectedProperty.id).length})
                </TabsTrigger>
                <TabsTrigger value="offers">
                  Offers ({getPropertyOffers(selectedProperty.id).length})
                </TabsTrigger>
                <TabsTrigger value="transactions">
                  Transactions ({getPropertyTransactions(selectedProperty.id).length})
                </TabsTrigger>
                <TabsTrigger value="investors">
                  Investors ({getPropertyInvestors(selectedProperty.id).length})
                </TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Property Type</label>
                    <p className="text-gray-900 capitalize">{selectedProperty.type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Listing Type</label>
                    <p className="text-gray-900 capitalize">{selectedProperty.listingType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <Badge className={getStatusColor(selectedProperty.status)}>
                      {selectedProperty.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Price</label>
                    <p className="text-gray-900">{formatPKR(selectedProperty.price)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Area</label>
                    <p className="text-gray-900">{selectedProperty.area} {selectedProperty.areaUnit}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Days on Market</label>
                    <p className="text-gray-900">{getDaysOnMarket(selectedProperty)} days</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Performance Score</label>
                    <p className={getPerformanceColor(getPerformanceScore(selectedProperty))}>
                      {getPerformanceScore(selectedProperty)}/100
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Location</label>
                  <p className="text-gray-900">{selectedProperty.address}</p>
                  <p className="text-gray-600">{selectedProperty.city}</p>
                </div>

                {selectedProperty.description && (
                  <div>
                    <label className="text-sm text-gray-600">Description</label>
                    <p className="text-gray-900">{selectedProperty.description}</p>
                  </div>
                )}

                {selectedProperty.notes && (
                  <div>
                    <label className="text-sm text-gray-600">Notes</label>
                    <p className="text-gray-900">{selectedProperty.notes}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-600">Assigned Agent</label>
                  <p className="text-gray-900">{selectedProperty.assignedAgentName || 'Unassigned'}</p>
                </div>

                {selectedProperty.features && selectedProperty.features.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Features</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProperty.features.map((feature, index) => (
                        <Badge key={index} variant="outline">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Leads Tab */}
              <TabsContent value="leads">
                {getPropertyLeads(selectedProperty.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-4">No leads interested in this property yet</p>
                    <Button onClick={() => handleCreateLead(selectedProperty)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Lead
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getPropertyLeads(selectedProperty.id).map((lead: Lead) => (
                      <Card key={lead.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-900 mb-1">{lead.name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </span>
                              {lead.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge className="capitalize">{(lead as any).stage || lead.status}</Badge>
                        </div>
                        {lead.notes && (
                          <p className="mt-2 text-sm text-gray-600">{lead.notes}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Offers Tab */}
              <TabsContent value="offers">
                {getPropertyOffers(selectedProperty.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No offers made on this property yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getPropertyOffers(selectedProperty.id).map((offer: PropertyOffer) => (
                      <Card key={offer.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-gray-900">{offer.leadName}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(offer.offerDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <Badge className="capitalize">{offer.status}</Badge>
                        </div>
                        <p className="text-lg text-gray-900 mb-2">
                          {formatPKR(offer.offerAmount)}
                        </p>
                        {offer.notes && (
                          <p className="text-sm text-gray-600">{offer.notes}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions">
                {getPropertyTransactions(selectedProperty.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No transactions recorded for this property
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getPropertyTransactions(selectedProperty.id).map((txn: Transaction) => (
                      <Card key={txn.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-gray-900 capitalize">{txn.type.replace('-', ' ')}</p>
                            <p className="text-sm text-gray-600">
                              {new Date((txn as any).date || txn.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <Badge className="capitalize">{txn.status}</Badge>
                        </div>
                        <p className="text-lg text-gray-900">
                          {formatPKR((txn as any).amount || txn.agreedPrice || 0)}
                        </p>
                        {(txn as any).description && (
                          <p className="text-sm text-gray-600 mt-2">{(txn as any).description}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Investors Tab */}
              <TabsContent value="investors">
                {getPropertyInvestors(selectedProperty.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No investors associated with this property
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getPropertyInvestors(selectedProperty.id).map((investor: PropertyInvestor) => (
                      <Card key={investor.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-gray-900">{investor.name}</p>
                            <p className="text-sm text-gray-600">
                              Invested: {new Date(investor.joinDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <Badge>{investor.ownership}% Ownership</Badge>
                        </div>
                        <p className="text-lg text-gray-900">
                          {formatPKR(investor.investmentAmount)}
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity">
                <div className="space-y-3">
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Plus className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">Property Listed</p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedProperty.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {getPropertyLeads(selectedProperty.id).length > 0 && (
                    <Card className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">
                            {getPropertyLeads(selectedProperty.id).length} Lead(s) Interested
                          </p>
                          <p className="text-sm text-gray-600">Multiple inquiries received</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {getPropertyOffers(selectedProperty.id).length > 0 && (
                    <Card className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Tag className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">
                            {getPropertyOffers(selectedProperty.id).length} Offer(s) Received
                          </p>
                          <p className="text-sm text-gray-600">Negotiation in progress</p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Status Update Modal */}
      <Dialog open={showStatusUpdateModal} onOpenChange={setShowStatusUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Property Status</DialogTitle>
            <DialogDescription>Change the status of this property</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Status</Label>
              <p className="text-sm text-gray-600 capitalize">
                {editingProperty?.status.replace('-', ' ')}
              </p>
            </div>
            <div>
              <Label>New Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="under-contract">Under Contract</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusUpdateModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Edit Price Modal */}
      <Dialog open={showQuickEditModal} onOpenChange={setShowQuickEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Property Price</DialogTitle>
            <DialogDescription>Enter the new price for this property</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Price</Label>
              <p className="text-sm text-gray-600">
                {formatPKR(editingProperty?.price || 0)}
              </p>
            </div>
            <div>
              <Label>New Price (PKR)</Label>
              <Input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Enter new price"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmQuickEdit}>Update Price</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Modal */}
      <Dialog open={showArchiveModal} onOpenChange={setShowArchiveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProperty?.archived ? 'Restore Property' : 'Archive Property'}
            </DialogTitle>
            <DialogDescription>
              {editingProperty?.archived
                ? 'Are you sure you want to restore this property? It will become visible again in active listings.'
                : 'Are you sure you want to archive this property? It will be hidden from active listings but can be restored later.'}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-4" aria-hidden="true">
            {editingProperty?.archived
              ? 'Are you sure you want to restore this property? It will become visible again in active listings.'
              : 'Are you sure you want to archive this property? It will be hidden from active listings but can be restored later.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmArchive}>
              {editingProperty?.archived ? 'Restore' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Property Notes</DialogTitle>
            <DialogDescription>Add or edit notes for this property</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Notes</Label>
            <Textarea
              value={propertyNotes}
              onChange={(e) => setPropertyNotes(e.target.value)}
              placeholder="Add notes about this property..."
              rows={6}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
