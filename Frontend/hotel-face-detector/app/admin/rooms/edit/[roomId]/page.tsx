// pages/admin/rooms/edit/[roomId].tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminApi } from '@/app/api/admin';
import { Room } from '@/app/types';
import RoomForm from '@/app/components/admin/RoomForm';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

export default function EditRoomPage() {
  const router = useRouter();
  const { roomId } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const roomData = await adminApi.getRoom(roomId as string);
        setRoom(roomData);
      } catch (err) {
        console.error('Failed to fetch room:', err);
        router.push('/admin');
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!room) {
    return <div className="container mx-auto px-4 py-8 text-center">Room not found</div>;
  }

  return <RoomForm room={room} />;
}