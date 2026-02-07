import React, { useState, useEffect } from 'react';
import { User, ConstructionSite, InventoryMaterial, SiteInventory, StockTransferRequest, StockTransferItem } from '../types';
import {
  getConstructionSites,
  getInventoryMaterials,
  getSiteInventory,
  getStockLevel,
  saveStockTransferRequest,
  generateTransferRequestNumber,
  initializeInventorySystem,
} from '../lib/inventory';
import { formatPKR } from '../lib/currency';
import { ArrowLeft, Filter, Download, Plus, TrendingUp, TrendingDown, Minus, ArrowRightLeft, X, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface CentralInventoryProps {
  user: User;
  onBack: () => void;
}

interface MaterialInventoryRow {
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  totalStock: number;
  minStockLevel: number;
  reorderLevel: number;
  stockStatus: 'healthy' | 'low' | 'critical';
  siteStocks: Record<string, number>;
}

export function CentralInventory({ user, onBack }: CentralInventoryProps) {
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  const [materials, setMaterials] = useState<InventoryMaterial[]>([]);
  const [inventory, setInventory] = useState<SiteInventory[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'healthy' | 'low' | 'critical'>('all');
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    initializeInventorySystem();
    loadData();
  }, []);

  const loadData = () => {
    setSites(getConstructionSites().filter(s => s.status === 'active'));
    setMaterials(getInventoryMaterials());
    setInventory(getSiteInventory());
  };

  const getInventoryRows = (): MaterialInventoryRow[] => {
    return materials.map(material => {
      const siteStocks: Record<string, number> = {};
      let totalStock = 0;

      sites.forEach(site => {
        const stock = getStockLevel(site.id, material.id);
        siteStocks[site.id] = stock;
        totalStock += stock;
      });

      let stockStatus: 'healthy' | 'low' | 'critical' = 'healthy';
      if (totalStock <= material.minStockLevel) {
        stockStatus = 'critical';
      } else if (totalStock <= material.reorderLevel) {
        stockStatus = 'low';
      }

      return {
        materialId: material.id,
        materialCode: material.materialCode,
        materialName: material.materialName,
        unit: material.unit,
        totalStock,
        minStockLevel: material.minStockLevel,
        reorderLevel: material.reorderLevel,
        stockStatus,
        siteStocks,
      };
    });
  };

  const filteredRows = getInventoryRows().filter(row => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !row.materialCode.toLowerCase().includes(search) &&
        !row.materialName.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // Stock status filter
    if (stockFilter !== 'all' && row.stockStatus !== stockFilter) {
      return false;
    }

    // Site filter - if a specific site is selected, check if that site has stock
    if (selectedSite !== 'all') {
      const siteStock = row.siteStocks[selectedSite] || 0;
      if (siteStock === 0) return false;
    }

    return true;
  });

  const getStatusColor = (status: 'healthy' | 'low' | 'critical') => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'low': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
    }
  };

  const getStatusLabel = (status: 'healthy' | 'low' | 'critical') => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'low': return 'Low Stock';
      case 'critical': return 'Critical';
    }
  };

  const stats = {
    totalMaterials: materials.length,
    healthyStock: filteredRows.filter(r => r.stockStatus === 'healthy').length,
    lowStock: filteredRows.filter(r => r.stockStatus === 'low').length,
    criticalStock: filteredRows.filter(r => r.stockStatus === 'critical').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl text-gray-900">Central Inventory</h1>
                <p className="text-gray-600 mt-1">Multi-site material stock management</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button onClick={() => setShowTransferModal(true)} className="gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Stock Transfer
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Materials</p>
                  <p className="text-2xl text-gray-900 mt-1">{stats.totalMaterials}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm">Healthy Stock</p>
                  <p className="text-2xl text-green-900 mt-1">{stats.healthyStock}</p>
                </div>
                <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-700" />
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-700 text-sm">Low Stock</p>
                  <p className="text-2xl text-orange-900 mt-1">{stats.lowStock}</p>
                </div>
                <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                  <Minus className="w-5 h-5 text-orange-700" />
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm">Critical Stock</p>
                  <p className="text-2xl text-red-900 mt-1">{stats.criticalStock}</p>
                </div>
                <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by material code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Site:</span>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Status:</span>
            <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Material Code</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Material Name</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Total Stock</th>
                  {sites.map(site => (
                    <th key={site.id} className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">
                      {site.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={4 + sites.length} className="px-4 py-8 text-center text-gray-500">
                      No materials found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(row => (
                    <tr key={row.materialId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{row.materialCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.materialName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.unit}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(row.stockStatus)}`} />
                          <span className="text-sm text-gray-900">
                            {row.totalStock.toLocaleString()} {row.unit}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({getStatusLabel(row.stockStatus)})
                          </span>
                        </div>
                      </td>
                      {sites.map(site => (
                        <td key={site.id} className="px-4 py-3 text-sm text-gray-900">
                          {(row.siteStocks[site.id] || 0).toLocaleString()} {row.unit}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Transfer Modal */}
      {showTransferModal && (
        <StockTransferModal
          sites={sites}
          materials={materials}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            setShowTransferModal(false);
            loadData();
          }}
          user={user}
        />
      )}
    </div>
  );
}

interface StockTransferModalProps {
  sites: ConstructionSite[];
  materials: InventoryMaterial[];
  onClose: () => void;
  onSuccess: () => void;
  user: User;
}

function StockTransferModal({ sites, materials, onClose, onSuccess, user }: StockTransferModalProps) {
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<StockTransferItem[]>([]);

  const addItem = () => {
    const newItem: StockTransferItem = {
      id: `item-${Date.now()}`,
      materialId: '',
      materialCode: '',
      materialName: '',
      unit: '',
      requestedQuantity: 0,
      availableQuantity: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    
    if (field === 'materialId') {
      const material = materials.find(m => m.id === value);
      if (material) {
        updatedItems[index] = {
          ...updatedItems[index],
          materialId: material.id,
          materialCode: material.materialCode,
          materialName: material.materialName,
          unit: material.unit,
          availableQuantity: transferFrom ? getStockLevel(transferFrom, material.id) : 0,
        };
      }
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
    }
    
    setItems(updatedItems);
  };

  const handleSubmit = () => {
    // Validation
    if (!transferFrom || !transferTo) {
      toast.error('Please select both transfer sites');
      return;
    }

    if (transferFrom === transferTo) {
      toast.error('Transfer from and to sites cannot be the same');
      return;
    }

    if (!requiredByDate) {
      toast.error('Please select required by date');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one material');
      return;
    }

    // Validate all items
    for (const item of items) {
      if (!item.materialId) {
        toast.error('Please select material for all items');
        return;
      }
      if (!item.requestedQuantity || item.requestedQuantity <= 0) {
        toast.error('Please enter valid quantity for all items');
        return;
      }
      if (item.requestedQuantity > (item.availableQuantity || 0)) {
        toast.error(`Requested quantity exceeds available stock for ${item.materialName}`);
        return;
      }
    }

    // Create transfer request
    const request: StockTransferRequest = {
      id: `transfer-${Date.now()}`,
      requestNumber: generateTransferRequestNumber(),
      transferFrom,
      transferTo,
      requestedBy: user.id,
      requestedDate: new Date().toISOString(),
      requiredByDate,
      status: 'pending',
      items,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveStockTransferRequest(request);
    toast.success('Stock transfer request created successfully');
    onSuccess();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Stock Transfer</DialogTitle>
          <DialogDescription>
            Create a request to transfer materials between construction sites. Select the source and destination sites, add materials, and specify the required delivery date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Transfer Sites */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Transfer From *</label>
              <Select value={transferFrom} onValueChange={(value) => {
                setTransferFrom(value);
                // Recalculate available quantities
                setItems(items.map(item => ({
                  ...item,
                  availableQuantity: item.materialId ? getStockLevel(value, item.materialId) : 0,
                })));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Transfer To *</label>
              <Select value={transferTo} onValueChange={setTransferTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Required By Date */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Required By Date *</label>
            <div className="relative">
              <input
                type="date"
                value={requiredByDate}
                onChange={(e) => setRequiredByDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Materials Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm text-gray-700">Materials *</label>
              <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Material
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-700">Material</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-700">Available Qty</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-700">Requested Qty</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-700">Unit</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
                        No materials added. Click "Add Material" to begin.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <Select
                            value={item.materialId}
                            onValueChange={(value) => updateItem(index, 'materialId', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map(material => (
                                <SelectItem key={material.id} value={material.id}>
                                  {material.materialCode} - {material.materialName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-sm ${!transferFrom || !item.materialId ? 'text-gray-400' : item.availableQuantity === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {transferFrom && item.materialId ? (item.availableQuantity || 0).toLocaleString() : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            max={item.availableQuantity || 0}
                            value={item.requestedQuantity || ''}
                            onChange={(e) => updateItem(index, 'requestedQuantity', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                            disabled={!item.materialId || !transferFrom}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-sm text-gray-600">{item.unit || '-'}</span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
              placeholder="Add any additional notes or special instructions..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit Transfer Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
