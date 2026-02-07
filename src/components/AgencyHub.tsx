import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { getProperties, getLeads } from '../lib/data';
import { InvestorSyndicationWidget } from './investor-analytics/InvestorSyndicationWidget';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Plus,
  Download,
  BarChart3,
  Users,
  Trophy,
  Target,
  Handshake,
  Star,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  Building2,
  Search,
  Filter,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AgencyHubProps {
  user: User;
}

export const AgencyHub: React.FC<AgencyHubProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const properties = useMemo(() => getProperties(user.id, user.role), [user.id, user.role]);
  const leads = useMemo(() => getLeads(user.id, user.role), [user.id, user.role]);

  // Mock agency data - in real app this would come from API/database
  const agencyData = useMemo(() => {
    const soldProperties = properties.filter(p => p.status === 'sold');
    const totalCommission = soldProperties.reduce((sum, p) => sum + (p.commissionEarned || 0), 0);
    
    // Get leads from this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newLeadsThisMonth = leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear;
    }).length;
    
    // Mock agents data
    const agents = [
      {
        id: '1',
        name: 'Sarah Johnson',
        dealsClosedThisMonth: 8,
        totalCommissionYTD: 125000,
        commissionThisMonth: 18500,
        avatar: 'SJ',
        status: 'active',
        lastActivity: '2 hours ago'
      },
      {
        id: '2',
        name: 'Michael Chen',
        dealsClosedThisMonth: 6,
        totalCommissionYTD: 98000,
        commissionThisMonth: 15200,
        avatar: 'MC',
        status: 'active',
        lastActivity: '5 hours ago'
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        dealsClosedThisMonth: 7,
        totalCommissionYTD: 87500,
        commissionThisMonth: 16800,
        avatar: 'ER',
        status: 'active',
        lastActivity: '1 day ago'
      },
      {
        id: '4',
        name: 'David Thompson',
        dealsClosedThisMonth: 5,
        totalCommissionYTD: 73000,
        commissionThisMonth: 12300,
        avatar: 'DT',
        status: 'active',
        lastActivity: '3 hours ago'
      },
      {
        id: '5',
        name: 'Lisa Park',
        dealsClosedThisMonth: 4,
        totalCommissionYTD: 65000,
        commissionThisMonth: 9800,
        avatar: 'LP',
        status: 'active',
        lastActivity: '6 hours ago'
      }
    ];

    // Mock deals by month data for chart
    const dealsByMonth = [
      { month: 'Jul', deals: 12 },
      { month: 'Aug', deals: 18 },
      { month: 'Sep', deals: 15 },
      { month: 'Oct', deals: 22 },
      { month: 'Nov', deals: 19 },
      { month: 'Dec', deals: 25 },
      { month: 'Jan', deals: 30 }
    ];

    // Extended agent data with more details
    const extendedAgents = agents.map(agent => ({
      ...agent,
      type: agent.id === '3' || agent.id === '5' ? 'External Broker' : 'In-house',
      defaultCommissionRate: agent.id === '3' || agent.id === '5' ? 4.5 : 3.0,
      phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      email: `${agent.name.toLowerCase().replace(' ', '.')}@aaraazi.com`,
      address: `${Math.floor(Math.random() * 9000) + 1000} ${['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr'][Math.floor(Math.random() * 4)]}, New York, NY`,
      joinDate: '2023-03-15',
      specialization: ['Luxury Properties', 'Commercial', 'Residential', 'Investment'][Math.floor(Math.random() * 4)],
      deals: [
        {
          id: '1',
          property: 'Downtown Towers, Apt 502',
          client: 'Johnson Family Trust',
          salePrice: 285000,
          commission: 8550,
          date: '2024-01-15',
          status: 'Closed'
        },
        {
          id: '2',
          property: 'Riverside Villas, Unit 8B',
          client: 'Metro Properties LLC',
          salePrice: 225000,
          commission: 6750,
          date: '2024-01-08',
          status: 'Closed'
        }
      ]
    }));

    // Calculate average deal velocity (average days to close)
    const averageDealVelocity = 28; // Mock data - days

    return {
      kpis: {
        newLeadsThisMonth: newLeadsThisMonth || 24, // Use real data or fallback to mock
        averageDealVelocity: averageDealVelocity,
        dealsClosedThisMonth: agents.reduce((sum, agent) => sum + agent.dealsClosedThisMonth, 0),
        topAgent: agents.reduce((prev, current) => 
          (current.totalCommissionYTD > prev.totalCommissionYTD) ? current : prev
        )
      },
      agents: extendedAgents,
      dealsByMonth
    };
  }, [properties, leads]);

  const renderKPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* New Leads This Month */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-50">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Leads (This Month)</p>
              <p className="text-2xl font-bold text-gray-900">
                {agencyData.kpis.newLeadsThisMonth}
              </p>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +15% vs last month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Deal Velocity */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-50">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Deal Velocity</p>
              <p className="text-2xl font-bold text-gray-900">
                {agencyData.kpis.averageDealVelocity} days
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingDown className="h-3 w-3 mr-1" />
                3 days faster
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals Closed This Month */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-50">
              <Handshake className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Deals Closed (This Month)</p>
              <p className="text-2xl font-bold text-gray-900">
                {agencyData.kpis.dealsClosedThisMonth}
              </p>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                8 more than last month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Agent */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-50">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Performing Agent</p>
              <p className="text-lg font-bold text-gray-900">
                {agencyData.kpis.topAgent.name}
              </p>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <Trophy className="h-3 w-3 mr-1" />
                ${agencyData.kpis.topAgent.totalCommissionYTD.toLocaleString()} YTD
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDealsChart = () => (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Deals Closed by Month</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">Last 7 Months</Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agencyData.dealsByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Deals Closed', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [value, 'Deals Closed']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="deals" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderAgentLeaderboard = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span>Top Agents Leaderboard</span>
          </CardTitle>
          <Badge className="bg-yellow-100 text-yellow-800">
            This Month
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Agent Name</TableHead>
              <TableHead className="text-center">Deals Closed</TableHead>
              <TableHead className="text-right">Commission (YTD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agencyData.agents
              .sort((a, b) => b.totalCommissionYTD - a.totalCommissionYTD)
              .map((agent, index) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex items-center">
                      {index < 3 ? (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {index + 1}
                        </div>
                      ) : (
                        <span className="w-6 text-center text-sm text-gray-500">{index + 1}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-800">
                        {agent.avatar}
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.lastActivity}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {agent.dealsClosedThisMonth}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${agent.totalCommissionYTD.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderAgentsPartners = () => {
    if (selectedAgent) {
      const agent = agencyData.agents.find(a => a.id === selectedAgent);
      if (!agent) return null;

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedAgent(null)}>
              ← Back to Agents List
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Agent Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-800">
                  {agent.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold">{agent.name}</h2>
                    <Badge className={agent.type === 'In-house' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}>
                      {agent.type}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {agent.specialization}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">Default Commission Rate</p>
                      <p className="font-bold">{agent.defaultCommissionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Deals Closed (YTD)</p>
                      <p className="font-bold">{agent.dealsClosedThisMonth + 18}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Commission (YTD)</p>
                      <p className="font-bold text-green-600">${agent.totalCommissionYTD.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Join Date</p>
                      <p className="font-bold">{agent.joinDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{agent.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{agent.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{agent.address}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">This Month Deals</span>
                  <span className="font-bold">{agent.dealsClosedThisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">This Month Commission</span>
                  <span className="font-bold text-green-600">${agent.commissionThisMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Deal Size</span>
                  <span className="font-bold">${(agent.totalCommissionYTD / (agent.dealsClosedThisMonth + 18) * 100 / agent.defaultCommissionRate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deal History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Deal History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agent.deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>{deal.date}</TableCell>
                      <TableCell className="font-medium">{deal.property}</TableCell>
                      <TableCell>{deal.client}</TableCell>
                      <TableCell>${deal.salePrice.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">${deal.commission.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">{deal.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Agents & Partners</h2>
            <p className="text-gray-600">Manage your sales team and broker network</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Agent/Broker
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search agents..." className="pl-10" />
                </div>
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="in-house">In-house</SelectItem>
                  <SelectItem value="external">External Broker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Agents Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Default Commission Rate</TableHead>
                  <TableHead>Deals Closed (YTD)</TableHead>
                  <TableHead>Total Commission Paid (YTD)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencyData.agents.map((agent) => (
                  <TableRow key={agent.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-800">
                          {agent.avatar}
                        </div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-gray-500">{agent.specialization}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={agent.type === 'In-house' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}>
                        {agent.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{agent.defaultCommissionRate}%</TableCell>
                    <TableCell className="font-medium">{agent.dealsClosedThisMonth + 18}</TableCell>
                    <TableCell className="font-medium text-green-600">${agent.totalCommissionYTD.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedAgent(agent.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Hub</h1>
            <p className="text-gray-600 mt-1">Track your team's sales activity and agent performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="agents">Agents & Partners</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {renderKPICards()}
            
            {/* Investor Syndication Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <InvestorSyndicationWidget 
                  user={user}
                  onViewDetails={() => {
                    // Investor syndication details shown in purchase cycles
                    console.log('Investor details available in purchase cycles');
                  }}
                />
              </div>
              <div className="lg:col-span-2">
                {/* Placeholder for future widget */}
                <div className="h-full"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {renderDealsChart()}
              {renderAgentLeaderboard()}
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            {renderAgentsPartners()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};