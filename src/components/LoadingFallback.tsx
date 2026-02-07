import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Building2, Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  error?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = "Loading...", 
  error 
}) => {
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Building2 className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};