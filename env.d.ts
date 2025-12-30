/// <reference types="svelte" />

declare module "*.svelte" {
	import type { Component } from "svelte";
	export default Component<any>;
}
