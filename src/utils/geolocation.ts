/**
 * GPS Location Utility
 * Uses Capacitor Geolocation on native, falls back to browser Geolocation API.
 */

import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface GeoLocation {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
}

/**
 * Get current GPS position. Returns null if denied/unavailable.
 */
export async function getCurrentLocation(): Promise<GeoLocation | null> {
    try {
        if (Capacitor.isNativePlatform()) {
            // Native: use Capacitor geolocation
            const perms = await Geolocation.checkPermissions();
            if (perms.location !== 'granted') {
                const req = await Geolocation.requestPermissions();
                if (req.location !== 'granted') return null;
            }
            const pos = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 15000,
            });
            return {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                timestamp: pos.timestamp,
            };
        } else {
            // Web fallback
            return await new Promise<GeoLocation | null>((resolve) => {
                if (!navigator.geolocation) {
                    resolve(null);
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        resolve({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            accuracy: pos.coords.accuracy,
                            timestamp: pos.timestamp,
                        });
                    },
                    () => resolve(null),
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
                );
            });
        }
    } catch {
        console.warn('GPS not available');
        return null;
    }
}

/**
 * Format a GPS coordinate to a human-readable string.
 */
export function formatCoordinate(loc: GeoLocation | null): string {
    if (!loc) return 'Tidak tersedia';
    return `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
}

/**
 * Format accuracy in meters.
 */
export function formatAccuracy(loc: GeoLocation | null): string {
    if (!loc) return '-';
    if (loc.accuracy < 10) return `±${loc.accuracy.toFixed(0)}m (Tinggi)`;
    if (loc.accuracy < 50) return `±${loc.accuracy.toFixed(0)}m (Sedang)`;
    return `±${loc.accuracy.toFixed(0)}m (Rendah)`;
}
