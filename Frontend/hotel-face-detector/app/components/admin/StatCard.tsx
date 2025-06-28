import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg">
      <div className="flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div>
          <h3 className="text-lg font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;