'use client';

import { JSX, useEffect, useState } from 'react';
import { reservationsApi } from '@/app/api/reservations';
import { Reservation } from '@/app/types';
import { format } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CalendarCheck, 
  CalendarX2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'check_in_date' | 'check_out_date'>('check_in_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        if (!user || user.role !== 'admin') {
          router.push('/');
          return;
        }
        
        const data = await reservationsApi.getUserReservations();
        setReservations(data);
        setFilteredReservations(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load reservations';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [user, router]);

  useEffect(() => {
    let results = [...reservations];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(reservation => 
        reservation.user_id.toLowerCase().includes(term) ||
        reservation.room_id.toLowerCase().includes(term) ||
        (reservation.status && reservation.status.toLowerCase().includes(term))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(reservation => reservation.status === statusFilter);
    }
    
    // Apply sorting
    results.sort((a, b) => {
      const aDate = new Date(a[sortField]);
      const bDate = new Date(b[sortField]);
      
      if (sortDirection === 'asc') {
        return aDate.getTime() - bDate.getTime();
      } else {
        return bDate.getTime() - aDate.getTime();
      }
    });
    
    setFilteredReservations(results);
  }, [reservations, searchTerm, statusFilter, sortField, sortDirection]);

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    try {
      await reservationsApi.updateReservation(reservationId, { status: newStatus });
      setReservations(prev => prev.map(r => 
        r.id === reservationId ? {...r, status: newStatus} : r
      ));
      toast.success(`Reservation status updated to ${newStatus}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update reservation';
      toast.error(message);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const data = await reservationsApi.getUserReservations();
      setReservations(data);
      toast.success('Reservations refreshed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh reservations';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1";
    
    switch(status) {
      case 'active':
        return (
          <span className={`${baseClasses} bg-blue-900/40 text-blue-300`}>
            <Clock className="h-3 w-3" /> Upcoming
          </span>
        );
      case 'checked_in':
        return (
          <span className={`${baseClasses} bg-green-900/40 text-green-300`}>
            <CalendarCheck className="h-3 w-3" /> Checked In
          </span>
        );
      case 'checked_out':
        return (
          <span className={`${baseClasses} bg-purple-900/40 text-purple-300`}>
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className={`${baseClasses} bg-red-900/40 text-red-300`}>
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-700 text-gray-300`}>
            {status}
          </span>
        );
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center text-red-400 text-xl">Unauthorized</div>
      </div>
    );
  }

  if (loading && reservations.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 py-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">Reservation Management</h1>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user or room ID..."
                className="bg-gray-700 text-gray-100 pl-10 pr-4 py-2 w-full border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Upcoming</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Sort By</label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                >
                  <option value="check_in_date">Check-in Date</option>
                  <option value="check_out_date">Check-out Date</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Order</label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as any)}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Reservations Table */}
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Check-out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                      No reservations found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((reservation) => (
                    <ReservationRow 
                      key={reservation.id}
                      reservation={reservation}
                      onStatusChange={handleStatusChange}
                      getStatusBadge={getStatusBadge}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationRow({ 
  reservation,
  onStatusChange,
  getStatusBadge
}: { 
  reservation: Reservation;
  onStatusChange: (id: string, status: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <tr className={`hover:bg-gray-750/50 ${reservation.status === 'cancelled' ? 'opacity-70' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
        #{reservation.id.slice(-6).toUpperCase()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {reservation.user_id.slice(0, 8)}...
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {reservation.room_id.slice(0, 8)}...
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {format(new Date(reservation.check_in_date), 'MMM dd, yyyy')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {format(new Date(reservation.check_out_date), 'MMM dd, yyyy')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(reservation.status ?? '')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
        <button 
          onClick={() => setShowActions(!showActions)}
          className="text-gray-400 hover:text-gray-200"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        
        {showActions && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 border border-gray-600">
            <div className="py-1">
              {reservation.status !== 'checked_in' && (
                <button
                  onClick={() => {
                    onStatusChange(reservation.id, 'checked_in');
                    setShowActions(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                >
                  Mark as Checked In
                </button>
              )}
              
              {reservation.status !== 'checked_out' && reservation.status !== 'active' && (
                <button
                  onClick={() => {
                    onStatusChange(reservation.id, 'checked_out');
                    setShowActions(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                >
                  Mark as Checked Out
                </button>
              )}
              
              {reservation.status !== 'cancelled' && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this reservation?')) {
                      onStatusChange(reservation.id, 'cancelled');
                      setShowActions(false);
                    }
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                >
                  Cancel Reservation
                </button>
              )}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}