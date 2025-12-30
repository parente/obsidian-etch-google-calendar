<script lang="ts">
	import type { GoogleCalendarClient } from "gcal";

	interface Props {
		/** Currently etched content within the block */
		oldEtching: string;
		/** Callback to etch new content within the block */
		etch: (newEtching: string) => Promise<void>;
		/** Google Calendar client */
		gcalClient: GoogleCalendarClient;
	}

	const { oldEtching, gcalClient, etch }: Props = $props();
	const lastLoad = new Date();
	let lastRefresh = $state(lastLoad);

	const refresh = $derived.by(async () => {
		if (oldEtching.trim() && lastRefresh === lastLoad) {
			console.debug("DailyEventsBlock => using cached etching");
			return oldEtching;
		}
		console.debug("DailyEventsBlock => fetching new content");
		// TODO: date from doc
		const resp = await gcalClient.getEventsForDate("2027-04-04");
		const lines: string[] = [];
		for (const item of resp?.items || []) {
			// console.debug("DailyEventsBlock => resp.item:", item);
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
		const newEtching = lines.join("\n") || `No events as of ${lastRefresh.toLocaleString()}`;
		await etch(newEtching);
		return newEtching;
	});
</script>

{#await refresh}
	<pre>{oldEtching || "⏳ Etching ..."}</pre>
{:then newEtching}
	<pre>{newEtching}</pre>
{:catch}
	<pre>{oldEtching}</pre>
{/await}

<button
	onclick={() => {
		lastRefresh = new Date();
	}}>Refresh</button
>

<style>
</style>
