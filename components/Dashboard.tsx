import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Clock, AlertCircle, FileText, ArrowUpRight } from 'lucide-react';
import { Invoice, InvoiceStatus, DashboardStats } from '../types';

interface DashboardProps {
  invoices: Invoice[];
  stats: DashboardStats;
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, stats }) => {
  // Prepare data for chart: Revenue by month
  const chartData = React.useMemo(() => {
    const data: Record<string, number> = {};
    invoices.forEach(inv => {
      if (inv.status !== InvoiceStatus.Draft) {
        const month = new Date(inv.issueDate).toLocaleString('default', { month: 'short' });
        const total = inv.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        data[month] = (data[month] || 0) + total;
      }
    });
    return Object.keys(data).map(key => ({ name: key, amount: data[key] }));
  }, [invoices]);

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition duration-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {subtext && <p className="text-xs text-slate-400 mt-4 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1"/> {subtext}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-emerald-500"
          subtext="Collected all time"
        />
        <StatCard
          title="Outstanding"
          value={`$${stats.outstandingAmount.toLocaleString()}`}
          icon={Clock}
          color="bg-blue-500"
          subtext="Pending payments"
        />
        <StatCard
          title="Overdue"
          value={`$${stats.overdueAmount.toLocaleString()}`}
          icon={AlertCircle}
          color="bg-rose-500"
          subtext="Action required"
        />
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          icon={FileText}
          color="bg-indigo-500"
          subtext="Including drafts"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Overview</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40}>
                   {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Mini List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-80">
            {invoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    inv.status === InvoiceStatus.Paid ? 'bg-emerald-500' :
                    inv.status === InvoiceStatus.Overdue ? 'bg-rose-500' :
                    inv.status === InvoiceStatus.Draft ? 'bg-slate-300' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{inv.clientName}</p>
                    <p className="text-xs text-slate-500">{inv.issueDate}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-bold text-slate-700">
                     ${inv.items.reduce((a,b) => a+(b.quantity*b.price),0).toLocaleString()}
                   </p>
                   <p className="text-xs text-slate-500 capitalize">{inv.status}</p>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;