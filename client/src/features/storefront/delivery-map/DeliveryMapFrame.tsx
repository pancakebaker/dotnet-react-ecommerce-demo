import type { ReactNode } from 'react';
import type { LatLng } from './deliveryMapTypes';

export function DeliveryMapFrame({ pin, children }: { pin: LatLng; children: ReactNode }) {
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
