
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import PerformanceMonitor from '@/components/PerformanceMonitor';

const Admin = () => {
  const { user, userRole, loading } = useAuth();
  const { checkRateLimit } = usePerformanceOptimization();
  const navigate = useNavigate();

  useEffect(() => {
    // Rate limit admin access attempts
    if (!loading && !checkRateLimit(`admin-access-${user?.id || 'anonymous'}`)) {
      console.warn('Rate limit exceeded for admin access');
      return;
    }

    if (!loading && (!user || userRole !== 'admin')) {
      navigate('/auth');
    }
  }, [user, userRole, loading, navigate, checkRateLimit]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/10">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return null;
  }

  return (
    <>
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
      <PerformanceMonitor />
    </>
  );
};

export default Admin;
