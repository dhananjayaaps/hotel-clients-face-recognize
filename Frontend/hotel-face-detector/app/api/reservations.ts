import axios from 'axios';
import { Reservation } from '@/app/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getAuthToken = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || '';
  }
  return '';
};

export const reservationsApi = {
  getGuestReservations: async (guestId: string): Promise<Reservation[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reservations/guest/${guestId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch guest reservations:', error);
      throw error;
    }
  },

  getUserReservations: async (): Promise<Reservation[]> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/api/reservations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user reservations:', error);
      throw error;
    }
  },

  createReservation: async (reservationData: {
    room_id: string;
    check_in_date: string | Date;
    check_out_date: string | Date;
    total_amount: number;
  }, token?: string): Promise<Reservation> => {
    try {
      const authToken = token || getAuthToken();
      // Convert dates to ISO string format
      const formattedData = {
        ...reservationData,
        check_in_date: new Date(reservationData.check_in_date).toISOString(),
        check_out_date: new Date(reservationData.check_out_date).toISOString()
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/reservations`,
        formattedData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create reservation:', error);
      throw error;
    }
  },

  cancelReservation: async (reservationId: string): Promise<void> => {
    try {
      const token = getAuthToken();
      await axios.delete(
        `${API_BASE_URL}/api/reservations/${reservationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
      throw error;
    }
  },

  getReservationDetails: async (reservationId: string): Promise<Reservation> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(
        `${API_BASE_URL}/api/reservations/${reservationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reservation details:', error);
      throw error;
    }
  },

  updateReservation: async (
    reservationId: string,
    updateData: {
      check_in_date?: string | Date;
      check_out_date?: string | Date;
      status?: string;
    }
  ): Promise<Reservation> => {
    try {
      const token = getAuthToken();
      // Format dates if provided
      const formattedData = {
        ...updateData,
        ...(updateData.check_in_date && { 
          check_in_date: new Date(updateData.check_in_date).toISOString() 
        }),
        ...(updateData.check_out_date && { 
          check_out_date: new Date(updateData.check_out_date).toISOString() 
        }),
      };

      const response = await axios.patch(
        `${API_BASE_URL}/api/reservations/${reservationId}`,
        formattedData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update reservation:', error);
      throw error;
    }
  }
};