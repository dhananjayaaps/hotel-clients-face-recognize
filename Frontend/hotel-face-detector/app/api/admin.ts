import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SystemStats {
  total_guests: number;
  occupied_rooms: number;
  available_rooms: number;
  today_check_ins: number;
  today_check_outs: number;
  monthly_revenue: number;
}

interface Reservation {
  id: string;
  guest_name: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  reservations_count: number;
}

interface AdminApi {
  getSystemStats: (token: string) => Promise<SystemStats>;
  getRecentReservations: (token: string, limit?: number) => Promise<Reservation[]>;
  getRevenueAnalytics: (token: string, period: 'daily' | 'weekly' | 'monthly') => Promise<RevenueData[]>;
}

export const adminApi: AdminApi = {
  getSystemStats: async (token: string): Promise<SystemStats> => {
    if (!token) {
      throw new Error('Authorization token is required');
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data as SystemStats;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response?.data?.detail || error.message);
        throw new Error(error.response?.data?.detail || 'Failed to fetch system stats');
      }
      console.error('Unexpected Error:', error);
      throw new Error('An unexpected error occurred');
    }
  },

  getRecentReservations: async (token: string, limit: number = 10): Promise<Reservation[]> => {
    if (!token) {
      throw new Error('Authorization token is required');
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/reservations/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { limit }
      });

      return response.data.map((res: any) => ({
        id: res.id,
        guest_name: res.guest_name,
        room_number: res.room_number,
        check_in_date: res.check_in_date,
        check_out_date: res.check_out_date,
        status: res.status,
        total_amount: res.total_amount
      }));
    } catch (error) {
      console.error('Failed to fetch recent reservations:', error);
      throw new Error('Failed to fetch recent reservations');
    }
  },

  getRevenueAnalytics: async (token: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<RevenueData[]> => {
    if (!token) {
      throw new Error('Authorization token is required');
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/analytics/revenue`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { period }
      });

      return response.data.map((item: any) => ({
        date: item.date,
        revenue: item.revenue,
        reservations_count: item.reservations_count
      }));
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', error);
      throw new Error('Failed to fetch revenue analytics');
    }
  }
};
