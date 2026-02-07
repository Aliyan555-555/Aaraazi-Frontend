import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Handshake, Building2, Users, ArrowLeft } from 'lucide-react';

interface AcquisitionTypeSelectorProps {
  onSelect: (type: 'client-listing' | 'agency-purchase' | 'investor-purchase') => void;
  onBack: () => void;
}

export const AcquisitionTypeSelector: React.FC<AcquisitionTypeSelectorProps> = ({ onSelect, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-medium text-gray-900">Add Property</h1>
              <p className="text-gray-600 mt-1">How is this property being added?</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Standard Client Listing */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500 group"
            onClick={() => onSelect('client-listing')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                <Handshake className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Standard Client Listing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-base leading-relaxed">
                For properties you are selling on behalf of a client for a commission. This is the traditional agency model.
              </CardDescription>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Commission-based</span>
                    <span className="text-green-600 font-medium">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Client ownership</span>
                    <span className="text-green-600 font-medium">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Agency investment</span>
                    <span className="text-gray-400">—</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6" variant="outline">
                Select This Option
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Purchase for Agency */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-500 group"
            onClick={() => onSelect('agency-purchase')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 transition-colors">
                <Building2 className="h-10 w-10 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Purchase for Agency</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-base leading-relaxed">
                For properties the agency is buying with its own funds to hold and resell. Full ownership and profit potential.
              </CardDescription>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Agency ownership</span>
                    <span className="text-green-600 font-medium">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Agency investment</span>
                    <span className="text-green-600 font-medium">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Full profit retention</span>
                    <span className="text-green-600 font-medium">✓</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6" variant="outline">
                Select This Option
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: Purchase with Investor Funds */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-orange-500 group"
            onClick={() => onSelect('investor-purchase')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-100 transition-colors">
                <Users className="h-10 w-10 text-orange-600" />
              </div>
              <CardTitle className="text-xl">Purchase with Investor Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-base leading-relaxed">
                For properties the agency is purchasing using capital from its investor pool. Shared ownership and profits.
              </CardDescription>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Investor capital</span>
                    <span className="text-green-600 font-medium">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shared ownership</span>
                    <span className="text-green-600 font-medium">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Profit sharing</span>
                    <span className="text-green-600 font-medium">✓</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6" variant="outline">
                Select This Option
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Need Help Choosing?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <p className="font-medium text-blue-900 mb-1">Standard Client Listing</p>
              <p className="text-sm text-blue-800">
                Choose this when a client wants to sell their property through your agency. You earn a commission on the sale.
              </p>
            </div>
            <div>
              <p className="font-medium text-blue-900 mb-1">Purchase for Agency</p>
              <p className="text-sm text-blue-800">
                Choose this when your agency is buying a property as an investment using company funds. You own it 100%.
              </p>
            </div>
            <div>
              <p className="font-medium text-blue-900 mb-1">Purchase with Investor Funds</p>
              <p className="text-sm text-blue-800">
                Choose this when your agency is buying a property using capital from your investor network. Profits are shared.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
