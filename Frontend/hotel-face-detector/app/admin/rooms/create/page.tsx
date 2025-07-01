// app/admin/rooms/create/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';

export default function CreateRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: '',
    price_per_night: '',
    capacity: '2',
    amenities: [] as string[],
  });

  const roomTypes = [
    'Standard',
    'Deluxe',
    'Suite',
    'Executive',
    'Presidential',
    'Family'
  ];

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const amenitiesOptions = [
    'WiFi',
    'Air Conditioning',
    'TV',
    'Mini Bar',
    'Safe',
    'Hair Dryer',
    'Coffee Maker',
    'Work Desk',
    'Jacuzzi',
    'Balcony'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityChange = (amenity: string) => {
    setFormData(prev => {
      if (prev.amenities.includes(amenity)) {
        return {
          ...prev,
          amenities: prev.amenities.filter(a => a !== amenity)
        };
      } else {
        return {
          ...prev,
          amenities: [...prev.amenities, amenity]
        };
      }
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('room_number', formData.room_number);
      formDataToSend.append('room_type', formData.room_type);
      formDataToSend.append('price_per_night', formData.price_per_night);
      formDataToSend.append('capacity', formData.capacity);
      
      formData.amenities.forEach(amenity => {
        formDataToSend.append('amenities[]', amenity);
      });

      if (image) {
        formDataToSend.append('image', image);
      }

      await axios.post(`${API_BASE_URL}/api/rooms`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Room created successfully!');
      router.push('/admin/rooms');
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Room</h1>
      
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Room Number *</label>
            <input
              type="text"
              name="room_number"
              value={formData.room_number}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Room Type *</label>
            <select
              name="room_type"
              value={formData.room_type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a room type</option>
              {roomTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price Per Night ($) *</label>
            <input
              type="number"
              name="price_per_night"
              value={formData.price_per_night}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Capacity *</label>
            <select
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Amenities</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {amenitiesOptions.map(amenity => (
              <div key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  id={`amenity-${amenity}`}
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleAmenityChange(amenity)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded bg-gray-800"
                />
                <label htmlFor={`amenity-${amenity}`} className="ml-2 text-sm">
                  {amenity}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Room Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-100 hover:file:bg-gray-600"
          />

          {previewUrl && (
            <div className="mt-4">
              <div className="relative h-64 w-64 rounded-md overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Room preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="mr-4 px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium bg-gray-700 text-gray-100 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </form>
    </div>
  );
}
