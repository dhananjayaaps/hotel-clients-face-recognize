"use client";

import { JSX, useEffect, useState } from 'react';
import { reservationsApi } from '@/app/api/reservations';
import { Reservation } from '@/app/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { CheckCircle2, XCircle, Clock, CalendarCheck, CalendarX2 } from 'lucide-react';

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
        // Sort reservations: active first, then by check-in date
        const sorted = data.sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          return new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime();
        });
        setReservations(sorted);
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
      setReservations(prev => prev.map(r => 
        r.id === reservationId ? {...r, status: 'cancelled'} : r
      ));
      toast.success('Reservation cancelled successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel reservation';
      toast.error(message);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1";
    
    switch(status) {
      case 'active':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <Clock className="h-4 w-4" /> Upcoming
          </span>
        );
      case 'checked_in':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CalendarCheck className="h-4 w-4" /> Checked In
          </span>
        );
      case 'checked_out':
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
            <CheckCircle2 className="h-4 w-4" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <XCircle className="h-4 w-4" /> Cancelled
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
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
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
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
              getStatusBadge={getStatusBadge}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationCard({ 
  reservation,
  onCancel,
  getStatusBadge
}: { 
  reservation: Reservation;
  onCancel: (id: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  const isUpcoming = reservation.status === 'active' && 
                    new Date(reservation.check_in_date) > new Date();
  const isCurrent = reservation.status === 'active' && 
                   new Date(reservation.check_in_date) <= new Date() && 
                   new Date(reservation.check_out_date) > new Date();

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6 ${
      reservation.status === 'cancelled' ? 'opacity-80' : ''
    }`}>
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-semibold">
              Reservation #{reservation.id.slice(-6).toUpperCase()}
            </h2>
            {getStatusBadge(reservation.status ?? "unknown")}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-600 font-medium">Check-in:</p>
              <p className="flex items-center gap-1">
                {format(new Date(reservation.check_in_date), 'MMM dd, yyyy h:mm a')}
                {isCurrent && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CalendarCheck className="h-3 w-3" /> Current
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Check-out:</p>
              <p>{format(new Date(reservation.check_out_date), 'MMM dd, yyyy h:mm a')}</p>
            </div>
          </div>

          {reservation.status === 'checked_in' && (
            <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Currently checked in
            </div>
          )}

          {reservation.status === 'checked_out' && (
            <div className="mt-2 text-sm text-purple-600 flex items-center gap-1">
              <CalendarX2 className="h-4 w-4" /> Stay completed
            </div>
          )}

          {reservation.status === 'cancelled' && (
            <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <XCircle className="h-4 w-4" /> This reservation was cancelled
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Link 
            href={`/rooms/${reservation.room_id}`} 
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center w-full md:w-auto"
          >
            View Room Details
          </Link>
          
          {(reservation.status === 'active' || isUpcoming) && (
            <button 
              onClick={() => onCancel(reservation.id)}
              className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors w-full md:w-auto"
            >
              <XCircle className="h-4 w-4" /> Cancel Reservation
            </button>
          )}

          {isCurrent && (
            <Link
              href={`/checkin`}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors w-full md:w-auto"
            >
              <CalendarCheck className="h-4 w-4" /> Check In Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}