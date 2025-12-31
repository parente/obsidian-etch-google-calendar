<script lang="ts">
	import type EtchGoogleCalendarPlugin from "main";
	import type SvelteEtcher from "etcher";
	import { calendar_v3 } from "@googleapis/calendar";
	import { PenTool } from "@lucide/svelte";

	interface Props {
		/** Currently etched content within the block */
		source: string;
		/** Etcher instance */
		etcher: SvelteEtcher;
		/** Plugin instance */
		plugin: EtchGoogleCalendarPlugin;
	}
	const { source, plugin, etcher }: Props = $props();

	// Reactive state variables
	let statusContent = $state("");
	let displayContent = $state("");

	// Update the displayed content when the source changes. The parent will never change it,
	// but the linter complains when we do direct assignment to the state.
	$effect(() => {
		displayContent = source;
	});

	/** Converts Google Calendar events to a plain text string of times and titles. */
	function eventsToLines(resp: calendar_v3.Schema$Events | null): string {
		const lines: string[] = [];
		for (const item of resp?.items || []) {
			if (item.start?.dateTime) {
				console.debug(item.start.dateTime);
				// Use moment to parse and preserve the original timezone
				const eventTime = window.moment.parseZone(item.start.dateTime);
				const start = eventTime.format("HH:mm");
				lines.push(`${start.padEnd(15)} ${item.summary}`);
			} else if (item.start?.date) {
				lines.push(`${"00:00".padEnd(15)} ${item.summary}`);
			}
		}
		return lines.join("\n") || "No events";
	}

	/** Attempts to get a date string (YYYY-MM-DD) from a note title / filename */
	function dateFromPath(sourcePath: string): string | null {
		// Get the filename without extension
		const parts = sourcePath.split("/");
		const fileName = parts[parts.length - 1]?.replace(/\.md$/, "");
		if (!fileName) return null;

		// Assume Obsidian will continue to make momentjs available globally
		const m = window.moment(fileName, "YYYY-MM-DD", true);
		if (!m.isValid()) return null;

		return m.format("YYYY-MM-DD");
	}

	/** Refreshes the Google Calendar events displayed and etched into the note markdown code block
	 *  for the date specified in the fence parameters or the note name.
	 */
	async function handleRefresh() {
		console.debug("DailyEventsBlock.handleRefresh");
		if (!plugin.gcalClient) {
			statusContent = "✋ Connect your Google Calendar in the plugin settings";
			return;
		}

		try {
			// Get the date from the fence or the name of the file if not specified
			const date = (etcher.fenceParams.date as string) || dateFromPath(etcher.sourcePath);
			if (!date) {
				statusContent =
					"✋ No date in code block <code>```etch-google-calendar{date: ...}</code> or note name";
				return;
			}
			statusContent = `⏳ Fetching events for ${date}...`;
			// Fetch latest calendar events
			const resp = await plugin.gcalClient.getEventsForDate({
				date,
				eventTypes: ["default", "focusTime"],
			});
			// Convert to plain text
			const newSource = eventsToLines(resp);
			// Etch the text into the source doc
			await etcher.etch(newSource);
			// Update displayed content
			displayContent = newSource;
			statusContent = `✔️ Updated: ${new Date().toLocaleString()}`;
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unknown error occurred etching calendar events";
			statusContent = `❌ ${message}`;
		}
	}
</script>

{#if displayContent}
	<pre>{displayContent}</pre>
{:else}
	<pre><em
			>Click <PenTool
				aria-label="The etch icon"
				size="12"
			/> to get Google Calendar events and etch them into the note</em
		></pre>
{/if}

<div class="footer">
	<span class="status">{@html statusContent}</span>
	<button
		onclick={handleRefresh}
		aria-label="Get Google Calendar events and etch them into the note"
		><PenTool size="12" /></button
	>
</div>

<style>
	pre {
		font-size: var(--code-size);
	}

	.footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 8px;
		min-height: 24px;
	}

	.status {
		margin-left: var(--size-4-1);
		margin-right: auto;
		line-height: 24px;
		font-size: var(--font-smallest);
		opacity: 0.7;
	}

	.footer button {
		height: inherit;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.footer button:hover {
		opacity: 1;
	}
</style>
