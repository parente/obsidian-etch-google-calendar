import {
	App,
	MarkdownRenderChild,
	TFile,
	type MarkdownPostProcessorContext,
	type MarkdownSectionInformation,
} from "obsidian";
import { mount, unmount, type Component } from "svelte";

class SvelteCodeBlock extends MarkdownRenderChild {
	private source: string;
	private ctx: MarkdownPostProcessorContext;
	private app: App;
	private componentCls: Component;
	private props: object;
	private component?: ReturnType<typeof mount>;

	constructor(
		source: string,
		containerEl: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		app: App,
		componentCls: Component,
		props: object
	) {
		super(containerEl);
		this.source = source;
		this.ctx = ctx;
		this.app = app;
		this.componentCls = componentCls;
		this.props = props;
	}

	onload() {
		console.debug("SvelteCodeBlock.onload");
		this.component = mount(this.componentCls, {
			target: this.containerEl,
			props: { ...this.props, oldEtching: this.source, etch: this.etch },
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
		console.debug("SvelteCodeBlock.etch => sectionInfo:", this.sectionInfo);
		if (!sectionInfo) return;

		const file = this.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
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
	};
}

export function createSvelteCodeBlockProcessor(app: App, componentCls: Component, props: object) {
	return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
		const child = new SvelteCodeBlock(source, el, ctx, app, componentCls, props);
		ctx.addChild(child);
	};
}
