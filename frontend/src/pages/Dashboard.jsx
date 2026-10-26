import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  ExternalLink,
  Edit,
  Search,
  Check,
  X,
  Compass,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ownerTab, setOwnerTab] = useState('bookings'); // 'bookings' | 'properties'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const isOwner = user?.role === 'owner' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  // Student: Fetch My Bookings
  const { data: rawStudentBookings, isLoading: loadingStudentBookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await api.get('/api/bookings/my');
      return res.data;
    },
    enabled: isStudent,
  });

  // Owner: Fetch Bookings
  const { data: rawOwnerBookings, isLoading: loadingOwnerBookings } = useQuery({
    queryKey: ['owner-bookings'],
    queryFn: async () => {
      const res = await api.get('/api/bookings/owner');
      return res.data;
    },
    enabled: isOwner,
  });

  // Owner: Fetch Properties
  const { data: rawOwnerProperties, isLoading: loadingOwnerProperties } = useQuery({
    queryKey: ['my-properties'],
    queryFn: async () => {
      const res = await api.get('/api/listings/owner/mine');
      return res.data;
    },
    enabled: isOwner,
  });

  // Normalize data arrays from API responses
  const properties = Array.isArray(rawOwnerProperties)
    ? rawOwnerProperties
    : (rawOwnerProperties?.listings || []);

  const bookings = Array.isArray(rawOwnerBookings)
    ? rawOwnerBookings
    : (rawOwnerBookings?.bookings || []);

  const studentBookings = Array.isArray(rawStudentBookings)
    ? rawStudentBookings
    : (rawStudentBookings?.bookings || []);

  // Accept / Reject Booking Mutation (Owner only)
  const bookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }) => {
      const res = await api.patch(`/api/bookings/${bookingId}`, { status });
      return res.data;
    },
    onSuccess: (data, variables) => {
      setActionSuccess(
        variables.status === 'accepted'
          ? 'Booking accepted! Property reserved and competing requests resolved.'
          : 'Booking request rejected.'
      );
      setActionError('');
      queryClient.invalidateQueries(['owner-bookings']);
      queryClient.invalidateQueries(['my-properties']);
    },
    onError: (err) => {
      setActionSuccess('');
      if (err.response?.status === 409) {
        setActionError(
          'Conflict: This property is no longer available or was reserved by another booking.'
        );
      } else {
        setActionError(
          err.response?.data?.message || err.response?.data?.error || 'Failed to update booking status.'
        );
      }
    },
  });

  const handleBookingAction = (bookingId, status) => {
    setActionError('');
    setActionSuccess('');
    bookingStatusMutation.mutate({ bookingId, status });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-green-500/10 text-green-700 border border-green-500/20">
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            Confirmed Stay
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">
            <span className="material-symbols-outlined text-[13px]">cancel</span>
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            Under Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-[75vh]">
      {/* ─── Header matching user role ───────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-outline-variant/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {isStudent ? 'Student Portal' : 'Owner Portal'}
            </span>
            <span className="text-xs text-on-surface-variant font-medium">• {user?.email}</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-on-background">
            {isStudent ? 'My Student Bookings & Stays' : 'Owner Property Overview'}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            {isStudent
              ? `Welcome back, ${user?.name || 'Student'}! Track your room applications, verified stays, and move-in dates.`
              : `Welcome back, ${user?.name || 'Owner'}! Manage your listings and tenant rental applications.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-xs text-on-surface">{user?.name || 'NestMate Member'}</p>
            <p className="text-[11px] text-primary capitalize font-medium">{user?.role || 'student'} Account</p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container/40 flex items-center justify-center bg-primary text-white font-bold text-sm shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          {/* List Property button: ONLY shown to Owners & Admins, NEVER to Students! */}
          {isOwner && (
            <Link
              to="/listing/new"
              className="bg-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5 ml-2"
            >
              <Plus className="h-4 w-4" />
              <span>List Property</span>
            </Link>
          )}

          {isStudent && (
            <Link
              to="/browse"
              className="bg-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5 ml-2"
            >
              <Compass className="h-4 w-4" />
              <span>Browse Rooms</span>
            </Link>
          )}
        </div>
      </header>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-700 font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* ─── 1. STUDENT VIEW: STATS & BOOKINGS ──────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {isStudent && (
        <div className="space-y-8">
          {/* Student Overview Stat Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-surface rounded-2xl p-5 sharp-shadow border border-outline-variant/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[26px]">apartment</span>
              </div>
              <div>
                <p className="text-on-surface-variant text-[11px] uppercase font-bold tracking-wider">Total Applications</p>
                <h3 className="font-heading font-bold text-2xl text-on-background mt-0.5">{studentBookings.length}</h3>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-5 sharp-shadow border border-outline-variant/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
                <span className="material-symbols-outlined text-[26px]">verified</span>
              </div>
              <div>
                <p className="text-on-surface-variant text-[11px] uppercase font-bold tracking-wider">Confirmed Stays</p>
                <h3 className="font-heading font-bold text-2xl text-on-background mt-0.5">
                  {studentBookings.filter((b) => b.status === 'accepted').length}
                </h3>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-5 sharp-shadow border border-outline-variant/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <span className="material-symbols-outlined text-[26px]">pending</span>
              </div>
              <div>
                <p className="text-on-surface-variant text-[11px] uppercase font-bold tracking-wider">Under Review</p>
                <h3 className="font-heading font-bold text-2xl text-on-background mt-0.5">
                  {studentBookings.filter((b) => b.status === 'pending').length}
                </h3>
              </div>
            </div>
          </section>

          {/* Student Bookings List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-xl text-on-background">Your Stay Applications</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">All room booking requests submitted through your student account.</p>
              </div>
              <Link to="/browse" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                <span>Find More Stays</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

            {loadingStudentBookings ? (
              <div className="p-12 text-center text-xs text-on-surface-variant animate-pulse space-y-2">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                <p>Loading your student bookings...</p>
              </div>
            ) : studentBookings.length === 0 ? (
              <div className="p-16 rounded-3xl bg-surface border border-dashed border-outline-variant/40 text-center space-y-4 max-w-xl mx-auto my-8">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-primary">
                  <span className="material-symbols-outlined text-3xl">bed</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-on-surface">No Room Applications Yet</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    You haven't applied for any student rooms yet. Browse our verified listings near university campuses with zero brokerage fees.
                  </p>
                </div>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm hover:bg-primary-container transition-all"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Browse Student Accommodations</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {studentBookings.map((b) => {
                  const propertyId = typeof b.listing_id === 'string' ? b.listing_id : b.listing_id?._id;
                  const title = b.listing_title || b.listing_id?.title || 'Student Accommodation';
                  const location = b.listing_location || b.listing_id?.location || 'Campus Area';
                  const price = b.listing_price || b.listing_id?.price;
                  const roomType = b.listing_room_type || b.listing_id?.room_type || 'Room';
                  const moveInDate = b.move_in_date || b.start_date;
                  const displayImage =
                    b.listing_image ||
                    (b.listing_id?.images && b.listing_id.images[0]) ||
                    b.listing_id?.image_path ||
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80';

                  return (
                    <div
                      key={b.id || b._id}
                      className="p-5 bg-surface rounded-2xl border border-outline-variant/30 sharp-shadow hover:border-primary/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="w-24 h-20 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-outline-variant/20">
                          <img src={displayImage} alt={title} className="w-full h-full object-cover" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">
                              {roomType}
                            </span>
                            {getStatusBadge(b.status)}
                          </div>
                          <h4 className="font-heading font-bold text-base text-on-surface line-clamp-1">{title}</h4>
                          <p className="text-xs text-on-surface-variant line-clamp-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                            {location}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant pt-1 font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              Move-in: {moveInDate ? new Date(moveInDate).toLocaleDateString() : 'Immediate'}
                            </span>
                            {price && (
                              <span className="font-bold text-primary">
                                ₹{Number(price).toLocaleString('en-IN')}/mo
                              </span>
                            )}
                            {b.owner_name && (
                              <span className="text-on-surface-variant">
                                Landlord: <span className="font-semibold text-on-surface">{b.owner_name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="self-end md:self-center shrink-0">
                        {propertyId && (
                          <Link
                            to={`/property/${propertyId}`}
                            className="px-4 py-2 rounded-xl bg-surface border border-outline-variant/50 text-xs font-semibold hover:border-primary hover:text-primary flex items-center gap-1.5 transition-colors"
                          >
                            <span>View Listing</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* ─── 2. OWNER VIEW: STATS & MANAGEMENT ──────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {isOwner && (
        <div className="space-y-8">
          {/* Stats Grid (Owner) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-6 sharp-shadow border border-outline-variant/20 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  apartment
                </span>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs uppercase font-bold tracking-wider">Active Listings</p>
                <h3 className="font-heading font-bold text-3xl text-on-background mt-1">{properties.length}</h3>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 sharp-shadow border border-outline-variant/20 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed/30 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  visibility
                </span>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs uppercase font-bold tracking-wider">Total Views</p>
                <h3 className="font-heading font-bold text-3xl text-on-background mt-1">{properties.length * 180 || 0}</h3>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 sharp-shadow border border-outline-variant/20 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  forum
                </span>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs uppercase font-bold tracking-wider">Bookings & Enquiries</p>
                <h3 className="font-heading font-bold text-3xl text-on-background mt-1">{bookings.length}</h3>
              </div>
            </div>
          </section>

          {/* Owner Tabs & Content */}
          <div className="space-y-6">
            <div className="flex p-1 bg-surface rounded-2xl border border-outline-variant/30 w-fit">
              <button
                type="button"
                onClick={() => setOwnerTab('bookings')}
                className={`py-2 px-5 text-xs font-semibold rounded-xl transition-all ${
                  ownerTab === 'bookings'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Tenant Requests ({bookings.length})
              </button>
              <button
                type="button"
                onClick={() => setOwnerTab('properties')}
                className={`py-2 px-5 text-xs font-semibold rounded-xl transition-all ${
                  ownerTab === 'properties'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                My Properties ({properties.length})
              </button>
            </div>

            {/* Tab 1: Bookings Requests Table */}
            {ownerTab === 'bookings' && (
              <section className="bg-surface rounded-2xl sharp-shadow border border-outline-variant/20 overflow-hidden">
                <div className="p-5 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="font-heading font-bold text-base text-on-surface">Incoming Tenant Requests</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 h-3.5 w-3.5" />
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {loadingOwnerBookings ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant animate-pulse">Loading tenant requests...</div>
                ) : bookings.length === 0 ? (
                  <div className="p-12 text-center text-xs text-on-surface-variant space-y-2">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">inbox</span>
                    <p className="font-bold text-on-surface">No tenant requests yet</p>
                    <p>When students apply to your properties, their requests will appear here for review.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-container-low/70 border-b border-outline-variant/20">
                        <tr>
                          <th className="px-5 py-3 font-bold uppercase tracking-wider text-on-surface-variant">Student</th>
                          <th className="px-5 py-3 font-bold uppercase tracking-wider text-on-surface-variant">Property</th>
                          <th className="px-5 py-3 font-bold uppercase tracking-wider text-on-surface-variant">Move-in Date</th>
                          <th className="px-5 py-3 font-bold uppercase tracking-wider text-on-surface-variant">Message</th>
                          <th className="px-5 py-3 font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
                          <th className="px-5 py-3 font-bold uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {bookings
                          .filter((b) => {
                            if (!searchQuery) return true;
                            const q = searchQuery.toLowerCase();
                            return (
                              b.student_name?.toLowerCase().includes(q) ||
                              b.listing_title?.toLowerCase().includes(q)
                            );
                          })
                          .map((b) => (
                            <tr key={b.id || b._id} className="hover:bg-surface-container-low/40 transition-colors">
                              <td className="px-5 py-3.5">
                                <p className="font-bold text-on-surface">{b.student_name || 'Student'}</p>
                                <p className="text-[11px] text-on-surface-variant">{b.student_email || ''}</p>
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-on-surface">{b.listing_title || 'Accommodation'}</td>
                              <td className="px-5 py-3.5 text-on-surface-variant">
                                {b.move_in_date ? new Date(b.move_in_date).toLocaleDateString() : 'Flexible'}
                              </td>
                              <td className="px-5 py-3.5 text-on-surface-variant max-w-xs truncate">{b.message || '—'}</td>
                              <td className="px-5 py-3.5">{getStatusBadge(b.status)}</td>
                              <td className="px-5 py-3.5 text-right">
                                {b.status === 'pending' ? (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleBookingAction(b.id || b._id, 'accepted')}
                                      className="px-3 py-1 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 flex items-center gap-1 shadow-xs"
                                    >
                                      <Check className="h-3 w-3" />
                                      <span>Accept</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleBookingAction(b.id || b._id, 'rejected')}
                                      className="px-3 py-1 rounded-lg bg-error/10 text-error font-semibold hover:bg-error/20 flex items-center gap-1"
                                    >
                                      <X className="h-3 w-3" />
                                      <span>Decline</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-on-surface-variant font-medium">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* Tab 2: Owner's Properties Table */}
            {ownerTab === 'properties' && (
              <section className="bg-surface rounded-2xl sharp-shadow border border-outline-variant/20 overflow-hidden">
                <div className="p-5 border-b border-outline-variant/20 flex justify-between items-center">
                  <h3 className="font-heading font-bold text-base text-on-surface">Your Managed Properties</h3>
                  <Link
                    to="/listing/new"
                    className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-container flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Property</span>
                  </Link>
                </div>

                {loadingOwnerProperties ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant animate-pulse">Loading properties...</div>
                ) : properties.length === 0 ? (
                  <div className="p-12 text-center text-xs text-on-surface-variant space-y-2">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">home_work</span>
                    <p className="font-bold text-on-surface">No properties listed yet</p>
                    <p>Start receiving student enquiries by listing your first accommodation.</p>
                    <Link to="/listing/new" className="inline-block mt-2 bg-primary text-white px-4 py-2 rounded-xl font-semibold">
                      List Property Now
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-container-low/70 border-b border-outline-variant/20">
                        <tr>
                          <th className="px-5 py-3 font-bold uppercase tracking-wider text-on-surface-variant">Photo</th>
                          <th className="px-5 py-3 font-bold uppercase tracking-wider text-on-surface-variant">Title</th>
                          <th className="px-5 py-3 font-bold uppercase tracking-wider text-on-surface-variant">Price</th>
                          <th className="px-5 py-3 font-bold uppercase tracking-wider text-on-surface-variant">Availability</th>
                          <th className="px-5 py-3 font-bold uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {properties.map((p) => {
                          const displayImage =
                            (p.images && p.images[0]) ||
                            p.image_path ||
                            p.image_url ||
                            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80';
                          const isAvailable = p.is_available === 1 || p.is_available === true;

                          return (
                            <tr key={p._id || p.id} className="hover:bg-surface-container-low/40 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="w-20 h-14 rounded-lg overflow-hidden border border-outline-variant/20">
                                  <img src={displayImage} alt="" className="w-full h-full object-cover" />
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                <p className="font-bold text-on-surface line-clamp-1">{p.title}</p>
                                <p className="text-[11px] text-on-surface-variant line-clamp-1">{p.location}</p>
                              </td>

                              <td className="px-5 py-3.5 font-bold text-primary">
                                ₹{Number(p.price).toLocaleString('en-IN')}/mo
                              </td>

                              <td className="px-5 py-3.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    isAvailable ? 'bg-secondary/10 text-secondary' : 'bg-neutral-200 text-neutral-600'
                                  }`}
                                >
                                  {isAvailable ? 'Available' : 'Reserved'}
                                </span>
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <Link
                                    to={`/property/${p._id || p.id}`}
                                    className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-on-surface"
                                    title="View Public Page"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Link>
                                  <Link
                                    to={`/edit/${p._id || p.id}`}
                                    className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary-container"
                                    title="Edit Property"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
