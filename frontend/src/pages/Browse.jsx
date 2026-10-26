import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import PropertyMap from '../components/PropertyMap';
import {
  MapPin,
  Map as MapIcon,
  Grid,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const AMENITY_OPTIONS = [
  'WiFi',
  'Air Conditioning',
  'On-site Parking',
  'Gym',
  'Laundry',
  'Attached Bathroom',
  'Power Backup',
  'Food Included',
  'CCTV Security',
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [roomType, setRoomType] = useState(searchParams.get('room_type') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '3000');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '25000');
  const [gender, setGender] = useState('All');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [selectedAmenities, setSelectedAmenities] = useState(
    searchParams.get('amenities') ? searchParams.get('amenities').split(',') : []
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [selectedListingId, setSelectedListingId] = useState(null);

  // Sync to URL
  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams();
    if (location.trim()) params.append('location', location.trim().slice(0, 50));
    if (roomType) params.append('room_type', roomType);
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);
    if (sort && sort !== 'newest') params.append('sort', sort);
    if (selectedAmenities.length > 0) params.append('amenities', selectedAmenities.join(','));
    if (newPage > 1) params.append('page', newPage.toString());

    setPage(newPage);
    setSearchParams(params);
  };

  const handleClearAll = () => {
    setLocation('');
    setRoomType('');
    setMinPrice('3000');
    setMaxPrice('25000');
    setGender('All');
    setSort('newest');
    setSelectedAmenities([]);
    setPage(1);
    setSearchParams(new URLSearchParams());
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Listings Query
  const queryParams = new URLSearchParams();
  if (location.trim()) queryParams.append('location', location.trim().slice(0, 50));
  if (roomType) queryParams.append('room_type', roomType);
  if (minPrice) queryParams.append('minPrice', minPrice);
  if (maxPrice) queryParams.append('maxPrice', maxPrice);
  if (sort) queryParams.append('sort', sort);
  if (selectedAmenities.length > 0) queryParams.append('amenities', selectedAmenities.join(','));
  queryParams.append('page', page);
  queryParams.append('limit', '9');

  const { data: listingsData, isLoading, isError } = useQuery({
    queryKey: ['listings', queryParams.toString()],
    queryFn: async () => {
      const res = await api.get(`/api/listings?${queryParams.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  // Map Data Query
  const { data: mapData } = useQuery({
    queryKey: ['listings-map', location, roomType],
    queryFn: async () => {
      const res = await api.get(`/api/listings/map?location=${encodeURIComponent(location)}`);
      return res.data;
    },
  });

  const listings = listingsData?.listings || [];
  const pagination = listingsData?.pagination || { total: listings.length, page: 1, totalPages: 1 };
  const mapListings = mapData?.listings || listings;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start">
      {/* ─── Left Sidebar: Refined App-Like Filters ─────────────────────────── */}
      <aside className="w-full lg:w-72 shrink-0 bg-surface border border-outline-variant/30 rounded-2xl lg:sticky lg:top-[90px] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-on-surface">Filters</h2>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-primary text-xs font-semibold hover:underline"
          >
            Clear all
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Location search */}
          <div className="space-y-2">
            <label className="font-bold text-on-surface text-xs uppercase tracking-wider">Location</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 text-[18px]">
                location_on
              </span>
              <input
                type="text"
                placeholder="Enter college or area..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={50}
                className="w-full pl-9 pr-3 py-2 bg-surface-container-low/60 rounded-xl text-xs text-on-surface border border-outline-variant/30 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-on-surface text-xs uppercase tracking-wider">Price Range</label>
              <span className="text-[11px] text-on-surface-variant font-medium">Monthly (₹)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold">Min</span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-surface-container-low/60 rounded-lg text-xs font-bold text-on-surface border border-outline-variant/30 focus:outline-none"
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold">Max</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-surface-container-low/60 rounded-lg text-xs font-bold text-on-surface border border-outline-variant/30 focus:outline-none text-right"
                />
              </div>
            </div>
          </div>

          {/* Property Type */}
          <div className="space-y-2.5">
            <label className="font-bold text-on-surface text-xs uppercase tracking-wider">Property Type</label>
            <div className="space-y-2">
              {[
                { id: 'single', label: 'Private Room (PG)' },
                { id: 'apartment', label: 'Studio / Flat' },
                { id: 'shared', label: 'Student Hall / Hostel' },
                { id: 'studio', label: 'Shared Room' },
              ].map((type) => (
                <label key={type.id} className="flex items-center gap-2.5 cursor-pointer group text-xs text-on-surface-variant hover:text-on-surface">
                  <input
                    type="radio"
                    name="roomTypeFilter"
                    checked={roomType === type.id}
                    onChange={() => setRoomType(roomType === type.id ? '' : type.id)}
                    className="accent-primary cursor-pointer w-4 h-4"
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Gender Preference */}
          <div className="space-y-2">
            <label className="font-bold text-on-surface text-xs uppercase tracking-wider">Gender Preference</label>
            <div className="grid grid-cols-2 gap-1.5">
              {['All', 'Female', 'Male', 'Co-ed'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    gender === g
                      ? 'border border-primary bg-primary text-white'
                      : 'border border-outline-variant/40 text-on-surface-variant hover:border-primary/50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2.5">
            <label className="font-bold text-on-surface text-xs uppercase tracking-wider">Amenities</label>
            <div className="space-y-2">
              {AMENITY_OPTIONS.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center justify-between cursor-pointer group text-xs text-on-surface-variant hover:text-on-surface"
                >
                  <span>{amenity}</span>
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="accent-primary cursor-pointer w-4 h-4"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20">
          <button
            type="button"
            onClick={() => applyFilters(1)}
            className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-xs shadow-sm hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Apply Results
          </button>
        </div>
      </aside>

      {/* ─── Right Content: Listings Header & Grid ─────────────────────────── */}
      <div className="flex-1 w-full flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-outline-variant/10">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-on-background">
              Find your next home
            </h1>
            <p className="text-on-surface-variant text-xs flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>{pagination.total || listings.length} properties available near University District</span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-surface border border-outline-variant/30 rounded-full px-3.5 py-1.5 shadow-sm text-xs">
              <span className="font-bold text-on-surface-variant uppercase text-[11px]">Sort:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  const p = new URLSearchParams(searchParams);
                  p.set('sort', e.target.value);
                  setSearchParams(p);
                }}
                className="bg-transparent border-none py-0 pl-1 pr-6 text-on-surface text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="newest">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-surface border border-outline-variant/30 rounded-lg p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'map' ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary'
                }`}
                title="Map View"
              >
                <MapIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Map vs Grid */}
        {viewMode === 'map' ? (
          <div className="h-[650px] w-full rounded-2xl overflow-hidden border border-outline-variant/30 shadow-card">
            <PropertyMap
              listings={mapListings}
              selectedId={selectedListingId}
              onMarkerClick={(id) => setSelectedListingId(id)}
              className="h-full w-full"
            />
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-2xl bg-surface border border-outline-variant/30 h-72"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-error/20 p-8">
            <p className="text-xs text-error font-medium">Failed to load listings. Please try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-outline-variant/40 p-8 space-y-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">home_work</span>
            <h3 className="font-bold text-base text-on-surface">No properties match your filter</h3>
            <p className="text-xs text-on-surface-variant">Try adjusting your budget or clearing amenity filters.</p>
            <button
              onClick={handleClearAll}
              className="mt-2 px-5 py-2 bg-primary text-white rounded-xl text-xs font-semibold"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item, idx) => {
              const displayImage =
                (item.images && item.images[0]) ||
                item.image_path ||
                item.image_url ||
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';

              return (
                <div
                  key={item._id || item.id || idx}
                  className="bg-surface rounded-2xl hover-lift overflow-hidden border border-outline-variant/30 flex flex-col justify-between shadow-xs group"
                >
                  {/* Photo with Floating Price Badge */}
                  <div className="relative aspect-[16/11] overflow-hidden bg-surface-container">
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={item.title}
                      src={displayImage}
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    {item.is_verified && (
                      <div className="absolute top-3.5 left-3.5 bg-[#FFBE0B] text-on-background px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-tighter shadow-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        <span>Verified</span>
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3 bg-primary-container text-white px-3.5 py-1.5 rounded-xl font-bold text-base shadow-lg backdrop-blur-sm bg-opacity-95">
                      ₹{Number(item.price).toLocaleString('en-IN')}
                      <span className="text-[11px] font-normal opacity-85">/mo</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <Link
                          to={`/property/${item._id || item.id}`}
                          className="font-heading text-base font-bold text-on-surface line-clamp-1 hover:text-primary transition-colors"
                        >
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-1 text-secondary font-bold text-xs bg-secondary/10 px-2 py-0.5 rounded-full shrink-0">
                          <span
                            className="material-symbols-outlined text-[14px] text-amber-500"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span>4.9</span>
                        </div>
                      </div>

                      <p className="flex items-center gap-1 text-on-surface-variant text-xs line-clamp-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{item.location}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/10 flex flex-wrap gap-1.5">
                      {(item.amenities && item.amenities.length > 0
                        ? item.amenities.slice(0, 3)
                        : ['WiFi', 'AC']
                      ).map((a, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-surface-container-low rounded-md text-[10px] font-bold text-on-secondary-container uppercase tracking-tight flex items-center gap-1"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => applyFilters(page - 1)}
              className="p-2 rounded-xl border border-outline-variant/40 bg-surface disabled:opacity-40 hover:bg-surface-container transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-xs font-semibold px-4 py-2 bg-surface rounded-xl border border-outline-variant/40">
              Page {page} of {pagination.totalPages}
            </div>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => applyFilters(page + 1)}
              className="p-2 rounded-xl border border-outline-variant/40 bg-surface disabled:opacity-40 hover:bg-surface-container transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
