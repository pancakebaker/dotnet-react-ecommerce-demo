import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeliveryMapPicker } from './DeliveryMapPicker';

vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children, onClick }: { children: ReactNode; onClick: (event: { latLng: { lat: () => number; lng: () => number } }) => void }) => (
    <div data-testid="google-map">
      <button type="button" onClick={() => onClick({ latLng: { lat: () => 10.123456, lng: () => 20.654321 } })}>
        Move map pin
      </button>
      {children}
    </div>
  ),
  MarkerF: ({ onDragEnd }: { onDragEnd: (event: { latLng: { lat: () => number; lng: () => number } }) => void }) => (
    <button type="button" onClick={() => onDragEnd({ latLng: { lat: () => 11.123456, lng: () => 21.654321 } })}>
      Drag marker
    </button>
  ),
  useJsApiLoader: () => ({ isLoaded: true, loadError: null })
}));

describe('DeliveryMapPicker', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
    Object.defineProperty(window, 'google', {
      configurable: true,
      value: {
        maps: {
          Geocoder: vi.fn(() => ({
            geocode: vi.fn((request: { address?: string; location?: { lat: number; lng: number } }) => {
              if (request.location) {
                return Promise.resolve({
                  results: [{ formatted_address: `Pinned ${request.location.lat}, ${request.location.lng}` }]
                });
              }

              return Promise.resolve({
                results: [{
                  geometry: {
                    location: {
                      lat: () => 12.345678,
                      lng: () => 98.765432
                    }
                  }
                }]
              });
            })
          }))
        }
      }
    });
  });

  it('shows setup guidance when the Google Maps API key is missing', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');

    render(<DeliveryMapPicker address="" onAddressChange={() => undefined} />);

    expect(screen.getByText(/VITE_GOOGLE_MAPS_API_KEY/i)).toBeInTheDocument();
  });

  it('moves the pin when the address changes', async () => {
    const { rerender } = render(<DeliveryMapPicker address="" onAddressChange={() => undefined} geocodeDelayMs={0} />);
    rerender(<DeliveryMapPicker address="Manila City Hall" onAddressChange={() => undefined} geocodeDelayMs={0} />);

    await waitFor(() => {
      expect(screen.getByText('12.345678, 98.765432')).toBeInTheDocument();
    });
  });

  it('updates the address when the pin is moved', async () => {
    const handleAddressChange = vi.fn();

    render(<DeliveryMapPicker address="" onAddressChange={handleAddressChange} />);

    fireEvent.click(screen.getByRole('button', { name: /move map pin/i }));

    await waitFor(() => {
      expect(handleAddressChange).toHaveBeenCalledWith('Pinned 10.123456, 20.654321');
    });
  });
});
