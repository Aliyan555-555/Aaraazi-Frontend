import React, { useMemo, useState } from 'react';
import { Property } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { formatCurrency } from '../lib/currency';
import {
  getPriceTrends,
  getMarketStatistics,
  getMarketVelocity,
  getPriceDistribution,
  getMarketTrendDirection,
  getAveragePricePerUnit
} from '../lib/marketTrends';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Calendar,
  MapPin,
  Home,
  Activity,
  BarChart3
} from 'lucide-react';

interface MarketTrendsChartProps {
  selectedPropertyType?: 'house' | 'apartment' | 'commercial' | 'land';
  selectedCity?: string;
}

export const MarketTrendsChart: React.FC<MarketTrendsChartProps> = ({
  selectedPropertyType,
  selectedCity
}) => {
  const [timeRange, setTimeRange] = useState<'3' | '6' | '12' | '24'>('12');
  const [propertyType, setPropertyType] = useState<string>(selectedPropertyType || 'all');
  const [city, setCity] = useState<string>(selectedCity || 'all');

  // Get market data
  const priceTrends = useMemo(() => {
    return getPriceTrends(
      parseInt(timeRange),
      propertyType === 'all' ? undefined : propertyType as any,
      city === 'all' ? undefined : city
    );
  }, [timeRange, propertyType, city]);

  const marketStats = useMemo(() => {
    return getMarketStatistics(
      propertyType === 'all' ? undefined : propertyType as any,
      city === 'all' ? undefined : city
    );
  }, [propertyType, city]);

  const marketVelocity = useMemo(() => {
    return getMarketVelocity(
      propertyType === 'all' ? undefined : propertyType as any,
      city === 'all' ? undefined : city
    );
  }, [propertyType, city]);

  const priceDistribution = useMemo(() => {
    return getPriceDistribution(
      propertyType === 'all' ? undefined : propertyType as any,
      city === 'all' ? undefined : city
    );
  }, [propertyType, city]);

  const trendDirection = useMemo(() => {
    return getMarketTrendDirection(
      parseInt(timeRange),
      propertyType === 'all' ? undefined : propertyType as any,
      city === 'all' ? undefined : city
    );
  }, [timeRange, propertyType, city]);

  const pricePerUnit = useMemo(() => {
    return getAveragePricePerUnit(
      propertyType === 'all' ? undefined : propertyType as any,
      city === 'all' ? undefined : city
    );
  }, [propertyType, city]);

  const formatMonth = (monthStr: any) => {
    if (!monthStr || typeof monthStr !== 'string') return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const COLORS = ['#030213', '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Get trend icon and color
  const getTrendIcon = () => {
    if (trendDirection.trend === 'rising') {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    } else if (trendDirection.trend === 'falling') {
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    } else {
      return <Minus className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    if (trendDirection.trend === 'rising') return 'text-green-600';
    if (trendDirection.trend === 'falling') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-500" />
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="house">Houses</SelectItem>
                  <SelectItem value="apartment">Apartments</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="Karachi">Karachi</SelectItem>
                  <SelectItem value="Lahore">Lahore</SelectItem>
                  <SelectItem value="Islamabad">Islamabad</SelectItem>
                  <SelectItem value="Rawalpindi">Rawalpindi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 Months</SelectItem>
                  <SelectItem value="6">Last 6 Months</SelectItem>
                  <SelectItem value="12">Last 12 Months</SelectItem>
                  <SelectItem value="24">Last 24 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">Market Trend</p>
              {getTrendIcon()}
            </div>
            <p className={`text-2xl mb-1 ${getTrendColor()}`}>
              {trendDirection.trend.charAt(0).toUpperCase() + trendDirection.trend.slice(1)}
            </p>
            <p className="text-xs text-gray-500">
              {trendDirection.changePercentage > 0 ? '+' : ''}
              {trendDirection.changePercentage.toFixed(1)}% ({trendDirection.strength})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">Average Price</p>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl text-gray-900 mb-1">
              {formatCurrency(marketStats.averagePrice)}
            </p>
            <p className="text-xs text-gray-500">
              Median: {formatCurrency(marketStats.medianPrice)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">Days to Sell</p>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl text-gray-900 mb-1">
              {marketVelocity.averageDaysToSell}
            </p>
            <p className="text-xs text-gray-500">
              Median: {marketVelocity.medianDaysToSell} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">Price Per {pricePerUnit.unit}</p>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl text-gray-900 mb-1">
              {formatCurrency(pricePerUnit.averagePricePerUnit)}
            </p>
            <p className="text-xs text-gray-500">
              {pricePerUnit.sampleSize} properties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Velocity Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Market Velocity
          </CardTitle>
          <CardDescription>How quickly properties are selling in this market</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Inventory Turnover</p>
              <p className="text-2xl text-gray-900 mb-1">
                {marketVelocity.inventoryTurnover.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {marketStats.soldProperties} of {marketStats.totalListings} properties sold
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Absorption Rate</p>
              <p className="text-2xl text-gray-900 mb-1">
                {marketVelocity.absorptionRate.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">Properties sold per month</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Active Inventory</p>
              <p className="text-2xl text-gray-900 mb-1">{marketStats.activeListings}</p>
              <p className="text-xs text-gray-500">Currently available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Price Trends Over Time</CardTitle>
          <CardDescription>
            Average and median prices for the last {timeRange} months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {priceTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={priceTrends}>
                <defs>
                  <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#030213" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#030213" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMedian" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={formatMonth}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="averagePrice"
                  stroke="#030213"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAverage)"
                  name="Average Price"
                />
                <Area
                  type="monotone"
                  dataKey="medianPrice"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMedian)"
                  name="Median Price"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No data available for selected filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Price Distribution</CardTitle>
            <CardDescription>Properties by price range</CardDescription>
          </CardHeader>
          <CardContent>
            {priceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="range"
                    stroke="#6b7280"
                    style={{ fontSize: '11px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === 'count') return [value, 'Properties'];
                      return [value + '%', 'Percentage'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#030213" name="Properties" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Per Unit Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Price Per Unit Trend</CardTitle>
            <CardDescription>Average price per {pricePerUnit.unit} over time</CardDescription>
          </CardHeader>
          <CardContent>
            {priceTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={formatMonth}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="averagePricePerUnit"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Price Per Unit"
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Market Insights</CardTitle>
          <CardDescription>Key takeaways from market analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-shrink-0">
                {trendDirection.trend === 'rising' ? (
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                ) : trendDirection.trend === 'falling' ? (
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                ) : (
                  <Minus className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 mb-1">Price Trend</p>
                <p className="text-xs text-gray-600">
                  Prices are {trendDirection.trend} with {trendDirection.strength} momentum (
                  {trendDirection.changePercentage > 0 ? '+' : ''}
                  {trendDirection.changePercentage.toFixed(1)}% over {timeRange} months)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Calendar className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-900 mb-1">Sales Velocity</p>
                <p className="text-xs text-gray-600">
                  Properties are selling in an average of {marketVelocity.averageDaysToSell} days.
                  {marketVelocity.averageDaysToSell < 30 &&
                    ' This is a fast-moving market - price competitively.'}
                  {marketVelocity.averageDaysToSell >= 30 &&
                    marketVelocity.averageDaysToSell < 90 &&
                    ' This is a moderately active market.'}
                  {marketVelocity.averageDaysToSell >= 90 &&
                    ' This is a slower market - consider competitive pricing.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <DollarSign className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-900 mb-1">Price Range</p>
                <p className="text-xs text-gray-600">
                  Market prices range from {formatCurrency(marketStats.priceRange.min)} to{' '}
                  {formatCurrency(marketStats.priceRange.max)}, with an average of{' '}
                  {formatCurrency(marketStats.averagePrice)}.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
