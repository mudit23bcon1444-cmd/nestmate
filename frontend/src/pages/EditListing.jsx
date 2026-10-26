import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const AMENITY_OPTIONS = [
  'WiFi',
  'Air Conditioning',
  'Attached Bathroom',
  'Power Backup',
  'RO Water',
  'Geyser',
  'Laundry / Washing Machine',
  'Meal Service / Mess',
  'CCTV Security',
  'Study Desk & Chair',
];

function EditListingForm({ listing }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(listing.title || '');
  const [roomType, setRoomType] = useState(listing.room_type || 'single');
  const [price, setPrice] = useState(listing.price || '');
  const [location, setLocation] = useState(listing.location || '');
  const [description, setDescription] = useState(listing.description || '');
  const [selectedAmenities, setSelectedAmenities] = useState(listing.amenities || ['WiFi']);
  const [error, setError] = useState('');

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const updateMutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await api.put(`/api/listings/${listing._id || listing.id}`, updatedData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['listing', listing._id || listing.id]);
      queryClient.invalidateQueries(['my-properties']);
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(
        err.response?.data?.error || err.response?.data?.message || 'Failed to update property.'
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !location.trim() || !price) {
      setError('Title, location address, and monthly rent are required.');
      return;
    }

    updateMutation.mutate({
      title: title.trim(),
      room_type: roomType,
      price: parseInt(price, 10),
      location: location.trim(),
      description: description.trim(),
      amenities: selectedAmenities,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
          Property Title *
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
            Property Type *
          </label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
          >
            <option value="single">Private Room (PG)</option>
            <option value="apartment">Studio Apartment</option>
            <option value="shared">Student Hall / Hostel</option>
            <option value="studio">Shared Room</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
            Monthly Rent (₹/month) *
          </label>
          <input
            type="number"
            required
            min={500}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
          Full Address & Campus Proximity *
        </label>
        <textarea
          required
          rows={3}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-3.5 bg-surface-bright border border-outline-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
        ></textarea>
      </div>

      <div>
        <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
          Amenities Available
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITY_OPTIONS.map((a) => {
            const isChecked = selectedAmenities.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${
                  isChecked
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-outline-variant/40 bg-surface text-on-surface-variant hover:border-primary/50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isChecked ? 'check_box' : 'check_box_outline_blank'}
                </span>
                <span>{a}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
          Detailed Description
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3.5 bg-surface-bright border border-outline-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
        ></textarea>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-primary text-primary text-xs font-semibold hover:bg-primary/5 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-container transition-all disabled:opacity-50"
        >
          <span>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: rawListing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await api.get(`/api/listings/${id}`);
      return res.data;
    },
  });

  const listing = rawListing?.listing || rawListing;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-surface-container rounded-lg"></div>
        <div className="h-96 bg-surface-container rounded-2xl"></div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-error" />
        <h2 className="mt-3 text-lg font-bold text-on-surface">Property Not Found</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-xs font-semibold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="bg-surface rounded-2xl sharp-shadow-lg p-6 sm:p-8 border border-outline-variant/30">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-on-background mb-1">
            Edit Property Details
          </h1>
          <p className="text-xs text-on-surface-variant">
            Update pricing, amenities, or descriptions for {listing.title}
          </p>
        </div>

        <EditListingForm key={listing._id || listing.id} listing={listing} />
      </div>
    </main>
  );
}
