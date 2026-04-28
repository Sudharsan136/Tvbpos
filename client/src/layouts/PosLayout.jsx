import { useState } from 'react';
import tvbLogo from '../assets/MkNfz.jpg';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Monitor, ChefHat, ClipboardList,
  UtensilsCrossed, Users, Settings, LogOut, Menu, X, LayoutGrid,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function PosLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: true },
    { to: '/terminal', icon: Monitor, label: 'Terminal' },
    { to: '/tables', icon: LayoutGrid, label: 'Tables', adminOnly: true },
    { to: '/kitchen', icon: ChefHat, label: 'Kitchen (KDS)' },
    { to: '/orders', icon: ClipboardList, label: 'Orders' },
    { to: '/menu', icon: UtensilsCrossed, label: 'Menu', adminOnly: true },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/settings', icon: Settings, label: 'Settings', adminOnly: true },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="flex h-screen bg-[#f0fdf4] overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[70px]'} transition-all duration-300 bg-white border-r-2 border-[#bbf7d0] flex flex-col shrink-0 shadow-sm`}>

        {/* Brand */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b-2 border-[#dcfce7] ${!sidebarOpen ? 'justify-center px-2' : ''}`}>
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border-2 border-[#bbf7d0] shrink-0 flex items-center justify-center shadow-sm">
            <img src={tvbLogo} alt="TVB" className="w-full h-full object-contain p-0.5" />
          </div>
          {sidebarOpen && (
            <div className="mt-1">
              <p className="text-[#15803d] font-bold text-lg leading-none" style={{ fontFamily: '"Almendra", serif' }}>Topi Vappa</p>
              <p className="text-[#16a34a] text-xs font-bold tracking-widest mt-0.5" style={{ fontFamily: '"Almendra", serif' }}>Biriyani</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={!sidebarOpen ? label : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 font-medium text-sm ${
                  isActive
                    ? 'bg-[#16a34a] text-white shadow-md shadow-[#16a34a]/25'
                    : 'text-[#374151] hover:bg-[#dcfce7] hover:text-[#15803d]'
                } ${!sidebarOpen ? 'justify-center' : ''}`
              }
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t-2 border-[#dcfce7] p-3 space-y-2">
          {sidebarOpen && (
            <div className="px-3 py-3 bg-[#f0fdf4] rounded-xl border border-[#bbf7d0]">
              <p className="text-[#111827] text-sm font-bold truncate">{user?.name}</p>
              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[#16a34a]/10 text-[#16a34a] capitalize font-semibold mt-1">
                {user?.role}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[#dc2626] hover:bg-[#fef2f2] transition text-sm font-medium ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut size={17} className="shrink-0" />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="h-14 bg-white border-b-2 border-[#dcfce7] flex items-center justify-between px-5 shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-[#374151] hover:bg-[#dcfce7] hover:text-[#16a34a] transition"
          >
            {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#dcfce7] text-[#16a34a] text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
              Live
            </div>
            <span className="text-[#6b7280] text-sm font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#f0fdf4]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
