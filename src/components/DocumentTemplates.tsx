import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import {
  DOCUMENT_TEMPLATES,
  DocumentTemplate,
  getTemplatesByCategory,
  getTemplateById,
  getTemplateCategories,
  generateDocument
} from '../lib/documentTemplates';
import {
  FileText,
  Download,
  Copy,
  Check,
  FileEdit,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentTemplatesProps {
  onBack: () => void;
}

export const DocumentTemplates: React.FC<DocumentTemplatesProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentTemplate['category'] | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const categories = getTemplateCategories();
  
  const filteredTemplates = selectedCategory === 'all' 
    ? DOCUMENT_TEMPLATES 
    : getTemplatesByCategory(selectedCategory);

  const getCategoryColor = (category: DocumentTemplate['category']) => {
    const colors = {
      agreement: 'bg-blue-100 text-blue-800 border-blue-300',
      letter: 'bg-green-100 text-green-800 border-green-300',
      receipt: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      report: 'bg-purple-100 text-purple-800 border-purple-300',
      marketing: 'bg-pink-100 text-pink-800 border-pink-300',
      legal: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[category];
  };

  const handleGenerateClick = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      agencyName: 'aaraazi Agency',
      agentName: '',
      agentPhone: '',
      agentEmail: ''
    });
    setGeneratedContent('');
    setShowGenerateModal(true);
  };

  const handleGenerate = () => {
    if (!selectedTemplate) return;

    const result = generateDocument(selectedTemplate, formData);

    if (!result.success) {
      toast.error(`Missing required fields: ${result.missingFields?.join(', ')}`);
      return;
    }

    setGeneratedContent(result.content || '');
    toast.success('Document generated successfully!');
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success('Document copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.name.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document downloaded!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl text-gray-900">Document Templates</h1>
            <p className="text-sm text-gray-600 mt-1">
              Pre-built templates for common real estate documents
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Category Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Category:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Templates ({DOCUMENT_TEMPLATES.length})
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.value)}
                  >
                    {cat.label} ({getTemplatesByCategory(cat.value).length})
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <FileEdit className="h-5 w-5 text-blue-600" />
                  <Badge variant="outline" className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                </div>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Required Fields:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.requiredFields.slice(0, 3).map((field, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                      {template.requiredFields.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.requiredFields.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleGenerateClick(template)}
                    className="w-full"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">No templates found in this category</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Generate Modal */}
      {selectedTemplate && (
        <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">{selectedTemplate.name}</DialogTitle>
              <DialogDescription>{selectedTemplate.description}</DialogDescription>
            </DialogHeader>

            {!generatedContent ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Fill in the required fields to generate the document:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.requiredFields.map(field => (
                    <div key={field}>
                      <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <Input
                        value={formData[field] || ''}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        placeholder={`Enter ${field}`}
                      />
                    </div>
                  ))}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerate}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600">Document generated successfully!</span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap text-gray-900">
                    {generatedContent}
                  </pre>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedContent('');
                      setFormData({});
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Another
                  </Button>
                  <Button variant="outline" onClick={handleCopyToClipboard}>
                    {copied ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
