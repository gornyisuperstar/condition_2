// app/utils/flash.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const FLASH_KEY = "issueRadar:flash";

/**
 * Сохранить одноразовое сообщение и целевой экран.
 * Пример: { target: "Registration", message: "Your account has been deleted." }
 */
export async function setFlash(payload) {
  try {
    await AsyncStorage.setItem(FLASH_KEY, JSON.stringify(payload || {}));
  } catch {}
}

/** Прочитать и тут же удалить одноразовое сообщение */
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
