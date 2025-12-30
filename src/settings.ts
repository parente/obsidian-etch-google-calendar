import { App, PluginSettingTab, Setting } from "obsidian";
import EtchPlugin from "./main";

export interface EtchPluginSettings {
	googleClientId: string;
	googleClientSecret: string;
	googleAccessToken?: string;
	googleRefreshToken?: string;
}

export const DEFAULT_SETTINGS: EtchPluginSettings = {
	googleClientId: "",
	googleClientSecret: "",
};

export class EtchPluginSettingTab extends PluginSettingTab {
	plugin: EtchPlugin;
	authorizeSetting?: Setting;

	constructor(app: App, plugin: EtchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private refreshDisplay(): void {
		// Reflect the current authorization state properly
		this.authorizeSetting?.controlEl.empty();
		if (this.plugin.settings.googleAccessToken) {
			this.authorizeSetting
				?.setName("Calendar access: Granted ✅")
				.setDesc("Click to remove Obsidian's access to your Google Calendar")
				.addButton((button) =>
					button.setButtonText("Deauthorize").onClick(async () => {
						delete this.plugin.settings.googleAccessToken;
						delete this.plugin.settings.googleRefreshToken;
						await this.plugin.saveSettings();
						this.refreshDisplay();
					})
				);
		} else {
			this.authorizeSetting
				?.setName("Calendar access: Pending")
				.setDesc("Click to give Obsidian access to your Google Calendar")
				.addButton((button) =>
					button.setButtonText("Authorize").onClick(async () => {
						await this.plugin.authorizeGoogleCalendarAccess();
						this.refreshDisplay();
					})
				);
		}

		// Enable the authorize button only if required values are provided
		this.authorizeSetting?.setDisabled(
			!this.plugin.settings.googleAccessToken &&
				(!this.plugin.settings.googleClientId || !this.plugin.settings.googleClientSecret)
		);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName("Google Calendar").setHeading();

		new Setting(containerEl)
			.setName("Google client ID")
			.setDesc("Enter an OAuth 2.0 client ID from the Google Cloud console")
			.addText((text) =>
				text
					.setPlaceholder("e.g., XXXX....apps.googleusercontent.com")
					.setValue(this.plugin.settings.googleClientId)
					.onChange(async (value) => {
						this.plugin.settings.googleClientId = value;
						await this.plugin.saveSettings();
						this.refreshDisplay();
					})
			);

		new Setting(containerEl)
			.setName("Google client secret")
			.setDesc("Enter an OAuth 2.0 client secret from the Google Cloud console")
			.addText((text) => {
				text.inputEl.type = "password";
				text.setPlaceholder("e.g., GOXXXX-X_XXXXXXXXXXXXXXXXXXXXXX")
					.setValue(this.plugin.settings.googleClientSecret)
					.onChange(async (value) => {
						this.plugin.settings.googleClientSecret = value;
						await this.plugin.saveSettings();
						this.refreshDisplay();
					});
			});

		this.authorizeSetting = new Setting(containerEl);

		this.refreshDisplay();
	}
}
