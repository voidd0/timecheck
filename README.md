# timecheck

[![npm version](https://img.shields.io/npm/v/@v0idd0/timecheck.svg?color=A0573A)](https://www.npmjs.com/package/@v0idd0/timecheck)
[![npm downloads](https://img.shields.io/npm/dw/@v0idd0/timecheck.svg?color=1F1A14)](https://www.npmjs.com/package/@v0idd0/timecheck)
[![License: MIT](https://img.shields.io/badge/license-MIT-A0573A.svg)](LICENSE)
[![Node ≥14](https://img.shields.io/badge/node-%E2%89%A514-1F1A14)](package.json)
[![Built by vøiddo](https://img.shields.io/badge/built%20by-v%C3%B8iddo-1F1A14)](https://voiddo.com/)

> Convert any timestamp to any format. Pipe-friendly. Zero deps. Made for the moment it's 2am, your logs are in three timezones, and you just need to know what `1706482800` is in human.

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

---

## Why timecheck?

Picture it: 02:14am, production is paging, you're staring at three log streams. The CDN logs are unix seconds. Your application logs are unix milliseconds. The third-party billing webhook helpfully gives you ISO 8601 in **its** timezone, which is neither yours nor the user's. You need to know whether event A happened before event B before you can decide whether the bug is yours.

The "fix" most people use:

- Open a browser tab to a unix-converter site that's covered in ads and asks you to disable your blocker.
- Pipe through `date -d @1706482800` and pray your `date` is GNU and not BSD (it isn't, on macOS).
- Open `python -c "import datetime; print(datetime.datetime.fromtimestamp(1706482800))"` and now your local timezone is poisoning the answer.
- Open Slack and message someone in a different timezone to "do the conversion for me".

`timecheck` is the boring single-purpose tool that lives in `$PATH` and just does it. One binary, zero deps, every format at once, every timezone you ask for. Reads from stdin so you can pipe a whole log line in. Has a `--replace-unix` mode that rewrites every unix token in a stream to ISO 8601 — leaving everything else alone.

Built so the next 2am page is twenty seconds shorter.

---

## Install

```bash
npm install -g @v0idd0/timecheck
```

Works on macOS, Linux, and Windows. Node 14 or newer.

---

## Usage

```bash
# Convert any timestamp — auto-detects format
timecheck 1706482800
timecheck "2026-04-28T10:14:32Z"
timecheck "Tue, 28 Apr 2026 10:14:32 GMT"

# Now in every format
timecheck

# Show local time in a specific zone
timecheck "2026-04-28T10:14:32Z" --tz Europe/Berlin
timecheck 1706482800 --tz Asia/Jerusalem
timecheck now --tz Pacific/Kiritimati   # +14, the world's earliest tomorrow

# JSON output for scripts
timecheck 1706482800 --json | jq .iso_8601

# Read from stdin
date +%s | timecheck

# Replace unix tokens in a log file
tail -f app.log | timecheck --replace-unix
```

---

## What it auto-detects

| Input | Source label |
|---|---|
| `1706482800` | `unix_seconds` |
| `1706482800123` | `unix_ms` |
| `2026-04-28T10:14:32Z` | `iso_8601` |
| `2026-04-28 10:14:32+02:00` | `iso_8601` |
| `Tue, 28 Apr 2026 10:14:32 GMT` | `rfc_2822` |
| `now` | `now` |

The cutoff between unix seconds and ms is ≥ 1e12 (≈ year 2001). If you've got a real-world timestamp from the year 2001 in milliseconds, please file an issue — we'll buy you a coffee for the war story.

---

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

Catches both 10-digit (seconds) and 13-digit (ms) tokens. Leaves smaller numbers (user IDs, sizes, response codes) alone.

---

## How timecheck compares

| Tool | Auto-detect input | All formats at once | Pipe stream rewrite | Cross-platform | Deps |
|---|---|---|---|---|---|
| **timecheck** | ✅ | ✅ | ✅ `--replace-unix` | ✅ darwin/linux/win32 | 0 |
| `date` (GNU) | ❌ flag-per-format | ❌ | ❌ | ❌ Linux only | system |
| `date` (BSD) | ❌ different flags | ❌ | ❌ | ❌ macOS / BSD only | system |
| `dateutils` | partial | ❌ separate `dconv`/`dseq`/`datediff` | ❌ | ✅ | system install |
| Random online converter | ❌ | partial | ❌ (it's a webpage) | ❌ needs browser + connectivity | the whole web |
| `python -c "datetime..."` | ❌ | ❌ verbose for each format | ❌ | ✅ | needs Python |

The honest summary: `dateutils` is genuinely strong if you're willing to install it and learn three subcommands. `timecheck` exists for the case where you want one binary, one command, every format printed at once, with a stream-rewrite mode. Pick the one that fits your hand better.

---

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

Pure functions. Zero deps. Works in Node and any modern bundler.

---

## FAQ

**What's the input source detection logic?**
Numeric strings ≥ 1e12 are unix milliseconds; smaller are unix seconds. Strings starting with a 4-digit year are tried as ISO 8601 (with both `T` and space separators, with or without timezone). Strings starting with a 3-letter weekday are tried as RFC 2822. The literal `now` resolves to system clock. Anything else exits with code 1 and a "could not parse" line on stderr.

**Why does `--tz` exist if it's not the system default?**
Because the system default lies. On a server that's UTC, `Date.toLocaleString()` returns UTC. On a developer laptop, it returns wherever the developer happens to be. `--tz Asia/Jerusalem` returns the same thing on both — which is the whole point of a debugging tool.

**What happens if I pass an invalid timezone?**
Exit code 2 and a one-line error: `unknown timezone: <name>. expected an IANA zone like 'Europe/Berlin' or 'UTC'.` We use the runtime's IANA database (`Intl.DateTimeFormat`), so anything in `tzdata` works.

**Does `--replace-unix` rewrite my file in place?**
No. It's a stream filter — read stdin, write stdout. If you want in-place, redirect: `timecheck --replace-unix < app.log > app.iso.log`. We deliberately don't touch the source file because backups are your problem, not ours.

**Will it round-trip a timestamp?**
Yes — `timecheck $(timecheck 1706482800 --json | jq -r .unix_seconds)` returns the same record. Numeric formats are lossless; relative ("2 years ago") is computed from current clock and changes over time.

**What's the weirdest timezone you handle?**
`Pacific/Kiritimati` (+14:00). It's the earliest "tomorrow" on Earth and it sometimes confuses log aggregators that assume timezone offsets cap at ±12. We don't make that assumption. There's also `Asia/Kathmandu` (+05:45), which exists specifically to wake people up when they generate cron expressions by hand.

---

## Exit codes

- `0` — parsed and printed successfully
- `1` — could not parse the input
- `2` — invalid CLI arguments / unknown timezone

---

## More from the studio

Other CLIs you might want in your `$PATH`:

- [tzdiff](https://github.com/voidd0/tzdiff) — compare timezones side by side, plan a meeting
- [cronwtf](https://github.com/voidd0/cronwtf) — decode any cron expression in plain english
- [dotdig](https://github.com/voidd0/dotdig) — DNS lookup for humans
- [logparse](https://github.com/voidd0/logparse) — parse nginx / apache / syslog into structured records
- Full list at [tools.voiddo.com](https://tools.voiddo.com/)

---

## From the same studio

- **[@v0idd0/jsonyo](https://www.npmjs.com/package/@v0idd0/jsonyo)** — JSON swiss army knife, 18 commands, zero limits
- **[@v0idd0/envguard](https://www.npmjs.com/package/@v0idd0/envguard)** — stop shipping `.env` drift to staging
- **[@v0idd0/depcheck](https://www.npmjs.com/package/@v0idd0/depcheck)** — find unused dependencies in one command
- **[@v0idd0/gitstats](https://www.npmjs.com/package/@v0idd0/gitstats)** — git repo analytics, one command
- **[View all tools →](https://voiddo.com/tools/)**

## License

MIT — see `LICENSE`.

---

Built by [vøiddo](https://voiddo.com/) — a small studio shipping AI-flavoured products, free dev tools, Chrome extensions and weird browser games.
