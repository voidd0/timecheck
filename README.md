# timecheck

Convert a unix timestamp, an ISO 8601 date or an RFC 2822 date to every other format, in any IANA time zone. It can also rewrite unix timestamps in a log stream, so you can read them.

[![npm](https://img.shields.io/npm/v/@v0idd0/timecheck?color=00f6d0&labelColor=050914)](https://www.npmjs.com/package/@v0idd0/timecheck)
[![test](https://github.com/voidd0/timecheck/actions/workflows/test.yml/badge.svg)](https://github.com/voidd0/timecheck/actions/workflows/test.yml)
[![license](https://img.shields.io/badge/license-MIT-00f6d0?labelColor=050914)](LICENSE)

## Install

```bash
npm install -g @v0idd0/timecheck
```

Or run it once without installing: `npx @v0idd0/timecheck --help`. Needs Node.js 18 or newer. No dependencies.

## Example

Convert one timestamp to every format. Output from a real run on 2026-11-26 (the "rel" line depends on the day you run it):

```console
$ timecheck 1706482800 --tz Asia/Jerusalem
input:   1706482800  (unix_seconds)
iso:     2024-01-28T23:00:00.000Z
local:   2024-01-29 01:00:00 Asia/Jerusalem
unix s:  1706482800
unix ms: 1706482800000
rfc:     Sun, 28 Jan 2024 23:00:00 GMT
rel:     3 years ago
day:     Sunday
```

The input format is detected, no flag needed:

```console
$ timecheck "Tue, 28 Apr 2026 10:14:32 GMT"
input:   Tue, 28 Apr 2026 10:14:32 GMT  (rfc_2822)
iso:     2026-04-28T10:14:32.000Z
local:   2026-04-28 10:14:32 UTC  (use --tz <name> for local)
unix s:  1777371272
unix ms: 1777371272000
rfc:     Tue, 28 Apr 2026 10:14:32 GMT
rel:     7 months ago
day:     Tuesday
```

Rewrite unix timestamps (10 digits for seconds, 13 for milliseconds) inside a log stream:

```console
$ cat app.log
GET /health 1706482800 ok
sync done at 1706482860123

$ timecheck --replace-unix < app.log
GET /health 2024-01-28T23:00:00.000Z ok
sync done at 2024-01-28T23:01:00.123Z
```

## Usage

```text
timecheck: convert timestamps between unix, ISO 8601 and RFC 2822.

Usage:
  timecheck                          show now in every format (also reads stdin)
  timecheck "<timestamp>"            convert one timestamp (auto-detects format)
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
  unix seconds  1706482800
  unix ms       1706482800123   (numbers of 1e12 or more count as ms)
  iso 8601      2026-04-28T10:14:32Z   2026-04-28 10:14:32+02:00
  rfc 2822      Tue, 28 Apr 2026 10:14:32 GMT
  literal       now

Exit codes:
  0  ok
  1  could not parse input
  2  invalid arguments

Examples:
  timecheck 1706482800
  timecheck "2026-04-28T10:14:32Z" --tz Asia/Jerusalem
  tail -f app.log | timecheck --replace-unix
  date +%s | timecheck --json | jq .iso_8601

Docs and issues: https://github.com/voidd0/timecheck
```

## Limits

- A number of 1e12 or more is read as milliseconds, anything smaller as seconds. Strings other than numbers and `now` go through the JavaScript `Date` parser, so ambiguous formats follow what Node.js accepts.
- `--tz` takes IANA names such as `Europe/Berlin`. An unknown name exits with code 2.
- `--replace-unix` only touches whole tokens of exactly 10 digits (optionally with a fraction) or 13 digits.

## License

MIT, see [LICENSE](LICENSE).

---

Made by [vøiddo](https://voiddo.com/?src=gh). More command line tools: [voiddo.com/packages](https://voiddo.com/packages/?src=gh).
We also run data scrapers for job boards, shops and ad libraries: [voiddo.com/scrapers](https://voiddo.com/scrapers/?src=gh).
