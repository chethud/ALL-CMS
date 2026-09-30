const VIDEO_ID = /^[\w-]{11}$/;

export function parseYouTubeId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (VIDEO_ID.test(trimmed)) return trimmed;

  let candidate = "";
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else {
      const fromPath = url.pathname.match(/\/(?:live|shorts|embed|v)\/([\w-]{11})/);
      candidate = fromPath?.[1] || url.searchParams.get("v") || "";
    }
  } catch {
    candidate = trimmed;
  }

  return VIDEO_ID.test(candidate) ? candidate : "";
}

export function watchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeFieldError(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!parseYouTubeId(trimmed)) {
    return "Use a YouTube watch link, youtu.be link, Shorts link, or an 11-character id.";
  }
  return null;
}

export function addGalleryVideo(existing: string[], raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return { ids: existing, error: "Paste a YouTube link first." };
  const id = parseYouTubeId(trimmed);
  if (!id) {
    return {
      ids: existing,
      error: "That link is not a YouTube video. Use a watch link, youtu.be, Shorts, or an 11-character id.",
    };
  }
  if (existing.includes(id)) {
    return { ids: existing, error: "That video is already in the gallery." };
  }
  return { ids: [...existing, id], error: null as string | null };
}
