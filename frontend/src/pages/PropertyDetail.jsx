import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import PropertyMap from '../components/PropertyMap';
import {
  Calendar,
  AlertCircle,
  Building,
  ArrowLeft,
  Send,
} from 'lucide-react';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [message, setMessage] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Fetch listing details
  const { data: rawListing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await api.get(`/api/listings/${id}`);
      return res.data;
    },
  });

  const listing = rawListing?.listing || rawListing;

  // Booking mutation with 409 conflict detection
  const bookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      const res = await api.post('/api/bookings', bookingData);
      return res.data;
    },
    onSuccess: () => {
      setBookingSuccess(true);
      setBookingError('');
      queryClient.invalidateQueries(['listing', id]);
    },
    onError: (err) => {
      if (err.response?.status === 409) {
        setBookingError(
          'Conflict: This listing has already been reserved or booked by another student!'
        );
      } else {
        setBookingError(
          err.response?.data?.error || err.response?.data?.message || 'Failed to submit booking request.'
        );
      }
    },
  });

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setBookingError('');

    if (!startDate) {
      setBookingError('Please specify your target move-in date.');
      return;
    }

    bookingMutation.mutate({
      listing_id: id,
      move_in_date: startDate,
      message: message.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
        <div className="h-96 bg-surface-container rounded-3xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-surface-container rounded w-3/4"></div>
            <div className="h-4 bg-surface-container rounded w-1/2"></div>
            <div className="h-40 bg-surface-container rounded-2xl"></div>
          </div>
          <div className="h-80 bg-surface-container rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <span className="material-symbols-outlined text-5xl text-error mb-3">error</span>
        <h2 className="text-xl font-bold text-on-surface">Property Not Found</h2>
        <p className="mt-2 text-xs text-on-surface-variant">The listing you requested might have been unlisted or removed.</p>
        <Link to="/browse" className="mt-6 inline-block bg-primary text-white py-2 px-6 rounded-xl text-xs font-semibold">
          Back to Browse
        </Link>
      </div>
    );
  }

  const images =
    listing.images && listing.images.length > 0
      ? listing.images
      : listing.image_path
      ? [listing.image_path]
      : listing.image_url
      ? [listing.image_url]
      : [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        ];

  const isAvailable = listing.is_available === 1 || listing.is_available === true;
  const isOwner = user && (String(user._id) === String(listing.owner_id) || String(user.id) === String(listing.owner_id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to listings</span>
      </button>

      {/* ─── Hero Image Gallery ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[380px] sm:h-[480px]">
        {/* Main Photo (2 cols on desktop) */}
        <div className="md:col-span-2 relative h-full rounded-3xl overflow-hidden shadow-card border border-outline-variant/30 group">
          <img
            src={images[selectedPhotoIndex] || images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="bg-[#FFBE0B] text-on-background px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-sm">
              Featured
            </span>
            <span className="bg-white/90 backdrop-blur-xs text-on-surface px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-sm capitalize">
              {listing.room_type || 'Studio'}
            </span>
          </div>
        </div>

        {/* Stacked Side Photos */}
        <div className="hidden md:flex flex-col gap-4 h-full">
          <div
            onClick={() => setSelectedPhotoIndex(1 % images.length)}
            className="relative flex-1 rounded-2xl overflow-hidden border border-outline-variant/30 cursor-pointer group"
          >
            <img
              src={images[1] || images[0]}
              alt="Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div
            onClick={() => setSelectedPhotoIndex(2 % images.length)}
            className="relative flex-1 rounded-2xl overflow-hidden border border-outline-variant/30 cursor-pointer group"
          >
            <img
              src={images[2] || images[0]}
              alt="Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <button
              type="button"
              className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-outline-variant/30 flex items-center gap-1.5 text-xs font-semibold shadow-sm hover:bg-white transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span>{images.length} Photos</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Content Canvas: Left Details + Right Booking Card ──────────── */}
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Left Column (Details 2/3) */}
        <div className="w-full lg:w-2/3 flex flex-col gap-8">
          {/* Title & Location Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                  isAvailable
                    ? 'bg-secondary/10 text-secondary border border-secondary/20'
                    : 'bg-error/10 text-error border border-error/20'
                }`}
              >
                {isAvailable ? 'Available for Rent' : 'Already Reserved'}
              </span>
              {listing.is_verified && (
                <span className="bg-tertiary text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  <span>NestMate Verified</span>
                </span>
              )}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-on-background leading-tight">
              {listing.title}
            </h1>

            <div className="flex items-center gap-1.5 text-on-surface-variant text-sm mt-2">
              <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
              <span>{listing.location}</span>
            </div>
          </div>

          {/* Description */}
          <section className="border-t border-outline-variant/10 pt-6 space-y-3">
            <h2 className="font-heading font-bold text-xl text-on-background">About this property</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
              {listing.description ||
                'Experience the perfect blend of comfort and student living. Designed specifically with student lifestyles in mind, this property provides high-speed internet, comfortable study space, and peaceful surroundings near major university campuses.'}
            </p>
          </section>

          {/* Amenities Grid */}
          <section className="border-t border-outline-variant/10 pt-6 space-y-4">
            <h2 className="font-heading font-bold text-xl text-on-background">Amenities & Facilities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(listing.amenities && listing.amenities.length > 0
                ? listing.amenities
                : ['High-speed WiFi', 'Air Conditioning', 'Attached Bathroom', 'Power Backup', 'Modern Kitchen', '24/7 Security']
              ).map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3.5 bg-surface rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors shadow-2xs"
                >
                  <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                  <span className="text-xs font-semibold text-on-surface">{amenity}</span>
                </div>
              ))}
            </div>
          </section>

          {/* House Rules */}
          <section className="border-t border-outline-variant/10 pt-6 space-y-4">
            <h2 className="font-heading font-bold text-xl text-on-background">House Rules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low/50 text-xs text-on-surface font-medium">
                <span className="material-symbols-outlined text-primary/80 text-[20px]">schedule</span>
                <span>Check-in after 12:00 PM</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low/50 text-xs text-on-surface font-medium">
                <span className="material-symbols-outlined text-primary/80 text-[20px]">smoke_free</span>
                <span>No smoking inside premises</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low/50 text-xs text-on-surface font-medium">
                <span className="material-symbols-outlined text-primary/80 text-[20px]">group</span>
                <span>Quiet study hours 10:00 PM – 7:00 AM</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low/50 text-xs text-on-surface font-medium">
                <span className="material-symbols-outlined text-primary/80 text-[20px]">pets</span>
                <span>No pets allowed</span>
              </div>
            </div>
          </section>

          {/* Location Map */}
          {listing.location_geo?.coordinates && (
            <section className="border-t border-outline-variant/10 pt-6 space-y-4">
              <h2 className="font-heading font-bold text-xl text-on-background">Location on Map</h2>
              <div className="w-full h-80 rounded-3xl overflow-hidden border border-outline-variant/20 shadow-card">
                <PropertyMap
                  listings={[listing]}
                  center={[listing.location_geo.coordinates[1], listing.location_geo.coordinates[0]]}
                  zoom={15}
                  className="h-full w-full"
                />
              </div>
            </section>
          )}

          {/* Tenant Reviews */}
          <section className="border-t border-outline-variant/10 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-xl text-on-background">Tenant Reviews</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-bold text-sm">4.9</span>
                  </div>
                  <span className="text-on-surface-variant text-xs">• 18 Verified Student Residents</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-surface rounded-2xl border border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container text-xs">
                      AS
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-on-surface">Aarav Sharma</h4>
                      <p className="text-[11px] text-on-surface-variant">Resident for 1 year</p>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant italic leading-relaxed">
                  "NestMate made moving to college super simple. The owner responded within minutes, and the Wi-Fi has never lagged once during exam weeks."
                </p>
              </div>

              <div className="p-5 bg-surface rounded-2xl border border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-on-primary-fixed text-xs">
                      PM
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-on-surface">Pooja Mehra</h4>
                      <p className="text-[11px] text-on-surface-variant">Resident for 6 months</p>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant italic leading-relaxed">
                  "Quiet environment for studying, verified amenities, and zero middleman broker deductions. Highly recommended!"
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ─── Right Column: Sticky Booking / Contact Card (1/3) ─────────────── */}
        <aside className="w-full lg:w-1/3 lg:sticky lg:top-[90px]">
          <div className="p-6 sm:p-7 bg-surface rounded-3xl border border-outline-variant/20 sharp-shadow-lg flex flex-col gap-6">
            {/* Price Header */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl sm:text-4xl font-bold text-primary tracking-tight">
                  ₹{Number(listing.price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">/ month</span>
              </div>
              <div className="flex items-center gap-1.5 text-tertiary">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span className="text-[12px] font-semibold">0% Brokerage • Direct Landlord Agreement</span>
              </div>
            </div>

            {/* Host Profile Info */}
            <div className="flex items-center gap-3.5 py-4 border-y border-outline-variant/10">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-base">
                  {listing.owner_name ? listing.owner_name.charAt(0).toUpperCase() : 'H'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  Managed By
                </p>
                <h4 className="font-heading text-sm font-bold text-on-surface">
                  {listing.owner_name || 'Verified Property Host'}
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-on-surface-variant mt-0.5">
                  <span className="material-symbols-outlined text-[13px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span>4.9 (Verified Landlord)</span>
                </div>
              </div>
            </div>

            {/* Form / Actions */}
            {bookingSuccess ? (
              <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary/20 text-center space-y-2 animate-fade-in">
                <span className="material-symbols-outlined text-4xl text-secondary">check_circle</span>
                <h4 className="font-bold text-sm text-on-surface">Booking Request Sent!</h4>
                <p className="text-xs text-on-surface-variant">
                  The property owner has received your request. Check your student dashboard for updates.
                </p>
                <Link
                  to="/dashboard"
                  className="mt-3 inline-block bg-primary text-white py-2 px-5 rounded-xl text-xs font-semibold"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : !isAvailable ? (
              <div className="p-5 rounded-2xl bg-surface-container border border-outline-variant/30 text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">block</span>
                <h4 className="font-bold text-sm text-on-surface">Currently Unavailable</h4>
                <p className="text-xs text-on-surface-variant">
                  This room has already been reserved by another student.
                </p>
                <Link
                  to="/browse"
                  className="mt-3 inline-block bg-surface border border-outline-variant px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Find Other Rooms
                </Link>
              </div>
            ) : isOwner ? (
              <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-center space-y-2">
                <Building className="mx-auto h-8 w-8 text-primary" />
                <h4 className="font-bold text-sm text-on-surface">Your Property</h4>
                <p className="text-xs text-on-surface-variant">You manage this listing.</p>
                <Link
                  to={`/edit/${listing._id || listing.id}`}
                  className="mt-2 inline-block bg-primary text-white px-5 py-2 rounded-xl text-xs font-semibold"
                >
                  Edit Listing
                </Link>
              </div>
            ) : !isAuthenticated ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-1">
                  <h4 className="font-bold text-xs text-on-surface">Ready to reserve your room?</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    Sign in with your student account to send an instant request.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="block text-center bg-primary text-white py-3 px-4 rounded-xl text-xs font-bold shadow-md hover:bg-primary-container transition-all"
                >
                  Sign In to Book
                </Link>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {bookingError && (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                    Target Move-in Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-on-surface-variant/70" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-surface-container-low/60 rounded-xl text-xs text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                    Message to Owner (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Introduce yourself, your college/year, and move-in timeline..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={300}
                    className="w-full p-3 bg-surface-container-low/60 rounded-xl text-xs text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={bookingMutation.isPending}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {bookingMutation.isPending ? (
                    'Submitting Request...'
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Request Instant Booking</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Reassurance badge */}
            <div className="flex gap-2.5 items-start p-3.5 bg-surface-container-low/50 rounded-xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Secure your room today. No payments are charged until after the landlord approves your booking.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
