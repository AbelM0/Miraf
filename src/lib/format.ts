export function formatRelativeDate(value: string | undefined) {
  if (!value) return "Not opened yet";
  const date = new Date(value);
  const delta = Date.now() - date.getTime();
  const day = 86_400_000;
  if (delta < day && date.getDate() === new Date().getDate()) return "Today";
  if (delta < day * 2) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

export function clampProgress(value: number) {
  return Math.min(100, Math.max(0, value));
}

