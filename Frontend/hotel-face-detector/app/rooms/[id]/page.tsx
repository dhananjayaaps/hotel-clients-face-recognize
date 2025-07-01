"use client";

import { useEffect, useState } from "react";
import { roomsApi } from "@/app/api/rooms";
import { Room } from "@/app/types";
import Image from "next/image";
import Link from "next/link";

export default function RoomDetailsPage({ params }: { params: { id: string } }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const data = await roomsApi.getRoomDetails(params.id);
        setRoom(data);
      } catch (err) {
        setError("Failed to load room details. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [params.id]);

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

  if (!room) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Room not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/rooms" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Rooms
      </Link>

      {/* Display room type and number */}
      <h1 className="text-3xl font-bold mb-6">
        {room.room_type} - Room #{room.room_number}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="relative h-64 mb-4 rounded-lg overflow-hidden">
            {room.image_url ? (
              <Image
                src={room.image_url}
                alt={`${room.room_type} Room`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="bg-gray-200 h-full flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Room Details</h2>

            <div className="space-y-4">
              {/* Description is missing from your interface; you can remove or add it */}
              {/* <div>
                <h3 className="font-medium text-gray-700">Description</h3>
                <p className="text-gray-600">{room.description}</p>
              </div> */}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Price</h3>
                  <p className="text-gray-600">${room.price_per_night} / night</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700">Capacity</h3>
                  <p className="text-gray-600">
                    {room.capacity} {room.capacity === 1 ? "person" : "people"}
                  </p>
                </div>
              </div>

              {room.amenities && room.amenities.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors duration-300">
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
