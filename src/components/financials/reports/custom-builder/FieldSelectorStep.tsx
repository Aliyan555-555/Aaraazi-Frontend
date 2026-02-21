/**
 * FieldSelectorStep Component
 * 
 * Step 2 of custom report builder - Select fields to include in report.
 * Two-column layout with available fields and selected fields.
 * 
 * Design System Compliant
 */

import React, { useMemo, useState } from 'react';
import { ReportConfiguration, SelectedField, AvailableField } from '../../../../types/custom-reports';
import { User } from '../../../../types';
import { getAvailableFields } from '../../../../lib/custom-report-builder';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { 
  ChevronRight, 
  X, 
  Search,
  AlertCircle,
  Check,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface FieldSelectorStepProps {
  config: Partial<ReportConfiguration>;
  onChange: (updates: Partial<ReportConfiguration>) => void;
  user: User;
}

export const FieldSelectorStep: React.FC<FieldSelectorStepProps> = ({
  config,
  onChange,
  user,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all available fields based on selected data sources
  const availableFields = useMemo(() => {
    const sources = config.dataSources || [];
    let allFields: AvailableField[] = [];
    
    sources.forEach(source => {
      const fields = getAvailableFields(source.source);
      allFields = [...allFields, ...fields];
    });
    
    return allFields;
  }, [config.dataSources]);

  // Filter available fields by search query
  const filteredAvailableFields = useMemo(() => {
    if (!searchQuery.trim()) return availableFields;
    
    const query = searchQuery.toLowerCase();
    return availableFields.filter(field =>
      field.label.toLowerCase().includes(query) ||
      field.field.toLowerCase().includes(query) ||
      field.source.toLowerCase().includes(query)
    );
  }, [availableFields, searchQuery]);

  const selectedFields = config.fields || [];

  // Check if field is already selected
  const isFieldSelected = (fieldId: string): boolean => {
    return selectedFields.some(f => f.id === fieldId);
  };

  // Add field to selection
  const handleAddField = (field: AvailableField) => {
    if (isFieldSelected(field.id)) return;
    
    const newField: SelectedField = {
      id: field.id,
      source: field.source,
      field: field.field,
      label: field.label,
      type: field.type,
    };
    
    onChange({ fields: [...selectedFields, newField] });
  };

  // Remove field from selection
  const handleRemoveField = (fieldId: string) => {
    onChange({ 
      fields: selectedFields.filter(f => f.id !== fieldId) 
    });
  };

  // Move field up in order
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    const newFields = [...selectedFields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    onChange({ fields: newFields });
  };

  // Move field down in order
  const handleMoveDown = (index: number) => {
    if (index === selectedFields.length - 1) return;
    
    const newFields = [...selectedFields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    onChange({ fields: newFields });
  };

  // Add all fields from a source
  const handleAddAllFromSource = (sourceName: string) => {
    const sourceFields = availableFields.filter(f => 
      f.source === sourceName && !isFieldSelected(f.id)
    );
    
    const newFields: SelectedField[] = sourceFields.map(field => ({
      id: field.id,
      source: field.source,
      field: field.field,
      label: field.label,
      type: field.type,
    }));
    
    onChange({ fields: [...selectedFields, ...newFields] });
  };

  // Group available fields by source
  const fieldsBySource = useMemo(() => {
    const grouped: { [source: string]: AvailableField[] } = {};
    
    filteredAvailableFields.forEach(field => {
      if (!grouped[field.source]) {
        grouped[field.source] = [];
      }
      grouped[field.source].push(field);
    });
    
    return grouped;
  }, [filteredAvailableFields]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-gray-900">Select Fields</h3>
        <p className="text-gray-600">
          Choose the fields you want to include in your report. You can reorder fields after adding them.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search fields..."
          className="pl-10"
        />
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Available Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-gray-900">Available Fields</h4>
            <span className="text-sm text-gray-500">
              {filteredAvailableFields.length} fields
            </span>
          </div>

          <div className="border rounded-lg h-96 overflow-y-auto">
            {Object.entries(fieldsBySource).map(([source, fields]) => (
              <div key={source} className="border-b last:border-b-0">
                {/* Source Header */}
                <div className="sticky top-0 bg-gray-50 px-4 py-2 flex items-center justify-between border-b">
                  <span className="text-sm text-gray-700 capitalize">{source}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddAllFromSource(source)}
                    className="h-6 px-2 text-xs"
                  >
                    Add All
                  </Button>
                </div>

                {/* Fields */}
                <div className="p-2 space-y-1">
                  {fields.map(field => (
                    <button
                      key={field.id}
                      onClick={() => handleAddField(field)}
                      disabled={isFieldSelected(field.id)}
                      className={`
                        w-full px-3 py-2 rounded text-left transition-colors
                        ${isFieldSelected(field.id)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'hover:bg-blue-50 hover:text-blue-900'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm">{field.label}</div>
                          <div className="text-xs text-gray-500">{field.type}</div>
                        </div>
                        {!isFieldSelected(field.id) && (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                        {isFieldSelected(field.id) && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredAvailableFields.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <p>No fields found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-gray-900">Selected Fields</h4>
            <span className="text-sm text-gray-500">
              {selectedFields.length} selected
            </span>
          </div>

          <div className="border rounded-lg h-96 overflow-y-auto p-2">
            {selectedFields.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <p>No fields selected</p>
                  <p className="text-sm mt-1">Click on fields to add them</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg group"
                  >
                    {/* Order Number */}
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded text-xs text-blue-700">
                      {index + 1}
                    </div>

                    {/* Field Info */}
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{field.label}</div>
                      <div className="text-xs text-gray-500">
                        {field.source} • {field.type}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Move Up */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>

                      {/* Move Down */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === selectedFields.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>

                      {/* Remove */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveField(field.id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Warning */}
      {selectedFields.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-yellow-900">
                Please select at least one field to continue
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
              The order of fields determines the column order in your report. 
              Use the arrow buttons to reorder fields after adding them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};