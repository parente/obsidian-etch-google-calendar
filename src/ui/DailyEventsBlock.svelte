<script lang="ts">
	import type { GoogleCalendarClient } from "gcal";

	interface Props {
		/** Currently etched content within the block */
		oldEtching: string;
		/** Callback to etch new content within the block */
		etch: (newEtching: string) => void;
		/** Google Calendar client */
		gcalClient: GoogleCalendarClient;
	}

	const { oldEtching, gcalClient, etch }: Props = $props();

	const refresh = $derived.by(async () => {
		const now = new Date();
		const resp = await gcalClient.getEventsForDate("2025-12-29");
		const lines: string[] = [];
		for (const item of resp?.items || []) {
			console.log(item);
			if (item.eventType === "default" || item.eventType === "focusTime") {
				if (item.start?.dateTime) {
					const dateTime = new Date(item.start.dateTime);
					const hours = dateTime.getHours().toString().padStart(2, "0");
					const minutes = dateTime.getMinutes().toString().padStart(2, "0");
					const start = `${hours}:${minutes}`;
					lines.push(`${start.padEnd(10)} ${item.summary}`);
				} else if (item.start?.date) {
					lines.push(`All day   ${item.summary}`);
				}
			}
		}
		return lines.join("\n") || `No events as of ${now.toLocaleTimeString()}`;
	});
</script>

{#await refresh}
	<pre>{oldEtching || "Etching ..."}</pre>
{:then newEtching}
	<pre>{newEtching}</pre>
{:catch}
	<pre>{oldEtching}</pre>
{/await}

<style>
</style>
