import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Calendar, Filter, Download, Printer, BarChart3, TrendingUp,
  DollarSign, ClipboardList, Percent, Table, Clock, Grid,
  CreditCard, Compass, ChevronRight, FileSpreadsheet, RefreshCw
} from 'lucide-react';

const CHART_COLORS = ['#16a34a', '#0284c7', '#ea580c', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  
  // Filters State
  const [datePreset, setDatePreset] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderType, setOrderType] = useState('');
  const [source, setSource] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  
  // Loading & Data States
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState({ kpis: {}, chartData: [] });
  const [itemData, setItemData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [rawOrders, setRawOrders] = useState([]);

  // Pivot Builder Configurations
  const [pivotRow, setPivotRow] = useState('paymentMode');
  const [pivotCol, setPivotCol] = useState('orderType');
  const [pivotMetric, setPivotMetric] = useState('grandTotal');

  // Set default dates to today
  useEffect(() => {
    handlePresetChange('today');
  }, []);

  // Sync date preset calculations
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(today.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(today.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(today.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        return; // Don't modify inputs
      default:
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Fetch all reports data from backend aggregates
  const fetchData = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    const params = { startDate, endDate, orderType, source, paymentMode };
    
    try {
      // 1. Fetch Sales Summary always (for KPI cards & Main analytics)
      const salesRes = await api.get('/reports/sales-summary', { params });
      setSalesData(salesRes.data);

      // 2. Fetch specific tab data or load everything to keep pivot updated
      const [itemsRes, paymentsRes, sourcesRes, tablesRes, hourlyRes, rawRes] = await Promise.all([
        api.get('/reports/items', { params }),
        api.get('/reports/payments', { params }),
        api.get('/reports/sources', { params }),
        api.get('/reports/tables', { params }),
        api.get('/reports/hourly', { params }),
        api.get('/reports/raw-orders', { params })
      ]);

      setItemData(itemsRes.data);
      setPaymentData(paymentsRes.data);
      setSourceData(sourcesRes.data);
      setTableData(tablesRes.data);
      setHourlyData(hourlyRes.data);
      setRawOrders(rawRes.data);

    } catch (error) {
      console.error('Error loading report analytics:', error);
      toast.error('Failed to load reports. Please check date range.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger load when dates or global filters change
  useEffect(() => {
    fetchData();
  }, [startDate, endDate, orderType, source, paymentMode]);

  // Client-Side CSV Exporter
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `Report_${activeTab}_${startDate}_to_${endDate}.csv`;

    switch (activeTab) {
      case 'sales':
        headers = ['Date', 'Revenue (INR)', 'Order Count'];
        rows = salesData.chartData.map(d => [d.date, d.revenue, d.orders]);
        break;
      case 'items':
        headers = ['Item Name', 'Category', 'Dietary Type', 'Quantity Sold', 'Revenue (INR)'];
        rows = itemData.map(d => [d.name, d.category, d.isVeg ? 'Veg' : 'Non-Veg', d.qty, d.revenue]);
        break;
      case 'payments':
        headers = ['Payment Mode', 'Revenue (INR)', 'Transactions'];
        rows = paymentData.map(d => [d.mode.toUpperCase(), d.revenue, d.orders]);
        break;
      case 'sources':
        headers = ['Source', 'Type', 'Revenue (INR)', 'Orders'];
        rows = sourceData.map(d => [d.source.toUpperCase(), d.orderType.toUpperCase(), d.revenue, d.orders]);
        break;
      case 'tables':
        headers = ['Table / Placement', 'Revenue (INR)', 'Bills Issued'];
        rows = tableData.map(d => [d.tableName, d.revenue, d.orders]);
        break;
      case 'hourly':
        headers = ['Time Bracket', 'Revenue (INR)', 'Orders Count'];
        rows = hourlyData.map(d => [d.label, d.revenue, d.orders]);
        break;
      case 'pivot':
        // Generate CSV for currently compiled Pivot table
        const pivot = calculatePivot();
        headers = [pivotRow.toUpperCase(), ...pivot.cols, 'GRAND TOTAL'];
        rows = pivot.rows.map(row => {
          const rowData = [row];
          pivot.cols.forEach(col => {
            rowData.push(pivot.matrix[row]?.[col] || 0);
          });
          rowData.push(pivot.rowTotals[row] || 0);
          return rowData;
        });
        // Append bottom Grand Total row
        const bottomRow = ['GRAND TOTAL'];
        pivot.cols.forEach(col => {
          bottomRow.push(pivot.colTotals[col] || 0);
        });
        bottomRow.push(pivot.grandTotal);
        rows.push(bottomRow);
        filename = `Pivot_${pivotRow}_vs_${pivotCol}_${startDate}_to_${endDate}.csv`;
        break;
      default:
        return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully');
  };

  // Browser Print stylesheet injector for clean A4 printing
  const handlePrint = () => {
    window.print();
  };

  // Pivot grid compiler (Row vs Col cross tabulation calculations)
  const calculatePivot = () => {
    if (!rawOrders.length) return { rows: [], cols: [], matrix: {}, rowTotals: {}, colTotals: {}, grandTotal: 0 };

    const rowsSet = new Set();
    const colsSet = new Set();
    const matrix = {};
    const rowTotals = {};
    const colTotals = {};
    let grandTotal = 0;

    rawOrders.forEach(order => {
      // Map data properties
      let rKey = order[pivotRow] || 'N/A';
      let cKey = pivotCol === 'none' ? 'All Orders' : (order[pivotCol] || 'N/A');

      // Capitalize for display readability
      if (typeof rKey === 'string') rKey = rKey.toUpperCase();
      if (typeof cKey === 'string') cKey = cKey.toUpperCase();

      rowsSet.add(rKey);
      colsSet.add(cKey);

      // Determine numeric value to sum
      let value = 0;
      if (pivotMetric === 'count') {
        value = 1;
      } else {
        value = Number(order[pivotMetric]) || 0;
      }

      // Initialize structures
      if (!matrix[rKey]) matrix[rKey] = {};
      if (!matrix[rKey][cKey]) matrix[rKey][cKey] = 0;

      matrix[rKey][cKey] += value;

      rowTotals[rKey] = (rowTotals[rKey] || 0) + value;
      colTotals[cKey] = (colTotals[cKey] || 0) + value;
      grandTotal += value;
    });

    const rows = Array.from(rowsSet).sort();
    const cols = Array.from(colsSet).sort();

    // Round financial numbers
    if (pivotMetric !== 'count') {
      rows.forEach(r => {
        cols.forEach(c => {
          if (matrix[r][c]) matrix[r][c] = parseFloat(matrix[r][c].toFixed(2));
        });
        rowTotals[r] = parseFloat(rowTotals[r].toFixed(2));
      });
      cols.forEach(c => {
        colTotals[c] = parseFloat(colTotals[c].toFixed(2));
      });
      grandTotal = parseFloat(grandTotal.toFixed(2));
    }

    return { rows, cols, matrix, rowTotals, colTotals, grandTotal };
  };

  const currentPivot = calculatePivot();

  // Dynamic label for metric sums
  const getMetricLabel = () => {
    switch (pivotMetric) {
      case 'grandTotal': return 'Revenue (₹)';
      case 'subtotal': return 'Subtotal (₹)';
      case 'discountAmount': return 'Discounts (₹)';
      case 'cgst': return 'CGST (₹)';
      case 'sgst': return 'SGST (₹)';
      case 'count': return 'Orders Count';
      default: return '';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#f0fdf4] min-h-screen">
      
      {/* Dynamic inline styles to hide layout sidebars & headers during print */}
      <style>{`
        @media print {
          aside, header, .no-print {
            display: none !important;
          }
          body, .print-container {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-card {
            border: 1px solid #d1d5db !important;
            box-shadow: none !important;
            break-inside: avoid;
            margin-bottom: 1.5rem;
          }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#bbf7d0] no-print">
        <div>
          <h1 className="text-3xl font-black text-[#15803d] flex items-center gap-2.5">
            <BarChart3 className="w-8 h-8 text-[#16a34a]" /> Reports & Analytics
          </h1>
          <p className="text-sm text-[#4b5563] mt-1 font-medium">
            Monitor restaurant performance, dish metrics, hourly rush trends, and custom transactional pivot tables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#bbf7d0] rounded-xl text-sm font-semibold text-[#15803d] hover:bg-[#dcfce7] transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Reload
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#bbf7d0] rounded-xl text-sm font-semibold text-[#374151] hover:bg-[#dcfce7] transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-[#16a34a]" /> Print PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#16a34a] rounded-xl text-sm font-semibold text-white hover:bg-[#15803d] transition shadow-md shadow-[#16a34a]/25"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Filter Controls ── */}
      <div className="bg-white rounded-2xl border-2 border-[#bbf7d0] p-5 shadow-sm space-y-4 no-print">
        <div className="flex items-center gap-2 text-[#15803d] font-bold text-base">
          <Filter className="w-5 h-5" /> Filter Controls
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          
          {/* Preset Buttons */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-bold text-[#4b5563]">Date Presets</label>
            <div className="grid grid-cols-5 gap-1 bg-[#f0fdf4] p-1 rounded-xl border border-[#bbf7d0]">
              {['today', 'yesterday', 'week', 'month', 'thisMonth'].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePresetChange(p)}
                  className={`text-[10px] font-bold py-1.5 px-0.5 rounded-lg transition text-center capitalize ${
                    datePreset === p 
                      ? 'bg-[#16a34a] text-white shadow-sm'
                      : 'text-[#374151] hover:bg-[#dcfce7]'
                  }`}
                >
                  {p === 'thisMonth' ? 'Month Start' : p === 'week' ? '7 Days' : p === 'month' ? '30 Days' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4b5563] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#16a34a]" /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full bg-[#f9fafb] text-sm text-[#1f2937] font-medium border border-[#d1d5db] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#16a34a]/30 focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4b5563] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#16a34a]" /> End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full bg-[#f9fafb] text-sm text-[#1f2937] font-medium border border-[#d1d5db] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#16a34a]/30 focus:outline-none"
            />
          </div>

          {/* Order Type */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4b5563]">Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full bg-[#f9fafb] text-sm text-[#1f2937] font-semibold border border-[#d1d5db] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#16a34a]/30 focus:outline-none"
            >
              <option value="">All Orders</option>
              <option value="dine_in">Dine In 🍽️</option>
              <option value="takeaway">Takeaway 🛍️</option>
              <option value="online">Online Delivery 📱</option>
            </select>
          </div>

          {/* Order Source */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4b5563]">Source Channel</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-[#f9fafb] text-sm text-[#1f2937] font-semibold border border-[#d1d5db] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#16a34a]/30 focus:outline-none"
            >
              <option value="">All Sources</option>
              <option value="pos">POS Terminal</option>
              <option value="swiggy">Swiggy Integration</option>
              <option value="zomato">Zomato Integration</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print-container">
        
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#bbf7d0] shadow-sm flex items-center gap-4 print-card hover:translate-y-[-2px] transition-transform">
          <div className="w-12 h-12 rounded-xl bg-[#dcfce7] flex items-center justify-center text-[#16a34a] shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6b7280]">GRAND REVENUE</p>
            <h3 className="text-xl md:text-2xl font-black text-[#111827] mt-0.5">
              ₹{(salesData.kpis?.totalRevenue || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-[#4b5563] mt-1 font-semibold">Net subtotal: ₹{(salesData.kpis?.totalSubtotal || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-[#bbf7d0] shadow-sm flex items-center gap-4 print-card hover:translate-y-[-2px] transition-transform">
          <div className="w-12 h-12 rounded-xl bg-[#e0f2fe] flex items-center justify-center text-[#0284c7] shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6b7280]">BILLS PAID</p>
            <h3 className="text-xl md:text-2xl font-black text-[#111827] mt-0.5">
              {(salesData.kpis?.totalOrders || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-[#4b5563] mt-1 font-semibold">Avg size: ₹{(salesData.kpis?.averageOrderValue || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Taxes Collected */}
        <div className="bg-white p-5 rounded-2xl border border-[#bbf7d0] shadow-sm flex items-center gap-4 print-card hover:translate-y-[-2px] transition-transform">
          <div className="w-12 h-12 rounded-xl bg-[#fef3c7] flex items-center justify-center text-[#d97706] shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6b7280]">GST TAXES</p>
            <h3 className="text-xl md:text-2xl font-black text-[#111827] mt-0.5">
              ₹{(salesData.kpis?.totalTax || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-[#4b5563] mt-1 font-semibold">CGST/SGST: ₹{(salesData.kpis?.totalCgst || 0).toLocaleString('en-IN')} each</p>
          </div>
        </div>

        {/* Discounts Given */}
        <div className="bg-white p-5 rounded-2xl border border-[#bbf7d0] shadow-sm flex items-center gap-4 print-card hover:translate-y-[-2px] transition-transform">
          <div className="w-12 h-12 rounded-xl bg-[#fee2e2] flex items-center justify-center text-[#dc2626] shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6b7280]">DISCOUNTS OFFERED</p>
            <h3 className="text-xl md:text-2xl font-black text-[#111827] mt-0.5">
              ₹{(salesData.kpis?.totalDiscount || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-[#4b5563] mt-1 font-semibold">Promotional campaigns & items</p>
          </div>
        </div>

      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex border-b-2 border-[#dcfce7] overflow-x-auto no-print">
        {[
          { id: 'sales', label: 'Sales Analytics', icon: TrendingUp },
          { id: 'items', label: 'Item Performance', icon: DollarSign },
          { id: 'payments', label: 'Payment Splits', icon: CreditCard },
          { id: 'sources', label: 'Channels & Types', icon: Compass },
          { id: 'tables', label: 'Table Stats', icon: Table },
          { id: 'hourly', label: 'Peak Hour Trends', icon: Clock },
          { id: 'pivot', label: 'Dynamic Pivot Builder 🎛️', icon: Grid },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 py-3 px-5 font-bold text-sm shrink-0 border-b-4 transition-all ${
                activeTab === t.id
                  ? 'border-[#16a34a] text-[#15803d] bg-white rounded-t-xl'
                  : 'border-transparent text-[#4b5563] hover:text-[#16a34a] hover:bg-[#dcfce7]/40'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── MAIN REPORTS VIEW AREA ── */}
      <div className="bg-white rounded-2xl border-2 border-[#bbf7d0] p-6 shadow-sm min-h-[300px] print-container">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw className="w-12 h-12 text-[#16a34a] animate-spin mb-4" />
            <h3 className="text-lg font-bold text-[#1f2937]">Aggregating Sales Records...</h3>
            <p className="text-sm text-[#4b5563] mt-1">MongoDB is running multi-tier analytics aggregation pipelines.</p>
          </div>
        ) : (
          
          <div>
            
            {/* 1. SALES SUMMARY VIEW */}
            {activeTab === 'sales' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3">
                  <h2 className="text-lg font-bold text-[#111827]">Daily Revenue Trend</h2>
                  <span className="text-xs text-[#6b7280] font-semibold">{startDate} to {endDate}</span>
                </div>
                
                {salesData.chartData.length === 0 ? (
                  <div className="py-12 text-center text-[#6b7280] font-semibold">No sales transactions available for this period.</div>
                ) : (
                  <>
                    <div className="h-80 w-full no-print">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
                          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                          <Tooltip contentStyle={{ background: '#111827', color: '#fff', borderRadius: '12px' }} />
                          <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#16a34a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                          <Line type="monotone" dataKey="orders" name="Orders Issued" stroke="#0284c7" strokeWidth={2} activeDot={{ r: 6 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto mt-4 rounded-xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f9fafb]">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-[#374151] uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Revenue Collected</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Orders Generated</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {salesData.chartData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{row.date}</td>
                              <td className="px-6 py-3.5 text-right text-sm font-bold text-[#16a34a]">₹{row.revenue.toLocaleString('en-IN')}</td>
                              <td className="px-6 py-3.5 text-right text-sm font-medium text-gray-700">{row.orders}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 2. ITEM PERFORMANCE VIEW */}
            {activeTab === 'items' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3">
                  <h2 className="text-lg font-bold text-[#111827]">Dish Ranking Performance</h2>
                  <span className="text-xs text-[#6b7280] font-semibold">Best-Sellers by Quantity</span>
                </div>

                {itemData.length === 0 ? (
                  <div className="py-12 text-center text-[#6b7280] font-semibold">No food item sales data.</div>
                ) : (
                  <>
                    <div className="h-80 w-full no-print">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={itemData.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" stroke="#6b7280" fontSize={10} angle={-15} textAnchor="end" height={50} />
                          <YAxis stroke="#6b7280" fontSize={12} />
                          <Tooltip contentStyle={{ background: '#111827', color: '#fff', borderRadius: '12px' }} />
                          <Bar dataKey="qty" name="Qty Sold" fill="#16a34a" radius={[6, 6, 0, 0]}>
                            {itemData.slice(0, 10).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto mt-4 rounded-xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f9fafb]">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-[#374151] uppercase tracking-wider">Item Name</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-[#374151] uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3.5 text-center text-xs font-bold text-[#374151] uppercase tracking-wider">Diet Type</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Qty Sold</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Revenue Generated</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {itemData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{row.name}</td>
                              <td className="px-6 py-3.5 text-sm font-semibold text-gray-500 capitalize">{row.category}</td>
                              <td className="px-6 py-3.5 text-center text-sm font-medium">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  row.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {row.isVeg ? 'Veg' : 'Non-Veg'}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-right text-sm font-bold text-gray-900">{row.qty}</td>
                              <td className="px-6 py-3.5 text-right text-sm font-bold text-[#16a34a]">₹{row.revenue.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 3. PAYMENT MODES VIEW */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3">
                  <h2 className="text-lg font-bold text-[#111827]">Revenue Split by Payment Mode</h2>
                  <span className="text-xs text-[#6b7280] font-semibold">Digital vs cash flows</span>
                </div>

                {paymentData.length === 0 ? (
                  <div className="py-12 text-center text-[#6b7280] font-semibold">No payment analytics available.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="h-64 no-print">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="revenue"
                            nameKey="mode"
                            label={({ name, percent }) => `${name.toUpperCase()} ${(percent * 100).toFixed(0)}%`}
                          >
                            {paymentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#111827', color: '#fff', borderRadius: '12px' }} formatter={(val) => `₹${val}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f9fafb]">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-[#374151] uppercase tracking-wider">Method</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Total Sales</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Bill Count</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paymentData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-3.5 text-sm font-semibold text-gray-900 capitalize flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                                {row.mode}
                              </td>
                              <td className="px-6 py-3.5 text-right text-sm font-bold text-[#16a34a]">₹{row.revenue.toLocaleString('en-IN')}</td>
                              <td className="px-6 py-3.5 text-right text-sm font-medium text-gray-700">{row.orders}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. CHANNELS & TYPES VIEW */}
            {activeTab === 'sources' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3">
                  <h2 className="text-lg font-bold text-[#111827]">Order Channels & Types breakdown</h2>
                  <span className="text-xs text-[#6b7280] font-semibold">POS vs Swiggy/Zomato</span>
                </div>

                {sourceData.length === 0 ? (
                  <div className="py-12 text-center text-[#6b7280] font-semibold">No integration source analysis.</div>
                ) : (
                  <>
                    <div className="h-72 no-print">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sourceData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="source" stroke="#6b7280" formatter={(v) => v.toUpperCase()} />
                          <YAxis stroke="#6b7280" />
                          <Tooltip contentStyle={{ background: '#111827', color: '#fff', borderRadius: '12px' }} />
                          <Legend />
                          <Bar dataKey="revenue" name="Revenue Sum (₹)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="orders" name="Order count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto mt-4 rounded-xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f9fafb]">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-[#374151] uppercase tracking-wider">Source Engine</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-[#374151] uppercase tracking-wider">Order Type</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Total Sum</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Transactions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sourceData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-3.5 text-sm font-semibold text-gray-900 uppercase">{row.source}</td>
                              <td className="px-6 py-3.5 text-sm font-semibold text-gray-500 uppercase">{row.orderType}</td>
                              <td className="px-6 py-3.5 text-right text-sm font-bold text-[#16a34a]">₹{row.revenue.toLocaleString('en-IN')}</td>
                              <td className="px-6 py-3.5 text-right text-sm font-medium text-gray-700">{row.orders}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 5. TABLE STATUS VIEW */}
            {activeTab === 'tables' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3">
                  <h2 className="text-lg font-bold text-[#111827]">Table Occupancy & Sales Rankings</h2>
                  <span className="text-xs text-[#6b7280] font-semibold">Which tables generate the most bills</span>
                </div>

                {tableData.length === 0 ? (
                  <div className="py-12 text-center text-[#6b7280] font-semibold">No table transaction logs.</div>
                ) : (
                  <>
                    <div className="h-72 no-print">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tableData} layout="vertical" margin={{ top: 10, right: 10, left: 50, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" stroke="#6b7280" />
                          <YAxis dataKey="tableName" type="category" stroke="#6b7280" fontSize={11} width={120} />
                          <Tooltip contentStyle={{ background: '#111827', color: '#fff', borderRadius: '12px' }} />
                          <Bar dataKey="revenue" name="Revenue (₹)" fill="#16a34a" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto mt-4 rounded-xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f9fafb]">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-[#374151] uppercase tracking-wider">Placement / Table</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Grand Revenue</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Bills Issued</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {tableData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{row.tableName}</td>
                              <td className="px-6 py-3.5 text-right text-sm font-bold text-[#16a34a]">₹{row.revenue.toLocaleString('en-IN')}</td>
                              <td className="px-6 py-3.5 text-right text-sm font-medium text-gray-700">{row.orders}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 6. PEAK HOURS VIEW */}
            {activeTab === 'hourly' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3">
                  <h2 className="text-lg font-bold text-[#111827]">Peak Hour Sales Load Distribution</h2>
                  <span className="text-xs text-[#6b7280] font-semibold">Staff scheduling optimization analyzer</span>
                </div>

                {hourlyData.length === 0 ? (
                  <div className="py-12 text-center text-[#6b7280] font-semibold">No hourly transaction timestamps.</div>
                ) : (
                  <>
                    <div className="h-80 w-full no-print">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="label" stroke="#6b7280" fontSize={11} tickInterval={1} />
                          <YAxis stroke="#6b7280" />
                          <Tooltip contentStyle={{ background: '#111827', color: '#fff', borderRadius: '12px' }} />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" name="Sales Sum (₹)" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="orders" name="Order count" stroke="#ea580c" strokeWidth={2} dot={{ r: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto mt-4 rounded-xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f9fafb]">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-[#374151] uppercase tracking-wider">Time Interval</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Sales Revenue</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-[#374151] uppercase tracking-wider">Orders Received</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {hourlyData.filter(d => d.revenue > 0 || d.orders > 0).map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{row.label}</td>
                              <td className="px-6 py-3.5 text-right text-sm font-bold text-[#16a34a]">₹{row.revenue.toLocaleString('en-IN')}</td>
                              <td className="px-6 py-3.5 text-right text-sm font-medium text-gray-700">{row.orders}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 7. DYNAMIC PIVOT BUILDER VIEW */}
            {activeTab === 'pivot' && (
              <div className="space-y-6">
                
                {/* Builder Controls */}
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-5 rounded-2xl flex flex-col md:flex-row gap-4 md:items-center justify-between no-print">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center flex-1">
                    
                    {/* Rows */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#15803d]">Rows (Row Grouping)</label>
                      <select
                        value={pivotRow}
                        onChange={(e) => setPivotRow(e.target.value)}
                        className="bg-white text-sm text-[#1f2937] font-semibold border border-[#d1d5db] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#16a34a]/30 focus:outline-none"
                      >
                        <option value="paymentMode">Payment Mode 💳</option>
                        <option value="orderType">Order Type 🍽️</option>
                        <option value="source">Order Channel 📡</option>
                        <option value="table">Table Number 🪑</option>
                        <option value="cashier">Cashier Name 👤</option>
                      </select>
                    </div>

                    <div className="hidden md:block text-[#16a34a] font-bold text-xl">×</div>

                    {/* Columns */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#15803d]">Columns (Column Grouping)</label>
                      <select
                        value={pivotCol}
                        onChange={(e) => setPivotCol(e.target.value)}
                        className="bg-white text-sm text-[#1f2937] font-semibold border border-[#d1d5db] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#16a34a]/30 focus:outline-none"
                      >
                        <option value="none">None (Single Column Totals)</option>
                        <option value="paymentMode">Payment Mode 💳</option>
                        <option value="orderType">Order Type 🍽️</option>
                        <option value="source">Order Channel 📡</option>
                        <option value="cashier">Cashier Name 👤</option>
                      </select>
                    </div>

                    <div className="hidden md:block text-[#16a34a] font-bold text-xl">→</div>

                    {/* Aggregation Metric */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#15803d]">Summary Value</label>
                      <select
                        value={pivotMetric}
                        onChange={(e) => setPivotMetric(e.target.value)}
                        className="bg-white text-sm text-[#1f2937] font-semibold border border-[#d1d5db] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#16a34a]/30 focus:outline-none"
                      >
                        <option value="grandTotal">Sales Grand Total (₹)</option>
                        <option value="subtotal">Sales Subtotal (₹)</option>
                        <option value="discountAmount">Discounts Deducted (₹)</option>
                        <option value="cgst">CGST Tax sum (₹)</option>
                        <option value="sgst">SGST Tax sum (₹)</option>
                        <option value="count">Bills Counts (Count)</option>
                      </select>
                    </div>

                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500">Pivot Dimension Size</p>
                    <span className="text-sm font-black text-[#16a34a]">{currentPivot.rows.length} rows × {currentPivot.cols.length} cols</span>
                  </div>
                </div>

                {/* Compiled Pivot Matrix Output Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-[#111827]">Dynamic Crosstab Matrix</h2>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">Metric calculated: {getMetricLabel()}</p>
                    </div>
                    <span className="text-[10px] bg-[#dcfce7] text-[#15803d] px-2.5 py-1 rounded-full font-bold">Dynamic Calculator Live</span>
                  </div>

                  {rawOrders.length === 0 ? (
                    <div className="py-12 text-center text-[#6b7280] font-semibold">No raw order data retrieved. Check date range filters.</div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border-2 border-gray-200">
                      <table className="min-w-full border-collapse">
                        
                        {/* Headers */}
                        <thead>
                          <tr className="bg-[#f9fafb] border-b border-gray-200">
                            <th className="px-6 py-4 text-left text-xs font-extrabold text-[#374151] uppercase tracking-wider border-r border-gray-200 min-w-[150px]">
                              {pivotRow.toUpperCase()}
                            </th>
                            {currentPivot.cols.map((colName) => (
                              <th key={colName} className="px-6 py-4 text-right text-xs font-extrabold text-[#374151] uppercase tracking-wider border-r border-gray-200">
                                {colName}
                              </th>
                            ))}
                            <th className="px-6 py-4 text-right text-xs font-black text-gray-900 uppercase bg-gray-100 tracking-wider">
                              Row Total
                            </th>
                          </tr>
                        </thead>

                        {/* Data Matrix Rows */}
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentPivot.rows.map((rowName) => (
                            <tr key={rowName} className="hover:bg-[#f0fdf4]/50 transition-colors">
                              {/* Row Label */}
                              <td className="px-6 py-4 text-sm font-bold text-gray-900 bg-[#f9fafb] border-r border-gray-200">
                                {rowName}
                              </td>
                              
                              {/* Columns values */}
                              {currentPivot.cols.map((colName) => {
                                const val = currentPivot.matrix[rowName]?.[colName] || 0;
                                return (
                                  <td key={colName} className="px-6 py-4 text-right text-sm font-bold text-gray-700 border-r border-gray-200">
                                    {pivotMetric === 'count' ? val : `₹${val.toLocaleString('en-IN')}`}
                                  </td>
                                );
                              })}

                              {/* Row Total */}
                              <td className="px-6 py-4 text-right text-sm font-black text-gray-900 bg-gray-50">
                                {pivotMetric === 'count' 
                                  ? currentPivot.rowTotals[rowName] 
                                  : `₹${(currentPivot.rowTotals[rowName] || 0).toLocaleString('en-IN')}`
                                }
                              </td>
                            </tr>
                          ))}

                          {/* Grand Total Footer Row */}
                          <tr className="bg-gray-100 font-extrabold border-t-2 border-gray-300">
                            <td className="px-6 py-4 text-sm font-black text-gray-900 border-r border-gray-200 uppercase bg-[#f9fafb]">
                              GRAND TOTAL
                            </td>
                            {currentPivot.cols.map((colName) => {
                              const val = currentPivot.colTotals[colName] || 0;
                              return (
                                <td key={colName} className="px-6 py-4 text-right text-sm font-black text-[#15803d]">
                                  {pivotMetric === 'count' ? val : `₹${val.toLocaleString('en-IN')}`}
                                </td>
                              );
                            })}
                            <td className="px-6 py-4 text-right text-sm font-black text-white bg-[#16a34a] shadow-sm">
                              {pivotMetric === 'count' 
                                ? currentPivot.grandTotal 
                                : `₹${(currentPivot.grandTotal || 0).toLocaleString('en-IN')}`
                              }
                            </td>
                          </tr>

                        </tbody>
                      </table>
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
