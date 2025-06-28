import axios from 'axios';

interface SystemStats {
  totalGuests: number;
  occupiedRooms: number;
  availableRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  monthlyRevenue: number;
}

export const getSystemStats = async (): Promise<SystemStats> => {
  try {
    // Simulated API call - replace with actual implementation
    const response = await axios.get('/api/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch system stats:', error);
    throw error;
  }
};

// Additional admin functions would go here