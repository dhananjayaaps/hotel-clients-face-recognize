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
          <h2 className="text-2xl font-semibold text-gray-100">Rooms</h2>
          <Link
            href="/admin/rooms/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md"
          >
            Create New Room
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">Room List</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-gray-850 border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Room Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amenities</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-200 font-medium">
                      {room.room_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {room.room_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        room.status === 'available'
                          ? 'bg-green-900/40 text-green-300'
                          : room.status === 'occupied'
                          ? 'bg-red-900/40 text-red-300'
                          : 'bg-yellow-900/40 text-yellow-300'
                      }`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300 font-mono">
                      ${room.price_per_night.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {room.capacity}
                    </td>
                    <td className="px-6 py-4 text-gray-300 max-w-xs truncate">
                      {room.amenities.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-3">
                      <button
                        onClick={() => handleEditRoom(room.id)}
                        className="text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-blue-900/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-900/30"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}