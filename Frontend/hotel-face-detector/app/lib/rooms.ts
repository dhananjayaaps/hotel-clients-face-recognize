import axios from 'axios';
import { Room } from '@/app/types';

interface Reservation {
  totalAmount: number;
  guestId: string;
  id: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  // Add other properties as needed
}

// Mock API calls - replace with real API calls in production
export const getAvailableRooms = async (): Promise<Room[]> => {
  try {
    // Simulated API call
    return [
      {
        id: '1',
        roomNumber: '101',
        roomType: 'Deluxe',
        pricePerNight: 150,
        status: 'available',
      },
      {
        id: '2',
        roomNumber: '102',
        roomType: 'Suite',
        pricePerNight: 250,
        status: 'available',
      },
      {
        id: '3',
        roomNumber: '201',
        roomType: 'Standard',
        pricePerNight: 100,
        status: 'available',
      },
    ];
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    throw error;
  }
};

export const getGuestReservations = async (guestId: string): Promise<Reservation[]> => {
  try {
    // Simulated API call
    return [
      {
        id: 'res1',
        roomId: '101',
        checkInDate: '2023-12-15',
        checkOutDate: '2023-12-20',
        status: 'confirmed',
      },
      {
        id: 'res2',
        roomId: '201',
        checkInDate: '2024-01-05',
        checkOutDate: '2024-01-10',
        status: 'pending',
      },
    ];
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    throw error;
  }
};