import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Sun, 
  Heart, 
  Baby,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const leaveTypes = {
  vacation: { label: 'Vacation', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50', progress: 'bg-amber-500' },
  sick: { label: 'Sick Leave', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', progress: 'bg-rose-500' },
  personal: { label: 'Personal', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', progress: 'bg-blue-500' },
  parental: { label: 'Parental', icon: Baby, color: 'text-purple-500', bg: 'bg-purple-50', progress: 'bg-purple-500' },
  floating: { label: 'Floating Holiday', icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-50', progress: 'bg-emerald-500' }
};

export default function LeaveBalanceCard({ balances, loading }) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 bg-slate-200 rounded w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">
          Leave Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(balances || {}).map(([type, data]) => {
          const config = leaveTypes[type] || leaveTypes.personal;
          const Icon = config.icon;
          const used = data.used || 0;
          const total = data.total || 0;
          const available = data.available || (total - used);
          const percentage = total > 0 ? ((total - used) / total) * 100 : 0;
          
          return (
            <div key={type} className={cn("p-4 rounded-xl", config.bg)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", config.color)} />
                  <span className="font-medium text-slate-700">{config.label}</span>
                </div>
                <span className={cn("text-lg font-semibold", config.color)}>
                  {available} days
                </span>
              </div>
              <Progress value={percentage} className="h-2 bg-white/50" />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{used} used</span>
                <span>{total} total</span>
              </div>
            </div>
          );
        })}
        
        {(!balances || Object.keys(balances).length === 0) && (
          <div className="text-center py-6 text-slate-500">
            No leave balance data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
