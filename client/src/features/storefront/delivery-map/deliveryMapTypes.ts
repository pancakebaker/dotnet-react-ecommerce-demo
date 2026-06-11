export type LatLng = {
  lat: number;
  lng: number;
};

export type DeliveryMapPickerProps = {
  address: string;
  onAddressChange: (address: string) => void;
  geocodeDelayMs?: number;
};
