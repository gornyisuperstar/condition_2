// app/lib/uploadImage.js
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../../firebase";

/** Определяем contentType по расширению/подсказке */
function resolveMime(extOrMime) {
  const v = (extOrMime || "").toLowerCase();
  if (v.startsWith("image/")) return v;
  if (v === "png") return "image/png";
  if (v === "webp") return "image/webp";
  if (v === "heic" || v === "heif") return "image/heic";
  // по умолчанию
  return "image/jpeg";
}

/**
 * Надёжная загрузка в Firebase Storage (Expo-friendly).
 * Принимает raw base64 (БЕЗ префикса data:) и MIME/расширение.
 * Возвращает https downloadURL.
 */
export async function uploadImageFromBase64(base64, extOrMime = "jpg") {
  if (!base64) return null;

  const contentType = resolveMime(extOrMime);
  const uid = auth.currentUser?.uid ?? "anonymous";
  const fileExt = contentType === "image/png" ? "png"
               : contentType === "image/webp" ? "webp"
               : contentType === "image/heic" ? "heic"
               : "jpg";

  const filename = `${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, `tickets/${uid}/${filename}`);

  // грузим как base64 — НИКАКИХ Blob/ArrayBuffer
  await uploadString(storageRef, base64, "base64", { contentType });

  return await getDownloadURL(storageRef);
}
