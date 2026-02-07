import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Investor, PropertyInvestment } from '../types';
import { formatPKR } from '../lib/currency';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { Users, TrendingUp, Building2, Calendar } from 'lucide-react';

interface InvestorDashboardChartsProps {
  investors: Investor[];
  investments: PropertyInvestment[];
}

export const InvestorDashboardCharts: React.FC<InvestorDashboardChartsProps> = ({
  investors,
  investments
}) => {
  // Capital by Investor Type
  const capitalByType = useMemo(() => {
    const typeData = investors.reduce((acc, investor) => {
      const type = investor.type;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += investor.totalInvested;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeData).map(([type, value]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value,
      count: investors.filter(i => i.type === type).length
    }));
  }, [investors]);

  // KYC Status Distribution
  const kycDistribution = useMemo(() => {
    const statuses = ['verified', 'pending', 'rejected', 'expired'];
    return statuses.map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: investors.filter(i => i.kycStatus === status).length
    })).filter(item => item.value > 0);
  }, [investors]);

  // Monthly Investment Trend (Last 6 months)
  const monthlyTrend = useMemo(() => {
    const months: Record<string, number> = {};
    const today = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      months[monthKey] = 0;
    }

    // Aggregate investments by month
    investments.forEach(inv => {
      const date = new Date(inv.investmentDate);
      const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (months.hasOwnProperty(monthKey)) {
        months[monthKey] += inv.investmentAmount;
      }
    });

    return Object.entries(months).map(([month, amount]) => ({
      month,
      amount,
      amountInMillions: Math.round(amount / 1000000)
    }));
  }, [investments]);

  // Top Investors by Total Invested
  const topInvestors = useMemo(() => {
    return [...investors]
      .sort((a, b) => b.totalInvested - a.totalInvested)
      .slice(0, 5)
      .map(inv => ({
        name: inv.name.length > 20 ? inv.name.substring(0, 20) + '...' : inv.name,
        invested: inv.totalInvested,
        investedInMillions: Math.round(inv.totalInvested / 1000000),
        profit: inv.totalProfitReceived
      }));
  }, [investors]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-900" style={{ fontWeight: '500' }}>{payload[0].name}</p>
          {payload[0].value && (
            <p className="text-sm text-gray-600">
              {typeof payload[0].value === 'number' ? formatPKR(payload[0].value) : payload[0].value}
            </p>
          )}
          {payload[0].payload.count && (
            <p className="text-xs text-gray-500">{payload[0].payload.count} investors</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Capital by Investor Type - Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Users className="w-5 h-5" />
            Capital by Investor Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {capitalByType.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={capitalByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {capitalByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No data available</p>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {capitalByType.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-gray-900" style={{ fontWeight: '500' }}>{formatPKR(item.value)}</p>
                  <p className="text-xs text-gray-500">{item.count} investors</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KYC Status Distribution - Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Building2 className="w-5 h-5" />
            KYC Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kycDistribution.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kycDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {kycDistribution.map((entry, index) => {
                      const colors = {
                        'Verified': '#10B981',
                        'Pending': '#F59E0B',
                        'Rejected': '#EF4444',
                        'Expired': '#F97316'
                      };
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={colors[entry.name as keyof typeof colors] || COLORS[index % COLORS.length]} 
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No KYC data available</p>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {kycDistribution.map((item) => {
              const colors = {
                'Verified': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
                'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
                'Rejected': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
                'Expired': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' }
              };
              const color = colors[item.name as keyof typeof colors];

              return (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-1 rounded ${color.bg} ${color.text} text-xs`}>
                    {item.name}
                  </span>
                  <span className="text-gray-900" style={{ fontWeight: '500' }}>{item.value} investors</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Investors by Capital - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <TrendingUp className="w-5 h-5" />
            Top Investors by Capital
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topInvestors.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInvestors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="invested" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No investors found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Investment Trend - Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Calendar className="w-5 h-5" />
            Investment Trend (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyTrend.some(m => m.amount > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No investment data available</p>
            </div>
          )}
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <p className="text-xs text-gray-600">Total Investments</p>
              <p className="text-gray-900" style={{ fontWeight: '500' }}>
                {investments.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Total Value</p>
              <p className="text-gray-900" style={{ fontWeight: '500' }}>
                {formatPKR(monthlyTrend.reduce((sum, m) => sum + m.amount, 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
