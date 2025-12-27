import { useState, useEffect } from 'react';
import { User, LeaveRequest } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Calendar, 
  FileCheck, 
  Clock,
  ArrowRight,
  Sun,
  Heart
} from 'lucide-react';
import LeaveBalanceCard from '@/components/leave/LeaveBalanceCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Load leave requests
      const requests = await LeaveRequest.filter(
        { user_id: currentUser.id },
        '-created_date',
        5
      );
      setRecentRequests(requests);

      // Mock stats for demo
      setStats({
        leaveBalance: {
          vacation: { total: 15, used: 5, available: 10 },
          sick: { total: 10, used: 2, available: 8 },
          personal: { total: 3, used: 1, available: 2 }
        },
        pendingRequests: 2,
        upcomingLeave: 1
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      // Set demo data
      setUser({ full_name: 'Demo Employee' });
      setStats({
        leaveBalance: {
          vacation: { total: 15, used: 5, available: 10 },
          sick: { total: 10, used: 2, available: 8 },
          personal: { total: 3, used: 1, available: 2 }
        },
        pendingRequests: 2,
        upcomingLeave: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-slate-500 mt-1">
                Welcome to your HR dashboard
              </p>
            </div>
            <Link to={createPageUrl('AskHR')}>
              <Button className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200/50">
                <MessageSquare className="mr-2 h-4 w-4" />
                Ask HR
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Vacation Days</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {stats?.leaveBalance?.vacation?.available || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Sun className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Sick Days</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {stats?.leaveBalance?.sick?.available || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-rose-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pending Requests</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {stats?.pendingRequests || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Upcoming Leave</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {stats?.upcomingLeave || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leave Balance */}
          <div className="lg:col-span-1">
            <LeaveBalanceCard balances={stats?.leaveBalance} loading={loading} />
          </div>

          {/* Quick Actions & Recent */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link to={createPageUrl('AskHR')} className="block">
                    <div className="p-4 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50/50 transition-all group cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mb-3 group-hover:bg-red-200 transition-colors">
                        <MessageSquare className="w-5 h-5 text-red-600" />
                      </div>
                      <h3 className="font-medium text-slate-800">Ask a Question</h3>
                      <p className="text-xs text-slate-500 mt-1">Get instant HR answers</p>
                    </div>
                  </Link>

                  <Link to={createPageUrl('AskHR') + '?action=leave'} className="block">
                    <div className="p-4 rounded-xl border border-slate-200 hover:border-green-200 hover:bg-green-50/50 transition-all group cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="font-medium text-slate-800">Request Time Off</h3>
                      <p className="text-xs text-slate-500 mt-1">Submit a leave request</p>
                    </div>
                  </Link>

                  <Link to={createPageUrl('AskHR') + '?action=verification'} className="block">
                    <div className="p-4 rounded-xl border border-slate-200 hover:border-purple-200 hover:bg-purple-50/50 transition-all group cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                        <FileCheck className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="font-medium text-slate-800">Verification Letter</h3>
                      <p className="text-xs text-slate-500 mt-1">Generate employment letter</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Requests */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Recent Requests
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-slate-500">
                  View All
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {recentRequests.map((request) => (
                      <div 
                        key={request.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-700 capitalize">
                              {request.leave_type?.replace('_', ' ')} Leave
                            </p>
                            <p className="text-xs text-slate-500">
                              {request.start_date} - {request.end_date}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          request.status === 'approved' ? 'default' :
                          request.status === 'pending' ? 'secondary' :
                          request.status === 'denied' ? 'destructive' : 'outline'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
