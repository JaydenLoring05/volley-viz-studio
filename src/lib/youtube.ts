const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Pulls the 11-character video id out of any YouTube link shape. */
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  const guess = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(guess);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const allowed = new Set([
    "youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "gaming.youtube.com",
    "youtube-nocookie.com",
    "youtu.be",
  ]);
  if (!allowed.has(host)) return null;

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return ID_RE.test(id) ? id : null;
  }

  const query = url.searchParams.get("v") ?? "";
  if (ID_RE.test(query)) return query;

  const path = url.pathname.match(/\/(shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/);
  if (path?.[2]) return path[2];

  return null;
}
