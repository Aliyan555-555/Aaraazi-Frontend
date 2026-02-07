/**
 * PDF Export Utility for aaraazi
 * Generates professional PDF documents for payment records, receipts, and schedules
 */

import { Deal, PaymentInstallment, DealPayment } from '../types';
import { formatPKR } from './currency';
import { exportPaymentRecord } from './dealPayments';

/**
 * Generate Payment Schedule PDF (browser-based HTML print)
 * This creates a print-friendly HTML view that can be saved as PDF using browser print
 */
export function generatePaymentSchedulePDF(dealId: string): void {
  const exportData = exportPaymentRecord(dealId);
  
  if (!exportData) {
    throw new Error('Failed to export payment data');
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Please allow popups to generate PDF');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Schedule - ${exportData.dealNumber}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #030213;
        }
        
        .header {
          border-bottom: 3px solid #030213;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          font-size: 24pt;
          font-weight: 500;
          margin-bottom: 10px;
        }
        
        .header .deal-number {
          font-size: 14pt;
          color: #666;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 14pt;
          font-weight: 500;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ececf0;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px 30px;
          margin-bottom: 20px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 9pt;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }
        
        .info-value {
          font-size: 11pt;
          font-weight: 500;
        }
        
        .summary-boxes {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .summary-box {
          border: 1px solid #ececf0;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        
        .summary-box.highlight {
          background-color: #f8f9fa;
          border-color: #030213;
        }
        
        .summary-label {
          font-size: 9pt;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .summary-value {
          font-size: 18pt;
          font-weight: 500;
        }
        
        .summary-value.paid {
          color: #22c55e;
        }
        
        .summary-value.pending {
          color: #f97316;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        th {
          background-color: #030213;
          color: white;
          padding: 12px 10px;
          text-align: left;
          font-weight: 500;
          font-size: 10pt;
        }
        
        td {
          padding: 10px;
          border-bottom: 1px solid #ececf0;
          font-size: 10pt;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 8pt;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .status-paid {
          background-color: #dcfce7;
          color: #15803d;
        }
        
        .status-pending {
          background-color: #fed7aa;
          color: #c2410c;
        }
        
        .status-overdue {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .status-partial {
          background-color: #fef3c7;
          color: #a16207;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ececf0;
          font-size: 9pt;
          color: #666;
          text-align: center;
        }
        
        .watermark {
          position: fixed;
          bottom: 20mm;
          right: 20mm;
          font-size: 8pt;
          color: #ccc;
          text-align: right;
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
      <!-- Header -->
      <div class="header">
        <h1>Payment Schedule</h1>
        <div class="deal-number">${exportData.dealNumber}</div>
      </div>
      
      <!-- Deal Information -->
      <div class="section">
        <h2 class="section-title">Transaction Details</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Property</div>
            <div class="info-value">${exportData.property.address}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Agreed Price</div>
            <div class="info-value">${formatPKR(exportData.agreedPrice)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Seller</div>
            <div class="info-value">${exportData.seller.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Buyer</div>
            <div class="info-value">${exportData.buyer.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Primary Agent</div>
            <div class="info-value">${exportData.agents.primary.name}</div>
          </div>
          ${exportData.agents.secondary ? `
          <div class="info-item">
            <div class="info-label">Secondary Agent</div>
            <div class="info-value">${exportData.agents.secondary.name}</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Payment Summary -->
      <div class="section">
        <h2 class="section-title">Payment Summary</h2>
        <div class="summary-boxes">
          <div class="summary-box highlight">
            <div class="summary-label">Total Amount</div>
            <div class="summary-value">${formatPKR(exportData.summary.totalAmount)}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Amount Paid</div>
            <div class="summary-value paid">${formatPKR(exportData.summary.totalPaid)}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Balance Due</div>
            <div class="summary-value pending">${formatPKR(exportData.summary.totalPending)}</div>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Payment Status</div>
            <div class="info-value">${exportData.summary.paymentPlanStatus.replace('-', ' ').toUpperCase()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Completion</div>
            <div class="info-value">${exportData.summary.percentagePaid.toFixed(1)}%</div>
          </div>
          ${exportData.summary.overduePayments.length > 0 ? `
          <div class="info-item">
            <div class="info-label">Overdue Payments</div>
            <div class="info-value" style="color: #b91c1c;">${exportData.summary.overduePayments.length}</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Installment Schedule -->
      ${exportData.plan ? `
      <div class="section">
        <h2 class="section-title">Installment Schedule</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">#</th>
              <th style="width: 30%;">Description</th>
              <th style="width: 15%;">Amount</th>
              <th style="width: 15%;">Due Date</th>
              <th style="width: 15%;">Paid</th>
              <th style="width: 17%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${exportData.plan.installments.map(inst => {
              const statusClass = 
                inst.status === 'paid' ? 'status-paid' :
                inst.status === 'overdue' ? 'status-overdue' :
                inst.status === 'partial' ? 'status-partial' :
                'status-pending';
              
              return `
                <tr>
                  <td>${inst.sequence}</td>
                  <td>${inst.description}</td>
                  <td>${formatPKR(inst.amount)}</td>
                  <td>${new Date(inst.dueDate).toLocaleDateString()}</td>
                  <td>${inst.paidAmount > 0 ? formatPKR(inst.paidAmount) : '-'}</td>
                  <td><span class="status-badge ${statusClass}">${inst.status}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <!-- Payment History -->
      ${exportData.payments.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Payment History</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Date</th>
              <th style="width: 20%;">Type</th>
              <th style="width: 20%;">Amount</th>
              <th style="width: 20%;">Method</th>
              <th style="width: 25%;">Reference</th>
            </tr>
          </thead>
          <tbody>
            ${exportData.payments.map(payment => `
              <tr>
                <td>${new Date(payment.paidDate).toLocaleDateString()}</td>
                <td>${payment.type.replace('-', ' ').toUpperCase()}</td>
                <td>${formatPKR(payment.amount)}</td>
                <td style="text-transform: capitalize;">${payment.paymentMethod.replace('-', ' ')}</td>
                <td>${payment.referenceNumber || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <!-- Modifications History -->
      ${exportData.plan && exportData.plan.modifications.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Modification History</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Date</th>
              <th style="width: 25%;">Type</th>
              <th style="width: 35%;">Reason</th>
              <th style="width: 25%;">Modified By</th>
            </tr>
          </thead>
          <tbody>
            ${exportData.plan.modifications.map(mod => `
              <tr>
                <td>${new Date(mod.modifiedAt).toLocaleDateString()}</td>
                <td style="text-transform: capitalize;">${mod.modificationType.replace('-', ' ')}</td>
                <td>${mod.reason}</td>
                <td>${mod.modifiedByName}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <!-- Footer -->
      <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>aaraazi - Professional Real Estate Management System</p>
      </div>
      
      <!-- Watermark -->
      <div class="watermark">
        aaraazi<br>
        ${exportData.dealNumber}
      </div>
      
      <!-- Print Button (hidden when printing) -->
      <div class="no-print" style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
        <button onclick="window.print()" style="
          background-color: #030213;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11pt;
          font-weight: 500;
        ">
          Print / Save as PDF
        </button>
        <button onclick="window.close()" style="
          background-color: white;
          color: #030213;
          border: 1px solid #ececf0;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11pt;
          font-weight: 500;
          margin-left: 10px;
        ">
          Close
        </button>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Generate Payment Receipt PDF (individual payment)
 */
export function generatePaymentReceiptPDF(dealId: string, paymentId: string): void {
  const exportData = exportPaymentRecord(dealId);
  
  if (!exportData) {
    throw new Error('Failed to export payment data');
  }
  
  const payment = exportData.payments.find(p => p.id === paymentId);
  
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Please allow popups to generate PDF');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${exportData.dealNumber}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #030213;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .receipt-header {
          text-align: center;
          border-bottom: 3px solid #030213;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .receipt-header h1 {
          font-size: 28pt;
          font-weight: 500;
          margin-bottom: 10px;
        }
        
        .receipt-number {
          font-size: 14pt;
          color: #666;
        }
        
        .amount-box {
          background-color: #f8f9fa;
          border: 2px solid #030213;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        
        .amount-label {
          font-size: 12pt;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        
        .amount-value {
          font-size: 36pt;
          font-weight: 500;
          color: #22c55e;
        }
        
        .info-section {
          margin: 30px 0;
        }
        
        .info-row {
          display: flex;
          padding: 12px 0;
          border-bottom: 1px solid #ececf0;
        }
        
        .info-label {
          flex: 0 0 200px;
          font-weight: 500;
          color: #666;
        }
        
        .info-value {
          flex: 1;
        }
        
        .signature-section {
          margin-top: 60px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 40px;
        }
        
        .signature-box {
          text-align: center;
          padding-top: 50px;
          border-top: 2px solid #030213;
        }
        
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #ececf0;
          font-size: 10pt;
          color: #666;
          text-align: center;
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
      <!-- Header -->
      <div class="receipt-header">
        <h1>PAYMENT RECEIPT</h1>
        <div class="receipt-number">Receipt #${payment.id.substring(0, 8).toUpperCase()}</div>
      </div>
      
      <!-- Amount Box -->
      <div class="amount-box">
        <div class="amount-label">Amount Received</div>
        <div class="amount-value">${formatPKR(payment.amount)}</div>
      </div>
      
      <!-- Receipt Details -->
      <div class="info-section">
        <div class="info-row">
          <div class="info-label">Date:</div>
          <div class="info-value">${new Date(payment.paidDate).toLocaleDateString()}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Payment Type:</div>
          <div class="info-value" style="text-transform: capitalize;">${payment.type.replace('-', ' ')}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Payment Method:</div>
          <div class="info-value" style="text-transform: capitalize;">${payment.paymentMethod.replace('-', ' ')}</div>
        </div>
        ${payment.referenceNumber ? `
        <div class="info-row">
          <div class="info-label">Reference Number:</div>
          <div class="info-value">${payment.referenceNumber}</div>
        </div>
        ` : ''}
        ${payment.notes ? `
        <div class="info-row">
          <div class="info-label">Notes:</div>
          <div class="info-value">${payment.notes}</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Deal Information -->
      <div class="info-section">
        <h3 style="margin-bottom: 15px;">Transaction Details</h3>
        <div class="info-row">
          <div class="info-label">Deal Number:</div>
          <div class="info-value">${exportData.dealNumber}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Property:</div>
          <div class="info-value">${exportData.property.address}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Buyer:</div>
          <div class="info-value">${exportData.buyer.name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Seller:</div>
          <div class="info-value">${exportData.seller.name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Recorded By:</div>
          <div class="info-value">${payment.recordedBy.agentName}</div>
        </div>
      </div>
      
      <!-- Signatures -->
      <div class="signature-section">
        <div class="signature-box">
          <div style="font-weight: 500;">Received By</div>
          <div style="font-size: 10pt; color: #666; margin-top: 5px;">${exportData.agents.primary.name}</div>
        </div>
        <div class="signature-box">
          <div style="font-weight: 500;">Paid By</div>
          <div style="font-size: 10pt; color: #666; margin-top: 5px;">${exportData.buyer.name}</div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p>This is a computer-generated receipt and does not require a signature.</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>aaraazi - Professional Real Estate Management System</p>
      </div>
      
      <!-- Print Button -->
      <div class="no-print" style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
        <button onclick="window.print()" style="
          background-color: #030213;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11pt;
          font-weight: 500;
        ">
          Print / Save as PDF
        </button>
        <button onclick="window.close()" style="
          background-color: white;
          color: #030213;
          border: 1px solid #ececf0;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11pt;
          font-weight: 500;
          margin-left: 10px;
        ">
          Close
        </button>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}
