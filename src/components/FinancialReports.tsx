import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { User } from '../types';
import {
  FileText,
  Download,
  Filter,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Settings,
  Eye,
  ChevronRight,
  Minus,
  Plus,
  Users,
  Trophy
} from 'lucide-react';
import { format } from 'date-fns';
import { BalanceSheetEnhanced } from './BalanceSheetEnhanced';
import { CashFlowEnhanced } from './CashFlowEnhanced';

interface FinancialReportsProps {
  user: User;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface ReportFilters {
  dateRange: DateRange;
  selectedProjects: string[];
  comparisonPeriod: boolean;
  reportType: 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'project-profitability' | 'agent-performance';
}

interface FinancialData {
  revenue: {
    unitSales: number;
    rentalIncome: number;
    interestIncome: number;
    total: number;
  };
  costOfGoodsSold: {
    landCosts: number;
    constructionCosts: number;
    materialCosts: number;
    salesCommissions: number;
    total: number;
  };
  operatingExpenses: {
    salariesWages: number;
    marketing: number;
    utilities: number;
    insurance: number;
    maintenance: number;
    professional: number;
    total: number;
  };
  assets: {
    current: {
      cashBank: number;
      accountsReceivable: number;
      workInProgress: number;
      unsoldInventory: number;
      total: number;
    };
    fixed: {
      land: number;
      buildings: number;
      equipment: number;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      accountsPayable: number;
      shortTermDebt: number;
      accruedExpenses: number;
      customerDeposits: number;
      total: number;
    };
    longTerm: {
      constructionLoans: number;
      mortgagePayable: number;
      total: number;
    };
    total: number;
  };
  equity: {
    paidInCapital: number;
    retainedEarnings: number;
    total: number;
  };
  cashFlow: {
    operating: {
      netIncome: number;
      depreciation: number;
      accountsReceivableChange: number;
      inventoryChange: number;
      accountsPayableChange: number;
      total: number;
    };
    investing: {
      propertyAcquisitions: number;
      constructionCapex: number;
      equipmentPurchases: number;
      total: number;
    };
    financing: {
      loanProceeds: number;
      loanRepayments: number;
      ownerContributions: number;
      dividendsPaid: number;
      total: number;
    };
    netChange: number;
    cashBeginning: number;
    cashEnding: number;
  };
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({ user }) => {
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      to: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    },
    selectedProjects: ['all'],
    comparisonPeriod: false,
    reportType: 'profit-loss'
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProjectFilter, setShowProjectFilter] = useState(false);

  // Mock projects data
  const projects = [
    { id: 'all', name: 'All Projects' },
    { id: '1', name: 'Downtown Towers Phase 1' },
    { id: '2', name: 'Riverside Villa Community' },
    { id: '3', name: 'Metro Commercial Complex' },
    { id: '4', name: 'Sunset Heights Residential' }
  ];

  // Mock financial data
  const currentPeriodData: FinancialData = {
    revenue: {
      unitSales: 2850000,
      rentalIncome: 125000,
      interestIncome: 8500,
      total: 2983500
    },
    costOfGoodsSold: {
      landCosts: 650000,
      constructionCosts: 1200000,
      materialCosts: 185000,
      salesCommissions: 89250,
      total: 2124250
    },
    operatingExpenses: {
      salariesWages: 245000,
      marketing: 85000,
      utilities: 15000,
      insurance: 32000,
      maintenance: 28000,
      professional: 45000,
      total: 450000
    },
    assets: {
      current: {
        cashBank: 2456780,
        accountsReceivable: 875000,
        workInProgress: 1200000,
        unsoldInventory: 2850000,
        total: 7381780
      },
      fixed: {
        land: 3500000,
        buildings: 8200000,
        equipment: 450000,
        total: 12150000
      },
      total: 19531780
    },
    liabilities: {
      current: {
        accountsPayable: 325000,
        shortTermDebt: 150000,
        accruedExpenses: 85000,
        customerDeposits: 650000,
        total: 1210000
      },
      longTerm: {
        constructionLoans: 4500000,
        mortgagePayable: 2800000,
        total: 7300000
      },
      total: 8510000
    },
    equity: {
      paidInCapital: 5000000,
      retainedEarnings: 6021780,
      total: 11021780
    },
    cashFlow: {
      operating: {
        netIncome: 409250,
        depreciation: 125000,
        accountsReceivableChange: -225000,
        inventoryChange: -220000,
        accountsPayableChange: 40000,
        total: 129250
      },
      investing: {
        propertyAcquisitions: -1850000,
        constructionCapex: -1200000,
        equipmentPurchases: -85000,
        total: -3135000
      },
      financing: {
        loanProceeds: 2500000,
        loanRepayments: -450000,
        ownerContributions: 500000,
        dividendsPaid: -150000,
        total: 2400000
      },
      netChange: -605750,
      cashBeginning: 3062530,
      cashEnding: 2456780
    }
  };

  // Mock comparison period data (previous period)
  const comparisonData: FinancialData = {
    revenue: {
      unitSales: 2400000,
      rentalIncome: 118000,
      interestIncome: 7200,
      total: 2525200
    },
    costOfGoodsSold: {
      landCosts: 580000,
      constructionCosts: 1050000,
      materialCosts: 165000,
      salesCommissions: 72000,
      total: 1867000
    },
    operatingExpenses: {
      salariesWages: 235000,
      marketing: 78000,
      utilities: 18000,
      insurance: 32000,
      maintenance: 25000,
      professional: 42000,
      total: 430000
    },
    assets: {
      current: {
        cashBank: 2721780,
        accountsReceivable: 650000,
        workInProgress: 980000,
        unsoldInventory: 2450000,
        total: 6801780
      },
      fixed: {
        land: 3200000,
        buildings: 7800000,
        equipment: 420000,
        total: 11420000
      },
      total: 18221780
    },
    liabilities: {
      current: {
        accountsPayable: 285000,
        shortTermDebt: 180000,
        accruedExpenses: 78000,
        customerDeposits: 580000,
        total: 1123000
      },
      longTerm: {
        constructionLoans: 4800000,
        mortgagePayable: 2950000,
        total: 7750000
      },
      total: 8873000
    },
    equity: {
      paidInCapital: 5000000,
      retainedEarnings: 4348780,
      total: 9348780
    },
    cashFlow: {
      operating: {
        netIncome: 228200,
        depreciation: 115000,
        accountsReceivableChange: -185000,
        inventoryChange: -180000,
        accountsPayableChange: 25000,
        total: 3200
      },
      investing: {
        propertyAcquisitions: -1250000,
        constructionCapex: -950000,
        equipmentPurchases: -65000,
        total: -2265000
      },
      financing: {
        loanProceeds: 2200000,
        loanRepayments: -380000,
        ownerContributions: 300000,
        dividendsPaid: -120000,
        total: 2000000
      },
      netChange: -261800,
      cashBeginning: 2983580,
      cashEnding: 2721780
    }
  };

  const handleDateRangeSelect = (preset: string) => {
    const today = new Date();
    let from: Date, to: Date;

    switch (preset) {
      case 'last-month':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last-quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
        const year = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
        from = new Date(year, lastQuarter * 3, 1);
        to = new Date(year, (lastQuarter + 1) * 3, 0);
        break;
      case 'ytd':
        from = new Date(today.getFullYear(), 0, 1);
        to = today;
        break;
      case 'last-year':
        from = new Date(today.getFullYear() - 1, 0, 1);
        to = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }

    setFilters(prev => ({
      ...prev,
      dateRange: { from, to }
    }));
  };

  const handleProjectToggle = (projectId: string) => {
    if (projectId === 'all') {
      setFilters(prev => ({
        ...prev,
        selectedProjects: ['all']
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        selectedProjects: prev.selectedProjects.includes('all')
          ? [projectId]
          : prev.selectedProjects.includes(projectId)
            ? prev.selectedProjects.filter(id => id !== projectId)
            : [...prev.selectedProjects, projectId]
      }));
    }
  };

  const calculateVariance = (current: number, comparison: number) => {
    if (comparison === 0) return { amount: current, percentage: 0 };
    const amount = current - comparison;
    const percentage = (amount / comparison) * 100;
    return { amount, percentage };
  };

  const renderGlobalFilters = () => (
    <Card className="mb-6 border-2 border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <Filter className="h-6 w-6" />
          <span className="text-xl">Global Report Filters</span>
        </CardTitle>
        <p className="text-blue-700 text-sm">
          These filters apply to all financial reports and enable powerful data analysis across projects and time periods
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range Picker */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-blue-800">📅 Date Range</label>
            <div className="flex space-x-2">
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start border-2 border-blue-300 bg-white">
                    <CalendarIcon className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">
                      {format(filters.dateRange.from, 'MMM dd')} - {format(filters.dateRange.to, 'MMM dd, yyyy')}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleDateRangeSelect('last-month');
                          setShowDatePicker(false);
                        }}
                      >
                        Last Month
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleDateRangeSelect('last-quarter');
                          setShowDatePicker(false);
                        }}
                      >
                        Last Quarter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleDateRangeSelect('ytd');
                          setShowDatePicker(false);
                        }}
                      >
                        YTD
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleDateRangeSelect('last-year');
                          setShowDatePicker(false);
                        }}
                      >
                        Last Year
                      </Button>
                    </div>
                    <Separator />
                    <Calendar
                      mode="range"
                      selected={{
                        from: filters.dateRange.from,
                        to: filters.dateRange.to
                      }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setFilters(prev => ({
                            ...prev,
                            dateRange: { from: range.from as Date, to: range.to as Date }
                          }));
                          setShowDatePicker(false);
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Project Filter */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-blue-800">🏗️ Filter by Project</label>
            <Popover open={showProjectFilter} onOpenChange={setShowProjectFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start border-2 border-blue-300 bg-white">
                  <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="font-medium">
                    {filters.selectedProjects.includes('all')
                      ? 'All Projects'
                      : `${filters.selectedProjects.length} projects selected`}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.selectedProjects.includes(project.id)}
                        onCheckedChange={() => handleProjectToggle(project.id)}
                      />
                      <label className="text-sm cursor-pointer flex-1" onClick={() => handleProjectToggle(project.id)}>
                        {project.name}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Comparison Period */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-blue-800">📊 Comparison</label>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={filters.comparisonPeriod}
                onCheckedChange={(checked) =>
                  setFilters(prev => ({ ...prev, comparisonPeriod: !!checked }))
                }
              />
              <label className="text-sm">Compare with previous period</label>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-blue-800">💾 Export</label>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderProfitLossStatement = () => {
    const grossProfit = currentPeriodData.revenue.total - currentPeriodData.costOfGoodsSold.total;
    const netProfit = grossProfit - currentPeriodData.operatingExpenses.total;

    const comparisonGrossProfit = comparisonData.revenue.total - comparisonData.costOfGoodsSold.total;
    const comparisonNetProfit = comparisonGrossProfit - comparisonData.operatingExpenses.total;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profit & Loss Statement</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {format(filters.dateRange.from, 'MMM dd')} - {format(filters.dateRange.to, 'MMM dd, yyyy')}
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Account</TableHead>
                <TableHead className="text-right font-bold">Current Period</TableHead>
                {filters.comparisonPeriod && (
                  <>
                    <TableHead className="text-right font-bold">Previous Period</TableHead>
                    <TableHead className="text-right font-bold">Variance</TableHead>
                    <TableHead className="text-right font-bold">% Change</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Revenue Section */}
              <TableRow className="bg-blue-50">
                <TableCell className="font-bold">REVENUE</TableCell>
                <TableCell></TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </>
                )}
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Unit Sales</TableCell>
                <TableCell className="text-right">${currentPeriodData.revenue.unitSales.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.revenue.unitSales.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      ${calculateVariance(currentPeriodData.revenue.unitSales, comparisonData.revenue.unitSales).amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.revenue.unitSales, comparisonData.revenue.unitSales).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.revenue.unitSales, comparisonData.revenue.unitSales).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>

              {/* Revenue items and other sections would continue here... */}

              {/* Net Profit */}
              <TableRow className="bg-blue-50 border-t-4 border-t-blue-500 font-bold text-xl">
                <TableCell>NET PROFIT</TableCell>
                <TableCell className="text-right">${netProfit.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonNetProfit.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      ${calculateVariance(netProfit, comparisonNetProfit).amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(netProfit, comparisonNetProfit).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(netProfit, comparisonNetProfit).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderBalanceSheet = () => (
    <BalanceSheetEnhanced
      currentPeriodData={currentPeriodData}
      comparisonData={comparisonData}
      filters={filters}
      calculateVariance={calculateVariance}
    />
  );

  const renderCashFlowStatement = () => (
    <CashFlowEnhanced
      currentPeriodData={currentPeriodData}
      comparisonData={comparisonData}
      filters={filters}
      calculateVariance={calculateVariance}
    />
  );

  const renderReportMenu = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Financial Reports</h1>
        <p className="text-gray-600 mb-8">
          Generate comprehensive financial reports with powerful filtering and comparison options
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"
            onClick={() => setFilters(prev => ({ ...prev, reportType: 'profit-loss' }))}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-blue-50 w-fit mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold mb-2">Profit & Loss</h3>
              <p className="text-sm text-gray-600">
                Income statement showing revenue, expenses, and net profit
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-green-500"
            onClick={() => setFilters(prev => ({ ...prev, reportType: 'balance-sheet' }))}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-green-50 w-fit mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold mb-2">Balance Sheet</h3>
              <p className="text-sm text-gray-600">
                Financial position showing assets, liabilities, and equity
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-purple-500"
            onClick={() => setFilters(prev => ({ ...prev, reportType: 'cash-flow' }))}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-purple-50 w-fit mx-auto mb-4">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold mb-2">Cash Flow</h3>
              <p className="text-sm text-gray-600">
                Cash movements from operating, investing, and financing activities
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-orange-500"
            onClick={() => setFilters(prev => ({ ...prev, reportType: 'project-profitability' }))}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-orange-50 w-fit mx-auto mb-4">
                <Building2 className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-bold mb-2">Project Profitability</h3>
              <p className="text-sm text-gray-600">
                Detailed breakdown of income and costs per project
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-cyan-500"
            onClick={() => setFilters(prev => ({ ...prev, reportType: 'agent-performance' }))}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-cyan-50 w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-cyan-600" />
              </div>
              <h3 className="font-bold mb-2">Agent Performance</h3>
              <p className="text-sm text-gray-600">
                Sales performance and commission tracking by agent
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderSelectedReport = () => {
    switch (filters.reportType) {
      case 'profit-loss':
        return renderProfitLossStatement();
      case 'balance-sheet':
        return renderBalanceSheet();
      case 'cash-flow':
        return renderCashFlowStatement();
      case 'project-profitability':
        return <div>Project Profitability Report - Coming Soon</div>;
      case 'agent-performance':
        return <div>Agent Performance Report - Coming Soon</div>;
      default:
        return renderReportMenu();
    }
  };

  return (
    <div className="p-6">
      {filters.reportType ? (
        <>
          {renderGlobalFilters()}
          {renderSelectedReport()}
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => setFilters(prev => ({ ...prev, reportType: 'profit-loss' as any }))}
            >
              ← Back to Report Menu
            </Button>
          </div>
        </>
      ) : (
        renderReportMenu()
      )}
    </div>
  );
};