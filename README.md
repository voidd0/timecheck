# timecheck

Convert timestamps between unix seconds, unix ms, ISO 8601, RFC 2822, and human-readable. Auto-detects the input format. Zero deps. Free forever from vøiddo.

```
$ timecheck 1706482800
input:   1706482800  (unix_seconds)
iso:     2024-01-28T23:00:00.000Z
local:   2024-01-28 23:00:00 UTC  (use --tz <name> for local)
unix s:  1706482800
unix ms: 1706482800000
rfc:     Sun, 28 Jan 2024 23:00:00 GMT
rel:     2 years ago
day:     Sunday
```

## Install

```bash
npm install -g @v0idd0/timecheck
```

## Usage

```bash
# Convert any timestamp
timecheck 1706482800
timecheck "2026-04-28T10:14:32Z"
timecheck "Tue, 28 Apr 2026 10:14:32 GMT"

# Now in every format
timecheck

# Show local time in a specific zone
timecheck "2026-04-28T10:14:32Z" --tz Europe/Berlin
timecheck 1706482800 --tz Asia/Jerusalem

# JSON output for scripts
timecheck 1706482800 --json | jq .iso_8601

# Read from stdin
date +%s | timecheck

# Replace unix tokens in a log file in place
tail -f app.log | timecheck --replace-unix
```

## What it auto-detects

| Input | Source label |
|---|---|
| `1706482800` | `unix_seconds` |
| `1706482800123` | `unix_ms` |
| `2026-04-28T10:14:32Z` | `iso_8601` |
| `2026-04-28 10:14:32+02:00` | `iso_8601` |
| `Tue, 28 Apr 2026 10:14:32 GMT` | `rfc_2822` |
| `now` | `now` |

The cutoff between unix seconds and ms is ≥ 1e12 (≈ year 2001). If you've got a timestamp in the year 2001 in milliseconds, file an issue and we'll buy you a coffee.

## Killer feature: `--replace-unix`

Most timestamp tools take one timestamp and convert it. `timecheck --replace-unix` is a stream filter — pipe a log file in, get the same log out with unix timestamps rewritten to ISO:

```bash
$ cat /var/log/app.log
[1706482800] auth ok user=alice
[1706482801] db query ms=42
[1706482802] sent reply ms=12

$ cat /var/log/app.log | timecheck --replace-unix
[2024-01-28T23:00:00.000Z] auth ok user=alice
[2024-01-28T23:00:01.000Z] db query ms=42
[2024-01-28T23:00:02.000Z] sent reply ms=12
```

Catches both 10-digit (seconds) and 13-digit (ms) tokens. Leaves smaller numbers (user IDs, sizes, etc.) alone.

## Programmatic API

```javascript
const { parseTimestamp, formatAll } = require('@v0idd0/timecheck');

const parsed = parseTimestamp('1706482800');
const formatted = formatAll(parsed, { tz: 'Asia/Jerusalem' });
// {
//   input_source: "unix_seconds",
//   iso_8601:     "2024-01-28T23:00:00.000Z",
//   iso_local:    "2024-01-29 01:00:00 Asia/Jerusalem",
//   unix_seconds: 1706482800,
//   unix_ms:      1706482800000,
//   rfc_2822:     "Sun, 28 Jan 2024 23:00:00 GMT",
//   relative:     "2 years ago",
//   weekday:      "Sunday",
//   timezone_used:"Asia/Jerusalem"
// }
```

## Exit codes

- `0` — parsed and printed successfully
- `1` — could not parse the input
- `2` — invalid CLI arguments

## License

MIT — part of the [vøiddo](https://voiddo.com) tools collection.

Built by vøiddo, a small studio shipping AI-flavoured tools, browser extensions and weird browser games.
