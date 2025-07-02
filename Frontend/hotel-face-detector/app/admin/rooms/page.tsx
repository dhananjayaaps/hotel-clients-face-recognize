'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { adminApi } from '@/app/api/admin';
import { Room } from '@/app/types';
import DataTable from '@/app/components/admin/DataTable';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user || user.role !== 'admin') return;

      try {
        const roomsData = await adminApi.getRooms();
        setRooms(roomsData);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [user]);

  const handleEditRoom = (roomId: string) => {
    router.push(`/admin/rooms/edit/${roomId}`);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await adminApi.deleteRoom(roomId);
      setRooms(rooms.filter((room) => room.id !== roomId));
      alert('Room deleted successfully');
    } catch (err) {
      console.error('Failed to delete room:', err);
      alert('Failed to delete room');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center text-red-400 text-xl">Unauthorized</div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-blue-400">
          Admin Dashboard - Room Management
        </h1>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-200">Rooms</h2>
          <Link
            href="/admin/rooms/create"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create New Room
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Room List</h2>
          <DataTable
            headers={['Room Number', 'Type', 'Status', 'Price', 'Capacity', 'Amenities', 'Actions']}
            data={rooms.map((room) => [
                <span key={`room-number-${room.id}`} className="text-gray-200">
                  {room.room_number}
                </span>,
                <span key={`room-type-${room.id}`} className="text-gray-200">
                  {room.room_type}
                </span>,
                <span
                  key={`status-${room.id}`}
                  className={`px-2 py-1 rounded-full text-xs ${
                    room.status === 'available'
                      ? 'bg-green-900 text-green-300'
                      : room.status === 'occupied'
                      ? 'bg-red-900 text-red-300'
                      : 'bg-yellow-900 text-yellow-300'
                  }`}
                >
                  {room.status}
                </span>,
                <span key={`price-${room.id}`} className="text-gray-200">
                  ${room.price_per_night.toFixed(2)}
                </span>,
                <span key={`capacity-${room.id}`} className="text-gray-200">
                  {room.capacity}
                </span>,
                <span key={`amenities-${room.id}`} className="text-gray-200">
                  {room.amenities.join(', ')}
                </span>,
                <div key={`actions-${room.id}`} className="flex space-x-2">
                  <button
                    onClick={() => handleEditRoom(room.id)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </div>,
            ])}
          />
        </div>
      </div>
    </div>
  );
}