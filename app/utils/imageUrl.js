import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";

const urlCache = new Map();

export async function normalizeImageUrl(url) {
  if (!url) return null;

  if (url.startsWith("http://localhost")) {
    return url.replace("localhost", "10.0.2.2");
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("gs://")) {
    if (urlCache.has(url)) return urlCache.get(url);
    try {
      const http = await getDownloadURL(ref(storage, url));
      urlCache.set(url, http);
      return http;
    } catch (e) {
      console.warn("Image load failed", e);
      return null;
    }
  }

  return null;
}
