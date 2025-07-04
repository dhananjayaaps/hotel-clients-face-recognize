import axios from 'axios';
import { Room } from '@/app/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ReservationData {
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  user_id: string;
}

interface Reservation {
  id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  user_id: string;
}

const getAuthToken = (): string => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  }
  throw new Error('Cannot access localStorage on server side');
};

const handleApiError = (error: unknown, defaultMessage: string): never => {
  if (axios.isAxiosError(error)) {
    const errorMessage = error.response?.data?.detail || error.message;
    console.error('API Error:', errorMessage);
    throw new Error(errorMessage || defaultMessage);
  }
  console.error('Unexpected Error:', error);
  throw new Error(defaultMessage);
};

export const roomsApi = {
  getAvailableRooms: async (status: string = 'available'): Promise<Room[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/rooms`, {
        params: { status },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch available rooms');
    }
  },

  getRoomDetails: async (roomId: string): Promise<Room> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/rooms/${roomId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch room details');
    }
  },

  createReservation: async (reservation: ReservationData): Promise<void> => {
    try {
      const token = getAuthToken();
      await axios.post(`${API_BASE_URL}/api/reservations`, reservation, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      return handleApiError(error, 'Failed to create reservation');
    }
  },

  getUserReservations: async (userId: string): Promise<Reservation[]> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/api/reservations`, {
        params: { user_id: userId },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch user reservations');
    }
  },
};