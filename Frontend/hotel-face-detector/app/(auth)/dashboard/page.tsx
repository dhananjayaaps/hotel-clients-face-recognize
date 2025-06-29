'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { roomsApi } from '@/app/api/rooms';
import { Room, Reservation } from '@/app/types';
import RoomCard from '@/app/components/common/RoomCard';
import ReservationCard from '@/app/components/common/ReservationCard';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

export default function Dashboard() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [availableRooms, guestReservations] = await Promise.all([
          roomsApi.getAvailableRooms(),
          roomsApi.getRoomDetails(user.id),
        ]);
        
        // Ensure rooms data is properly formatted
        const formattedRooms = (availableRooms || []).map(room => ({
          id: room.id ?? '',
          name: room.name ?? 'Unknown Room',
          description: room.description ?? '',
          price: room.price ?? 0,
          capacity: room.capacity ?? 1,
          amenities: room.amenities ?? [],
          images: room.images ?? [],
          available: room.available ?? true,
          roomNumber: room.roomNumber ?? '',
          roomType: room.roomType ?? 'Standard',
          pricePerNight: room.pricePerNight ?? room.price ?? 0,
          status: room.status ?? 'available'
        }));
        
        setRooms(formattedRooms as Room[]);
        
        // Ensure reservations data is properly formatted
        const formattedReservations = (guestReservations || []).map(reservation => ({
          id: reservation.id ?? '',
          roomId: reservation.roomId ?? '',
          guestId: reservation.guestId ?? user.id,
          checkInDate: reservation.checkInDate ?? '',
          checkOutDate: reservation.checkOutDate ?? '',
          totalAmount: reservation.totalAmount ?? 0,
          status: (
            ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'].includes(reservation.status)
              ? reservation.status
              : 'pending'
          ) as 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled',
        }));
        
        setReservations(formattedReservations as Reservation[]);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>;
  if (!user) return <div className="container mx-auto px-4 py-8">Please login to view your dashboard</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome back, {user?.fullName}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Available Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.length > 0 ? (
              rooms.map(room => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                />
              ))
            ) : (
              <div className="col-span-2 bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600">No available rooms found.</p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Reservations</h2>
          {reservations.length > 0 ? (
            <div className="space-y-4">
              {reservations.map(reservation => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-600">You don't have any reservations yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}