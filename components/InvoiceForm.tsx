import React, { useState, useRef } from 'react';
import { Plus, Trash2, Upload, Loader2, Sparkles, Save, ArrowLeft } from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceStatus } from '../types';
import { extractInvoiceFromImage, fileToGenerativePart } from '../services/geminiService';

interface InvoiceFormProps {
  initialData?: Invoice | null;
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
}

const emptyItem: InvoiceItem = {
  id: '',
  description: '',
  quantity: 1,
  price: 0,
};

const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialData, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Invoice>>(
    initialData || {
      clientName: '',
      clientEmail: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: InvoiceStatus.Draft,
      items: [{ ...emptyItem, id: Math.random().toString(36).substr(2, 9) }],
      notes: '',
    }
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const base64 = await fileToGenerativePart(file);
      const data = await extractInvoiceFromImage(base64, file.type);
      
      setFormData(prev => ({
        ...prev,
        clientName: data.clientName || prev.clientName,
        issueDate: data.issueDate || prev.issueDate,
        dueDate: data.dueDate || prev.dueDate,
        items: data.items?.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9)
        })) || prev.items
      }));
    } catch (err) {
      console.error("AI extraction failed", err);
      alert("Failed to extract data from the image.");
    } finally {
      setLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { ...emptyItem, id: Math.random().toString(36).substr(2, 9) }]
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const calculateTotal = () => {
    return formData.items?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
    } as Invoice);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center space-x-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800">
            {initialData ? 'Edit Invoice' : 'New Invoice'}
          </h2>
        </div>
        
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition border border-indigo-200"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Auto-fill from Image</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        {/* Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Client Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                value={formData.clientName}
                onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Client Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                value={formData.clientEmail}
                onChange={e => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                placeholder="billing@acme.com"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Issue Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  value={formData.issueDate}
                  onChange={e => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  value={formData.dueDate}
                  onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as InvoiceStatus }))}
              >
                {Object.values(InvoiceStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            Line Items
            <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {formData.items?.length || 0} items
            </span>
          </h3>
          <div className="space-y-3">
            {formData.items?.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-start bg-slate-50 p-3 rounded-lg border border-slate-100 group hover:border-indigo-100 transition-colors">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Description"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                    value={item.quantity}
                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                    value={item.price}
                    onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value))}
                  />
                </div>
                <div className="w-24 py-1.5 text-right font-medium text-slate-700 text-sm">
                  ${(item.quantity * item.price).toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-4 flex items-center space-x-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded hover:bg-indigo-50 transition w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Add Line Item</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-start border-t border-slate-100 pt-6">
          <div className="w-full md:w-1/2 mb-6 md:mb-0">
            <label className="block text-sm font-medium text-slate-600 mb-1">Notes / Terms</label>
            <textarea
              className="w-full h-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm resize-none"
              placeholder="Payment due within 30 days..."
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <div className="w-full md:w-1/3 flex flex-col items-end">
            <div className="w-full flex justify-between text-lg font-bold text-slate-800 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span>Total Due</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="mt-6 flex space-x-3 w-full">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 flex justify-center items-center space-x-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                <Save className="w-4 h-4" />
                <span>Save Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;