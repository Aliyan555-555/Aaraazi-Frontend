import { useMemo } from 'react';
import {
    Share2,
    Users,
    Zap,
    Target,
    TrendingUp,
    ArrowUpRight,
    UserPlus
} from 'lucide-react';
import { Card } from '../ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { PropertyMatch } from '../../types/sharing';
import { User } from '../../types';

interface CollaborationMetricsProps {
    user: User;
    matches: PropertyMatch[];
    sharedListingsCount: number;
}

export function CollaborationMetrics({ user, matches, sharedListingsCount }: CollaborationMetricsProps) {
    // Calculate specific metrics
    const stats = useMemo(() => {
        const myMatches = matches.filter(m =>
            m.listingAgentId === user.id || m.buyerAgentId === user.id || m.renterAgentId === user.id
        );

        const offersSubmitted = myMatches.filter(m => m.status === 'offer-submitted').length;
        const dealsCreated = myMatches.filter(m => m.status === 'deal-created').length;

        // Calculate average match score
        const avgScore = myMatches.length > 0
            ? Math.round(myMatches.reduce((sum, m) => sum + m.matchScore, 0) / myMatches.length)
            : 0;

        // Get match distribution by status for the chart
        const statusDistribution = [
            { name: 'Pending', count: myMatches.filter(m => m.status === 'pending').length, color: '#94a3b8' },
            { name: 'Viewed', count: myMatches.filter(m => m.status === 'viewed').length, color: '#60a5fa' },
            { name: 'Offers', count: offersSubmitted, color: '#f59e0b' },
            { name: 'Deals', count: dealsCreated, color: '#10b981' },
        ];

        return {
            totalMatches: myMatches.length,
            offersSubmitted,
            dealsCreated,
            avgScore,
            statusDistribution
        };
    }, [matches, user.id]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Collaboration Performance
                </h2>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    Last 30 Days
                </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Shared Listings</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{sharedListingsCount}</h3>
                            <div className="flex items-center mt-1 text-xs text-green-600 font-medium">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                <span>+12% vs last month</span>
                            </div>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-xl">
                            <Share2 className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Smart Matches</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMatches}</h3>
                            <div className="flex items-center mt-1 text-xs text-blue-600 font-medium">
                                <Zap className="w-3 h-3 mr-1" />
                                <span>{stats.avgScore}% Avg Score</span>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cross-Agent Offers</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.offersSubmitted}</h3>
                            <div className="flex items-center mt-1 text-xs text-amber-600 font-medium">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                <span>High activity profile</span>
                            </div>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <Users className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Collaborative Deals</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.dealsCreated}</h3>
                            <div className="flex items-center mt-1 text-xs text-emerald-600 font-medium">
                                <Zap className="w-3 h-3 mr-1" />
                                <span>Verified performance</span>
                            </div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl">
                            <ArrowUpRight className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Activity Chart & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Collaboration Pipeline</h3>
                            <p className="text-sm text-gray-500">Match progression through stages</p>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.statusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                    {stats.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Sharing Impact</h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <UserPlus className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">Network Reach</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium italic">65%</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <Target className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">Conversion Goal</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium italic">40%</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <div className="bg-indigo-50 rounded-xl p-4">
                                <p className="text-xs text-indigo-700 font-medium uppercase mb-1">AI Recommendation</p>
                                <p className="text-sm text-indigo-900 italic">
                                    "Based on your current matches, agents in DHA Phase 5 are highly active. Consider sharing DHA Phase 6 listings for higher conversion."
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
