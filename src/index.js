// timecheck — convert timestamps between unix seconds, unix ms,
// ISO 8601, RFC 2822, and human-readable. Auto-detects input format
// so you can just pipe a log line in. Zero runtime dependencies.

'use strict';

const UNIT_NAMES = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];
const UNIT_MS    = [365 * 86400000, 30 * 86400000, 7 * 86400000, 86400000, 3600000, 60000, 1000];

function parseTimestamp(input) {
  if (input === null || input === undefined) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : { date: input, source: 'date_object' };
  }

  if (typeof input === 'number') {
    return parseNumeric(input);
  }

  const s = String(input).trim();
  if (!s) return null;

  if (s === 'now') return { date: new Date(), source: 'now' };

  if (/^-?\d+(\.\d+)?$/.test(s)) {
    return parseNumeric(parseFloat(s));
  }

  // Try native Date constructor (handles ISO 8601, RFC 2822, many locales)
  const native = new Date(s);
  if (!isNaN(native.getTime())) {
    let source = 'iso_8601';
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(s)) source = 'iso_8601';
    else if (/^[A-Za-z]{3},\s*\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(s)) source = 'rfc_2822';
    else source = 'native_parsed';
    return { date: native, source };
  }

  return null;
}

function parseNumeric(n) {
  if (!isFinite(n)) return null;
  // Heuristic: numbers >= 1e12 are probably ms (≥ year 2001-09 in ms),
  // smaller = seconds.
  if (Math.abs(n) >= 1e12) {
    const d = new Date(n);
    if (isNaN(d.getTime())) return null;
    return { date: d, source: 'unix_ms' };
  }
  const d = new Date(n * 1000);
  if (isNaN(d.getTime())) return null;
  return { date: d, source: 'unix_seconds' };
}

function relativeTime(date, now) {
  const ms = date.getTime() - now.getTime();
  const abs = Math.abs(ms);
  if (abs < 1000) return 'just now';
  for (let i = 0; i < UNIT_MS.length; i++) {
    if (abs >= UNIT_MS[i]) {
      const v = Math.round(abs / UNIT_MS[i]);
      const unit = UNIT_NAMES[i] + (v === 1 ? '' : 's');
      return ms < 0 ? v + ' ' + unit + ' ago' : 'in ' + v + ' ' + unit;
    }
  }
  return 'just now';
}

function formatAll(parsed, opts) {
  opts = opts || {};
  const now = opts.now || new Date();
  const date = parsed.date;
  const ms = date.getTime();
  return {
    input_source: parsed.source,
    iso_8601: date.toISOString(),
    iso_local: localIsoLike(date, opts.tz || null),
    unix_seconds: Math.floor(ms / 1000),
    unix_ms: ms,
    rfc_2822: date.toUTCString(),
    relative: relativeTime(date, now),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
    timezone_used: opts.tz || 'UTC',
  };
}

function localIsoLike(date, tz) {
  if (!tz) return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
  try {
    const fmt = new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: tz,
    });
    const out = fmt.format(date);
    return out + ' ' + tz;
  } catch (_) {
    return date.toISOString();
  }
}

// Process a single line — when in --replace-unix mode, find unix
// seconds-or-ms tokens and substitute their ISO equivalent in place.
const UNIX_TOKEN_RE = /\b(\d{10}(?:\.\d+)?|\d{13})\b/g;

function replaceUnixInLine(line) {
  return line.replace(UNIX_TOKEN_RE, (m) => {
    const parsed = parseNumeric(parseFloat(m));
    if (!parsed) return m;
    return parsed.date.toISOString();
  });
}

module.exports = {
  parseTimestamp,
  formatAll,
  relativeTime,
  replaceUnixInLine,
};
