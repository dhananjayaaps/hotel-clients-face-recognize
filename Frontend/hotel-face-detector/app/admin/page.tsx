'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { getSystemStats } from '@/app/lib/admin';
import { SystemStats } from '@/app/types';
import StatsCard from '@/app/components/admin/StatCard';
import DataTable from '@/app/components/admin/DataTable';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== 'admin') return;
      
      try {
        const data = await getSystemStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user || user.role !== 'admin') {
    return <div className="container mx-auto px-4 py-8 text-center">Unauthorized</div>;
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Guests" value={stats.totalGuests} icon="👥" />
          <StatsCard title="Occupied Rooms" value={stats.occupiedRooms} icon="🛏️" />
          <StatsCard title="Available Rooms" value={stats.availableRooms} icon="🚪" />
          <StatsCard title="Monthly Revenue" value={`$${stats.monthlyRevenue.toLocaleString()}`} icon="💰" />
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <DataTable
          headers={['Event', 'User', 'Time', 'Details']}
          data={[
            ['Check-in', 'John Doe', '10:30 AM', 'Room 101'],
            ['Check-out', 'Jane Smith', '11:45 AM', 'Room 205'],
            ['New Booking', 'Mike Johnson', '1:15 PM', 'Room 302'],
          ]}
        />
      </div>
    </div>
  );
}