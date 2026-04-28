import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import PosLayout from './layouts/PosLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Terminal from './pages/Terminal';
import Kitchen from './pages/Kitchen';
import Orders from './pages/Orders';
import MenuManagement from './pages/MenuManagement';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import TableManagement from './pages/TableManagement';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/terminal" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1d2e', color: '#e2e8f0', border: '1px solid #2a2f4a' },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <PosLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/terminal" replace />} />
          <Route path="dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
          <Route path="terminal" element={<Terminal />} />
          <Route path="tables" element={<ProtectedRoute adminOnly><TableManagement /></ProtectedRoute>} />
          <Route path="kitchen" element={<Kitchen />} />
          <Route path="orders" element={<Orders />} />
          <Route path="menu" element={<ProtectedRoute adminOnly><MenuManagement /></ProtectedRoute>} />
          <Route path="customers" element={<Customers />} />
          <Route path="settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
