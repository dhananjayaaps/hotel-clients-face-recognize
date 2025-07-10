// app/reservations/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { reservationsApi } from '@/app/api/reservations';
import { Reservation } from '@/app/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        if (!user) {
          router.push('/login');
          return;
        }
        
        const data = await reservationsApi.getUserReservations();
        setReservations(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load reservations';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [user, router]);

  const handleCancelReservation = async (reservationId: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      await reservationsApi.cancelReservation(reservationId);
      setReservations(prev => prev.filter(r => r.id !== reservationId));
      toast.success('Reservation cancelled successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel reservation';
      setError(message);
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500 text-xl">{error}</div>
        {error.includes('authenticated') && (
          <Link href="/login" className="ml-4 text-blue-500">
            Please login
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Reservations</h1>
      
      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">You don't have any reservations yet.</p>
          <Link 
            href="/rooms" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Browse Available Rooms
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reservations.map((reservation) => (
            <ReservationCard 
              key={reservation.id} 
              reservation={reservation} 
              onCancel={handleCancelReservation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationCard({ 
  reservation,
  onCancel
}: { 
  reservation: Reservation;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">
            #{reservation.room_id || reservation.room_id}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-600 font-medium">Check-in:</p>
              <p>{format(new Date(reservation.check_in_date), 'MMM dd, yyyy h:mm a')}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Check-out:</p>
              <p>{format(new Date(reservation.check_out_date), 'MMM dd, yyyy h:mm a')}</p>
            </div>
          </div>

        </div>

        <div className="flex flex-col items-end gap-2">
          <Link 
            href={`/rooms/${reservation.room_id}`} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center w-full md:w-auto"
          >
            View Room
          </Link>
          <button 
            onClick={() => onCancel(reservation.id)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors w-full md:w-auto"
          >
            Cancel Reservation
          </button>
        </div>
      </div>
    </div>
  );
}