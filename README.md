# Obsidian Plugin - Etch - Google Calendar

An Obsidian plugin that etches daily Google Calendar events into your notes for permanent, local,
offline access.

[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://www.buymeacoffee.com/parente)

## Why?

## Development

```bash
cd /path/to/vault/.obsidian/plugins
git clone git@github.com:parente/obsidian-etch-google-calendar.git
npm i
npm run dev
npm run eslint
npm run svelte-check
```

## Attribution

The structure of this plugin originates from https://github.com/obsidianmd/obsidian-sample-plugin.

I adapted large chunks of code needed for local OAuth and invoking the Google Calendar API from
https://github.com/lexafaxine/GoogleCalendarImporter.
