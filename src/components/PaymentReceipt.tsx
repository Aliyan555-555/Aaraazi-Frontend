import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { PaymentTransaction, ScheduledPayment, Property, Transaction } from '../types';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddress } from '../lib/utils';
import { convertNumberToWords } from '../lib/payments';
import { Printer, Download } from 'lucide-react';

interface PaymentReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentTransaction: PaymentTransaction;
  scheduledPayment: ScheduledPayment;
  property: Property;
  transaction: Transaction;
  totalPaid: number;
  totalAmount: number;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  open,
  onOpenChange,
  paymentTransaction,
  scheduledPayment,
  property,
  transaction,
  totalPaid,
  totalAmount
}) => {
  const remainingBalance = totalAmount - totalPaid;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real app, this would generate a PDF
    handlePrint();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Payment Receipt</DialogTitle>
          <DialogDescription>
            Official payment receipt for property transaction
          </DialogDescription>
        </DialogHeader>
        
        {/* Actions Bar */}
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Receipt Content */}
        <div className="bg-white p-8 print:p-0" id="receipt-content">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
            <div>
              <h1 className="text-2xl text-gray-900 mb-2">aaraazi</h1>
              <p className="text-sm text-gray-600">Real Estate Management Solutions</p>
              <p className="text-sm text-gray-600">Karachi, Pakistan</p>
              <p className="text-sm text-gray-600">Phone: +92-XXX-XXXXXXX</p>
              <p className="text-sm text-gray-600">Email: info@aaraazi.pk</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl text-gray-900 mb-2">PAYMENT RECEIPT</h2>
              <div className="text-sm text-gray-600">
                <p>Receipt No: <span className="text-gray-900">{paymentTransaction.receiptNumber}</span></p>
                <p>Date Issued: <span className="text-gray-900">
                  {new Date().toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span></p>
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="mb-6">
            <h3 className="text-sm text-gray-600 mb-2">Property Information</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900">{property.title}</p>
              <p className="text-sm text-gray-600">{formatPropertyAddress(property.address)}</p>
            </div>
          </div>

          {/* Received From */}
          <div className="mb-6">
            <h3 className="text-sm text-gray-600 mb-2">Received From</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900">{transaction.buyerName}</p>
              {transaction.buyerContact && (
                <p className="text-sm text-gray-600">Contact: {transaction.buyerContact}</p>
              )}
              {transaction.buyerEmail && (
                <p className="text-sm text-gray-600">Email: {transaction.buyerEmail}</p>
              )}
            </div>
          </div>

          {/* Payment Details Table */}
          <div className="mb-6">
            <h3 className="text-sm text-gray-600 mb-2">Payment Details</h3>
            <table className="w-full border border-gray-300">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="p-3 bg-gray-50 text-gray-900 w-1/3">Amount Received</td>
                  <td className="p-3 text-gray-900">
                    <p className="mb-1">{formatPKR(paymentTransaction.amountPaid)}</p>
                    <p className="text-sm text-gray-600 italic">
                      ({convertNumberToWords(paymentTransaction.amountPaid)})
                    </p>
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="p-3 bg-gray-50 text-gray-900">Payment Method</td>
                  <td className="p-3 text-gray-900 capitalize">
                    {paymentTransaction.paymentMethod.replace('-', ' ')}
                  </td>
                </tr>
                {paymentTransaction.referenceNumber && (
                  <tr className="border-b border-gray-300">
                    <td className="p-3 bg-gray-50 text-gray-900">
                      {paymentTransaction.paymentMethod === 'cheque' ? 'Cheque No.' : 'Reference No.'}
                    </td>
                    <td className="p-3 text-gray-900">{paymentTransaction.referenceNumber}</td>
                  </tr>
                )}
                <tr className="border-b border-gray-300">
                  <td className="p-3 bg-gray-50 text-gray-900">Payment Date</td>
                  <td className="p-3 text-gray-900">
                    {new Date(paymentTransaction.paymentDate).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 bg-gray-50 text-gray-900">Payment Against</td>
                  <td className="p-3 text-gray-900">
                    {scheduledPayment.title} for Property: {property.title}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {paymentTransaction.notes && (
            <div className="mb-6">
              <h3 className="text-sm text-gray-600 mb-2">Additional Notes</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-900">{paymentTransaction.notes}</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="mb-8">
            <h3 className="text-sm text-gray-600 mb-2">Payment Summary</h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 gap-px bg-gray-300">
                <div className="p-4 bg-white">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-lg text-gray-900">{formatPKR(totalAmount)}</p>
                </div>
                <div className="p-4 bg-white">
                  <p className="text-sm text-gray-600 mb-1">Total Paid to Date</p>
                  <p className="text-lg text-green-600">{formatPKR(totalPaid)}</p>
                </div>
                <div className="p-4 bg-white">
                  <p className="text-sm text-gray-600 mb-1">Remaining Balance</p>
                  <p className="text-lg text-orange-600">{formatPKR(remainingBalance)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t-2 border-gray-300">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-600 italic mb-4">
                  Thank you for your payment!
                </p>
                <p className="text-xs text-gray-500">
                  This is a computer-generated receipt and is valid without signature.
                </p>
              </div>
              <div className="text-center">
                <div className="w-48 border-t border-gray-400 pt-2">
                  <p className="text-sm text-gray-600">Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>

          {/* Print Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 print-only hidden print:block">
            <p>aaraazi - Real Estate Management Solutions</p>
            <p>For queries, please contact us at info@aaraazi.pk or +92-XXX-XXXXXXX</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};