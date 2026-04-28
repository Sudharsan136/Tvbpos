import { useState } from 'react';
import tvbLogo from '../assets/MkNfz.jpg';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', data);
      setUser(res.data);
      toast.success(`Welcome, ${res.data.name}! 🍛`);
      navigate(res.data.role === 'admin' ? '/dashboard' : '/terminal');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#f0fdf4]">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#16a34a] p-14 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* Logo */}
        <div className="relative z-10 w-64 md:w-72 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center mb-10 border-4 border-white overflow-hidden">
          <img src={tvbLogo} alt="Topi Vappa Biriyani" className="w-full h-auto object-contain block" />
        </div>

        <div className="relative z-10 text-center mt-2">
          <h1 className="text-6xl font-bold text-white tracking-wide" style={{ fontFamily: '"Almendra", serif' }}>Topi Vappa</h1>
          <h2 className="text-4xl font-bold text-[#bbf7d0] mt-1 tracking-wider" style={{ fontFamily: '"Almendra", serif' }}>Biriyani</h2>
          <p className="text-white/70 text-sm mt-4 leading-relaxed max-w-xs">
            Premium Restaurant Management &amp; Point of Sale System
          </p>

          {/* Stats */}
          <div className="mt-10 flex gap-8 justify-center">
            {[{ val: '12', label: 'Tables' }, { val: '23+', label: 'Menu Items' }, { val: 'Live', label: 'Real-time' }].map(({ val, label }) => (
              <div key={label} className="text-center">
                <p className="text-white font-extrabold text-2xl">{val}</p>
                <p className="text-white/60 text-xs mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-40 rounded-3xl overflow-hidden bg-white border-2 border-[#bbf7d0] shadow-lg mb-5">
              <img src={tvbLogo} alt="TVB" className="w-full h-auto object-contain block" />
            </div>
            <h1 className="text-4xl font-bold text-[#15803d] text-center leading-tight" style={{ fontFamily: '"Almendra", serif' }}>Topi Vappa<br/>Biriyani</h1>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-[#dcfce7] p-8 md:p-12">
            <div className="mb-10 lg:pl-1">
              <h3 className="text-3xl font-extrabold text-[#111827]">Sign In</h3>
              <p className="text-[#6b7280] text-base mt-2">Enter your credentials to access the POS</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="admin@resto.com"
                  className="w-full px-4 py-3.5 rounded-xl bg-[#f9fafb] border-2 border-[#e5e7eb] text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#16a34a] focus:bg-white transition text-sm font-medium"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3.5 pr-12 rounded-xl bg-[#f9fafb] border-2 border-[#e5e7eb] text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#16a34a] focus:bg-white transition text-sm font-medium"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151] transition">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-extrabold text-base tracking-wide transition-all shadow-lg shadow-[#16a34a]/30 disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : '🍛 Sign In to POS'}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-4 rounded-2xl bg-[#f0fdf4] border-2 border-[#dcfce7]">
              <p className="text-[#15803d] text-xs font-bold uppercase tracking-wider mb-3">Demo Credentials</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
                  <p className="text-sm text-[#374151]"><span className="font-bold text-[#15803d]">Admin:</span> admin@resto.com / admin123</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] shrink-0" />
                  <p className="text-sm text-[#374151]"><span className="font-bold text-[#d97706]">Cashier:</span> cashier@resto.com / cashier123</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-[#9ca3af] text-xs mt-6">© 2026 Topi Vappa Biriyani · POS v1.0</p>
        </div>
      </div>
    </div>
  );
}
