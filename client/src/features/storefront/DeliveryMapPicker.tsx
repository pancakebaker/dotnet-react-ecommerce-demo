import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';

type LatLng = {
  lat: number;
  lng: number;
};

declare global {
  interface Window {
    __ECOMMERCE_DEMO_SCREENSHOTS__?: boolean;
  }
}

type DeliveryMapPickerProps = {
  address: string;
  onAddressChange: (address: string) => void;
  geocodeDelayMs?: number;
};

const mapContainerStyle = { width: '100%', height: '320px' };
const defaultCenter: LatLng = { lat: 14.5995, lng: 120.9842 };

export function DeliveryMapPicker({ address, onAddressChange, geocodeDelayMs = 700 }: DeliveryMapPickerProps) {
  if (window.__ECOMMERCE_DEMO_SCREENSHOTS__) {
    return (
      <DeliveryMapFrame pin={defaultCenter}>
        <div className="relative h-[320px] bg-teal-50">
          <div className="absolute left-1/2 top-16 -translate-x-1/2 text-center text-sm font-semibold text-brand">
            <div className="mx-auto mb-2 h-5 w-5 rounded-full border-4 border-white bg-brand shadow-md" />
            Google Maps delivery pin
          </div>
        </div>
      </DeliveryMapFrame>
    );
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [pin, setPin] = useState<LatLng>(defaultCenter);
  const [geocodeStatus, setGeocodeStatus] = useState('');
  const suppressAddressGeocode = useRef(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: apiKey || ''
  });

  const geocodeAddress = useCallback(async (nextAddress: string) => {
    if (!isLoaded || !nextAddress.trim()) return;

    try {
      const geocoder = new window.google.maps.Geocoder();
      const { results } = await geocoder.geocode({ address: nextAddress });
      const location = results[0]?.geometry.location;

      if (location) {
        setPin({ lat: location.lat(), lng: location.lng() });
        setGeocodeStatus('');
      }
    } catch {
      setGeocodeStatus('Address could not be located yet. Add more detail or move the map pin.');
    }
  }, [isLoaded]);

  const updateFromLatLng = useCallback(async (location: LatLng) => {
    setPin(location);
    setGeocodeStatus('');

    if (!isLoaded) return;

    try {
      const geocoder = new window.google.maps.Geocoder();
      const { results } = await geocoder.geocode({ location });
      const formattedAddress = results[0]?.formatted_address;

      if (formattedAddress) {
        suppressAddressGeocode.current = true;
        onAddressChange(formattedAddress);
      }
    } catch {
      setGeocodeStatus('Pin moved, but the address could not be updated automatically.');
    }
  }, [isLoaded, onAddressChange]);

  useEffect(() => {
    if (!isLoaded || !address.trim()) return;

    if (suppressAddressGeocode.current) {
      suppressAddressGeocode.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      void geocodeAddress(address);
    }, geocodeDelayMs);

    return () => window.clearTimeout(timeout);
  }, [address, geocodeAddress, geocodeDelayMs, isLoaded]);

  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    fullscreenControl: true,
    mapTypeControl: false,
    streetViewControl: false
  }), []);

  if (!apiKey) {
    return (
      <section className="rounded-md border border-line bg-white" aria-labelledby="delivery-map-title">
        <MapHeader pin={defaultCenter} />
        <div className="m-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to <code>client/.env</code> and restart Vite to enable the delivery pin map.
        </div>
      </section>
    );
  }

  return (
    <DeliveryMapFrame pin={pin}>
      {loadError && (
        <div className="m-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700" role="alert">
          Google Maps could not load. Check the API key, billing, and domain restrictions.
        </div>
      )}

      {!loadError && !isLoaded && <div className="p-4 text-sm text-slate-500">Loading map...</div>}

      {!loadError && isLoaded && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={pin}
          zoom={15}
          onClick={event => {
            const next = event.latLng;
            if (next) void updateFromLatLng({ lat: next.lat(), lng: next.lng() });
          }}
          options={mapOptions}
        >
          <MarkerF
            position={pin}
            draggable
            onDragEnd={event => {
              const next = event.latLng;
              if (next) void updateFromLatLng({ lat: next.lat(), lng: next.lng() });
            }}
          />
        </GoogleMap>
      )}

      {geocodeStatus && <p className="border-t border-line p-3 text-xs text-amber-800">{geocodeStatus}</p>}
    </DeliveryMapFrame>
  );
}

function DeliveryMapFrame({ pin, children }: { pin: LatLng; children: ReactNode }) {
  return (
    <section className="rounded-md border border-line bg-white" aria-labelledby="delivery-map-title">
      <MapHeader pin={pin} />
      {children}
    </section>
  );
}

function MapHeader({ pin }: { pin: LatLng }) {
  return (
    <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 id="delivery-map-title" className="text-sm font-semibold">Delivery pin</h2>
        <p className="mt-1 text-xs text-slate-500">Move the pin to fill the address, or edit the address to move the pin.</p>
      </div>
      <p className="font-mono text-xs text-slate-500">
        {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
      </p>
    </div>
  );
}
