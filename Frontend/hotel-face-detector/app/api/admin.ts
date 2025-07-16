import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://20.169.80.3:8000';

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  price_per_night: number;
  status: 'available' | 'occupied' | 'maintenance';
  capacity: number;
  amenities: string[];
  image_url?: string;
}

interface CreateRoomData {
  room_number: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  status?: 'available' | 'occupied' | 'maintenance';
  image_url?: string;
}

interface AdminApi {
  getRooms: (status?: string) => Promise<Room[]>;
  getRoom: (roomId: string) => Promise<Room>;
  createRoom: (roomData: CreateRoomData) => Promise<Room>;
  updateRoom: (roomId: string, roomData: Partial<CreateRoomData>) => Promise<Room>;
  deleteRoom: (roomId: string) => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
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

export const adminApi: AdminApi = {
  getRooms: async (status?: string): Promise<Room[]> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: status ? { status } : {},
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch rooms');
    }
  },

  getRoom: async (roomId: string): Promise<Room> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/api/rooms/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch room details');
    }
  },

  createRoom: async (roomData: CreateRoomData): Promise<Room> => {
    try {
      const token = getAuthToken();
      const response = await axios.post(`${API_BASE_URL}/api/rooms`, roomData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to create room');
    }
  },

  updateRoom: async (roomId: string, roomData: Partial<CreateRoomData>): Promise<Room> => {
    try {
      const token = getAuthToken();
      const response = await axios.patch(`${API_BASE_URL}/api/rooms/${roomId}`, roomData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to update room');
    }
  },

  deleteRoom: async (roomId: string): Promise<void> => {
    try {
      const token = getAuthToken();
      await axios.delete(`${API_BASE_URL}/api/rooms/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      return handleApiError(error, 'Failed to delete room');
    }
  },

  uploadImage: async (file: File): Promise<string> => {
    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API_BASE_URL}/api/images/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.image_url;
    } catch (error) {
      return handleApiError(error, 'Failed to upload image');
    }
  },
};