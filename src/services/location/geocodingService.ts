import * as Location from 'expo-location';
import type { Coordinates, LocationAddress } from './locationTypes';

const geocodeCache = new Map<string, LocationAddress>();

export const geocodingService = {
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationAddress> {
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const cached = geocodeCache.get(cacheKey);
    if (cached) return cached;

    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const first = results[0];
    const address: LocationAddress = first
      ? {
          city: first.city || undefined,
          region: first.region || undefined,
          country: first.country || undefined,
          street: first.street || undefined,
          postalCode: first.postalCode || undefined,
          formattedAddress: formatAddress(first),
        }
      : { formattedAddress: 'Unknown location' };

    geocodeCache.set(cacheKey, address);
    return address;
  },

  async getCity(coordinates: Coordinates): Promise<string | undefined> {
    const address = await this.reverseGeocode(coordinates.latitude, coordinates.longitude);
    return address.city;
  },

  formatPlace(address: Partial<LocationAddress>): string {
    return [address.city, address.region, address.country].filter(Boolean).join(', ') || 'Unknown location';
  },

  clearCache(): void {
    geocodeCache.clear();
  },
};

function formatAddress(address: Location.LocationGeocodedAddress): string {
  const street = [address.streetNumber, address.street].filter(Boolean).join(' ');
  return [street, address.city, address.region, address.country].filter(Boolean).join(', ') || 'Unknown location';
}
