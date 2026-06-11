import { useEffect, useRef } from 'react';
import type { LatLng } from './deliveryMapTypes';

type AdvancedDeliveryMarkerProps = {
  map: google.maps.Map;
  onDragEnd: (location: LatLng) => void;
  position: LatLng;
};

export function AdvancedDeliveryMarker({ map, onDragEnd, position }: AdvancedDeliveryMarkerProps) {
  const marker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    let active = true;
    let dragListener: google.maps.MapsEventListener | undefined;

    async function createMarker() {
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
      if (!active) return;

      marker.current = new AdvancedMarkerElement({
        map,
        position,
        title: 'Delivery location',
        gmpDraggable: true
      });

      dragListener = marker.current.addListener('dragend', () => {
        const next = marker.current?.position;
        if (!next) return;

        if (next instanceof google.maps.LatLng) {
          onDragEnd({ lat: next.lat(), lng: next.lng() });
          return;
        }

        if (typeof next.lat === 'number' && typeof next.lng === 'number') {
          onDragEnd({ lat: next.lat, lng: next.lng });
        }
      });
    }

    void createMarker();

    return () => {
      active = false;
      dragListener?.remove();
      if (marker.current) {
        marker.current.map = null;
        marker.current = null;
      }
    };
  }, [map, onDragEnd]);

  useEffect(() => {
    if (marker.current) {
      marker.current.position = position;
    }
  }, [position]);

  return null;
}
