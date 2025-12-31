import {
	App,
	MarkdownRenderChild,
	parseYaml,
	Plugin,
	TFile,
	type MarkdownPostProcessorContext,
} from "obsidian";
import { mount, unmount, type Component } from "svelte";

export default class SvelteEtcher extends MarkdownRenderChild {
	private source: string;
	private ctx: MarkdownPostProcessorContext;
	private app: App;
	private plugin: Plugin;
	private componentCls: Component;
	private component?: ReturnType<typeof mount>;
	private currentPath: string;

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
		this.currentPath = ctx.sourcePath;
	}

	onload() {
		console.debug("SvelteCodeBlock.onload");

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (oldPath === this.currentPath) {
					this.currentPath = file.path;
				}
			})
		);

		this.component = mount(this.componentCls, {
			target: this.containerEl,
			props: {
				source: this.source,
				etcher: this,
				plugin: this.plugin,
			},
		});
	}

	onunload() {
		console.debug("SvelteCodeBlock.onunload");
		if (this.component) {
			void unmount(this.component);
		}
	}

	get sourcePath(): string {
		return this.currentPath;
	}

	get fenceParams(): { [key: string]: unknown } {
		const sectionInfo = this.ctx.getSectionInfo(this.containerEl);
		if (!sectionInfo) return {};

		const lines = sectionInfo.text.split("\n");
		// Extract YAML parameters from a line like ```etch-something{...}
		const match = lines[sectionInfo.lineStart]?.match(/(\{.*\})/);
		if (!match || !match[1]) return {};
		return parseYaml(match[1]) as { [key: string]: unknown };
	}

	public async etch(newEtching: string): Promise<void> {
		const sectionInfo = this.ctx.getSectionInfo(this.containerEl);
		console.debug("SvelteCodeBlock.etch => sectionInfo:", sectionInfo);
		if (!sectionInfo) return;

		const file = this.app.vault.getAbstractFileByPath(this.sourcePath);
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
	}
}

export function createSvelteEtcher(app: App, plugin: Plugin, componentCls: Component) {
	return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
		const child = new SvelteEtcher(source, el, ctx, app, plugin, componentCls);
		ctx.addChild(child);
	};
}
