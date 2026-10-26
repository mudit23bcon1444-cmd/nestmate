import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { IndianRupee, MapPin, Eye } from 'lucide-react';

// Custom Map Marker using HTML/Tailwind
const createCustomIcon = (price, isSelected = false) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-xs shadow-md transition-all duration-200 ${
        isSelected
          ? 'bg-primary text-white scale-110 ring-2 ring-white ring-offset-2'
          : 'bg-surface-container text-on-surface hover:bg-primary hover:text-white border border-outline'
      }">
        <span class="font-bold">₹${Number(price).toLocaleString('en-IN')}</span>
      </div>
    `,
    iconSize: [60, 28],
    iconAnchor: [30, 14],
    popupAnchor: [0, -14],
  });
};

// Component to dynamically fit bounds or pan to selected coordinates
function ChangeView({ bounds, center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (center) {
      map.setView(center, zoom || 13);
    }
  }, [bounds, center, zoom, map]);
  return null;
}

export default function PropertyMap({
  listings = [],
  selectedId = null,
  onMarkerClick = null,
  center = [28.6139, 77.2090], // Default: Delhi NCR
  zoom = 12,
  className = 'h-[500px] w-full rounded-2xl overflow-hidden shadow-card border border-outline',
}) {
  // Filter valid coordinates
  const validListings = listings.filter(
    (l) =>
      l.location_geo &&
      Array.isArray(l.location_geo.coordinates) &&
      l.location_geo.coordinates.length === 2 &&
      !isNaN(l.location_geo.coordinates[0]) &&
      !isNaN(l.location_geo.coordinates[1])
  );

  const bounds =
    validListings.length > 0
      ? validListings.map((l) => [l.location_geo.coordinates[1], l.location_geo.coordinates[0]])
      : null;

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ChangeView bounds={bounds} center={bounds ? null : center} zoom={zoom} />

        {validListings.map((listing) => {
          const lat = listing.location_geo.coordinates[1];
          const lng = listing.location_geo.coordinates[0];
          const isSelected = selectedId === listing._id;
          const icon = createCustomIcon(listing.price, isSelected);

          const displayImage =
            (listing.images && listing.images[0]) ||
            listing.image_url ||
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80';

          return (
            <Marker
              key={listing._id}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(listing._id),
              }}
            >
              <Popup className="custom-popup" maxWidth={260}>
                <div className="overflow-hidden rounded-xl font-body">
                  <div className="relative h-32 w-full overflow-hidden bg-surface-container">
                    <img
                      src={displayImage}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white capitalize backdrop-blur-xs">
                      {listing.room_type || 'Room'}
                    </div>
                  </div>

                  <div className="p-3">
                    <h4 className="font-heading font-semibold text-sm text-on-surface line-clamp-1 mb-1">
                      {listing.title}
                    </h4>
                    <p className="flex items-center gap-1 text-xs text-on-surface-variant line-clamp-1 mb-2">
                      <MapPin className="h-3 w-3 shrink-0 text-primary" />
                      {listing.location}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-outline">
                      <div className="flex items-baseline text-primary font-bold text-sm">
                        <IndianRupee className="h-3 w-3" />
                        <span>{Number(listing.price).toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-on-surface-variant font-normal">/mo</span>
                      </div>

                      <Link
                        to={`/property/${listing._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
