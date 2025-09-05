const BASE_URL = "http://10.0.2.2:5000";

export async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  console.log("🌐 API call:", url, options);
  try {
    const res = await fetch(url, options);
    console.log("🌐 API response status:", res.status);
    return res;
  } catch (err) {
    console.error("🌐 API fetch error:", err);
    throw err;
  }
}
