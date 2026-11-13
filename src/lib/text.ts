import type { Status } from '../types';

/**
 * Normalises text for diacritics-insensitive search:
 * "Cầu Giấy" -> "cau giay", "Đống Đa" -> "dong da", "Shin-Ōkubo" -> "shin okubo".
 */
export function normalize(s: string | undefined | null): string {
  if (!s) return '';
  return s
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[øØ]/g, 'o')
    .replace(/[łŁ]/g, 'l')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Same as normalize but with no spaces, so "caugiay" or "cau-giay" also match. */
export function compact(s: string | undefined | null): string {
  return normalize(s).replace(/\s+/g, '');
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]): number {
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** Black or white text, whichever contrasts more with the given background. */
export function contrastText(bg: string): string {
  const rgb = hexToRgb(bg);
  if (!rgb) return '#ffffff';
  const l = luminance(rgb);
  const withWhite = 1.05 / (l + 0.05);
  const withBlack = (l + 0.05) / 0.05;
  return withBlack > withWhite ? '#111111' : '#ffffff';
}

/** Safe CSS color for a data-provided hex (falls back to grey). */
export function safeColor(c: string | undefined): string {
  return c && hexToRgb(c) ? c : '#888888';
}

export const STATUS_LABEL: Record<Status, string> = {
  operating: 'Operating',
  construction: 'Under construction',
  approved: 'Approved',
  planned: 'Planned',
  proposed: 'Proposed',
};

export const STATUS_SHORT: Record<Status, string> = {
  operating: 'Operating',
  construction: 'Construction',
  approved: 'Approved',
  planned: 'Planned',
  proposed: 'Proposed',
};

export const STATUS_HINT: Record<Status, string> = {
  operating: 'In revenue service today',
  construction: 'Physically under construction',
  approved: 'Investment approved or funded, not yet under construction',
  planned: 'In an official master plan, not yet approved',
  proposed: 'Studies, concepts and long-range vision',
};

export function formatKm(km: number): string {
  if (!Number.isFinite(km)) return '–';
  if (km >= 100) return Math.round(km).toLocaleString('en-US');
  return km.toFixed(1);
}

const CJK = /[぀-ヿ㐀-䶿一-鿿가-힯ｦ-ﾟ]/;
export function hasCJK(s: string | undefined): boolean {
  return !!s && CJK.test(s);
}

type Named = { name: string; nameLocal?: string };

/** The name shown first everywhere: the local-language name (Cầu Giấy, 新宿) when there is one. */
export function primaryName(x: Named): string {
  return x.nameLocal?.trim() || x.name;
}

/** The English / romanised name, shown as the secondary name in detail cards (undefined if same). */
export function secondaryName(x: Named): string | undefined {
  const local = x.nameLocal?.trim();
  return local && local !== x.name ? x.name : undefined;
}

/**
 * Map label: the local name. Non-Latin scripts (Japanese, Korean, Chinese) also get the romanised
 * name on a second line, since most viewers can't read them; Latin-script names (Vietnamese) don't.
 */
export function mapLabel(x: Named): string {
  const second = secondaryName(x);
  return second && hasCJK(x.nameLocal) ? `${primaryName(x)}\n${second}` : primaryName(x);
}
