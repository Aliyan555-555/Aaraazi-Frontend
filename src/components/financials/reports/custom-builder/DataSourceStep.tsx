/**
 * DataSourceStep Component
 * 
 * Step 1 of custom report builder - Select data sources.
 * Allows users to choose one or more data sources for the report.
 * 
 * Design System V4.1 Compliant
 */

import React from 'react';
import { ReportConfiguration, DataSource } from '../../../../types/custom-reports';
import { User } from '../../../../types';
import { 
  DollarSign, 
  Building2, 
  Receipt, 
  Percent, 
  Users, 
  Target,
  BookOpen,
  Check
} from 'lucide-react';

interface DataSourceStepProps {
  config: Partial<ReportConfiguration>;
  onChange: (updates: Partial<ReportConfiguration>) => void;
  user: User;
}

interface SourceOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

export const DataSourceStep: React.FC<DataSourceStepProps> = ({
  config,
  onChange,
  user,
}) => {
  const sources: SourceOption[] = [
    {
      id: 'deals',
      label: 'Deals',
      description: 'Sales transactions, commissions, and deal lifecycle data',
      icon: <DollarSign className="h-6 w-6" />,
      available: true,
    },
    {
      id: 'properties',
      label: 'Properties',
      description: 'Property listings, prices, areas, and ownership information',
      icon: <Building2 className="h-6 w-6" />,
      available: true,
    },
    {
      id: 'expenses',
      label: 'Expenses',
      description: 'Business expenses, bills, and payables',
      icon: <Receipt className="h-6 w-6" />,
      available: true,
    },
    {
      id: 'commissions',
      label: 'Commissions',
      description: 'Agent commissions and payment tracking',
      icon: <Percent className="h-6 w-6" />,
      available: true,
    },
    {
      id: 'investors',
      label: 'Investors',
      description: 'Investor information and distribution data',
      icon: <Users className="h-6 w-6" />,
      available: true,
    },
    {
      id: 'budgets',
      label: 'Budgets',
      description: 'Budget categories, actuals, and variance tracking',
      icon: <Target className="h-6 w-6" />,
      available: true,
    },
    {
      id: 'ledger',
      label: 'General Ledger',
      description: 'Journal entries, accounts, and double-entry bookkeeping',
      icon: <BookOpen className="h-6 w-6" />,
      available: false, // Coming soon
    },
  ];

  const selectedSources = config.dataSources?.map(s => s.source) || [];

  const handleToggleSource = (sourceId: string) => {
    const isSelected = selectedSources.includes(sourceId as any);
    
    let newSources: DataSource[];
    
    if (isSelected) {
      // Remove source
      newSources = config.dataSources?.filter(s => s.source !== sourceId) || [];
    } else {
      // Add source
      newSources = [
        ...(config.dataSources || []),
        { source: sourceId as any }
      ];
    }
    
    onChange({ dataSources: newSources });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-gray-900">Select Data Sources</h3>
        <p className="text-gray-600">
          Choose one or more data sources to include in your report. You can combine data from multiple sources.
        </p>
      </div>

      {/* Source Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map(source => (
          <button
            key={source.id}
            onClick={() => source.available && handleToggleSource(source.id)}
            disabled={!source.available}
            className={`
              relative p-6 border-2 rounded-lg text-left transition-all
              ${selectedSources.includes(source.id as any)
                ? 'border-blue-600 bg-blue-50'
                : source.available
                ? 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              }
            `}
          >
            {/* Selection Indicator */}
            {selectedSources.includes(source.id as any) && (
              <div className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}

            {/* Coming Soon Badge */}
            {!source.available && (
              <div className="absolute top-4 right-4 px-2 py-1 bg-gray-200 rounded text-xs text-gray-600">
                Coming Soon
              </div>
            )}

            {/* Icon */}
            <div className={`
              inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3
              ${selectedSources.includes(source.id as any)
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
              }
            `}>
              {source.icon}
            </div>

            {/* Label and Description */}
            <div className="space-y-1">
              <div className={`
                ${selectedSources.includes(source.id as any)
                  ? 'text-blue-900'
                  : 'text-gray-900'
                }
              `}>
                {source.label}
              </div>
              <p className="text-sm text-gray-600">
                {source.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Selection Summary */}
      {selectedSources.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-green-900">
                {selectedSources.length} data source{selectedSources.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-sm text-green-700 mt-1">
                Your report will include data from:{' '}
                {selectedSources.map(s => 
                  sources.find(src => src.id === s)?.label
                ).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {selectedSources.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-yellow-900">
                Please select at least one data source to continue
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pro Tip */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full flex-shrink-0">
            <span className="text-xs text-blue-600">💡</span>
          </div>
          <div>
            <p className="text-blue-900 mb-1">Pro Tip</p>
            <p className="text-sm text-blue-700">
              You can combine multiple data sources to create comprehensive reports. 
              For example, combine Deals + Properties to analyze property performance by deal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import AlertCircle for validation warning
import { AlertCircle } from 'lucide-react';