import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, FileText, Plus, Settings, Search, Bell, Menu, X, Bot, ChevronRight, Briefcase } from 'lucide-react';
import { Invoice, InvoiceStatus, View, DashboardStats } from './types';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import { generateFinancialInsights } from './services/geminiService';

// Mock Data
const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-001',
    clientName: 'Tech Solutions Inc',
    clientEmail: 'accounts@techsolutions.com',
    issueDate: '2023-10-15',
    dueDate: '2023-11-15',
    status: InvoiceStatus.Paid,
    items: [
      { id: '1', description: 'Frontend Development', quantity: 40, price: 85 },
      { id: '2', description: 'UI Design', quantity: 15, price: 95 }
    ],
    notes: 'Thank you for your business!'
  },
  {
    id: 'INV-002',
    clientName: 'Creative Agency',
    clientEmail: 'billing@creative.agency',
    issueDate: '2023-10-28',
    dueDate: '2023-11-10',
    status: InvoiceStatus.Overdue,
    items: [
      { id: '3', description: 'Logo Redesign', quantity: 1, price: 1500 }
    ],
    notes: 'Late fees apply after 30 days.'
  },
  {
    id: 'INV-003',
    clientName: 'Startup Hub',
    clientEmail: 'hello@startuphub.io',
    issueDate: '2023-11-05',
    dueDate: '2023-12-05',
    status: InvoiceStatus.Pending,
    items: [
      { id: '4', description: 'Consultation', quantity: 5, price: 200 },
      { id: '5', description: 'Server Setup', quantity: 1, price: 500 }
    ]
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Insight State
  const [showInsights, setShowInsights] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsText, setInsightsText] = useState<string | null>(null);

  // Derived Stats
  const stats: DashboardStats = useMemo(() => {
    return invoices.reduce((acc, inv) => {
      const total = inv.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      acc.totalInvoices++;
      if (inv.status === InvoiceStatus.Paid) {
        acc.totalRevenue += total;
      } else if (inv.status === InvoiceStatus.Pending) {
        acc.outstandingAmount += total;
      } else if (inv.status === InvoiceStatus.Overdue) {
        acc.overdueAmount += total;
      }
      return acc;
    }, { totalRevenue: 0, outstandingAmount: 0, overdueAmount: 0, totalInvoices: 0 });
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invoices, searchQuery]);

  const handleSaveInvoice = (invoice: Invoice) => {
    if (editingInvoice) {
      setInvoices(prev => prev.map(inv => inv.id === invoice.id ? invoice : inv));
    } else {
      setInvoices(prev => [invoice, ...prev]);
    }
    setEditingInvoice(null);
    setView('invoices');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setView('create-invoice');
  };

  const handleDeleteInvoice = (id: string) => {
    if(window.confirm("Are you sure you want to delete this invoice?")) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    }
  };

  const handleGetInsights = async () => {
    setShowInsights(true);
    if (!insightsText) {
      setInsightsLoading(true);
      const text = await generateFinancialInsights(invoices);
      setInsightsText(text);
      setInsightsLoading(false);
    }
  };

  // Status Badge Component
  const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
    const styles = {
      [InvoiceStatus.Paid]: "bg-emerald-100 text-emerald-700 border-emerald-200",
      [InvoiceStatus.Pending]: "bg-blue-100 text-blue-700 border-blue-200",
      [InvoiceStatus.Overdue]: "bg-rose-100 text-rose-700 border-rose-200",
      [InvoiceStatus.Draft]: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl z-20 absolute md:relative h-full md:h-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800 justify-between md:justify-start">
          <div className="flex items-center">
             <Briefcase className="w-8 h-8 text-indigo-400 flex-shrink-0" />
             {isSidebarOpen && <span className="ml-3 font-bold text-xl tracking-tight hidden md:block">Nova Invoice</span>}
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          <button 
            onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className={`ml-3 font-medium ${!isSidebarOpen && 'md:hidden'}`}>Dashboard</span>
          </button>
          
          <button 
            onClick={() => { setView('invoices'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === 'invoices' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className={`ml-3 font-medium ${!isSidebarOpen && 'md:hidden'}`}>Invoices</span>
          </button>

           <div className="pt-4 mt-4 border-t border-slate-800">
              <button 
                onClick={() => { handleGetInsights(); setIsSidebarOpen(false); }}
                className="w-full flex items-center p-3 rounded-lg text-indigo-300 hover:bg-slate-800 hover:text-indigo-200 transition-colors group"
              >
                <Bot className="w-5 h-5 flex-shrink-0" />
                <span className={`ml-3 font-medium flex-1 text-left ${!isSidebarOpen && 'md:hidden'}`}>AI Advisor</span>
                {isSidebarOpen && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"/>}
              </button>
           </div>
        </nav>

        <div className="p-4 border-t border-slate-800 hidden md:block">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
             <Menu className="w-5 h-5"/>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10">
          <div className="flex items-center gap-4 flex-1">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-600">
               <Menu className="w-6 h-6" />
             </button>
             <div className="relative w-full max-w-xl">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
               <input 
                 type="text" 
                 placeholder="Search invoices..." 
                 className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                 value={searchQuery}
                 onChange={(e) => {
                   setSearchQuery(e.target.value);
                   if (view !== 'invoices') setView('invoices');
                 }}
               />
             </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4 ml-4">
             <button 
               onClick={() => {
                 setEditingInvoice(null);
                 setView('create-invoice');
               }}
               className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-lg transition shadow-sm font-medium text-sm whitespace-nowrap"
             >
               <Plus className="w-4 h-4" />
               <span className="hidden md:inline">New Invoice</span>
               <span className="md:hidden">New</span>
             </button>
             <button className="hidden md:block p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition relative">
               <Bell className="w-5 h-5" />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
               JD
             </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6 lg:p-8">
           {view === 'dashboard' && <Dashboard invoices={invoices} stats={stats} />}
           
           {view === 'invoices' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-800">All Invoices</h2>
                 <span className="text-sm text-slate-500">{filteredInvoices.length} results</span>
               </div>
               
               {/* Desktop Table */}
               <div className="hidden md:block overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                       <th className="p-4">Invoice ID</th>
                       <th className="p-4">Client</th>
                       <th className="p-4">Date</th>
                       <th className="p-4">Amount</th>
                       <th className="p-4">Status</th>
                       <th className="p-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredInvoices.map(inv => (
                       <tr key={inv.id} className="hover:bg-slate-50/50 transition group">
                         <td className="p-4 font-medium text-slate-700 text-sm">#{inv.id}</td>
                         <td className="p-4">
                            <div className="text-sm font-medium text-slate-800">{inv.clientName}</div>
                            <div className="text-xs text-slate-400">{inv.clientEmail}</div>
                         </td>
                         <td className="p-4 text-sm text-slate-600">{inv.issueDate}</td>
                         <td className="p-4 text-sm font-bold text-slate-700">
                           ${inv.items.reduce((s, i) => s + (i.price*i.quantity), 0).toFixed(2)}
                         </td>
                         <td className="p-4">
                           <StatusBadge status={inv.status} />
                         </td>
                         <td className="p-4 text-right">
                           <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleEditInvoice(inv)}
                               className="px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200 transition"
                             >
                               Edit
                             </button>
                             <button 
                               onClick={() => handleDeleteInvoice(inv.id)}
                               className="px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                             >
                               Delete
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                     {filteredInvoices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No invoices found.
                          </td>
                        </tr>
                     )}
                   </tbody>
                 </table>
               </div>

               {/* Mobile Card List View */}
               <div className="md:hidden divide-y divide-slate-100">
                 {filteredInvoices.map(inv => (
                   <div key={inv.id} className="p-4 space-y-3">
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="font-bold text-slate-800 text-sm">{inv.clientName}</div>
                         <div className="text-xs text-slate-500 mt-0.5">#{inv.id} • {inv.issueDate}</div>
                       </div>
                       <div className="text-right">
                         <div className="font-bold text-slate-800 text-sm">
                           ${inv.items.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex justify-between items-center pt-1">
                       <StatusBadge status={inv.status} />
                       <div className="flex space-x-2">
                         <button 
                           onClick={() => handleEditInvoice(inv)}
                           className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded border border-indigo-100"
                         >
                           Edit
                         </button>
                         <button 
                           onClick={() => handleDeleteInvoice(inv.id)}
                           className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 rounded border border-rose-100"
                         >
                           Delete
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
                 {filteredInvoices.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      No invoices found.
                    </div>
                 )}
               </div>
             </div>
           )}

           {view === 'create-invoice' && (
             <InvoiceForm 
               initialData={editingInvoice}
               onSave={handleSaveInvoice}
               onCancel={() => setView(editingInvoice ? 'invoices' : 'dashboard')}
             />
           )}
        </div>

        {/* AI Insights Modal */}
        {showInsights && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
              <div className="bg-indigo-600 p-6 flex justify-between items-start">
                 <div>
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <Bot className="w-6 h-6 mr-2" />
                      Financial Advisor
                    </h3>
                    <p className="text-indigo-100 text-sm mt-1">Powered by Gemini</p>
                 </div>
                 <button onClick={() => setShowInsights(false)} className="text-indigo-200 hover:text-white transition">
                   <X className="w-6 h-6" />
                 </button>
              </div>
              <div className="p-6">
                {insightsLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Analyzing your financial data...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none">
                     <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                       {insightsText}
                     </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowInsights(false)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;