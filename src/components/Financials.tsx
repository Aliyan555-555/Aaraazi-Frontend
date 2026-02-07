import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { User, Property, Commission, Expense } from '../types';
import { getProperties, getCommissions, getExpenses, addExpense, getAllAgents } from '../lib/data';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Plus,
  Download,
  PieChart,
  BarChart3
} from 'lucide-react';

interface FinancialsProps {
  user: User;
}

export const Financials: React.FC<FinancialsProps> = ({ user }) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'marketing',
    date: new Date().toISOString().split('T')[0]
  });

  const properties = useMemo(() => getProperties(user.id, user.role), [user.id, user.role]);
  const commissions = useMemo(() => getCommissions(user.id, user.role), [user.id, user.role]);
  const expenses = useMemo(() => getExpenses(user.id, user.role), [user.id, user.role]);
  const agents = useMemo(() => getAllAgents(), []);

  const stats = useMemo(() => {
    const soldProperties = properties.filter(p => p.status === 'sold');
    const totalCommission = soldProperties.reduce((sum, p) => sum + (p.commissionEarned || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalCommission - totalExpenses;
    
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const monthlyCommission = soldProperties
      .filter(p => {
        const saleDate = new Date(p.updatedAt);
        return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
      })
      .reduce((sum, p) => sum + (p.commissionEarned || 0), 0);
    
    const monthlyExpenses = expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      totalCommission,
      totalExpenses,
      netIncome,
      monthlyCommission,
      monthlyExpenses,
      soldProperties: soldProperties.length,
      averageCommission: soldProperties.length > 0 ? totalCommission / soldProperties.length : 0
    };
  }, [properties, expenses]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      agentId: user.id,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date
    });
    setExpenseForm({
      description: '',
      amount: '',
      category: 'marketing',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddExpense(false);
    window.location.reload(); // Simple refresh for demo
  };

  const expenseCategories = [
    'marketing',
    'travel',
    'office',
    'professional-development',
    'technology',
    'insurance',
    'other'
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Overview</h1>
          <p className="text-gray-600">
            {user.role === 'admin' ? 'Agency-wide financial performance' : 'Your financial performance and commission tracking'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => setShowAddExpense(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-50">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalCommission.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-50">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.netIncome.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-50">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Properties Sold</p>
                <p className="text-2xl font-bold text-gray-900">{stats.soldProperties}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="commissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          {user.role === 'admin' && <TabsTrigger value="agency">Agency Overview</TabsTrigger>}
        </TabsList>

        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Commission Earned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.filter(p => p.status === 'sold').map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.title}</TableCell>
                      <TableCell>${(property.finalSalePrice || property.price).toLocaleString()}</TableCell>
                      <TableCell>{property.commissionRate || 3}%</TableCell>
                      <TableCell className="text-green-600">
                        ${(property.commissionEarned || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Paid</Badge>
                      </TableCell>
                      <TableCell>{property.updatedAt}</TableCell>
                    </TableRow>
                  ))}
                  {properties.filter(p => p.status === 'sold').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No sold properties yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Expense Tracking</CardTitle>
                <div className="flex gap-2">
                  <span className="text-sm text-gray-600">
                    This Month: <span className="font-medium">${stats.monthlyExpenses.toLocaleString()}</span>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell>${expense.amount.toLocaleString()}</TableCell>
                      <TableCell>{expense.date}</TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No expenses recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === 'admin' && (
          <TabsContent value="agency" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agents.map((agent) => {
                      const agentProperties = properties.filter(p => p.agentId === agent.id && p.status === 'sold');
                      const agentCommission = agentProperties.reduce((sum, p) => sum + (p.commissionEarned || 0), 0);
                      return (
                        <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-sm text-gray-600">{agentProperties.length} properties sold</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">${agentCommission.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">commission earned</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Commission</span>
                      <span className="font-medium text-green-600">
                        ${stats.monthlyCommission.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Expenses</span>
                      <span className="font-medium text-red-600">
                        ${stats.monthlyExpenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Net Monthly Income</span>
                      <span className="font-bold">
                        ${(stats.monthlyCommission - stats.monthlyExpenses).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Marketing materials"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={expenseForm.category} 
                    onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddExpense(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Add Expense
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};