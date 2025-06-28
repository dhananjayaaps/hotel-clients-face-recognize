import Image from 'next/image';
import { Room } from '@/app/types/index';
import Button from '../ui/Button';
import { useRouter } from 'next/navigation';

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  const router = useRouter();
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full" />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{room.roomNumber} - {room.roomType}</h3>
            <p className="text-gray-600 mt-1">${room.pricePerNight}/night</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            room.status === 'available' 
              ? 'bg-green-100 text-green-800' 
              : room.status === 'occupied' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-yellow-100 text-yellow-800'
          }`}>
            {room.status}
          </span>
        </div>
        
        <div className="mt-4">
          <p className="text-gray-700 line-clamp-2">{room.description}</p>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {room.amenities.map((amenity, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {amenity}
            </span>
          ))}
        </div>
        
        <div className="mt-6">
          <Button 
            onClick={() => router.push(`/rooms/${room.id}`)}
            className="w-full"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
