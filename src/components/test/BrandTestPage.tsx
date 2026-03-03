import React from 'react';
import { Check, X, AlertTriangle, Info, TrendingUp, Home, User, DollarSign, Calendar } from 'lucide-react';

/**
 * Brand Test Page - Visual showcase of the new aaraazi design system
 * 
 * Displays:
 * - Color palette swatches
 * - Typography hierarchy
 * - Button variations
 * - Badge/status components
 * - Card layouts with proper spacing
 * - Form inputs
 * - Table styling
 * - Spacing examples
 */
export function BrandTestPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6">
        <h1 className="text-2xl font-semibold text-slate-700">
          aaraazi Brand Design System </h1>
        <p className="text-sm text-slate-400 mt-1">
          Visual test page for the new brand colors, typography, and spacing
        </p>
      </div>

      {/* Main Content */}
      <div className="p-8 md:p-10 lg:p-12 space-y-12">
        
        {/* Color Palettes Section */}
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Color Palettes</h2>
            <p className="text-sm text-slate-400">
              60% Neutral, 30% Slate, 10% Accent (Terracotta & Forest)
            </p>
          </div>

          {/* Terracotta Palette */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              Terracotta - Primary Accent (10%)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { name: '50', hex: '#FDF5F2', bg: 'bg-[#FDF5F2]', text: 'text-slate-700' },
                { name: '100', hex: '#F9E6DD', bg: 'bg-[#F9E6DD]', text: 'text-slate-700' },
                { name: '200', hex: '#E9C4B0', bg: 'bg-[#E9C4B0]', text: 'text-slate-700' },
                { name: '300', hex: '#D99A7E', bg: 'bg-[#D99A7E]', text: 'text-white' },
                { name: '400', hex: '#C17052', bg: 'bg-[#C17052]', text: 'text-white', primary: true },
                { name: '500', hex: '#A85D42', bg: 'bg-[#A85D42]', text: 'text-white' },
                { name: '600', hex: '#8F4A33', bg: 'bg-[#8F4A33]', text: 'text-white' },
                { name: '700', hex: '#6D3825', bg: 'bg-[#6D3825]', text: 'text-white' },
              ].map((color) => (
                <div key={color.name} className="space-y-2">
                  <div className={`${color.bg} ${color.text} h-20 rounded-lg flex items-center justify-center font-medium relative ${color.primary ? 'ring-2 ring-slate-700' : ''}`}>
                    {color.name}
                    {color.primary && (
                      <div className="absolute -top-2 -right-2 bg-slate-700 text-white text-xs px-2 py-1 rounded">
                        PRIMARY
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 text-center">{color.hex}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Forest Green Palette */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              Forest Green - Success & Growth (10%)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { name: '50', hex: '#F2F7F5', bg: 'bg-[#F2F7F5]', text: 'text-slate-700' },
                { name: '100', hex: '#DFF0E9', bg: 'bg-[#DFF0E9]', text: 'text-slate-700' },
                { name: '200', hex: '#B3D9C8', bg: 'bg-[#B3D9C8]', text: 'text-slate-700' },
                { name: '300', hex: '#7AB89D', bg: 'bg-[#7AB89D]', text: 'text-white' },
                { name: '400', hex: '#2D6A54', bg: 'bg-[#2D6A54]', text: 'text-white', primary: true },
                { name: '500', hex: '#255745', bg: 'bg-[#255745]', text: 'text-white' },
                { name: '600', hex: '#1E4637', bg: 'bg-[#1E4637]', text: 'text-white' },
                { name: '700', hex: '#163529', bg: 'bg-[#163529]', text: 'text-white' },
              ].map((color) => (
                <div key={color.name} className="space-y-2">
                  <div className={`${color.bg} ${color.text} h-20 rounded-lg flex items-center justify-center font-medium relative ${color.primary ? 'ring-2 ring-slate-700' : ''}`}>
                    {color.name}
                    {color.primary && (
                      <div className="absolute -top-2 -right-2 bg-slate-700 text-white text-xs px-2 py-1 rounded">
                        SUCCESS
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 text-center">{color.hex}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Neutral Palette */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              Neutral - Backgrounds & Space (60%)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { name: '0', hex: '#FFFFFF', bg: 'bg-[#FFFFFF]', text: 'text-slate-700', border: true },
                { name: '50', hex: '#FAFAF9', bg: 'bg-[#FAFAF9]', text: 'text-slate-700' },
                { name: '100', hex: '#F5F4F1', bg: 'bg-[#F5F4F1]', text: 'text-slate-700' },
                { name: '200', hex: '#E8E2D5', bg: 'bg-[#E8E2D5]', text: 'text-slate-700', primary: true },
                { name: '300', hex: '#D4CFC3', bg: 'bg-[#D4CFC3]', text: 'text-slate-700' },
                { name: '400', hex: '#B8B3A8', bg: 'bg-[#B8B3A8]', text: 'text-white' },
                { name: '500', hex: '#8C8780', bg: 'bg-[#8C8780]', text: 'text-white' },
              ].map((color) => (
                <div key={color.name} className="space-y-2">
                  <div className={`${color.bg} ${color.text} h-20 rounded-lg flex items-center justify-center font-medium relative ${color.border ? 'border border-slate-200' : ''} ${color.primary ? 'ring-2 ring-slate-700' : ''}`}>
                    {color.name}
                    {color.primary && (
                      <div className="absolute -top-2 -right-2 bg-slate-700 text-white text-xs px-2 py-1 rounded">
                        CREAM
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 text-center">{color.hex}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Slate Palette */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              Slate - Text & UI Elements (30%)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { name: '50', hex: '#F8F9FA', bg: 'bg-[#F8F9FA]', text: 'text-slate-700' },
                { name: '100', hex: '#E2E5E8', bg: 'bg-[#E2E5E8]', text: 'text-slate-700' },
                { name: '200', hex: '#C5CBD1', bg: 'bg-[#C5CBD1]', text: 'text-slate-700' },
                { name: '300', hex: '#A8B1BA', bg: 'bg-[#A8B1BA]', text: 'text-white' },
                { name: '400', hex: '#6B7580', bg: 'bg-[#6B7580]', text: 'text-white' },
                { name: '500', hex: '#363F47', bg: 'bg-[#363F47]', text: 'text-white', primary: true },
                { name: '600', hex: '#2D353C', bg: 'bg-[#2D353C]', text: 'text-white' },
                { name: '700', hex: '#1A1D1F', bg: 'bg-[#1A1D1F]', text: 'text-white', primary: true },
              ].map((color) => (
                <div key={color.name} className="space-y-2">
                  <div className={`${color.bg} ${color.text} h-20 rounded-lg flex items-center justify-center font-medium relative ${color.primary ? 'ring-2 ring-[#C17052]' : ''}`}>
                    {color.name}
                    {color.primary && (
                      <div className="absolute -top-2 -right-2 bg-[#C17052] text-white text-xs px-2 py-1 rounded">
                        BRAND
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 text-center">{color.hex}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Typography System</h2>
            <p className="text-sm text-slate-400">Inter font family with proper hierarchy</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="border-b border-neutral-200 pb-4">
                <h1 className="text-[1.875rem] font-semibold text-slate-700">
                  H1 Heading - Dashboard Overview
                </h1>
                <p className="text-xs text-slate-400 mt-1">text-2xl (26.25px) • font-semibold (600) • slate-700</p>
              </div>
              
              <div className="border-b border-neutral-200 pb-4">
                <h2 className="text-[1.5rem] font-semibold text-slate-700">
                  H2 Heading - Section Title
                </h2>
                <p className="text-xs text-slate-400 mt-1">text-xl (21px) • font-semibold (600) • slate-700</p>
              </div>
              
              <div className="border-b border-neutral-200 pb-4">
                <h3 className="text-[1.25rem] font-semibold text-slate-700">
                  H3 Heading - Subsection
                </h3>
                <p className="text-xs text-slate-400 mt-1">text-lg (17.5px) • font-semibold (600) • slate-700</p>
              </div>
              
              <div className="border-b border-neutral-200 pb-4">
                <h4 className="text-[1rem] font-semibold text-slate-700">
                  H4 Heading - Card Title
                </h4>
                <p className="text-xs text-slate-400 mt-1">text-base (14px) • font-semibold (600) • slate-700</p>
              </div>
              
              <div className="border-b border-neutral-200 pb-4">
                <h5 className="text-[0.875rem] font-semibold text-slate-600 uppercase tracking-wide">
                  H5 Heading - Label
                </h5>
                <p className="text-xs text-slate-400 mt-1">text-sm (12.25px) • font-semibold (600) • slate-600 • uppercase</p>
              </div>
              
              <div className="border-b border-neutral-200 pb-4">
                <p className="text-[1rem] font-normal text-slate-600">
                  Body text - This is the default paragraph text used throughout the application. It should be easily readable and comfortable for long-form content.
                </p>
                <p className="text-xs text-slate-400 mt-1">text-base (14px) • font-normal (400) • slate-600</p>
              </div>
              
              <div className="border-b border-neutral-200 pb-4">
                <p className="text-[0.875rem] text-slate-400">
                  Small text - Used for secondary information, helper text, and captions.
                </p>
                <p className="text-xs text-slate-400 mt-1">text-sm (12.25px) • font-normal (400) • slate-400</p>
              </div>
              
              <div>
                <p className="text-[0.75rem] text-slate-400">
                  Tiny text - Used for badges, tiny labels, and minimal UI elements.
                </p>
                <p className="text-xs text-slate-400 mt-1">text-xs (10.5px) • font-normal (400) • slate-400</p>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Button Components</h2>
            <p className="text-sm text-slate-400">All button variations with proper styling</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <div className="space-y-6">
              {/* Primary Buttons */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Primary (Terracotta)</h4>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-[#C17052] text-white hover:bg-[#A85D42] active:bg-[#8F4A33] px-6 py-3 rounded-lg font-medium transition-all">
                    Add Property
                  </button>
                  <button className="bg-[#C17052] text-white hover:bg-[#A85D42] active:bg-[#8F4A33] px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Add Property
                  </button>
                  <button className="bg-[#C17052] text-white px-6 py-3 rounded-lg font-medium opacity-50 cursor-not-allowed">
                    Disabled
                  </button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Secondary (Slate)</h4>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-[#E2E5E8] text-[#1A1D1F] hover:bg-[#C5CBD1] active:bg-[#A8B1BA] px-6 py-3 rounded-lg font-medium transition-all">
                    Cancel
                  </button>
                  <button className="bg-[#E2E5E8] text-[#1A1D1F] hover:bg-[#C5CBD1] active:bg-[#A8B1BA] px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2">
                    <User className="w-4 h-4" />
                    View Profile
                  </button>
                </div>
              </div>

              {/* Success Buttons */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Success (Forest Green)</h4>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-[#2D6A54] text-white hover:bg-[#255745] active:bg-[#1E4637] px-6 py-3 rounded-lg font-medium transition-all">
                    Approve
                  </button>
                  <button className="bg-[#2D6A54] text-white hover:bg-[#255745] active:bg-[#1E4637] px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Confirm
                  </button>
                </div>
              </div>

              {/* Destructive Buttons */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Destructive (Error)</h4>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-[#DC2626] text-white hover:bg-[#B91C1C] px-6 py-3 rounded-lg font-medium transition-all">
                    Delete
                  </button>
                  <button className="bg-[#DC2626] text-white hover:bg-[#B91C1C] px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>

              {/* Outline Buttons */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Outline</h4>
                <div className="flex flex-wrap gap-4">
                  <button className="border-2 border-[#D4CFC3] text-[#1A1D1F] hover:bg-[#F5F4F1] px-6 py-3 rounded-lg font-medium transition-all">
                    View Details
                  </button>
                  <button className="border-2 border-[#C17052] text-[#C17052] hover:bg-[#FDF5F2] px-6 py-3 rounded-lg font-medium transition-all">
                    Learn More
                  </button>
                </div>
              </div>

              {/* Ghost Buttons */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Ghost</h4>
                <div className="flex flex-wrap gap-4">
                  <button className="text-[#6B7580] hover:bg-[#F5F4F1] px-6 py-3 rounded-lg font-medium transition-all">
                    Skip
                  </button>
                  <button className="text-[#C17052] hover:bg-[#FDF5F2] px-6 py-3 rounded-lg font-medium transition-all">
                    View All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Status Badges</h2>
            <p className="text-sm text-slate-400">Semantic color badges for different states</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Property Statuses</h4>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F2F7F5] text-[#163529] border border-[#B3D9C8]">
                    Available
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E8E2D5] text-[#6B7580] border border-[#D4CFC3]">
                    Sold
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FDF5F2] text-[#6D3825] border border-[#E9C4B0]">
                    Pending
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E2E5E8] text-[#6B7580] border border-[#C5CBD1]">
                    Archived
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Lead Statuses</h4>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE]">
                    New
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FDF5F2] text-[#6D3825] border border-[#E9C4B0]">
                    Contacted
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F2F7F5] text-[#163529] border border-[#B3D9C8]">
                    Qualified
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                    Negotiation
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E8E2D5] text-[#6B7580] border border-[#D4CFC3]">
                    Closed
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Alert Badges</h4>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F2F7F5] text-[#163529] border border-[#B3D9C8]">
                    <Check className="w-3 h-3 mr-1" />
                    Success
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Warning
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                    <X className="w-3 h-3 mr-1" />
                    Error
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE]">
                    <Info className="w-3 h-3 mr-1" />
                    Info
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Card Layouts</h2>
            <p className="text-sm text-slate-400">Cards with proper spacing (24px padding)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Property Card */}
            <div className="bg-white border border-[#E8E2D5] rounded-lg shadow-sm overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-[#C17052] to-[#A85D42]"></div>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-[#1A1D1F]">Modern Villa</h4>
                    <p className="text-sm text-[#6B7580] mt-1">DHA Phase 8, Karachi</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F2F7F5] text-[#163529] border border-[#B3D9C8]">
                    Available
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7580]">Price</span>
                    <span className="font-medium text-[#1A1D1F]">PKR 5,000,000</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7580]">Area</span>
                    <span className="font-medium text-[#1A1D1F]">500 sq yd</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7580]">Type</span>
                    <span className="font-medium text-[#1A1D1F]">Residential</span>
                  </div>
                </div>
                <button className="w-full bg-[#C17052] text-white hover:bg-[#A85D42] px-4 py-2.5 rounded-lg font-medium transition-all">
                  View Details
                </button>
              </div>
            </div>

            {/* Metric Card */}
            <div className="bg-white border border-[#E8E2D5] rounded-lg shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-[#F2F7F5] p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-[#2D6A54]" />
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#F2F7F5] text-[#163529]">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </span>
              </div>
              <div>
                <p className="text-sm text-[#6B7580]">Total Revenue</p>
                <p className="text-2xl font-semibold text-[#1A1D1F] mt-1">PKR 10M</p>
              </div>
              <p className="text-xs text-[#6B7580]">
                <span className="font-medium text-[#2D6A54]">+PKR 1.2M</span> from last month
              </p>
            </div>

            {/* Info Card */}
            <div className="bg-white border border-[#E8E2D5] rounded-lg shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#FDF5F2] p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-[#C17052]" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#1A1D1F]">Upcoming Viewings</h4>
                  <p className="text-sm text-[#6B7580]">This week</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[#E8E2D5]">
                  <span className="text-sm text-[#363F47]">Modern Villa</span>
                  <span className="text-xs text-[#6B7580]">Tomorrow, 2 PM</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E8E2D5]">
                  <span className="text-sm text-[#363F47]">Beach House</span>
                  <span className="text-xs text-[#6B7580]">Wed, 10 AM</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[#363F47]">Downtown Apt</span>
                  <span className="text-xs text-[#6B7580]">Fri, 4 PM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Inputs Section */}
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Form Components</h2>
            <p className="text-sm text-slate-400">Inputs with proper styling and spacing</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Text Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A1D1F]">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter property name"
                    className="w-full bg-[#F5F4F1] border border-[#D4CFC3] text-[#1A1D1F] placeholder:text-[#6B7580] focus:border-[#C17052] focus:ring-2 focus:ring-[#C17052]/20 px-4 py-2.5 rounded-lg outline-none transition-all"
                  />
                  <p className="text-xs text-[#6B7580]">This will appear in property listings</p>
                </div>

                {/* Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A1D1F]">
                    Property Type *
                  </label>
                  <select className="w-full bg-[#F5F4F1] border border-[#D4CFC3] text-[#1A1D1F] focus:border-[#C17052] focus:ring-2 focus:ring-[#C17052]/20 px-4 py-2.5 rounded-lg outline-none transition-all">
                    <option>Select type</option>
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Land</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Number Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A1D1F]">
                    Price (PKR)
                  </label>
                  <input
                    type="number"
                    placeholder="5000000"
                    className="w-full bg-[#F5F4F1] border border-[#D4CFC3] text-[#1A1D1F] placeholder:text-[#6B7580] focus:border-[#C17052] focus:ring-2 focus:ring-[#C17052]/20 px-4 py-2.5 rounded-lg outline-none transition-all"
                  />
                </div>

                {/* Number Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A1D1F]">
                    Area (sq yd)
                  </label>
                  <input
                    type="number"
                    placeholder="500"
                    className="w-full bg-[#F5F4F1] border border-[#D4CFC3] text-[#1A1D1F] placeholder:text-[#6B7580] focus:border-[#C17052] focus:ring-2 focus:ring-[#C17052]/20 px-4 py-2.5 rounded-lg outline-none transition-all"
                  />
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A1D1F]">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter property description..."
                  className="w-full bg-[#F5F4F1] border border-[#D4CFC3] text-[#1A1D1F] placeholder:text-[#6B7580] focus:border-[#C17052] focus:ring-2 focus:ring-[#C17052]/20 px-4 py-2.5 rounded-lg outline-none transition-all resize-none"
                ></textarea>
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  className="w-4 h-4 rounded border-[#D4CFC3] text-[#C17052] focus:ring-[#C17052] focus:ring-offset-0"
                />
                <label htmlFor="featured" className="text-sm text-[#363F47]">
                  Mark as featured property
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-[#E8E2D5]">
                <button
                  type="submit"
                  className="bg-[#C17052] text-white hover:bg-[#A85D42] px-6 py-3 rounded-lg font-medium transition-all"
                >
                  Save Property
                </button>
                <button
                  type="button"
                  className="bg-[#E2E5E8] text-[#1A1D1F] hover:bg-[#C5CBD1] px-6 py-3 rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Table Section */}
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Table Components</h2>
            <p className="text-sm text-slate-400">Data tables with proper styling</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F4F1] border-b-2 border-[#D4CFC3]">
                <tr>
                  <th className="text-left text-[#1A1D1F] font-semibold px-6 py-4 text-sm">Property</th>
                  <th className="text-left text-[#1A1D1F] font-semibold px-6 py-4 text-sm">Location</th>
                  <th className="text-left text-[#1A1D1F] font-semibold px-6 py-4 text-sm">Status</th>
                  <th className="text-left text-[#1A1D1F] font-semibold px-6 py-4 text-sm">Price</th>
                  <th className="text-right text-[#1A1D1F] font-semibold px-6 py-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-[#FAFAF9] border-b border-[#E8E2D5] transition-colors">
                  <td className="text-[#363F47] px-6 py-4 text-sm">Modern Villa</td>
                  <td className="text-[#6B7580] px-6 py-4 text-sm">DHA Phase 8</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F2F7F5] text-[#163529] border border-[#B3D9C8]">
                      Available
                    </span>
                  </td>
                  <td className="text-[#1A1D1F] font-medium px-6 py-4 text-sm">PKR 5,000,000</td>
                  <td className="text-right px-6 py-4">
                    <button className="text-[#C17052] hover:text-[#A85D42] text-sm font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#FAFAF9] border-b border-[#E8E2D5] transition-colors">
                  <td className="text-[#363F47] px-6 py-4 text-sm">Beach House</td>
                  <td className="text-[#6B7580] px-6 py-4 text-sm">Clifton Block 8</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E8E2D5] text-[#6B7580] border border-[#D4CFC3]">
                      Sold
                    </span>
                  </td>
                  <td className="text-[#1A1D1F] font-medium px-6 py-4 text-sm">PKR 8,500,000</td>
                  <td className="text-right px-6 py-4">
                    <button className="text-[#C17052] hover:text-[#A85D42] text-sm font-medium">
                      View
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#FAFAF9] border-b border-[#E8E2D5] transition-colors">
                  <td className="text-[#363F47] px-6 py-4 text-sm">Downtown Apartment</td>
                  <td className="text-[#6B7580] px-6 py-4 text-sm">Saddar</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FDF5F2] text-[#6D3825] border border-[#E9C4B0]">
                      Pending
                    </span>
                  </td>
                  <td className="text-[#1A1D1F] font-medium px-6 py-4 text-sm">PKR 3,200,000</td>
                  <td className="text-right px-6 py-4">
                    <button className="text-[#C17052] hover:text-[#A85D42] text-sm font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#FAFAF9] transition-colors">
                  <td className="text-[#363F47] px-6 py-4 text-sm">Commercial Plot</td>
                  <td className="text-[#6B7580] px-6 py-4 text-sm">Bahria Town</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F2F7F5] text-[#163529] border border-[#B3D9C8]">
                      Available
                    </span>
                  </td>
                  <td className="text-[#1A1D1F] font-medium px-6 py-4 text-sm">PKR 12,000,000</td>
                  <td className="text-right px-6 py-4">
                    <button className="text-[#C17052] hover:text-[#A85D42] text-sm font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Spacing Examples */}
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Spacing System</h2>
            <p className="text-sm text-slate-400">Increased spacing for better breathing room</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Card Padding: 24px (space-6)</h4>
              <div className="border-2 border-dashed border-[#C17052] p-6 bg-[#FDF5F2]">
                <div className="bg-white border border-[#E8E2D5] p-6 rounded-lg">
                  <p className="text-sm text-[#363F47]">This card has 24px padding instead of the old 16px</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Section Gaps: 32-40px (space-8 to space-10)</h4>
              <div className="space-y-8 border-2 border-dashed border-[#2D6A54] p-4 bg-[#F2F7F5]">
                <div className="bg-white border border-[#E8E2D5] p-4 rounded-lg">
                  <p className="text-sm text-[#363F47]">Section 1</p>
                </div>
                <div className="bg-white border border-[#E8E2D5] p-4 rounded-lg">
                  <p className="text-sm text-[#363F47]">Section 2 (32px gap above)</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Element Gaps: 16-24px (space-4 to space-6)</h4>
              <div className="space-y-4 border-2 border-dashed border-[#6B7580] p-4 bg-[#F8F9FA]">
                <div className="bg-white border border-[#E8E2D5] p-3 rounded-lg">
                  <p className="text-sm text-[#363F47]">Element 1</p>
                </div>
                <div className="bg-white border border-[#E8E2D5] p-3 rounded-lg">
                  <p className="text-sm text-[#363F47]">Element 2 (16px gap above)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 60-30-10 Visual Example */}
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">60-30-10 Color Rule</h2>
            <p className="text-sm text-slate-400">Visual demonstration of color proportions</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="bg-[#FAFAF9] border border-[#E8E2D5] p-8 rounded-lg text-center">
                  <p className="text-4xl font-bold text-[#1A1D1F]">60%</p>
                  <p className="text-sm font-medium text-[#363F47] mt-2">Neutral</p>
                  <p className="text-xs text-[#6B7580] mt-1">Backgrounds & Space</p>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-[#FFFFFF] rounded"></div>
                  <div className="h-2 bg-[#FAFAF9] rounded"></div>
                  <div className="h-2 bg-[#F5F4F1] rounded"></div>
                  <div className="h-2 bg-[#E8E2D5] rounded"></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-[#E2E5E8] border border-[#C5CBD1] p-8 rounded-lg text-center">
                  <p className="text-4xl font-bold text-[#1A1D1F]">30%</p>
                  <p className="text-sm font-medium text-[#363F47] mt-2">Slate</p>
                  <p className="text-xs text-[#6B7580] mt-1">Text & UI Elements</p>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-[#6B7580] rounded"></div>
                  <div className="h-2 bg-[#363F47] rounded"></div>
                  <div className="h-2 bg-[#2D353C] rounded"></div>
                  <div className="h-2 bg-[#1A1D1F] rounded"></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-[#C17052] border border-[#A85D42] p-8 rounded-lg text-center">
                  <p className="text-4xl font-bold text-white">10%</p>
                  <p className="text-sm font-medium text-white mt-2">Accent</p>
                  <p className="text-xs text-[#FDF5F2] mt-1">CTAs & Highlights</p>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-[#C17052] rounded"></div>
                  <div className="h-2 bg-[#2D6A54] rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="bg-white border-t border-neutral-200 px-8 py-6 mt-12">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            aaraazi Brand Design System • January 2026
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">Built with Inter font</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-400">60-30-10 color ratio</span>
          </div>
        </div>
      </div>
    </div>
  );
}
