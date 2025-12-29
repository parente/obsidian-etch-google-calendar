import { Notice, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, type MyPluginSettings, SampleSettingTab } from "settings";
import { type Credentials } from "google-auth-library";
import { GoogleCalendarAPI, type GoogleCalendarCredentials } from "gcal";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	googleCalendarAPI: GoogleCalendarAPI;

	async onload() {
		// Load saved settings
		await this.loadSettings();

		// this.registerMarkdownCodeBlockProcessor("block-md", createBlockMdProcessor(this.app));

		// this.registerMarkdownCodeBlockProcessor("block-svelte", createBlockSvelteProcessor());

		// Add a settings disalog tab
		this.addSettingTab(new SampleSettingTab(this.app, this));
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

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	new Notice("Click");
		// });

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		if (this.googleCalendarAPI) {
			this.googleCalendarAPI.cleanup();
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>
		);
		this.initializeGoogleCalendarAPI();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private initializeGoogleCalendarAPI() {
		const credentials: GoogleCalendarCredentials = {
			clientId: this.settings.googleClientId,
			clientSecret: this.settings.googleClientSecret,
			accessToken: this.settings.googleAccessToken,
			refreshToken: this.settings.googleRefreshToken,
		};

		const onTokensUpdated = async (tokens: Credentials) => {
			if (tokens.access_token) {
				this.settings.googleAccessToken = tokens.access_token;
			}
			if (tokens.refresh_token) {
				this.settings.googleRefreshToken = tokens.refresh_token;
			}
			await this.saveSettings();
		};

		this.googleCalendarAPI = new GoogleCalendarAPI(credentials, onTokensUpdated);
	}

	async enableGoogleCalendarBlocks() {
		if (!this.settings.googleClientId || !this.settings.googleClientSecret) {
			new Notice("Enter both Google Client ID and Client Secret in the settings");
			return;
		}

		try {
			const tokens = await this.googleCalendarAPI.startOAuthFlow();
			if (tokens.access_token && tokens.refresh_token) {
				this.settings.googleAccessToken = tokens.access_token;
				this.settings.googleRefreshToken = tokens.refresh_token || "";
				await this.saveSettings();
				this.initializeGoogleCalendarAPI();
				// this.registerMarkdownCodeBlockProcessor(
				// 	"google-calendar",
				// 	createCodeBlockProcessor(this.googleCalendarAPI)
				// );
			}
		} catch (error) {
			console.error("Error during OAuth flow:", error);
		}
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
