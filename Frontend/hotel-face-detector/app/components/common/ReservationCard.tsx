import { Reservation } from '@/app/types';
import Link from 'next/link';

interface ReservationCardProps {
  reservation: Reservation;
}

export default function ReservationCard({ reservation }: ReservationCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    'checked-in': 'bg-green-100 text-green-800',
    'checked-out': 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold">Reservation #{reservation.id.slice(0, 8)}</h3>
          <p className="text-gray-600">
            {new Date(reservation.checkInDate).toLocaleDateString()} - {new Date(reservation.checkOutDate).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[reservation.status]}`}>
          {reservation.status}
        </span>
      </div>
      
      <div className="mt-4">
        <p className="font-medium">Total: ${reservation.totalAmount}</p>
        {reservation.specialRequests && (
          <p className="text-gray-600 mt-2">Special Requests: {reservation.specialRequests}</p>
        )}
      </div>
      
      <div className="mt-6">
        <Link 
          href={`/reservations/${reservation.id}`}
          className="text-blue-600 hover:underline"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}