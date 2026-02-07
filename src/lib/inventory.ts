import { 
  ConstructionSite, 
  InventoryMaterial, 
  SiteInventory, 
  StockTransferRequest,
  StockTransferItem,
  InventoryTransaction 
} from '../types';

const STORAGE_KEYS = {
  SITES: 'estatemanager_construction_sites',
  MATERIALS: 'estatemanager_inventory_materials',
  SITE_INVENTORY: 'estatemanager_site_inventory',
  TRANSFER_REQUESTS: 'estatemanager_stock_transfers',
  TRANSACTIONS: 'estatemanager_inventory_transactions',
};

// ============================================================================
// CONSTRUCTION SITES
// ============================================================================

export function getConstructionSites(): ConstructionSite[] {
  const stored = localStorage.getItem(STORAGE_KEYS.SITES);
  return stored ? JSON.parse(stored) : [];
}

export function saveConstructionSite(site: ConstructionSite): void {
  const sites = getConstructionSites();
  const existingIndex = sites.findIndex(s => s.id === site.id);
  
  if (existingIndex >= 0) {
    sites[existingIndex] = site;
  } else {
    sites.push(site);
  }
  
  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
}

export function initializeDefaultSites(): void {
  const existing = getConstructionSites();
  if (existing.length > 0) return;
  
  const defaultSites: ConstructionSite[] = [
    {
      id: 'site-1',
      name: 'DHA City Project',
      projectId: 'project-1',
      location: 'DHA City, Karachi',
      status: 'active',
      siteManager: 'Ahmed Khan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'site-2',
      name: 'Bahria Town Site',
      projectId: 'project-2',
      location: 'Bahria Town, Karachi',
      status: 'active',
      siteManager: 'Zain Ali',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'site-3',
      name: 'Clifton Heights',
      projectId: 'project-3',
      location: 'Clifton, Karachi',
      status: 'active',
      siteManager: 'Sara Malik',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'site-4',
      name: 'Gulshan Complex',
      projectId: 'project-4',
      location: 'Gulshan-e-Iqbal, Karachi',
      status: 'active',
      siteManager: 'Imran Siddiqui',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  
  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(defaultSites));
}

// ============================================================================
// INVENTORY MATERIALS
// ============================================================================

export function getInventoryMaterials(): InventoryMaterial[] {
  const stored = localStorage.getItem(STORAGE_KEYS.MATERIALS);
  return stored ? JSON.parse(stored) : [];
}

export function saveInventoryMaterial(material: InventoryMaterial): void {
  const materials = getInventoryMaterials();
  const existingIndex = materials.findIndex(m => m.id === material.id);
  
  if (existingIndex >= 0) {
    materials[existingIndex] = material;
  } else {
    materials.push(material);
  }
  
  localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
}

export function initializeDefaultMaterials(): void {
  const existing = getInventoryMaterials();
  if (existing.length > 0) return;
  
  const defaultMaterials: InventoryMaterial[] = [
    {
      id: 'mat-1',
      materialCode: 'CEM-001',
      materialName: 'Cement (OPC 53 Grade)',
      category: 'cement',
      unit: 'bags',
      minStockLevel: 500,
      reorderLevel: 800,
      standardCost: 850,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mat-2',
      materialCode: 'STL-001',
      materialName: 'Steel Rebar 12mm',
      category: 'steel',
      unit: 'ton',
      minStockLevel: 10,
      reorderLevel: 15,
      standardCost: 185000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mat-3',
      materialCode: 'BRK-001',
      materialName: 'Red Bricks (Class A)',
      category: 'bricks',
      unit: 'pcs',
      minStockLevel: 50000,
      reorderLevel: 80000,
      standardCost: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mat-4',
      materialCode: 'SND-001',
      materialName: 'Fine Sand (Ravi)',
      category: 'sand',
      unit: 'cft',
      minStockLevel: 1000,
      reorderLevel: 1500,
      standardCost: 65,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mat-5',
      materialCode: 'AGG-001',
      materialName: 'Coarse Aggregates',
      category: 'aggregates',
      unit: 'cft',
      minStockLevel: 800,
      reorderLevel: 1200,
      standardCost: 75,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mat-6',
      materialCode: 'WOD-001',
      materialName: 'Timber (Hardwood)',
      category: 'wood',
      unit: 'cft',
      minStockLevel: 200,
      reorderLevel: 300,
      standardCost: 1800,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mat-7',
      materialCode: 'ELC-001',
      materialName: 'Electrical Cable 2.5mm',
      category: 'electrical',
      unit: 'units',
      minStockLevel: 500,
      reorderLevel: 750,
      standardCost: 450,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mat-8',
      materialCode: 'PLB-001',
      materialName: 'PVC Pipes 4 inch',
      category: 'plumbing',
      unit: 'units',
      minStockLevel: 200,
      reorderLevel: 300,
      standardCost: 850,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mat-9',
      materialCode: 'FIN-001',
      materialName: 'Ceramic Tiles (600x600)',
      category: 'finishing',
      unit: 'sqft',
      minStockLevel: 5000,
      reorderLevel: 8000,
      standardCost: 180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mat-10',
      materialCode: 'STL-002',
      materialName: 'Steel Rebar 16mm',
      category: 'steel',
      unit: 'ton',
      minStockLevel: 8,
      reorderLevel: 12,
      standardCost: 187000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  
  localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(defaultMaterials));
}

// ============================================================================
// SITE INVENTORY
// ============================================================================

export function getSiteInventory(): SiteInventory[] {
  const stored = localStorage.getItem(STORAGE_KEYS.SITE_INVENTORY);
  return stored ? JSON.parse(stored) : [];
}

export function saveSiteInventory(inventory: SiteInventory): void {
  const allInventory = getSiteInventory();
  const existingIndex = allInventory.findIndex(
    i => i.siteId === inventory.siteId && i.materialId === inventory.materialId
  );
  
  if (existingIndex >= 0) {
    allInventory[existingIndex] = inventory;
  } else {
    allInventory.push(inventory);
  }
  
  localStorage.setItem(STORAGE_KEYS.SITE_INVENTORY, JSON.stringify(allInventory));
}

export function getSiteInventoryBySite(siteId: string): SiteInventory[] {
  const allInventory = getSiteInventory();
  return allInventory.filter(i => i.siteId === siteId);
}

export function getSiteInventoryByMaterial(materialId: string): SiteInventory[] {
  const allInventory = getSiteInventory();
  return allInventory.filter(i => i.materialId === materialId);
}

export function getStockLevel(siteId: string, materialId: string): number {
  const inventory = getSiteInventory().find(
    i => i.siteId === siteId && i.materialId === materialId
  );
  return inventory?.quantity || 0;
}

export function initializeDefaultInventory(): void {
  const existing = getSiteInventory();
  if (existing.length > 0) return;
  
  const sites = getConstructionSites();
  const materials = getInventoryMaterials();
  const now = new Date().toISOString();
  
  const defaultInventory: SiteInventory[] = [];
  
  // Generate random inventory for each site-material combination
  sites.forEach(site => {
    materials.forEach(material => {
      const baseQuantity = material.minStockLevel + Math.floor(Math.random() * material.reorderLevel);
      const variation = Math.random() * 0.5 + 0.75; // 75% to 125%
      const quantity = Math.floor(baseQuantity * variation);
      
      defaultInventory.push({
        id: `inv-${site.id}-${material.id}`,
        siteId: site.id,
        materialId: material.id,
        quantity,
        lastUpdated: now,
        updatedBy: site.siteManager,
      });
    });
  });
  
  localStorage.setItem(STORAGE_KEYS.SITE_INVENTORY, JSON.stringify(defaultInventory));
}

// ============================================================================
// STOCK TRANSFERS
// ============================================================================

export function getStockTransferRequests(): StockTransferRequest[] {
  const stored = localStorage.getItem(STORAGE_KEYS.TRANSFER_REQUESTS);
  return stored ? JSON.parse(stored) : [];
}

export function saveStockTransferRequest(request: StockTransferRequest): void {
  const requests = getStockTransferRequests();
  const existingIndex = requests.findIndex(r => r.id === request.id);
  
  if (existingIndex >= 0) {
    requests[existingIndex] = request;
  } else {
    requests.push(request);
  }
  
  localStorage.setItem(STORAGE_KEYS.TRANSFER_REQUESTS, JSON.stringify(requests));
}

export function generateTransferRequestNumber(): string {
  const requests = getStockTransferRequests();
  const year = new Date().getFullYear();
  const count = requests.filter(r => r.requestNumber.startsWith(`TR-${year}`)).length;
  return `TR-${year}-${String(count + 1).padStart(4, '0')}`;
}

// ============================================================================
// INVENTORY TRANSACTIONS
// ============================================================================

export function getInventoryTransactions(): InventoryTransaction[] {
  const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  return stored ? JSON.parse(stored) : [];
}

export function saveInventoryTransaction(transaction: InventoryTransaction): void {
  const transactions = getInventoryTransactions();
  transactions.push(transaction);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initializeInventorySystem(): void {
  initializeDefaultSites();
  initializeDefaultMaterials();
  initializeDefaultInventory();
}
