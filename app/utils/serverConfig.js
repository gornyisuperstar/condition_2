import { Platform } from "react-native";

/**
 * ЛОКАЛЬНО:
 * - Android эмулятор → 10.0.2.2
 * - iOS симулятор → localhost
 * - Реальное устройство по Wi-Fi → замени на IP твоего ПК, например:
 *   http://192.168.0.15:5000
 */
export const SERVER_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

export async function api(path, options = {}) {
  const url = `${SERVER_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}
