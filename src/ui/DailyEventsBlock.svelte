<script lang="ts">
	import type EtchGoogleCalendarPlugin from "main";

	interface Props {
		/** Currently etched content within the block */
		oldEtching: string;
		/** Callback to etch new content within the block */
		etch: (newEtching: string) => Promise<void>;
		/** Plugin instance */
		plugin: EtchGoogleCalendarPlugin;
	}

	const { oldEtching, plugin, etch }: Props = $props();
	const lastLoad = new Date();
	let lastRefresh = $state(lastLoad);

	const refresh = $derived.by(async () => {
		console.log("DailyEventsBlock.refresh => gcalClient:", plugin.gcalClient);
		console.log("DailyEventsBlock.refresh => lastRefresh:", lastRefresh);
		console.log("DailyEventsBlock.refresh => lastLoad:", lastLoad);
		if (lastRefresh === lastLoad || !plugin.gcalClient) {
			console.debug("DailyEventsBlock => using cached etching");
			return oldEtching;
		}
		console.debug("DailyEventsBlock => fetching new content");
		// TODO: date from doc
		const resp = await plugin.gcalClient.getEventsForDate("2027-04-04");
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
	<pre>⏳ Etching ...</pre>
{:then newEtching}
	<pre>{newEtching || "ℹ️ Google Calendar access required"}</pre>
{:catch}
	<pre>{oldEtching}</pre>
{/await}

<button
	onclick={() => {
		console.log("refresh.onclick");
		lastRefresh = new Date();
	}}>Refresh</button
>

<style>
</style>
