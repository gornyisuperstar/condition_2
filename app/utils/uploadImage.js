// app/utils/uploadImage.js
export async function uploadImage(uri) {
  if (!uri) return null;

  let filename = uri.split("/").pop();
  let match = /\.(\w+)$/.exec(filename);
  let type = match ? `image/${match[1]}` : `image`;

  let formData = new FormData();
  formData.append("image", { uri, name: filename, type });

  const response = await fetch("http://10.0.2.2:5000/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.url;
}
