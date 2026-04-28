#!/usr/bin/env node
'use strict';

const { parseTimestamp, formatAll, replaceUnixInLine } = require('../src/index');

const HELP = `timecheck — convert timestamps between unix, iso 8601, rfc 2822, human.

Usage:
  timecheck                          show now in every format (also reads stdin)
  timecheck "<timestamp>"            convert one timestamp
  timecheck --replace-unix < log     rewrite unix tokens to ISO in stdin lines
  timecheck --json "<timestamp>"     json output
  timecheck --tz America/New_York "<timestamp>"

Options:
  --json                  JSON output instead of human table.
  --tz <iana>             Show local time in this IANA zone (e.g. Europe/Berlin).
  --replace-unix          Filter mode: rewrite unix tokens (10 or 13 digits) in
                          stdin to ISO in stdout. No other output.
  -h, --help              Show this help.

Recognised inputs:
  unix seconds  — 1 706 482 800
  unix ms       — 1 706 482 800 123
  iso 8601      — 2026-04-28T10:14:32Z   2026-04-28 10:14:32+02:00
  rfc 2822      — Tue, 28 Apr 2026 10:14:32 GMT
  literal       — "now"

Exit codes:
  0  ok
  1  could not parse input
  2  invalid arguments

Examples:
  timecheck 1706482800
  timecheck "2026-04-28T10:14:32Z" --tz Asia/Jerusalem
  tail -f app.log | timecheck --replace-unix
  date +%s | timecheck --json | jq .iso_8601
`;

function parseArgs(argv) {
  const opts = { json: false, replaceUnix: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') { opts.help = true; continue; }
    if (a === '--json') { opts.json = true; continue; }
    if (a === '--replace-unix') { opts.replaceUnix = true; continue; }
    if (a === '--tz') { opts.tz = argv[++i]; continue; }
    if (a.startsWith('-')) { console.error('unknown option: ' + a); process.exit(2); }
    positional.push(a);
  }
  return { positional, opts };
}

const isTTY = process.stdout.isTTY;
const C = {
  reset: isTTY ? '\x1b[0m' : '',
  dim:   isTTY ? '\x1b[2m' : '',
  bold:  isTTY ? '\x1b[1m' : '',
  cya:   isTTY ? '\x1b[36m' : '',
  vio:   isTTY ? '\x1b[35m' : '',
};

function printHuman(input, formatted) {
  console.log(C.bold + 'input:' + C.reset + '   ' + (input || '(now)') +
    '  ' + C.dim + '(' + formatted.input_source + ')' + C.reset);
  console.log('iso:     ' + formatted.iso_8601);
  console.log('local:   ' + formatted.iso_local +
    (formatted.timezone_used !== 'UTC' ? '' : C.dim + '  (use --tz <name> for local)' + C.reset));
  console.log('unix s:  ' + formatted.unix_seconds);
  console.log('unix ms: ' + formatted.unix_ms);
  console.log('rfc:     ' + formatted.rfc_2822);
  console.log('rel:     ' + C.cya + formatted.relative + C.reset);
  console.log('day:     ' + formatted.weekday);
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => { data += c; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function streamReplaceUnix() {
  return new Promise((resolve, reject) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        process.stdout.write(replaceUnixInLine(line) + '\n');
      }
    });
    process.stdin.on('end', () => {
      if (buf.length) process.stdout.write(replaceUnixInLine(buf));
      resolve();
    });
    process.stdin.on('error', reject);
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const { positional, opts } = parseArgs(argv);

  if (opts.help) { process.stdout.write(HELP); process.exit(0); }

  if (opts.replaceUnix) {
    if (process.stdin.isTTY) {
      console.error('--replace-unix expects piped stdin (no tty)');
      process.exit(2);
    }
    await streamReplaceUnix();
    return;
  }

  let input;
  if (positional.length > 0) {
    input = positional.join(' ');
  } else {
    const piped = await readStdin();
    input = piped.trim() || 'now';
  }

  const parsed = parseTimestamp(input);
  if (!parsed) {
    console.error('could not parse: ' + JSON.stringify(input));
    process.exit(1);
  }

  const formatted = formatAll(parsed, { tz: opts.tz });
  if (opts.json) {
    process.stdout.write(JSON.stringify(formatted, null, 2) + '\n');
  } else {
    printHuman(input === 'now' ? null : input, formatted);
  }
}

main().catch(e => { console.error(e.stack || e.message); process.exit(2); });
