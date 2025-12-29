import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "./main";

export interface MyPluginSettings {
	googleClientId: string;
	googleClientSecret: string;
	googleAccessToken?: string;
	googleRefreshToken?: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	googleClientId: "",
	googleClientSecret: "",
};

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h3", { text: "Google Calendar API" });

		new Setting(containerEl)
			.setName("Google client ID")
			.setDesc("OAuth 2.0 client ID from Google Cloud console")
			.addText((text) =>
				text
					.setPlaceholder("e.g., XXXX....apps.googleusercontent.com")
					.setValue(this.plugin.settings.googleClientId)
					.onChange(async (value) => {
						this.plugin.settings.googleClientId = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Google client secret")
			.setDesc("OAuth 2.0 client secret from Google Cloud Console")
			.addText((text) =>
				text
					.setPlaceholder("e.g., GOXXXX-X_XXXXXXXXXXXXXXXXXXXXXX")
					.setValue(this.plugin.settings.googleClientSecret)
					.onChange(async (value) => {
						this.plugin.settings.googleClientSecret = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Google authorization")
			.setDesc("Click to authorize access to your Google Calendar")
			.addButton((button) =>
				button.setButtonText("Authorize Google Calendar").onClick(async () => {
					await this.plugin.enableGoogleCalendarBlocks();
				})
			)
			.setDisabled(
				!this.plugin.settings.googleClientId || !this.plugin.settings.googleClientSecret
			);
	}
}
