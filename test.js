/* timecheck — smoke tests. Run via: node test.js */
'use strict';

const { parseTimestamp, formatAll, relativeTime, replaceUnixInLine } = require('./src/index');

let passed = 0, failed = 0;
function eq(label, a, b) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log('  ok  ' + label); passed++; }
  else { console.log('  FAIL ' + label); console.log('     actual:   ' + JSON.stringify(a)); console.log('     expected: ' + JSON.stringify(b)); failed++; }
}
function truthy(label, v) { if (v) { console.log('  ok  ' + label); passed++; } else { console.log('  FAIL ' + label); failed++; } }

console.log('parseTimestamp:');
truthy('null returns null',           parseTimestamp(null) === null);
truthy('empty string returns null',   parseTimestamp('') === null);
truthy('"now" parses',                 parseTimestamp('now') !== null);
eq('unix seconds source',             parseTimestamp('1706482800').source, 'unix_seconds');
eq('unix ms source',                  parseTimestamp('1706482800123').source, 'unix_ms');
eq('iso 8601 source',                  parseTimestamp('2026-04-28T10:14:32Z').source, 'iso_8601');
eq('iso w/space source',               parseTimestamp('2026-04-28 10:14:32').source, 'iso_8601');
eq('rfc 2822 source',                  parseTimestamp('Tue, 28 Apr 2026 10:14:32 GMT').source, 'rfc_2822');
truthy('garbage returns null',         parseTimestamp('not a date at all xx') === null);

console.log('\nunix conversion roundtrip:');
{
  const p = parseTimestamp('1706482800');
  truthy('seconds → date',          p && p.date instanceof Date);
  eq('unix s exact',                p.date.getTime() / 1000, 1706482800);
}
{
  const p = parseTimestamp(1706482800123);
  eq('ms exact',                    p.date.getTime(), 1706482800123);
}

console.log('\nformatAll:');
{
  const p = parseTimestamp('2026-04-28T10:14:32Z');
  const f = formatAll(p, { now: new Date('2026-04-28T11:14:32Z') });
  eq('iso_8601',                    f.iso_8601, '2026-04-28T10:14:32.000Z');
  eq('unix_seconds',                f.unix_seconds, 1777371272);
  eq('unix_ms',                     f.unix_ms, 1777371272000);
  truthy('relative includes "ago"', f.relative.includes('ago'));
  eq('input_source preserved',      f.input_source, 'iso_8601');
  truthy('rfc_2822 has GMT',        f.rfc_2822.includes('GMT'));
}

console.log('\nformatAll with --tz:');
{
  const p = parseTimestamp('2026-04-28T10:00:00Z');
  const f = formatAll(p, { tz: 'Asia/Jerusalem' });
  eq('timezone_used',               f.timezone_used, 'Asia/Jerusalem');
  truthy('iso_local has tz suffix', f.iso_local.includes('Asia/Jerusalem'));
}

console.log('\nrelativeTime:');
{
  const now = new Date('2026-04-28T12:00:00Z');
  eq('+1 minute',  relativeTime(new Date('2026-04-28T12:01:00Z'), now), 'in 1 minute');
  eq('+5 minutes', relativeTime(new Date('2026-04-28T12:05:00Z'), now), 'in 5 minutes');
  eq('-1 hour',    relativeTime(new Date('2026-04-28T11:00:00Z'), now), '1 hour ago');
  eq('-2 days',    relativeTime(new Date('2026-04-26T12:00:00Z'), now), '2 days ago');
  eq('just now',   relativeTime(new Date('2026-04-28T12:00:00.500Z'), now), 'just now');
}

console.log('\nreplaceUnixInLine:');
eq('replaces 10-digit ts',
   replaceUnixInLine('[1706482800] error: bad input'),
   '[2024-01-28T23:00:00.000Z] error: bad input');
eq('replaces 13-digit ts',
   replaceUnixInLine('event ms=1706482800000 user=alice'),
   'event ms=2024-01-28T23:00:00.000Z user=alice');
eq('multiple per line',
   replaceUnixInLine('1706482800 → 1706486400'),
   '2024-01-28T23:00:00.000Z → 2024-01-29T00:00:00.000Z');
eq('non-timestamp digits ignored',
   replaceUnixInLine('user-id=42 size=1024'),
   'user-id=42 size=1024');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
