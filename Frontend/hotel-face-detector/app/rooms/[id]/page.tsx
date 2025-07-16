'use client';

import { useEffect, useState, FormEvent } from 'react';
import { roomsApi } from '@/app/api/rooms';
import { Room } from '@/app/types';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';

export default function RoomDetailsPage() {
  const params = useParams();
  const id = params.id;
  const { user } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservationData, setReservationData] = useState({
    check_in_date: '',
    check_out_date: '',
  });
  const [reservationError, setReservationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const data = await roomsApi.getRoomDetails(String(id ?? ''));
        setRoom(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load room details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [params.id]);

  const handleReservationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setReservationError(null);

    if (!user) {
      setReservationError('You must be logged in to make a reservation.');
      return;
    }

    try {
      await roomsApi.createReservation({
        room_id: String(params.id),
        check_in_date: new Date(reservationData.check_in_date).toISOString(), // Format as ISO string
        check_out_date: new Date(reservationData.check_out_date).toISOString(), // Format as ISO string
        user_id: user.id,
      });
      alert('Reservation created successfully!');
      router.push('/reservations');
    } catch (err: any) {
      setReservationError(err.message || 'Failed to create reservation.');
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReservationData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="text-gray-200 text-xl">Room not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 py-8">
      <div className="container mx-auto">
        <Link href="/rooms" className="text-blue-400 hover:text-blue-300 mb-4 inline-block transition-colors">
          ← Back to Rooms
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-blue-400">
          {room.room_type} - Room #{room.room_number}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="relative h-64 mb-4 rounded-lg overflow-hidden border border-gray-700">
              {room.image_url ? (
                <Image
                  src={room.image_url}
                  alt={`${room.room_type} Room`}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="bg-gray-800 h-full flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-200">Room Details</h2>

              <div className="space-y-4">
                {room.description && (
                  <div>
                    <h3 className="font-medium text-gray-300">Description</h3>
                    <p className="text-gray-400">{room.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-300">Price</h3>
                    <p className="text-gray-400">${room.price_per_night.toFixed(2)} / night</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-300">Capacity</h3>
                    <p className="text-gray-400">
                      {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                    </p>
                  </div>
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-300">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="bg-gray-700 px-3 py-1 rounded-full text-sm text-gray-200"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleReservationSubmit} className="space-y-4">
                  {reservationError && (
                    <div className="bg-red-900 text-red-200 p-3 rounded">{reservationError}</div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      name="check_in_date"
                      value={reservationData.check_in_date}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      name="check_out_date"
                      value={reservationData.check_out_date}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors duration-300"
                    disabled={!user}
                  >
                    {user ? 'Book Now' : 'Log in to Book'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}