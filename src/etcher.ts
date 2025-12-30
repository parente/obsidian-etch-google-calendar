import {
	App,
	MarkdownRenderChild,
	Plugin,
	TFile,
	type MarkdownPostProcessorContext,
} from "obsidian";
import { mount, unmount, type Component } from "svelte";

class SvelteEtcher extends MarkdownRenderChild {
	private source: string;
	private ctx: MarkdownPostProcessorContext;
	private app: App;
	private plugin: Plugin;
	private componentCls: Component;
	private component?: ReturnType<typeof mount>;

	constructor(
		source: string,
		containerEl: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		app: App,
		plugin: Plugin,
		componentCls: Component
	) {
		super(containerEl);
		this.source = source;
		this.ctx = ctx;
		this.app = app;
		this.plugin = plugin;
		this.componentCls = componentCls;
	}

	onload() {
		console.debug("SvelteCodeBlock.onload");
		this.component = mount(this.componentCls, {
			target: this.containerEl,
			props: { oldEtching: this.source, etch: this.etch, plugin: this.plugin },
		});
	}

	onunload() {
		console.debug("SvelteCodeBlock.onunload");
		if (this.component) {
			void unmount(this.component);
		}
	}

	etch = async (newEtching: string): Promise<void> => {
		const sectionInfo = this.ctx.getSectionInfo(this.containerEl);
		console.debug("SvelteCodeBlock.etch => sectionInfo:", sectionInfo);
		if (!sectionInfo) return;

		const file = this.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
		if (!(file instanceof TFile)) return;

		await this.app.vault.process(file, (data: string) => {
			console.debug("SvelteCodeBlock.etch => processing file:", file.path);
			const lines = data.split("\n");
			// Retain everything except the content within the code block fence
			const newLines = [
				...lines.slice(0, sectionInfo.lineStart + 1),
				newEtching,
				...lines.slice(sectionInfo.lineEnd),
			];
			return newLines.join("\n");
		});
	};
}

export function createSvelteEtcher(app: App, plugin: Plugin, componentCls: Component) {
	return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
		const child = new SvelteEtcher(source, el, ctx, app, plugin, componentCls);
		ctx.addChild(child);
	};
}
