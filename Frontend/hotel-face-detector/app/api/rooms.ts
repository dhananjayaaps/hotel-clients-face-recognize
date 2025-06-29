import axios from 'axios';
import { Room } from '@/app/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const roomsApi = {
  getAvailableRooms: async (): Promise<Room[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/rooms`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      throw error;
    }
  },

  getRoomDetails: async (roomId: string): Promise<Room> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch room details:', error);
      throw error;
    }
  }
};