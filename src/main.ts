import {
	App,
	MarkdownRenderChild,
	MarkdownRenderer,
	Plugin,
	type MarkdownPostProcessorContext,
} from "obsidian";
import { DEFAULT_SETTINGS, type MyPluginSettings } from "./settings";
import HelloWorld from "./ui/HelloWorld.svelte";
import { mount, unmount } from "svelte";

class SvelteCodeBlock extends MarkdownRenderChild {
	private source: string;
	private component: ReturnType<typeof mount> | undefined;

	constructor(containerEl: HTMLElement, source: string) {
		super(containerEl);
		this.source = source;
	}

	onload() {
		this.component = mount(HelloWorld, {
			target: this.containerEl,
			props: {
				source: this.source,
			},
		});
	}

	onunload() {
		console.debug("onunload => source: ", this.source);
		if (this.component) {
			void unmount(this.component);
		}
	}
}

class MarkdownCodeBlock extends MarkdownRenderChild {
	private app: App;
	private source: string;

	constructor(containerEl: HTMLElement, source: string, app: App) {
		super(containerEl);
		this.source = source;
		this.app = app;
	}

	onload() {
		console.debug("onload => source: ", this.source, ", containerEl: ", this.containerEl);
		void MarkdownRenderer.render(this.app, this.source, this.containerEl, "", this);
	}

	onunload() {
		console.debug("onunload => source: ", this.source);
	}
}

function createBlockMdProcessor(app: App) {
	return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
		const child = new MarkdownCodeBlock(el, source, app);
		ctx.addChild(child);
		console.debug("createBlockMdProcessor => ctx: ", ctx);
	};
}

function createBlockSvelteProcessor() {
	return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
		const child = new SvelteCodeBlock(el, source);
		ctx.addChild(child);
		console.debug("createBlockSvelteProcessor => ctx: ", ctx);
	};
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor("block-md", createBlockMdProcessor(this.app));

		this.registerMarkdownCodeBlockProcessor("block-svelte", createBlockSvelteProcessor());
		// // This creates an icon in the left ribbon.
		// this.addRibbonIcon('dice', 'Sample', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status bar text');

		// // This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-modal-simple',
		// 	name: 'Open modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// // This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'replace-selected',
		// 	name: 'Replace selected content',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		editor.replaceSelection('Sample editor command');
		// 	}
		// });
		// // This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-modal-complex',
		// 	name: 'Open modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 		return false;
		// 	}
		// });

		// // This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	new Notice("Click");
		// });

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		let { contentEl } = this;
// 		contentEl.setText("Woah!");
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }
