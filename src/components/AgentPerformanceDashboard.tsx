import React, { useMemo, useState } from 'react';
import { User } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { formatCurrency } from '../lib/currency';
import { getAllAgents } from '../lib/auth';


import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  DollarSign,
  Home,
  Users,
  Clock,
  Activity,
  Calendar,
  CheckCircle,
  Minus
} from 'lucide-react';
import { AgentPerformance, AgentRanking, calculateAgentPerformance, compareToTeamAverage, getAgentActivityTimeline, getAgentPerformanceTrends, getAgentRankings, getTopPerformers } from '../lib/agentPerformance';

interface AgentPerformanceDashboardProps {
  user: User;
}

export const AgentPerformanceDashboard: React.FC<AgentPerformanceDashboardProps> = ({ user }) => {
  const [timeRange, setTimeRange] = useState<'all' | '30days' | '90days' | 'ytd'>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>(user.role === 'agent' ? user.id : 'all');

  // Get all agents
  const allAgents = useMemo(() => {
    return getAllAgents();
  }, []);

  // Calculate rankings
  const rankings = useMemo(() => {
    return getAgentRankings(timeRange);
  }, [timeRange]);

  // Get top performers
  const topPerformers = useMemo(() => {
    return getTopPerformers(5, timeRange);
  }, [timeRange]);

  // Selected agent data
  const selectedAgentData = useMemo(() => {
    if (selectedAgent === 'all') return null;

    const agent = allAgents.find((a: User) => a.id === selectedAgent);
    if (!agent) return null;

    return calculateAgentPerformance(agent.id, agent.name, timeRange);
  }, [selectedAgent, timeRange, allAgents]);

  // Team comparison
  const teamComparison = useMemo(() => {
    if (selectedAgent === 'all') return null;
    return compareToTeamAverage(selectedAgent);
  }, [selectedAgent]);

  // Activity timeline
  const activityTimeline = useMemo(() => {
    if (selectedAgent === 'all') return [];
    return getAgentActivityTimeline(selectedAgent, 30);
  }, [selectedAgent]);

  // Performance trends
  const performanceTrends = useMemo(() => {
    if (selectedAgent === 'all') return [];
    const agent = allAgents.find((a: User) => a.id === selectedAgent);
    if (!agent) return [];
    return getAgentPerformanceTrends(agent.id, agent.name, 6);
  }, [selectedAgent, allAgents]);

  // Get badge component
  const getBadge = (badge?: AgentRanking['badge']) => {
    if (!badge) return null;

    const badgeConfig = {
      gold: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: '🥇 Gold' },
      silver: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: '🥈 Silver' },
      bronze: { color: 'bg-orange-100 text-orange-800 border-orange-300', label: '🥉 Bronze' },
      'top-performer': { color: 'bg-blue-100 text-blue-800 border-blue-300', label: '⭐ Top Performer' },
      'rising-star': { color: 'bg-green-100 text-green-800 border-green-300', label: '🚀 Rising Star' }
    };

    const config = badgeConfig[badge];
    return (
      <Badge variant="outline" className={`${config.color} border`}>
        {config.label}
      </Badge>
    );
  };

  const formatMonth = (monthStr: any) => {
    if (!monthStr || typeof monthStr !== 'string') return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getComparisonIcon = (status: 'above' | 'at' | 'below') => {
    if (status === 'above') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (status === 'below') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {user.role === 'admin' && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents (Leaderboard)</SelectItem>
                    {allAgents.map((agent: User) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard View */}
      {selectedAgent === 'all' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top 3 Podium */}
            {rankings.slice(0, 3).map((ranking: AgentRanking, index: number) => (
              <Card key={ranking.agentId} className={index === 0 ? 'border-yellow-300 bg-yellow-50' : ''}>
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    {index === 0 && <Trophy className="h-12 w-12 text-yellow-600" />}
                    {index === 1 && <Trophy className="h-10 w-10 text-gray-500" />}
                    {index === 2 && <Trophy className="h-10 w-10 text-orange-600" />}
                  </div>
                  <p className="text-2xl mb-1">#{ranking.rank}</p>
                  <p className="text-base text-gray-900 mb-2">{ranking.agentName}</p>
                  {getBadge(ranking.badge)}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-600 mb-1">Performance Score</p>
                    <p className="text-3xl text-gray-900">{ranking.score}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Agent Leaderboard
              </CardTitle>
              <CardDescription>Rankings based on overall performance score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rankings.map((ranking: AgentRanking) => (
                  <div
                    key={ranking.agentId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-900">
                        <span className="text-base">#{ranking.rank}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">{ranking.agentName}</p>
                        {ranking.badge && (
                          <div className="mt-1">{getBadge(ranking.badge)}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg text-gray-900">{ranking.score}</p>
                      <p className="text-xs text-gray-500">score</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Top Performers Breakdown
              </CardTitle>
              <CardDescription>Detailed metrics for top 5 agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-xs text-gray-600">Agent</th>
                      <th className="text-right p-3 text-xs text-gray-600">Sales</th>
                      <th className="text-right p-3 text-xs text-gray-600">Conv. Rate</th>
                      <th className="text-right p-3 text-xs text-gray-600">Avg. Days</th>
                      <th className="text-right p-3 text-xs text-gray-600">Commission</th>
                      <th className="text-right p-3 text-xs text-gray-600">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.map((perf: AgentPerformance) => (
                      <tr key={perf.agentId} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">{perf.agentName}</td>
                        <td className="p-3 text-sm text-right">{perf.soldProperties}</td>
                        <td className="p-3 text-sm text-right">{perf.conversionRate.toFixed(1)}%</td>
                        <td className="p-3 text-sm text-right">{perf.averageDaysToSell}</td>
                        <td className="p-3 text-sm text-right">{formatCurrency(perf.totalCommissionEarned)}</td>
                        <td className="p-3 text-sm text-right">
                          <Badge variant="outline">{perf.overallScore}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Individual Agent View */}
      {selectedAgent !== 'all' && selectedAgentData && (
        <>
          {/* Agent Header */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl text-gray-900 mb-1">{selectedAgentData.agentName}</h2>
                  <div className="flex items-center gap-2">
                    {rankings.find(r => r.agentId === selectedAgent) && (
                      <>
                        <Badge variant="outline" className="bg-white">
                          Rank #{rankings.find(r => r.agentId === selectedAgent)?.rank}
                        </Badge>
                        {getBadge(rankings.find(r => r.agentId === selectedAgent)?.badge)}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-1">Overall Score</p>
                  <p className="text-4xl text-blue-600">{selectedAgentData.overallScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Total Sales</p>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl text-gray-900 mb-1">{selectedAgentData.soldProperties}</p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(selectedAgentData.totalSalesValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Conversion Rate</p>
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl text-gray-900 mb-1">
                  {selectedAgentData.conversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  {selectedAgentData.soldProperties} of {selectedAgentData.totalListings} listings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Avg. Days to Sell</p>
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-2xl text-gray-900 mb-1">{selectedAgentData.averageDaysToSell}</p>
                <p className="text-xs text-gray-500">
                  Fastest: {selectedAgentData.fastestSale} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Total Commission</p>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl text-gray-900 mb-1">
                  {formatCurrency(selectedAgentData.totalCommissionEarned)}
                </p>
                <p className="text-xs text-gray-500">
                  Avg: {formatCurrency(selectedAgentData.averageCommission)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="comparison">Team Compare</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Lead & CRM Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-600 mb-2">Lead Conversion</p>
                    <p className="text-xl text-gray-900 mb-1">
                      {selectedAgentData.leadConversionRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedAgentData.convertedLeads} of {selectedAgentData.totalLeads} leads
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-600 mb-2">Active Listings</p>
                    <p className="text-xl text-gray-900 mb-1">{selectedAgentData.activeListings}</p>
                    <p className="text-xs text-gray-500">
                      {selectedAgentData.newListingsThisMonth} new this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-600 mb-2">Listing Quality</p>
                    <p className="text-xl text-gray-900 mb-1">
                      {selectedAgentData.listingQualityScore}/100
                    </p>
                    <p className="text-xs text-gray-500">
                      Avg. {selectedAgentData.averagePropertyViews.toFixed(1)} views/listing
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Activity & Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Activity</CardTitle>
                    <CardDescription>Last 30 days performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Home className="h-5 w-5 text-blue-600" />
                          <span className="text-sm text-gray-900">New Listings</span>
                        </div>
                        <span className="text-base text-gray-900">
                          {selectedAgentData.newListingsThisMonth}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-900">New Leads</span>
                        </div>
                        <span className="text-base text-gray-900">
                          {selectedAgentData.newLeadsThisMonth}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="h-5 w-5 text-purple-600" />
                          <span className="text-sm text-gray-900">CRM Interactions</span>
                        </div>
                        <span className="text-base text-gray-900">
                          {selectedAgentData.interactionsThisMonth}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Financial Summary</CardTitle>
                    <CardDescription>Commission breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Earned (Closed Sales)</p>
                        <p className="text-2xl text-green-600">
                          {formatCurrency(selectedAgentData.totalCommissionEarned)}
                        </p>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-600 mb-1">Projected (Active Listings)</p>
                        <p className="text-2xl text-blue-600">
                          {formatCurrency(selectedAgentData.projectedCommission)}
                        </p>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-600 mb-1">Total Pipeline</p>
                        <p className="text-2xl text-gray-900">
                          {formatCurrency(
                            selectedAgentData.totalCommissionEarned + selectedAgentData.projectedCommission
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Team Comparison Tab */}
            <TabsContent value="comparison" className="space-y-6">
              {teamComparison && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance vs Team Average</CardTitle>
                      <CardDescription>How you compare to your teammates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {teamComparison.comparisons.map((comp, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-gray-900">{comp.metric}</p>
                              {getComparisonIcon(comp.status)}
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-600">Your Score</p>
                                <p className="text-base text-gray-900">
                                  {comp.metric.includes('Commission')
                                    ? formatCurrency(comp.agentValue)
                                    : comp.metric.includes('Rate')
                                      ? `${comp.agentValue.toFixed(1)}%`
                                      : comp.agentValue.toFixed(1)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-600">Team Avg</p>
                                <p className="text-base text-gray-900">
                                  {comp.metric.includes('Commission')
                                    ? formatCurrency(comp.teamValue)
                                    : comp.metric.includes('Rate')
                                      ? `${comp.teamValue.toFixed(1)}%`
                                      : comp.teamValue.toFixed(1)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-600">Difference</p>
                                <p className={`text-base ${comp.status === 'above' ? 'text-green-600' :
                                    comp.status === 'below' ? 'text-red-600' : 'text-gray-900'
                                  }`}>
                                  {comp.difference > 0 ? '+' : ''}
                                  {comp.differencePercentage.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Trends (6 Months)</CardTitle>
                  <CardDescription>Sales and lead activity over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="month"
                          tickFormatter={formatMonth}
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <Tooltip labelFormatter={formatMonth} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Sales"
                          dot={{ fill: '#10b981' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="leads"
                          stroke="#4f46e5"
                          strokeWidth={2}
                          name="Leads"
                          dot={{ fill: '#4f46e5' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <p>No trend data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Commission Trends</CardTitle>
                  <CardDescription>Monthly commission earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={performanceTrends}>
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
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip
                          formatter={(value: any) => formatCurrency(value)}
                          labelFormatter={formatMonth}
                        />
                        <Bar dataKey="commission" fill="#030213" name="Commission" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <p>No commission data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity (Last 30 Days)</CardTitle>
                  <CardDescription>Timeline of listings, sales, and leads</CardDescription>
                </CardHeader>
                <CardContent>
                  {activityTimeline.length > 0 ? (
                    <div className="space-y-3">
                      {activityTimeline.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {activity.type === 'listing' && <Home className="h-4 w-4 text-blue-600" />}
                            {activity.type === 'sale' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {activity.type === 'lead' && <Users className="h-4 w-4 text-purple-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {activity.value && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm text-gray-900">{formatCurrency(activity.value)}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <p>No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};