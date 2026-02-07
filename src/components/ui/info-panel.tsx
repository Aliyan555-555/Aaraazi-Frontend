/**
 * InfoPanel - Data-dense information display component
 * 
 * Features:
 * - Label-value pairs in grid layout
 * - Adjustable columns (1, 2, 3, 4)
 * - Density modes (compact, comfortable, spacious)
 * - Copyable values
 * - Icon support
 * - Section title
 * - Responsive
 * 
 * Usage:
 * <InfoPanel
 *   title="Property Information"
 *   data={[
 *     { label: 'Address', value: '123 Main St', copyable: true },
 *     { label: 'Price', value: formatPKR(5000000), icon: <DollarSign /> },
 *   ]}
 *   columns={2}
 *   density="comfortable"
 * />
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './button';
import { toast } from 'sonner';

export interface InfoPanelItem {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  copyable?: boolean;
  href?: string;
  onClick?: () => void;
}

export interface InfoPanelProps {
  title?: string;
  data: InfoPanelItem[];
  columns?: 1 | 2 | 3 | 4;
  density?: 'compact' | 'comfortable' | 'spacious';
  className?: string;
  showDivider?: boolean;
}

export function InfoPanel({
  title,
  data,
  columns = 2,
  density = 'comfortable',
  className = '',
  showDivider = true,
}: InfoPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Density classes
  const densityClasses = {
    compact: 'gap-3 py-3',
    comfortable: 'gap-4 py-4',
    spacious: 'gap-6 py-6',
  };

  const itemPaddingClasses = {
    compact: 'py-1.5',
    comfortable: 'py-2',
    spacious: 'py-3',
  };

  // Handle copy
  const handleCopy = async (value: React.ReactNode, index: number) => {
    try {
      const textValue = typeof value === 'string' ? value : String(value);
      await navigator.clipboard.writeText(textValue);
      setCopiedIndex(index);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  // Grid columns class
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Title */}
      {title && (
        <div className={`px-6 py-3 border-b border-gray-200 ${showDivider ? '' : 'border-b-0'}`}>
          <h3 className="font-medium text-[#030213]">{title}</h3>
        </div>
      )}

      {/* Content */}
      <div className={`px-6 ${densityClasses[density]}`}>
        <div className={`grid ${gridColsClass} gap-x-8`}>
          {data.map((item, index) => (
            <div
              key={index}
              className={`${itemPaddingClasses[density]} ${index < data.length - columns && showDivider
                  ? 'border-b border-gray-100'
                  : ''
                }`}
            >
              {/* Label */}
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                {item.icon && <span className="text-gray-400">{item.icon}</span>}
                <span>{item.label}</span>
              </div>

              {/* Value */}
              <div className="flex items-center justify-between gap-2">
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-sm text-[#030213] hover:text-blue-600 transition-colors font-medium"
                    onClick={item.onClick}
                  >
                    {item.value}
                  </a>
                ) : item.onClick ? (
                  <button
                    onClick={item.onClick}
                    className="text-sm text-[#030213] hover:text-blue-600 transition-colors font-medium text-left"
                  >
                    {item.value}
                  </button>
                ) : (
                  <div className="text-sm text-[#030213] font-medium flex-1">
                    {item.value}
                  </div>
                )}

                {/* Copy button */}
                {item.copyable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopy(item.value, index)}
                    aria-label="Copy value"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-400" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
