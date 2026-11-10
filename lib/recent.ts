export type RecentShow = {
  imdbID: string;
  title: string;
  year: string;
};

const STORAGE_KEY = "heatseries:recent";
const MAX_RECENT = 8;
const listeners = new Set<() => void>();

export function subscribeRecent(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns the raw stored string so `useSyncExternalStore` gets a stable snapshot. */
export function getRecentSnapshot(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseRecent(raw: string | null): RecentShow[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter(
          (item): item is RecentShow =>
            typeof item?.imdbID === "string" && typeof item?.title === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function write(shows: RecentShow[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shows));
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

export function addRecent(show: RecentShow) {
  const others = parseRecent(getRecentSnapshot()).filter((item) => item.imdbID !== show.imdbID);
  write([show, ...others].slice(0, MAX_RECENT));
}

export function clearRecent() {
  write([]);
}
