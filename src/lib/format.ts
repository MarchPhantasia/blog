const zhDate = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const zhDateShort = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatDate(d: Date): string {
  return zhDate.format(d);
}

export function formatDateShort(d: Date): string {
  return zhDateShort.format(d).replaceAll('/', '-');
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function yearOf(d: Date): number {
  return d.getFullYear();
}
