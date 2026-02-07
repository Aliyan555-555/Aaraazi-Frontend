import { PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptItem } from '../types';

const STORAGE_KEYS = {
  PURCHASE_ORDERS: 'estatemanager_purchase_orders',
  GRNS: 'estatemanager_grns',
};

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

export function getPurchaseOrders(): PurchaseOrder[] {
  const stored = localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
  return stored ? JSON.parse(stored) : [];
}

export function savePurchaseOrder(po: PurchaseOrder): void {
  const orders = getPurchaseOrders();
  const existingIndex = orders.findIndex(o => o.id === po.id);
  
  if (existingIndex >= 0) {
    orders[existingIndex] = po;
  } else {
    orders.push(po);
  }
  
  localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(orders));
}

export function getPurchaseOrderById(id: string): PurchaseOrder | null {
  const orders = getPurchaseOrders();
  return orders.find(o => o.id === id) || null;
}

export function generatePONumber(): string {
  const orders = getPurchaseOrders();
  const year = new Date().getFullYear();
  const count = orders.filter(o => o.poNumber.startsWith(`PO-${year}`)).length;
  return `PO-${year}-${String(count + 1).padStart(4, '0')}`;
}

export function initializeDefaultPurchaseOrders(): void {
  const existing = getPurchaseOrders();
  if (existing.length > 0) return;

  const defaultOrders: PurchaseOrder[] = [
    {
      id: 'po-1',
      poNumber: 'PO-2025-0001',
      supplierId: 'supplier-1',
      supplierName: 'Karachi Cement Suppliers',
      siteId: 'site-1',
      siteName: 'DHA City Project',
      orderDate: '2025-09-15',
      expectedDeliveryDate: '2025-09-20',
      status: 'approved',
      items: [
        {
          id: 'poi-1',
          materialId: 'mat-1',
          materialCode: 'CEM-001',
          materialName: 'Cement (OPC 53 Grade)',
          unit: 'bags',
          orderedQuantity: 1000,
          receivedQuantity: 0,
          unitPrice: 850,
          totalPrice: 850000,
        },
        {
          id: 'poi-2',
          materialId: 'mat-3',
          materialCode: 'BRK-001',
          materialName: 'Red Bricks (Class A)',
          unit: 'pcs',
          orderedQuantity: 50000,
          receivedQuantity: 0,
          unitPrice: 15,
          totalPrice: 750000,
        },
      ],
      subtotal: 1600000,
      taxRate: 17,
      taxAmount: 272000,
      total: 1872000,
      paymentTerms: '30 days net',
      deliveryAddress: 'DHA City Project Site, Karachi',
      notes: 'Delivery to be made in two batches',
      approvedBy: 'admin-1',
      approvedDate: '2025-09-15',
      createdBy: 'admin-1',
      createdAt: new Date('2025-09-15').toISOString(),
      updatedAt: new Date('2025-09-15').toISOString(),
    },
    {
      id: 'po-2',
      poNumber: 'PO-2025-0002',
      supplierId: 'supplier-2',
      supplierName: 'Premium Steel Works',
      siteId: 'site-2',
      siteName: 'Bahria Town Site',
      orderDate: '2025-09-18',
      expectedDeliveryDate: '2025-09-25',
      status: 'approved',
      items: [
        {
          id: 'poi-3',
          materialId: 'mat-2',
          materialCode: 'STL-001',
          materialName: 'Steel Rebar 12mm',
          unit: 'ton',
          orderedQuantity: 20,
          receivedQuantity: 0,
          unitPrice: 185000,
          totalPrice: 3700000,
        },
        {
          id: 'poi-4',
          materialId: 'mat-10',
          materialCode: 'STL-002',
          materialName: 'Steel Rebar 16mm',
          unit: 'ton',
          orderedQuantity: 15,
          receivedQuantity: 0,
          unitPrice: 187000,
          totalPrice: 2805000,
        },
      ],
      subtotal: 6505000,
      taxRate: 17,
      taxAmount: 1105850,
      total: 7610850,
      paymentTerms: '45 days net',
      deliveryAddress: 'Bahria Town Construction Site, Karachi',
      notes: 'Quality certificate required with delivery',
      approvedBy: 'admin-1',
      approvedDate: '2025-09-18',
      createdBy: 'admin-1',
      createdAt: new Date('2025-09-18').toISOString(),
      updatedAt: new Date('2025-09-18').toISOString(),
    },
    {
      id: 'po-3',
      poNumber: 'PO-2025-0003',
      supplierId: 'supplier-3',
      supplierName: 'Elite Building Materials',
      siteId: 'site-1',
      siteName: 'DHA City Project',
      orderDate: '2025-09-20',
      expectedDeliveryDate: '2025-09-27',
      status: 'approved',
      items: [
        {
          id: 'poi-5',
          materialId: 'mat-4',
          materialCode: 'SND-001',
          materialName: 'Fine Sand (Ravi)',
          unit: 'cft',
          orderedQuantity: 2000,
          receivedQuantity: 0,
          unitPrice: 65,
          totalPrice: 130000,
        },
        {
          id: 'poi-6',
          materialId: 'mat-5',
          materialCode: 'AGG-001',
          materialName: 'Coarse Aggregates',
          unit: 'cft',
          orderedQuantity: 1500,
          receivedQuantity: 0,
          unitPrice: 75,
          totalPrice: 112500,
        },
      ],
      subtotal: 242500,
      taxRate: 17,
      taxAmount: 41225,
      total: 283725,
      paymentTerms: '15 days net',
      deliveryAddress: 'DHA City Project Site, Karachi',
      createdBy: 'admin-1',
      createdAt: new Date('2025-09-20').toISOString(),
      updatedAt: new Date('2025-09-20').toISOString(),
    },
  ];

  localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(defaultOrders));
}

// ============================================================================
// GOODS RECEIPT NOTES
// ============================================================================

export function getGoodsReceiptNotes(): GoodsReceiptNote[] {
  const stored = localStorage.getItem(STORAGE_KEYS.GRNS);
  return stored ? JSON.parse(stored) : [];
}

export function saveGoodsReceiptNote(grn: GoodsReceiptNote): void {
  const grns = getGoodsReceiptNotes();
  const existingIndex = grns.findIndex(g => g.id === grn.id);
  
  if (existingIndex >= 0) {
    grns[existingIndex] = grn;
  } else {
    grns.push(grn);
  }
  
  localStorage.setItem(STORAGE_KEYS.GRNS, JSON.stringify(grns));
  
  // Update the PO received quantities if GRN is approved
  if (grn.status === 'approved') {
    updatePOReceivedQuantities(grn);
  }
}

export function getGoodsReceiptNoteById(id: string): GoodsReceiptNote | null {
  const grns = getGoodsReceiptNotes();
  return grns.find(g => g.id === id) || null;
}

export function generateGRNNumber(): string {
  const grns = getGoodsReceiptNotes();
  const year = new Date().getFullYear();
  const count = grns.filter(g => g.grnNumber.startsWith(`GRN-${year}`)).length;
  return `GRN-${year}-${String(count + 1).padStart(4, '0')}`;
}

function updatePOReceivedQuantities(grn: GoodsReceiptNote): void {
  const po = getPurchaseOrderById(grn.purchaseOrderId);
  if (!po) return;

  // Update received quantities
  po.items.forEach(poItem => {
    const grnItem = grn.items.find(gi => gi.materialId === poItem.materialId);
    if (grnItem && grnItem.qualityCheck === 'accepted') {
      poItem.receivedQuantity += grnItem.acceptedQuantity || grnItem.receivedQuantity;
    } else if (grnItem && grnItem.qualityCheck === 'partially-accepted') {
      poItem.receivedQuantity += grnItem.acceptedQuantity || 0;
    }
  });

  // Update PO status
  const totalOrdered = po.items.reduce((sum, item) => sum + item.orderedQuantity, 0);
  const totalReceived = po.items.reduce((sum, item) => sum + item.receivedQuantity, 0);

  if (totalReceived >= totalOrdered) {
    po.status = 'fully-received';
  } else if (totalReceived > 0) {
    po.status = 'partially-received';
  }

  po.updatedAt = new Date().toISOString();
  savePurchaseOrder(po);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initializeGRNSystem(): void {
  initializeDefaultPurchaseOrders();
}
