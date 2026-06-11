import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { AdvancedDeliveryMarker } from './delivery-map/AdvancedDeliveryMarker';
import { defaultCenter, googleMapsLibraries, mapContainerStyle } from './delivery-map/deliveryMapConfig';
import type { DeliveryMapPickerProps } from './delivery-map/deliveryMapTypes';
import { DeliveryMapFrame } from './delivery-map/DeliveryMapFrame';
import { GoogleMapsLoadError, GoogleMapsLoadingState, MissingGoogleMapsKeyNotice, ScreenshotDeliveryMap } from './delivery-map/DeliveryMapFallbacks';
import { useDeliveryMapGeocoding } from './delivery-map/useDeliveryMapGeocoding';

declare global {
  interface Window {
    __ECOMMERCE_DEMO_SCREENSHOTS__?: boolean;
  }
}

export function DeliveryMapPicker({ address, onAddressChange, geocodeDelayMs = 700 }: DeliveryMapPickerProps) {
  if (window.__ECOMMERCE_DEMO_SCREENSHOTS__) {
    return <ScreenshotDeliveryMap />;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return <MissingGoogleMapsKeyNotice />;
  }

  return (
    <InteractiveDeliveryMapPicker
      address={address}
      apiKey={apiKey}
      geocodeDelayMs={geocodeDelayMs}
      onAddressChange={onAddressChange}
    />
  );
}

function InteractiveDeliveryMapPicker({
  address,
  apiKey,
  geocodeDelayMs,
  onAddressChange
}: DeliveryMapPickerProps & { apiKey: string; geocodeDelayMs: number }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: apiKey,
    libraries: googleMapsLibraries
  });
  const {
    geocodeStatus,
    map,
    mapOptions,
    pin,
    setMap,
    updateFromLatLng
  } = useDeliveryMapGeocoding({
    address,
    geocodeDelayMs,
    isLoaded,
    onAddressChange
  });

  return (
    <DeliveryMapFrame pin={loadError ? defaultCenter : pin}>
      {loadError && <GoogleMapsLoadError />}

      {!loadError && !isLoaded && <GoogleMapsLoadingState />}

      {!loadError && isLoaded && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={pin}
          zoom={15}
          onClick={event => {
            const next = event.latLng;
            if (next) void updateFromLatLng({ lat: next.lat(), lng: next.lng() });
          }}
          onLoad={setMap}
          onUnmount={() => setMap(null)}
          options={mapOptions}
        >
          {map && (
            <AdvancedDeliveryMarker
              map={map}
              onDragEnd={updateFromLatLng}
              position={pin}
            />
          )}
        </GoogleMap>
      )}

      {geocodeStatus && <p className="border-t border-line p-3 text-xs text-amber-800">{geocodeStatus}</p>}
    </DeliveryMapFrame>
  );
}
