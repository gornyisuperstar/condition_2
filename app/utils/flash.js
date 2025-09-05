import AsyncStorage from "@react-native-async-storage/async-storage";

const FLASH_KEY = "issueRadar:flash";

export async function setFlash(payload) {
  try {
    await AsyncStorage.setItem(FLASH_KEY, JSON.stringify(payload || {}));
  } catch {}
}

export async function consumeFlash() {
  try {
    const raw = await AsyncStorage.getItem(FLASH_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(FLASH_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
