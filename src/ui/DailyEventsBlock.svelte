<script lang="ts">
	import type EtchGoogleCalendarPlugin from "main";
	import { calendar_v3 } from "@googleapis/calendar";
	import { PenTool } from "@lucide/svelte";

	interface Props {
		/** Currently etched content within the block */
		source: string;
		/** Callback to etch new content within the block */
		etch: (newEtching: string) => Promise<void>;
		/** Plugin instance */
		plugin: EtchGoogleCalendarPlugin;
	}

	const { source, plugin, etch }: Props = $props();

	let statusContent = $state("");
	let displayContent = $state("");

	$effect(() => {
		displayContent = source;
	});

	function eventsToLines(resp: calendar_v3.Schema$Events | null): string {
		const lines: string[] = [];
		for (const item of resp?.items || []) {
			if (item.eventType === "default" || item.eventType === "focusTime") {
				if (item.start?.dateTime) {
					const dateTime = new Date(item.start.dateTime);
					const hours = dateTime.getHours().toString().padStart(2, "0");
					const minutes = dateTime.getMinutes().toString().padStart(2, "0");
					const start = `${hours}:${minutes}`;
					lines.push(`${start.padEnd(15)} ${item.summary}`);
				} else if (item.start?.date) {
					lines.push(`All day   ${item.summary}`);
				}
			}
		}
		return lines.join("\n") || "No events";
	}

	async function handleRefresh() {
		if (!plugin.gcalClient) {
			statusContent = "✋ Connect your Google Calendar in the plugin settings";
			return;
		}

		statusContent = "⏳ Etching ...";
		try {
			const resp = await plugin.gcalClient.getEventsForDate("2025-12-30");
			const newSource = eventsToLines(resp);
			await etch(newSource);
			displayContent = newSource;
		} catch (error) {
			// TODO: some kind of error message
		} finally {
			statusContent = "";
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
	<span class="status">{statusContent}</span>
	<button
		onclick={handleRefresh}
		aria-label="Get Google Calendar events and etch them into the note"
		><PenTool size="12" /></button
	>
</div>

<style>
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
	}

	.footer button {
		height: inherit;
		cursor: pointer;
	}
</style>
