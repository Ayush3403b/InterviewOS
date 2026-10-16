import { useCallback, useState } from "react";

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type GeolocationStatus =
  | "idle"
  | "fetching"
  | "resolved"
  | "denied"
  | "unavailable"
  | "error";

export interface UseGeolocationResult {
  status: GeolocationStatus;
  coords: GeolocationCoords | null;
  fetchLocation: () => Promise<GeolocationCoords | null>;
}

/**
 * One-shot device geolocation - candidates typically only need this
 * captured once at interview start, not polled continuously, so
 * this exposes an explicit `fetchLocation()` action rather than
 * watching position changes.
 */
export function useGeolocation(): UseGeolocationResult {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [coords, setCoords] = useState<GeolocationCoords | null>(null);

  const fetchLocation =
    useCallback(async (): Promise<GeolocationCoords | null> => {
      if (!navigator.geolocation) {
        setStatus("unavailable");
        return null;
      }

      setStatus("fetching");

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const next: GeolocationCoords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };
            setCoords(next);
            setStatus("resolved");
            resolve(next);
          },
          (error) => {
            setStatus(
              error.code === error.PERMISSION_DENIED ? "denied" : "error"
            );
            resolve(null);
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      });
    }, []);

  return { status, coords, fetchLocation };
}
