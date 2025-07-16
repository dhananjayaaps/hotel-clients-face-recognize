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

// types/index.ts
export interface Room {
  id: string;
  room_number: string;
  room_type: string;
  price_per_night: number;
  status: 'available' | 'occupied' | 'maintenance';
  capacity: number;
  amenities: string[];
  image_url?: string;
  description?: string;
}

export interface CreateRoomData {
  room_number: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  status?: 'available' | 'occupied' | 'maintenance';
  image_url?: string;
  description?: string;
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
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  user_id: string;
  created_at?: string;
  status?: string;
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