/**
 * Inventory Management Types
 */

export interface ConstructionSite {
  id: string;
  name: string;
  projectId: string;
  location: string;
  status: "active" | "inactive" | "completed";
  siteManager: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMaterial {
  id: string;
  materialCode: string;
  materialName: string;
  category: string;
  unit: string;
  minStockLevel: number;
  reorderLevel: number;
  standardCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface SiteInventory {
  id: string;
  siteId: string;
  materialId: string;
  quantity: number;
  lastUpdated: string;
  updatedBy: string;
}

export interface StockTransferItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  requestedQuantity: number;
  availableQuantity: number;
  approvedQuantity?: number;
}

export interface StockTransferRequest {
  id: string;
  requestNumber: string;
  transferFrom: string;
  transferTo: string;
  requestedBy: string;
  requestedDate: string;
  requiredByDate: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "in-transit"
    | "completed"
    | "cancelled";
  items: StockTransferItem[];
  notes?: string;
  approvedBy?: string;
  approvedDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  siteId: string;
  materialId: string;
  transactionType:
    | "receipt"
    | "issue"
    | "transfer-in"
    | "transfer-out"
    | "adjustment";
  quantity: number;
  balanceAfter: number;
  referenceType?: "purchase" | "stock-transfer" | "adjustment" | "consumption";
  referenceId?: string;
  performedBy: string;
  notes?: string;
  createdAt: string;
}
