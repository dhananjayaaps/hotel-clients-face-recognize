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
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities: never[];
  images: never[];
  available: boolean;
  map(arg0: (reservation: any) => { id: any; roomId: any; guestId: any; checkInDate: any; checkOutDate: any; totalAmount: any; status: "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled"; }): unknown;
  id: string;
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
  status: string;
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