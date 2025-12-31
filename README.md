# Obsidian Plugin - Etch - Google Calendar

An Obsidian plugin that etches daily Google Calendar events into your notes for permanent, local,
offline access.

[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://www.buymeacoffee.com/parente)

## Why?

I've been using [gcalcli](https://github.com/insanum/gcalcli) to output a text agenda at the command
line and then copy/pasting it into my daily note. I like how the text agenda becomes a permanent part
of the local Makrdown file, and shows in a simple editable format.

I haven't created an Obsidian plug-in since
[obsidian-overdue](https://github.com/parente/obsidian-overdue), and wanted to try my hand at
automating the "etching" of Google Calender events into my Obsidian notes.

## Setup

You need to configure a Google Cloud Platform project with access to the Google Calendar API in
the Google Workspace account where your calendar resides. Then you need to create an OAuth 2.0
client in the project, and set the client ID and client secret in the plug-in settings in Obsidian.

This first few sections of [this
quickstart](https://developers.google.com/workspace/calendar/api/quickstart/nodejs) explain the
steps in a bit more detail. Stop when you get to installing libraries or writing code.

The plug-in only works on Obsidian desktop because it needs to run a tiny server to complete the
OAuth 2.0 flow when connecting to your Google calendar.

## Usage

Create a daily note with a title like `2025-12-31`. Place a fenced code block with language
identifier `etch-google-calendar` somewhere in the document. Move the text caret out of the block
so that it renders. Click the pen icon that appears in the bottom right to etch the Calendar
events for that day (`2025-12-31`) into the code block.

````
```etch-google-calendar
```
````

Alternative, add a `{date: ...}` parameter to the language identifier. The plug-in will populate
the events for that date into the code block instead.

````
```etch-google-calendar{date: 2026-01-01}
```
````

The plug-in uses the timezone configured for the calendar in Google Calendar when writing the times
into the note.

All-day events show as starting at `00:00`.

## Development

```bash
cd /path/to/vault/.obsidian/plugins
git clone git@github.com:parente/obsidian-etch-google-calendar.git
npm i
npm run eslint
npm run svelte-check
npm run dev
```

## Attribution

The structure of this plugin originates from https://github.com/obsidianmd/obsidian-sample-plugin.

I adapted large chunks of code needed for local OAuth and invoking the Google Calendar API from
https://github.com/lexafaxine/GoogleCalendarImporter.
