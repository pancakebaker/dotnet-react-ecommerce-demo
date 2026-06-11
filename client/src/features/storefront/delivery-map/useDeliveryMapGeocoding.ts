import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { defaultCenter } from './deliveryMapConfig';
import type { LatLng } from './deliveryMapTypes';

type UseDeliveryMapGeocodingOptions = {
  address: string;
  geocodeDelayMs: number;
  isLoaded: boolean;
  onAddressChange: (address: string) => void;
};

export function useDeliveryMapGeocoding({
  address,
  geocodeDelayMs,
  isLoaded,
  onAddressChange
}: UseDeliveryMapGeocodingOptions) {
  const [pin, setPin] = useState<LatLng>(defaultCenter);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocodeStatus, setGeocodeStatus] = useState('');
  const suppressAddressGeocode = useRef(false);

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
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
    mapTypeControl: false,
    streetViewControl: false
  }), []);

  return {
    geocodeStatus,
    map,
    mapOptions,
    pin,
    setMap,
    updateFromLatLng
  };
}
