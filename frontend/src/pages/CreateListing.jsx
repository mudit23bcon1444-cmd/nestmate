import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import {
  Upload,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  MapPin,
} from 'lucide-react';

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

export default function CreateListing() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [roomType, setRoomType] = useState('single');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
        },
        (err) => {
          setError('Unable to fetch GPS coordinates: ' + err.message);
        }
      );
    }
  };

  const createMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.post('/api/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(
        err.response?.data?.error || err.response?.data?.message || 'Failed to submit property listing.'
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

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('room_type', roomType);
    formData.append('price', price);
    formData.append('location', location.trim());
    if (description.trim()) formData.append('description', description.trim());
    if (latitude) formData.append('latitude', latitude);
    if (longitude) formData.append('longitude', longitude);
    if (selectedAmenities.length > 0) {
      formData.append('amenities', selectedAmenities.join(','));
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }

    createMutation.mutate(formData);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
            <span>List Your Property</span>
            <span className="text-primary">Step 1 of 1</span>
          </div>
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary-container w-full transition-all duration-500"></div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-surface rounded-2xl sharp-shadow-lg p-6 sm:p-8 border border-outline-variant/30">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl font-bold text-on-background mb-1">
                Basic Information
              </h1>
              <p className="text-xs text-on-surface-variant">
                Let's start with the core details of your student property.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline bg-primary/10 px-3 py-1.5 rounded-xl self-start sm:self-auto transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Property Title */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Property Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cozy Private Studio near University Gate"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Property Type & Price */}
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
                  placeholder="e.g. 8500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Location & GPS */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Full Address & Proximity to University *
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  Auto-detect GPS
                </button>
              </div>
              <textarea
                required
                rows={3}
                placeholder="Enter complete street address, nearby college landmarks, and metro station..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={100}
                className="w-full p-3.5 bg-surface-bright border border-outline-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
              ></textarea>
            </div>

            {/* Amenities Grid */}
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

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Detailed Property Description
              </label>
              <textarea
                rows={4}
                placeholder="Describe house rules, meal options, study environment, and rent terms..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 bg-surface-bright border border-outline-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
              ></textarea>
            </div>

            {/* Visual Preview Banner & Image Upload */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                Property Photo
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <label className="flex-1 w-full border-2 border-dashed border-outline-variant hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition-colors bg-surface-container-low/40">
                  <Upload className="mx-auto h-7 w-7 text-primary mb-2" />
                  <span className="text-xs font-bold text-primary">Upload Property Photo</span>
                  <p className="text-[11px] text-on-surface-variant mt-1">PNG, JPG, or WEBP up to 5MB</p>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>

                {imagePreview && (
                  <div className="h-28 w-44 rounded-xl overflow-hidden border border-outline-variant shrink-0">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Visual Context Banner matching template */}
            <div className="rounded-xl overflow-hidden h-36 bg-surface-container relative">
              <img
                alt="Student Living Space Preview"
                className="w-full h-full object-cover opacity-80"
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-on-background/30 backdrop-blur-[2px]">
                <p className="text-white text-xs font-medium text-center px-4">
                  Listing a space that feels like home starts with clear and verified details.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-primary text-primary text-xs font-semibold hover:bg-primary/5 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-container transition-all disabled:opacity-50"
              >
                <span>{createMutation.isPending ? 'Publishing...' : 'Submit for Verification'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
