/**
 * Automated Receipt Generation System
 * Generates unique receipt numbers and manages receipt lifecycle
 * Integrated with flexible payment system
 */

import { DealPayment, Deal } from '../types';
import { getDealById } from './deals';
import { formatPKR } from './currency';

// Receipt metadata stored in localStorage
interface ReceiptMetadata {
  receiptNumber: string;
  paymentId: string;
  dealId: string;
  generatedAt: string;
  generatedBy: string;
  version: number; // For tracking reprints
}

const RECEIPT_COUNTER_KEY = 'estatemanager_receipt_counter';
const RECEIPTS_METADATA_KEY = 'estatemanager_receipts_metadata';

/**
 * Get all receipt metadata
 */
function getAllReceiptMetadata(): ReceiptMetadata[] {
  const data = localStorage.getItem(RECEIPTS_METADATA_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save receipt metadata
 */
function saveReceiptMetadata(metadata: ReceiptMetadata): void {
  const allMetadata = getAllReceiptMetadata();
  const existingIndex = allMetadata.findIndex(m => m.paymentId === metadata.paymentId);
  
  if (existingIndex >= 0) {
    allMetadata[existingIndex] = metadata;
  } else {
    allMetadata.push(metadata);
  }
  
  localStorage.setItem(RECEIPTS_METADATA_KEY, JSON.stringify(allMetadata));
}

/**
 * Generate unique receipt number
 * Format: RCP-YYYY-###
 * Example: RCP-2024-001, RCP-2024-002
 */
export function generateReceiptNumber(): string {
  const currentYear = new Date().getFullYear();
  const counterKey = `${RECEIPT_COUNTER_KEY}_${currentYear}`;
  
  // Get current counter for this year
  const currentCounter = parseInt(localStorage.getItem(counterKey) || '0', 10);
  const nextCounter = currentCounter + 1;
  
  // Save updated counter
  localStorage.setItem(counterKey, nextCounter.toString());
  
  // Format: RCP-2024-001
  const paddedCounter = nextCounter.toString().padStart(3, '0');
  return `RCP-${currentYear}-${paddedCounter}`;
}

/**
 * Auto-generate receipt for a payment
 * Called automatically when payment is recorded
 */
export function autoGenerateReceipt(
  payment: DealPayment,
  deal: Deal,
  generatedBy: string
): string {
  // Generate unique receipt number
  const receiptNumber = generateReceiptNumber();
  
  // Create receipt metadata
  const metadata: ReceiptMetadata = {
    receiptNumber,
    paymentId: payment.id,
    dealId: deal.id,
    generatedAt: new Date().toISOString(),
    generatedBy,
    version: 1,
  };
  
  // Save metadata
  saveReceiptMetadata(metadata);
  
  return receiptNumber;
}

/**
 * Get receipt metadata for a payment
 */
export function getReceiptMetadata(paymentId: string): ReceiptMetadata | null {
  const allMetadata = getAllReceiptMetadata();
  return allMetadata.find(m => m.paymentId === paymentId) || null;
}

/**
 * Check if receipt exists for payment
 */
export function hasReceipt(payment: DealPayment | string): boolean {
  const paymentId = typeof payment === 'string' ? payment : payment.id;
  return getReceiptMetadata(paymentId) !== null;
}

/**
 * Regenerate/reprint receipt (increments version)
 */
export function regenerateReceipt(
  paymentId: string,
  regeneratedBy: string
): ReceiptMetadata | null {
  const metadata = getReceiptMetadata(paymentId);
  
  if (!metadata) {
    return null;
  }
  
  // Increment version for reprint tracking
  metadata.version += 1;
  metadata.generatedAt = new Date().toISOString();
  metadata.generatedBy = regeneratedBy;
  
  saveReceiptMetadata(metadata);
  
  return metadata;
}

/**
 * Generate professional receipt HTML for printing/download
 */
export function generateReceiptHTML(paymentId: string): string | null {
  const metadata = getReceiptMetadata(paymentId);
  
  if (!metadata) {
    return null;
  }
  
  // Get deal and payment data
  const deal = getDealById(metadata.dealId);
  if (!deal) return null;
  
  const payment = deal.financial.payments.find(p => p.id === paymentId);
  if (!payment) return null;
  
  // Get property address (from connected sell cycle)
  const propertyAddress = deal.cycles.sellCycle ? 
    `Property ID: ${deal.cycles.sellCycle.propertyId}` : 
    'Property information unavailable';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${metadata.receiptNumber}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #030213;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .receipt-container {
          border: 3px solid #030213;
          border-radius: 12px;
          padding: 40px;
          background: white;
        }
        
        .receipt-header {
          text-align: center;
          border-bottom: 2px solid #030213;
          padding-bottom: 25px;
          margin-bottom: 35px;
        }
        
        .company-name {
          font-size: 28pt;
          font-weight: 500;
          color: #030213;
          margin-bottom: 5px;
        }
        
        .company-tagline {
          font-size: 11pt;
          color: #666;
          margin-bottom: 15px;
        }
        
        .receipt-title {
          font-size: 32pt;
          font-weight: 500;
          color: #030213;
          margin: 15px 0 10px 0;
          letter-spacing: 2px;
        }
        
        .receipt-number {
          font-size: 16pt;
          color: #666;
          font-weight: 500;
          letter-spacing: 1px;
        }
        
        .amount-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 3px solid #030213;
          border-radius: 12px;
          padding: 35px;
          text-align: center;
          margin: 35px 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .amount-label {
          font-size: 13pt;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 12px;
          font-weight: 500;
        }
        
        .amount-value {
          font-size: 42pt;
          font-weight: 500;
          color: #22c55e;
          letter-spacing: 1px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        
        .amount-words {
          font-size: 11pt;
          color: #666;
          margin-top: 10px;
          font-style: italic;
        }
        
        .details-section {
          margin: 30px 0;
        }
        
        .section-title {
          font-size: 13pt;
          font-weight: 500;
          color: #030213;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .detail-row {
          display: flex;
          padding: 10px 0;
          border-bottom: 1px solid #f1f3f5;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          flex: 0 0 180px;
          font-weight: 500;
          color: #495057;
        }
        
        .detail-value {
          flex: 1;
          color: #212529;
        }
        
        .payment-type-badge {
          display: inline-block;
          background: #dcfce7;
          color: #15803d;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 10pt;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .notes-section {
          background: #fff9e6;
          border-left: 4px solid #fbbf24;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        
        .notes-title {
          font-weight: 500;
          color: #92400e;
          margin-bottom: 5px;
        }
        
        .notes-content {
          color: #78350f;
          font-size: 10pt;
        }
        
        .signature-section {
          margin-top: 60px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 50px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-top: 2px solid #030213;
          padding-top: 12px;
          margin-top: 60px;
        }
        
        .signature-label {
          font-weight: 500;
          color: #030213;
          margin-bottom: 5px;
        }
        
        .signature-name {
          font-size: 10pt;
          color: #666;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 25px;
          border-top: 2px solid #e9ecef;
          text-align: center;
        }
        
        .footer-text {
          font-size: 9pt;
          color: #868e96;
          line-height: 1.8;
        }
        
        .footer-important {
          font-size: 10pt;
          color: #495057;
          font-weight: 500;
          margin-bottom: 10px;
        }
        
        .version-watermark {
          position: fixed;
          bottom: 15mm;
          right: 15mm;
          font-size: 8pt;
          color: #dee2e6;
          text-align: right;
          line-height: 1.4;
        }
        
        .stamp-box {
          border: 2px dashed #ced4da;
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          color: #adb5bd;
          font-size: 10pt;
          margin-top: 30px;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Header -->
        <div class="receipt-header">
          <div class="company-name">AARAAZI</div>
          <div class="company-tagline">Professional Real Estate Management</div>
          <div class="receipt-title">PAYMENT RECEIPT</div>
          <div class="receipt-number">${metadata.receiptNumber}</div>
          ${metadata.version > 1 ? `<div style="font-size: 9pt; color: #e74c3c; margin-top: 5px;">DUPLICATE COPY - Version ${metadata.version}</div>` : ''}
        </div>
        
        <!-- Amount Section -->
        <div class="amount-section">
          <div class="amount-label">Amount Received</div>
          <div class="amount-value">${formatPKR(payment.amount)}</div>
          <div class="amount-words">${numberToWords(payment.amount)} Rupees Only</div>
        </div>
        
        <!-- Payment Details -->
        <div class="details-section">
          <div class="section-title">Payment Information</div>
          <div class="detail-row">
            <div class="detail-label">Date of Payment:</div>
            <div class="detail-value">${new Date(payment.paidDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Payment Type:</div>
            <div class="detail-value">
              <span class="payment-type-badge">${payment.type.replace('-', ' ')}</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Payment Method:</div>
            <div class="detail-value" style="text-transform: capitalize;">${payment.paymentMethod.replace('-', ' ')}</div>
          </div>
          ${payment.referenceNumber ? `
          <div class="detail-row">
            <div class="detail-label">Reference Number:</div>
            <div class="detail-value">${payment.referenceNumber}</div>
          </div>
          ` : ''}
          <div class="detail-row">
            <div class="detail-label">Payment Status:</div>
            <div class="detail-value" style="text-transform: capitalize; color: #22c55e; font-weight: 500;">${payment.status}</div>
          </div>
        </div>
        
        <!-- Transaction Details -->
        <div class="details-section">
          <div class="section-title">Transaction Details</div>
          <div class="detail-row">
            <div class="detail-label">Deal Number:</div>
            <div class="detail-value">${deal.dealNumber}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Property:</div>
            <div class="detail-value">${propertyAddress}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Total Agreed Price:</div>
            <div class="detail-value">${formatPKR(deal.financial.agreedPrice)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Total Paid to Date:</div>
            <div class="detail-value" style="color: #22c55e; font-weight: 500;">${formatPKR(deal.financial.totalPaid)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Balance Remaining:</div>
            <div class="detail-value" style="color: #f97316; font-weight: 500;">${formatPKR(deal.financial.balanceRemaining)}</div>
          </div>
        </div>
        
        <!-- Parties -->
        <div class="details-section">
          <div class="section-title">Parties Involved</div>
          <div class="detail-row">
            <div class="detail-label">Received From:</div>
            <div class="detail-value">
              <strong>${deal.parties.buyer.name}</strong><br>
              ${deal.parties.buyer.contact ? `<span style="font-size: 10pt; color: #666;">${deal.parties.buyer.contact}</span>` : ''}
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Received By:</div>
            <div class="detail-value">
              <strong>${deal.agents.primary.name}</strong> (Primary Agent)<br>
              <span style="font-size: 10pt; color: #666;">On behalf of ${deal.parties.seller.name}</span>
            </div>
          </div>
          ${deal.agents.secondary ? `
          <div class="detail-row">
            <div class="detail-label">Buyer's Agent:</div>
            <div class="detail-value"><strong>${deal.agents.secondary.name}</strong> (Secondary Agent)</div>
          </div>
          ` : ''}
        </div>
        
        <!-- Notes -->
        ${payment.notes ? `
        <div class="notes-section">
          <div class="notes-title">Payment Notes:</div>
          <div class="notes-content">${payment.notes}</div>
        </div>
        ` : ''}
        
        <!-- Stamp Box -->
        <div class="stamp-box">
          OFFICIAL STAMP<br>
          (If applicable)
        </div>
        
        <!-- Signatures -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">
              <div class="signature-label">Received By</div>
              <div class="signature-name">${deal.agents.primary.name}</div>
              <div class="signature-name" style="font-size: 9pt; margin-top: 3px;">${new Date(payment.paidDate).toLocaleDateString()}</div>
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line">
              <div class="signature-label">Paid By</div>
              <div class="signature-name">${deal.parties.buyer.name}</div>
              <div class="signature-name" style="font-size: 9pt; margin-top: 3px;">${new Date(payment.paidDate).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-important">
            This is an official payment receipt issued by aaraazi.
          </div>
          <div class="footer-text">
            Receipt generated on ${new Date(metadata.generatedAt).toLocaleDateString()} at ${new Date(metadata.generatedAt).toLocaleTimeString()}<br>
            Generated by: ${metadata.generatedBy}<br>
            For queries, please contact your real estate agent or property manager.
          </div>
        </div>
        
        <!-- Watermark -->
        <div class="version-watermark">
          ${metadata.receiptNumber}<br>
          Payment ID: ${payment.id.substring(0, 8)}<br>
          Version ${metadata.version}
        </div>
      </div>
      
      <!-- Print Button -->
      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="
          background-color: #030213;
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12pt;
          font-weight: 500;
          margin-right: 10px;
        ">
          🖨️ Print Receipt
        </button>
        <button onclick="window.close()" style="
          background-color: white;
          color: #030213;
          border: 2px solid #ececf0;
          padding: 14px 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12pt;
          font-weight: 500;
        ">
          Close
        </button>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

/**
 * Open receipt in new window for printing/downloading
 */
export function viewReceipt(paymentId: string): void {
  const html = generateReceiptHTML(paymentId);
  
  if (!html) {
    throw new Error('Receipt not found or unable to generate');
  }
  
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Please allow popups to view receipt');
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Download receipt as HTML file
 */
export function downloadReceipt(paymentId: string): void {
  const metadata = getReceiptMetadata(paymentId);
  
  if (!metadata) {
    throw new Error('Receipt not found');
  }
  
  const html = generateReceiptHTML(paymentId);
  
  if (!html) {
    throw new Error('Unable to generate receipt');
  }
  
  // Create blob and download
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${metadata.receiptNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert number to words (Pakistani Rupee context)
 * Simplified version for receipt generation
 */
function numberToWords(amount: number): string {
  if (amount === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  }
  
  // Handle Pakistani numbering system (Crore, Lakh, Thousand)
  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const remainder = Math.floor(amount % 1000);
  
  let result = '';
  
  if (crore > 0) {
    result += convertLessThanThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertLessThanThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertLessThanThousand(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    result += convertLessThanThousand(remainder);
  }
  
  return result.trim();
}

/**
 * Get receipt statistics
 */
export function getReceiptStats(): {
  totalReceipts: number;
  receiptsThisYear: number;
  receiptsThisMonth: number;
} {
  const allMetadata = getAllReceiptMetadata();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  return {
    totalReceipts: allMetadata.length,
    receiptsThisYear: allMetadata.filter(m => {
      const receiptDate = new Date(m.generatedAt);
      return receiptDate.getFullYear() === currentYear;
    }).length,
    receiptsThisMonth: allMetadata.filter(m => {
      const receiptDate = new Date(m.generatedAt);
      return receiptDate.getFullYear() === currentYear && receiptDate.getMonth() === currentMonth;
    }).length,
  };
}