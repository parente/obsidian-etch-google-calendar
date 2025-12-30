import { MarkdownRenderChild, type MarkdownPostProcessorContext } from "obsidian";
import { mount, unmount, type Component } from "svelte";

class SvelteCodeBlock extends MarkdownRenderChild {
	private componentCls: Component;
	private props: object;
	private component?: ReturnType<typeof mount>;

	constructor(containerEl: HTMLElement, componentCls: Component, props: object) {
		super(containerEl);
		this.props = props;
		this.componentCls = componentCls;
	}

	onload() {
		this.component = mount(this.componentCls, {
			target: this.containerEl,
			props: this.props,
		});
	}

	onunload() {
		if (this.component) {
			void unmount(this.component);
		}
	}
}

export function createSvelteCodeBlockProcessor(componentCls: Component, props: object) {
	return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
		const child = new SvelteCodeBlock(el, componentCls, { oldEtching: source, ...props });
		ctx.addChild(child);
	};
}
