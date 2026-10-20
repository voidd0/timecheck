# timecheck

[![npm version](https://img.shields.io/npm/v/@v0idd0/timecheck.svg?color=A0573A)](https://www.npmjs.com/package/@v0idd0/timecheck)
[![npm downloads](https://img.shields.io/npm/dw/@v0idd0/timecheck.svg?color=1F1A14)](https://www.npmjs.com/package/@v0idd0/timecheck)
[![License: MIT](https://img.shields.io/badge/license-MIT-A0573A.svg)](LICENSE)
[![Node ≥14](https://img.shields.io/badge/node-%E2%89%A514-1F1A14)](package.json)

**[Homepage](https://tools.voiddo.com/timecheck/?ref=timecheck-readme)** · **[GitHub](https://github.com/voidd0/timecheck)** · **[npm](https://www.npmjs.com/package/@v0idd0/timecheck)** · **[All tools](https://tools.voiddo.com/?ref=timecheck-catalog-readme)** · **[Contact](mailto:support@voiddo.com)**

---

**Unix timestamp converter, epoch converter, and log rewrite filter.** Paste unix seconds, unix ms, ISO 8601, RFC 2822, or human-readable text; `timecheck` auto-detects the format, prints every representation, and rewrites unix tokens inside log files in place.

If you were searching for a `currentmillis.com` alternative that also works on log files, this is the CLI.

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

## Why teams keep `timecheck` in runbooks

Most timestamp tools do one conversion and stop. `timecheck` is built for repeatable workflows:

- **Auto-detect mode** for mixed inputs (seconds, milliseconds, ISO, RFC 2822).
- **`--replace-unix` stream mode** that rewrites epoch tokens inside logs in-place.
- **Stable scriptable CLI output** for CI and incident tooling.

That makes it useful for:

- incident triage and postmortem timelines
- log archaeology during handoffs
- shell pipelines feeding parsing jobs

## Compared with currentmillis-style tools

`timecheck` is CLI-first with no dependencies, with stream filtering built in:

| Need | `timecheck` | Currentmillis-like web converters |
|---|---|---|
| Convert mixed timestamp formats | ✅ | sometimes |
| Rewrite log streams without dropping context | ✅ | usually no |
| Keep output in CI-friendly shape | ✅ | partial |
| Zero install inside shell automation | ✅ | no |

If you need quick single-value checks, those tools are still useful; if you need workflow-grade conversion, this one is usually faster.

## Examples you can run immediately

### Convert an epoch from a shell variable

```bash
ts=$(date +%s)
timecheck "$ts" --tz Asia/Jerusalem
```

### Convert mixed logs and keep lines intact

```bash
cat app.log | timecheck --replace-unix > app.with-readable-times.log
```

### Feed parsed data into your own tooling

```bash
timecheck "2026-05-18T12:00:00Z" --json | jq '.unix_ms'
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

Most timestamp tools take one timestamp and convert it. `timecheck --replace-unix` is a stream filter, pipe a log file in, get the same log out with unix timestamps rewritten to ISO:

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

- `0`: parsed and printed successfully
- `1`: could not parse the input
- `2`: invalid CLI arguments

## License

MIT: part of the [vøiddo](https://voiddo.com/?ref=timecheck-studio-readme) tools collection.

---

Maintained by v0idd0.
