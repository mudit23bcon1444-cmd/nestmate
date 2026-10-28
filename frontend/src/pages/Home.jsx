import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [propertyType, setPropertyType] = useState('');

  // Fetch real listings if available, else fall back to curated featured
  const { data } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: async () => {
      const res = await api.get('/api/listings?limit=6');
      return res.data;
    },
  });

  const apiListings = data?.listings || (Array.isArray(data) ? data : []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.append('location', location.trim());
    if (propertyType && propertyType !== 'Property Type') {
      params.append('room_type', propertyType.toLowerCase());
    }
    if (budget === 'Under ₹5,000') {
      params.append('max_price', '5000');
    } else if (budget === '₹5,000 - ₹10,000') {
      params.append('min_price', '5000');
      params.append('max_price', '10000');
    } else if (budget === '₹10,000+') {
      params.append('min_price', '10000');
    }
    navigate(`/browse?${params.toString()}`);
  };

  // Static curated cards matching code.html screenshots
  const curatedCards = [
    {
      id: 'featured-1',
      title: 'Sunset Residency',
      location: 'IIT Delhi Campus',
      price: '12,500',
      badge: 'FEATURED',
      badgeColor: 'bg-[#FFBE0B] text-on-secondary-fixed',
      image:
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      amenities: [
        { icon: 'wifi', label: 'WiFi' },
        { icon: 'ac_unit', label: 'AC' },
        { icon: 'chair', label: 'Furnished' },
      ],
    },
    {
      id: 'featured-2',
      title: 'Urban Heights PG',
      location: 'Koramangala, Bangalore',
      price: '8,000',
      badge: 'NEW',
      badgeColor: 'bg-primary text-white',
      image:
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
      amenities: [
        { icon: 'local_dining', label: 'Food Incl.' },
        { icon: 'cleaning_services', label: 'Cleaning' },
      ],
    },
    {
      id: 'featured-3',
      title: 'The Scholars Hub',
      location: 'Vasant Vihar, Mumbai',
      price: '15,000',
      badge: 'POPULAR',
      badgeColor: 'bg-tertiary text-white',
      image:
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      amenities: [
        { icon: 'security', label: 'Security' },
        { icon: 'fitness_center', label: 'Gym' },
      ],
    },
  ];

  return (
    <div className="w-full">
      {/* ─── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative px-4 overflow-hidden bg-surface-bright pt-16 md:pt-24 pb-[140px] md:pb-[160px]">
        {/* Background Image & Ambient Gradients */}
        <div className="absolute inset-0 z-0">
          <img
            alt="Modern student apartment interior"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/20"></div>
          <div className="absolute inset-0 bg-radial-gradient(circle at top right, #ffdbd0 0%, transparent 70%) opacity-50"></div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-[52px] font-bold text-on-primary-container mb-6 max-w-4xl tracking-tight leading-tight">
            Find Your Perfect PG or <br className="hidden md:block" /> Flat Near College
          </h1>

          <p className="text-base sm:text-lg text-on-primary-container/70 mb-10 max-w-2xl leading-relaxed">
            Secure, verified, and student-friendly housing solutions designed for your comfort and academic success.
          </p>

          {/* Large Pill Search Bar */}
          <form
            onSubmit={handleSearch}
            className="w-full max-w-4xl bg-surface p-2.5 rounded-2xl border-subtle sharp-shadow-lg flex flex-col md:flex-row gap-2"
          >
            {/* Location */}
            <div className="flex-1 relative group">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 group-focus-within:text-primary transition-colors text-[22px]"
              >
                location_on
              </span>
              <input
                className="w-full pl-12 pr-4 py-3.5 border-none rounded-xl bg-surface-container-low/50 focus:bg-surface-container-low focus:ring-1 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 text-sm transition-all focus:outline-none"
                placeholder="Enter college or city"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Budget */}
            <div className="flex-1 relative group">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 group-focus-within:text-primary transition-colors text-[22px]"
              >
                payments
              </span>
              <select
                className="w-full pl-12 pr-4 py-3.5 border-none rounded-xl bg-surface-container-low/50 focus:bg-surface-container-low focus:ring-1 focus:ring-primary/20 text-on-surface text-sm appearance-none transition-all focus:outline-none cursor-pointer"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              >
                <option value="">Budget (Any)</option>
                <option value="Under ₹5,000">Under ₹5,000</option>
                <option value="₹5,000 - ₹10,000">₹5,000 - ₹10,000</option>
                <option value="₹10,000+">₹10,000+</option>
              </select>
            </div>

            {/* Property Type */}
            <div className="flex-1 relative group">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 group-focus-within:text-primary transition-colors text-[22px]"
              >
                home
              </span>
              <select
                className="w-full pl-12 pr-4 py-3.5 border-none rounded-xl bg-surface-container-low/50 focus:bg-surface-container-low focus:ring-1 focus:ring-primary/20 text-on-surface text-sm appearance-none transition-all focus:outline-none cursor-pointer"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="">Property Type</option>
                <option value="single">PG</option>
                <option value="apartment">Flat</option>
                <option value="shared">Hostel</option>
                <option value="studio">Shared Room</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="bg-primary text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-container hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Abstract blur elements */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-12 -right-24 w-80 h-80 bg-primary-fixed/30 rounded-full blur-[120px]"></div>
      </section>

      {/* ─── Stats Row ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto -mt-10 px-4 sm:px-6 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-surface rounded-xl p-6 border-subtle sharp-shadow hover:border-primary/20 transition-colors group">
          <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-primary text-[28px]">apartment</span>
          </div>
          <div className="font-heading font-bold text-2xl text-on-surface">2400+</div>
          <div className="text-xs text-on-surface-variant font-medium mt-0.5">Listings</div>
        </div>

        <div className="bg-surface rounded-xl p-6 border-subtle sharp-shadow hover:border-primary/20 transition-colors group">
          <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-primary text-[28px]">verified_user</span>
          </div>
          <div className="font-heading font-bold text-2xl text-on-surface">800+</div>
          <div className="text-xs text-on-surface-variant font-medium mt-0.5">Verified Owners</div>
        </div>

        <div className="bg-surface rounded-xl p-6 border-subtle sharp-shadow hover:border-primary/20 transition-colors group">
          <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-primary text-[28px]">location_city</span>
          </div>
          <div className="font-heading font-bold text-2xl text-on-surface">12</div>
          <div className="text-xs text-on-surface-variant font-medium mt-0.5">Cities</div>
        </div>

        <div className="bg-surface rounded-xl p-6 border-subtle sharp-shadow hover:border-primary/20 transition-colors group">
          <div className="flex items-center gap-1.5 mb-4">
            <span
              className="material-symbols-outlined text-[#FFBE0B] text-[26px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="font-heading font-bold text-2xl text-on-surface">4.8</span>
          </div>
          <div className="text-xs text-on-surface-variant font-medium mt-0.5">User Rating</div>
        </div>
      </section>

      {/* ─── Browse by Category ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-1">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-on-surface">Browse by Category</h2>
            <p className="text-xs md:text-sm text-on-surface-variant/70 max-w-md">
              Find the perfect living arrangement that suits your lifestyle and budget preferences.
            </p>
          </div>
          <Link
            to="/browse"
            className="text-primary font-semibold text-xs md:text-sm flex items-center gap-1.5 group hover:underline decoration-2 underline-offset-4"
          >
            <span>View all categories</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* PG */}
          <div
            onClick={() => navigate('/browse?room_type=single')}
            className="group bg-surface-container-low/40 p-8 rounded-2xl border-subtle hover:bg-surface-container-low hover:border-primary/20 hover-lift cursor-pointer text-center"
          >
            <div className="w-16 h-16 bg-surface rounded-full border-subtle flex items-center justify-center mx-auto mb-6 sharp-shadow group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-primary-container text-[30px]">bed</span>
            </div>
            <h3 className="font-heading font-bold text-lg text-on-surface mb-1">PG</h3>
            <p className="text-xs text-on-surface-variant/80">Fully managed stays</p>
          </div>

          {/* Flat */}
          <div
            onClick={() => navigate('/browse?room_type=apartment')}
            className="group bg-surface-container-low/40 p-8 rounded-2xl border-subtle hover:bg-surface-container-low hover:border-primary/20 hover-lift cursor-pointer text-center"
          >
            <div className="w-16 h-16 bg-surface rounded-full border-subtle flex items-center justify-center mx-auto mb-6 sharp-shadow group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-primary-container text-[30px]">domain</span>
            </div>
            <h3 className="font-heading font-bold text-lg text-on-surface mb-1">Flat</h3>
            <p className="text-xs text-on-surface-variant/80">Independent apartments</p>
          </div>

          {/* Hostel */}
          <div
            onClick={() => navigate('/browse?room_type=shared')}
            className="group bg-surface-container-low/40 p-8 rounded-2xl border-subtle hover:bg-surface-container-low hover:border-primary/20 hover-lift cursor-pointer text-center"
          >
            <div className="w-16 h-16 bg-surface rounded-full border-subtle flex items-center justify-center mx-auto mb-6 sharp-shadow group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-primary-container text-[30px]">corporate_fare</span>
            </div>
            <h3 className="font-heading font-bold text-lg text-on-surface mb-1">Hostel</h3>
            <p className="text-xs text-on-surface-variant/80">Social student living</p>
          </div>

          {/* Shared Room */}
          <div
            onClick={() => navigate('/browse?room_type=studio')}
            className="group bg-surface-container-low/40 p-8 rounded-2xl border-subtle hover:bg-surface-container-low hover:border-primary/20 hover-lift cursor-pointer text-center"
          >
            <div className="w-16 h-16 bg-surface rounded-full border-subtle flex items-center justify-center mx-auto mb-6 sharp-shadow group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-primary-container text-[30px]">group</span>
            </div>
            <h3 className="font-heading font-bold text-lg text-on-surface mb-1">Shared Room</h3>
            <p className="text-xs text-on-surface-variant/80">Budget friendly choice</p>
          </div>
        </div>
      </section>

      {/* ─── Featured Listings ─────────────────────────────────────────────────── */}
      <section className="bg-surface-container-lowest/50 py-20 px-4 sm:px-6 border-y border-outline-variant/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-on-surface">Featured Listings</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/browse')}
                className="w-11 h-11 rounded-full border-subtle flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all bg-surface"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/browse')}
                className="w-11 h-11 rounded-full border-subtle flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all bg-surface"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* If backend has listings, show them merged with the refined aesthetic */}
            {(apiListings.length > 0 ? apiListings.slice(0, 3) : curatedCards).map((item, idx) => {
              const displayImage =
                (item.images && item.images[0]) ||
                item.image_path ||
                item.image ||
                curatedCards[idx % curatedCards.length].image;

              const badge =
                idx === 0
                  ? { text: 'FEATURED', color: 'bg-[#FFBE0B] text-on-secondary-fixed' }
                  : idx === 1
                  ? { text: 'NEW', color: 'bg-primary text-white' }
                  : { text: 'POPULAR', color: 'bg-tertiary text-white' };

              const targetUrl = item._id ? `/property/${item._id}` : '/browse';

              return (
                <div
                  key={item._id || item.id || idx}
                  onClick={() => navigate(targetUrl)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(targetUrl);
                    }
                  }}
                  className="bg-surface rounded-2xl overflow-hidden border-subtle sharp-shadow hover-lift group flex flex-col justify-between cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
                    <img
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      src={displayImage}
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div
                      className={`absolute top-4 left-4 ${badge.color} font-bold text-[10px] tracking-widest px-3 py-1 rounded-full uppercase`}
                    >
                      {badge.text}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="absolute top-4 right-4 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-primary transition-colors hover:text-red-500 shadow-sm z-10"
                    >
                      <span className="material-symbols-outlined text-[20px]">favorite</span>
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1 flex-1 pr-2">
                        <h3 className="font-heading font-semibold text-lg text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="flex items-center gap-1.5 text-on-surface-variant/70 text-xs line-clamp-1">
                          <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                          {item.location}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-primary font-bold text-xl">
                          ₹{Number(item.price).toLocaleString('en-IN')}
                        </div>
                        <div className="text-on-surface-variant/60 text-[11px] font-medium uppercase tracking-wider">
                          Per Month
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/10">
                      {(item.amenities && item.amenities.length > 0
                        ? item.amenities.slice(0, 3)
                        : ['WiFi', 'AC', 'Furnished']
                      ).map((amenity, i) => {
                        const label = typeof amenity === 'object' ? amenity.label : amenity;
                        const icon =
                          label.toLowerCase().includes('wifi')
                            ? 'wifi'
                            : label.toLowerCase().includes('ac')
                            ? 'ac_unit'
                            : label.toLowerCase().includes('food')
                            ? 'local_dining'
                            : label.toLowerCase().includes('clean')
                            ? 'cleaning_services'
                            : label.toLowerCase().includes('gym')
                            ? 'fitness_center'
                            : label.toLowerCase().includes('sec')
                            ? 'security'
                            : 'chair';

                        return (
                          <span
                            key={i}
                            className="bg-surface-container-low border border-outline-variant/10 px-2.5 py-1 rounded-md text-on-secondary-container text-[12px] font-medium flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">{icon}</span>
                            <span>{label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16 space-y-2">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-on-surface">How It Works</h2>
          <p className="text-xs md:text-sm text-on-surface-variant/70 max-w-xl mx-auto">
            Your journey from searching to moving in, simplified into three easy steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] border-t-2 border-dotted border-primary/20 -z-10"></div>

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 bg-primary text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg relative group-hover:rotate-3 transition-transform">
              <span className="material-symbols-outlined text-[42px]">search</span>
              <div className="absolute -top-3 -right-3 w-9 h-9 bg-on-background text-white rounded-full flex items-center justify-center font-bold border-4 border-surface text-sm">
                1
              </div>
            </div>
            <h3 className="font-heading font-bold text-xl text-on-surface mb-2">Search</h3>
            <p className="text-xs md:text-sm text-on-surface-variant/80 max-w-[240px]">
              Filter by location, budget, and amenities to find your ideal home.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 bg-primary text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg relative group-hover:-rotate-3 transition-transform">
              <span className="material-symbols-outlined text-[42px]">fact_check</span>
              <div className="absolute -top-3 -right-3 w-9 h-9 bg-on-background text-white rounded-full flex items-center justify-center font-bold border-4 border-surface text-sm">
                2
              </div>
            </div>
            <h3 className="font-heading font-bold text-xl text-on-surface mb-2">Choose</h3>
            <p className="text-xs md:text-sm text-on-surface-variant/80 max-w-[240px]">
              Compare verified listings and select the one that feels like home.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 bg-primary text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg relative group-hover:rotate-3 transition-transform">
              <span className="material-symbols-outlined text-[42px]">chat</span>
              <div className="absolute -top-3 -right-3 w-9 h-9 bg-on-background text-white rounded-full flex items-center justify-center font-bold border-4 border-surface text-sm">
                3
              </div>
            </div>
            <h3 className="font-heading font-bold text-xl text-on-surface mb-2">Contact</h3>
            <p className="text-xs md:text-sm text-on-surface-variant/80 max-w-[240px]">
              Message owners directly and schedule a visit to finalize your stay.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ───────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-on-background rounded-3xl p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="text-center md:text-left relative z-10 space-y-2">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-surface">
              Are you a property owner?
            </h2>
            <p className="text-surface-variant/70 text-sm md:text-base">
              Reach thousands of students searching for a place to stay.
            </p>
          </div>

          <Link
            to={isAuthenticated ? (user?.role === 'owner' ? '/listing/new' : '/browse') : '/register'}
            className="bg-primary text-white font-bold px-10 py-5 rounded-xl hover:bg-white hover:text-on-background transition-all sharp-shadow-lg active:scale-95 relative z-10 whitespace-nowrap text-sm"
          >
            {isAuthenticated && user?.role === 'student' ? 'Find Your Room Today' : 'List Your Property Now'}
          </Link>

          {/* Decorative ambient blur */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
        </div>
      </section>
    </div>
  );
}
