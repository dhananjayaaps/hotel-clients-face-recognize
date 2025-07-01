// auth.ts
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'guest' | 'admin' | 'staff';
  phone?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Room {
  id: string;
  room_number: number;
  room_type: string;
  price_per_night: number;
  capacity: number;
  amenities?: string[];
  image_url?: string;
  status: 'available' | 'booked' | 'maintenance';
  createdAt?: string;
  updatedAt?: string;
}

export interface SignupResponse {
  userId: string;
  token: string;
}

// rooms.ts
export type RoomType = 'standard' | 'deluxe' | 'suite';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
// reservations.ts
export interface Reservation {
  id: string;
  guestId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  totalAmount: number;
  specialRequests?: string;
}

// admin.ts
export interface SystemStats {
  totalGuests: number;
  occupiedRooms: number;
  availableRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  monthlyRevenue: number;
}

// auth.ts
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'guest' | 'admin' | 'staff';
  phone?: string;
}

// reservations.ts
export interface Reservation {
  id: string;
  guestId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  totalAmount: number;
  specialRequests?: string;
}