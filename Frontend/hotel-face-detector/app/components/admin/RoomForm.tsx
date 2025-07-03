'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/app/api/admin';
import { Room, CreateRoomData } from '@/app/types';

interface RoomFormProps {
  room?: Room; // Optional for edit mode
}

export default function RoomForm({ room }: RoomFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateRoomData>({
    room_number: room?.room_number || '',
    room_type: room?.room_type || '',
    price_per_night: room?.price_per_night || 0,
    capacity: room?.capacity || 2,
    amenities: room?.amenities || [],
    status: room?.status || 'available',
    image_url: room?.image_url || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(room?.image_url || null);

  const availableAmenities = [
    'Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Bathtub', 'Coffee Maker', 'Safe'
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let updatedFormData = { ...formData };

      // Upload image if a new file is selected
      if (imageFile) {
        const imageUrl = await adminApi.uploadImage(imageFile);
        updatedFormData = { ...updatedFormData, image_url: imageUrl };
      }

      if (room) {
        await adminApi.updateRoom(room.id, updatedFormData);
      } else {
        await adminApi.createRoom(updatedFormData);
      }
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to save room');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price_per_night' || name === 'capacity' ? Number(value) : value,
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => {
      const amenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 py-8">
      <div className="container mx-auto max-w-lg">
        <h1 className="text-3xl font-bold mb-8 text-blue-400">
          {room ? 'Edit Room' : 'Create Room'}
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700"
        >
          {error && (
            <div className="bg-red-900 text-red-200 p-3 rounded mb-4">{error}</div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Room Number
            </label>
            <input
              type="text"
              name="room_number"
              value={formData.room_number}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Room Type
            </label>
            <input
              type="text"
              name="room_type"
              value={formData.room_type}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Price per Night
            </label>
            <input
              type="number"
              name="price_per_night"
              value={formData.price_per_night}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Capacity
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Amenities
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableAmenities.map((amenity) => (
                <label key={amenity} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-300">{amenity}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Room Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Room preview"
                  className="w-full h-48 object-cover rounded border border-gray-600"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {room ? 'Update Room' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}