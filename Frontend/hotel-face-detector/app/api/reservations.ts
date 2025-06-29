import axios from 'axios';
import { Reservation } from '@/app/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const reservationsApi = {
  getGuestReservations: async (guestId: string): Promise<Reservation[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reservations/guest/${guestId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
      throw error;
    }
  },

  createReservation: async (reservationData: {
    room_id: string;
    check_in_date: string;
    check_out_date: string;
    total_amount: number;
  }, token: string): Promise<Reservation> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/reservations`,
        reservationData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create reservation:', error);
      throw error;
    }
  }
};