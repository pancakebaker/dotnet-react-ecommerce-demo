import { defaultCenter } from './deliveryMapConfig';
import { DeliveryMapFrame } from './DeliveryMapFrame';

export function ScreenshotDeliveryMap() {
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

export function MissingGoogleMapsKeyNotice() {
  return (
    <DeliveryMapFrame pin={defaultCenter}>
      <div className="m-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
        Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to <code>client/.env</code> and restart Vite to enable the delivery pin map.
      </div>
    </DeliveryMapFrame>
  );
}

export function GoogleMapsLoadError() {
  return (
    <div className="m-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700" role="alert">
      Google Maps could not load. Check the API key, billing, and domain restrictions.
    </div>
  );
}

export function GoogleMapsLoadingState() {
  return <div className="p-4 text-sm text-slate-500">Loading map...</div>;
}
