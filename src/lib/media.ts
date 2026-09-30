export function resolveMediaUrl(url: string, domain: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/") && domain) return `https://${domain}${url}`;
  return url;
}

export function storagePathFromPublicUrl(url: string) {
  const marker = "/storage/v1/object/public/cms-media/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0] ?? "");
}

export function fileLabel(url: string) {
  try {
    const path = new URL(url, "https://placeholder.local").pathname;
    return decodeURIComponent(path.split("/").filter(Boolean).pop() || url);
  } catch {
    return url;
  }
}
