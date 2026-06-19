import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { supabase } from './lib/supabase';

// Pages
import { Landing } from './pages/Landing';
import { Login, Register } from './pages/Auth';
import { Payment } from './pages/Payment';
import { Dashboard } from './pages/Dashboard';
import { Courses, CourseDetail } from './pages/Courses';
import { Products, ProductDetail } from './pages/Products';
import { Accounts } from './pages/Accounts';
import { Proxies } from './pages/Proxies';
import { Tutorials, TutorialDetail } from './pages/Tutorials';
import { Support, TicketDetail } from './pages/Support';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminAccounts } from './pages/admin/AdminAccounts';
import { AdminProxies } from './pages/admin/AdminProxies';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminTickets } from './pages/admin/AdminTickets';
import { AdminSettings } from './pages/admin/AdminSettings';

// Admin Products page (similar to courses)
import { AdminProducts } from './pages/admin/AdminProducts';

// PWA Registration
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
    } catch {
      console.log('SW registration failed');
    }
  }
};

// Initialize default admin user
const initializeApp = async () => {
  try {
    // Check if admin exists
    const { data: adminCheck } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .single();

    if (!adminCheck) {
      // Create admin user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@webcash.com',
        password: 'admin123456',
        options: {
          data: { username: 'Admin' }
        }
      });

      if (authData.user && !authError) {
        await supabase.from('users').insert({
          id: authData.user.id,
          email: 'admin@webcash.com',
          username: 'Admin',
          role: 'admin',
          is_active: true,
          subscription_active: true
        });
      }
    }
  } catch {
    // Handle silently
  }
};

const AppContent: React.FC = () => {
  useApp();

  useEffect(() => {
    registerServiceWorker();
    initializeApp();
  }, []);

  // Reset daily slots at midnight
  useEffect(() => {
    const checkAndResetSlots = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('last_slot_date')
          .eq('id', user.id)
          .single();

        if (userData?.last_slot_date !== today) {
          await supabase
            .from('users')
            .update({ daily_slot_used: false, last_slot_date: today })
            .eq('id', user.id);
        }
      }
    };

    const interval = setInterval(checkAndResetSlots, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/payment" element={<Payment />} />

      {/* User Routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:id" element={<CourseDetail />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/proxies" element={<Proxies />} />
      <Route path="/tutorials" element={<Tutorials />} />
      <Route path="/tutorials/:id" element={<TutorialDetail />} />
      <Route path="/support" element={<Support />} />
      <Route path="/support/:id" element={<TicketDetail />} />
      <Route path="/wallet" element={<Dashboard />} />
      <Route path="/more" element={<Dashboard />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/courses" element={<AdminCourses />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/accounts" element={<AdminAccounts />} />
      <Route path="/admin/proxies" element={<AdminProxies />} />
      <Route path="/admin/payments" element={<AdminDashboard />} />
      <Route path="/admin/tickets" element={<AdminTickets />} />
      <Route path="/admin/notifications" element={<AdminNotifications />} />
      <Route path="/admin/podcasts" element={<AdminNotifications />} />
      <Route path="/admin/socials" element={<AdminSettings />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
          <AppContent />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
