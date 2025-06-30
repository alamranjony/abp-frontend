import { TOMTOM_GEOCODE_API_BASE_URL, OPTIMIZATION_BASE_URL } from './constants';

export function generateTomTomGeocodeUrl(query: string, apiKey: string): string {
  return `${TOMTOM_GEOCODE_API_BASE_URL}${encodeURIComponent(query)}.json?key=${apiKey}`;
}

export function generateTomTomOptimizationUrl(wayPoints: string, apiKey: string): string {
  return `${OPTIMIZATION_BASE_URL}${wayPoints}/json?&travelMode=car&vehicleMaxSpeed=120&vehicleCommercial=true&key=${apiKey}`;
}

export interface DeliveryCoordinates {
  latitude: string;
  longitude: string;
  displayOrder: number;
  mapPin: string;
}
