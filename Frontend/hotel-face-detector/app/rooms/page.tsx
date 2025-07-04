// app/rooms/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { roomsApi } from '@/app/api/rooms';
import { Room } from '@/app/types';
import Link from 'next/link';
import Image from 'next/image';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomsApi.getAvailableRooms();
        setRooms(data);
      } catch (err) {
        setError('Failed to load rooms. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Available Rooms</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}

function RoomCard({ room }: { room: Room }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 w-full">
        {room.image_url ? (
          <Image
            src={room.image_url}
            alt={room.room_type}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
          />
        ) : (
          <div className="bg-gray-200 h-full flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Room {room.room_number}</h2>
        <p className="text-gray-600 mb-2">{room.room_type}</p>

        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700">${room.price_per_night} / night</span>
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {room.amenities?.map((amenity, index) => (
            <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
              {amenity}
            </span>
          ))}
        </div>

        <Link
          href={`/rooms/${room.id}`}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded transition-colors duration-300"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}



