import React from 'react';
import { Card, CardContent, CardHeader } from './card';

/**
 * Loading Skeleton Components
 * Reusable loading states for better UX
 */

// ============================================================================
// BASE SKELETON
// ============================================================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClass = 'bg-gray-200';
  const animationClass = animation === 'pulse' ? 'animate-pulse' : '';
  
  const variantClass = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }[variant];

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClass} ${variantClass} ${animationClass} ${className}`}
      style={style}
    />
  );
};

// ============================================================================
// PROPERTY CARD SKELETON
// ============================================================================

export const PropertyCardSkeleton: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Image */}
          <Skeleton variant="rectangular" height={200} />
          
          {/* Title */}
          <Skeleton variant="text" width="80%" />
          
          {/* Address */}
          <Skeleton variant="text" width="60%" />
          
          {/* Price and Details */}
          <div className="flex items-center justify-between">
            <Skeleton variant="text" width={100} />
            <Skeleton variant="text" width={80} />
          </div>
          
          {/* Tags */}
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={60} height={24} />
            <Skeleton variant="rectangular" width={80} height={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// TABLE SKELETON
// ============================================================================

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / columns}%`} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-3 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width={`${100 / columns}%`} />
          ))}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// LEAD CARD SKELETON
// ============================================================================

export const LeadCardSkeleton: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="50%" />
            </div>
            <Skeleton variant="rectangular" width={80} height={24} />
          </div>
          
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={60} height={20} />
            <Skeleton variant="rectangular" width={70} height={20} />
          </div>
          
          <Skeleton variant="text" width="90%" />
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// DASHBOARD STATS SKELETON
// ============================================================================

export const DashboardStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width={80} height={32} />
              <Skeleton variant="text" width="40%" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ============================================================================
// ANALYTICS CHART SKELETON
// ============================================================================

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
  return (
    <Card>
      <CardHeader>
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="50%" />
      </CardHeader>
      <CardContent>
        <Skeleton variant="rectangular" height={height} />
      </CardContent>
    </Card>
  );
};

// ============================================================================
// FORM SKELETON
// ============================================================================

interface FormSkeletonProps {
  fields?: number;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ fields = 6 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width={100} />
          <Skeleton variant="rectangular" height={40} />
        </div>
      ))}
      
      <div className="flex gap-3 pt-4">
        <Skeleton variant="rectangular" width={100} height={36} />
        <Skeleton variant="rectangular" width={100} height={36} />
      </div>
    </div>
  );
};

// ============================================================================
// LIST SKELETON
// ============================================================================

interface ListSkeletonProps {
  items?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
          <Skeleton variant="rectangular" width={60} height={24} />
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// DETAIL PAGE SKELETON
// ============================================================================

export const DetailPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="text" width="30%" />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={80} height={24} />
          <Skeleton variant="rectangular" width={100} height={24} />
        </div>
      </div>
      
      {/* Image Gallery */}
      <Skeleton variant="rectangular" height={400} />
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton variant="text" width="40%" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton variant="text" width={100} />
                  <Skeleton variant="text" width={120} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton variant="text" width="40%" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton variant="text" width={100} />
                  <Skeleton variant="text" width={120} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// CALENDAR SKELETON
// ============================================================================

export const CalendarSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={150} />
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={32} height={32} />
            <Skeleton variant="rectangular" width={32} height={32} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} variant="text" className="text-center" />
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// TIMELINE SKELETON
// ============================================================================

export const TimelineSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Skeleton variant="circular" width={12} height={12} />
            {i < items - 1 && (
              <div className="w-0.5 h-16 bg-gray-200" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="40%" className="mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};
