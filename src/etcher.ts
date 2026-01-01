/**
 * Code block processor that supports rendering a Svelte component view and etching
 * content back into the source of the markdown file containing it.
 */

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
		if (this.component) {
			void unmount(this.component);
		}
	}

	/**
	 * The source path of the markdown file containing this code block, accounting for renames.
	 */
	get sourcePath(): string {
		return this.currentPath;
	}

	/**
	 * Extracts parameters from a code block language identifier.
	 *
	 * The parameters are specified as a YAML map immediately following the code block language,
	 * e.g. ```etch-something{foo: "bar", baz: 42}
	 */
	get fenceParams(): { [key: string]: unknown } {
		const sectionInfo = this.ctx.getSectionInfo(this.containerEl);
		if (!sectionInfo) return {};

		const lines = sectionInfo.text.split("\n");
		// Extract YAML parameters from a line like ```etch-something{...}
		const match = lines[sectionInfo.lineStart]?.match(/(\{.*\})/);
		if (!match || !match[1]) return {};
		return parseYaml(match[1]) as { [key: string]: unknown };
	}

	/**
	 * Etches new text content into the markdown file code block / fenced block source.
	 *
	 * @param newEtching New text to content to etch in to the code block source
	 * @returns Promise that resolves when the etching is complete
	 */
	public async etch(newEtching: string): Promise<void> {
		const sectionInfo = this.ctx.getSectionInfo(this.containerEl);
		if (!sectionInfo) return;

		const file = this.app.vault.getAbstractFileByPath(this.sourcePath);
		if (!(file instanceof TFile)) return;

		await this.app.vault.process(file, (data: string) => {
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

/**
 * Creates a factory function for instantiating a SvelteEtcher code block processor, suitable as a
 * handler for Plugin.registerMarkdownCodeBlockProcessor.
 *
 * @param app Obsidian application instance
 * @param plugin Plugin instance
 * @param componentCls Svelte component class
 * @returns Factory function
 */
export function createSvelteEtcher(
	app: App,
	plugin: Plugin,
	componentCls: Component
): (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void {
	return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
		const child = new SvelteEtcher(source, el, ctx, app, plugin, componentCls);
		ctx.addChild(child);
	};
}
