/**
 * Plugin settings view and controller.
 */
import { App, PluginSettingTab, Setting } from "obsidian";
import EtchGoogleCalendarPlugin from "./main";

export interface EtchGoogleCalendarPluginSettings {
    googleClientId: string;
    googleClientSecret: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
}

export const DEFAULT_SETTINGS: EtchGoogleCalendarPluginSettings = {
    googleClientId: "",
    googleClientSecret: "",
};

export class EtchGoogleCalendarPluginSettingTab extends PluginSettingTab {
    plugin: EtchGoogleCalendarPlugin;
    clientIDSetting: Setting;
    clientSecretSetting: Setting;
    authorizeSetting: Setting;

    constructor(app: App, plugin: EtchGoogleCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    private refreshDisplay(): void {
        // Reflect the current authorization state properly
        this.authorizeSetting.controlEl.empty();

        if (this.plugin.settings.googleAccessToken) {
            this.clientIDSetting.setDisabled(true);
            this.clientSecretSetting.setDisabled(true);

            this.authorizeSetting
                ?.setName("Calendar access: granted ✅")
                .setDesc("Click to remove Obsidian's access to your Google Calendar")
                .addButton((button) =>
                    button.setButtonText("Revoke").onClick(async () => {
                        await this.plugin.revokeGoogleCalendarAccess();
                        this.refreshDisplay();
                    })
                );
        } else {
            this.clientIDSetting.setDisabled(false);
            this.clientSecretSetting.setDisabled(false);

            this.authorizeSetting
                ?.setName("Calendar access: pending")
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

        this.clientIDSetting = new Setting(containerEl)
            .setName("Google client ID")
            .setDesc("Enter an OAuth 2.0 client ID from the Google Cloud console")
            .addText((text) =>
                text
                    .setPlaceholder("Example: XXXX....apps.googleusercontent.com")
                    .setValue(this.plugin.settings.googleClientId)
                    .onChange(async (value) => {
                        this.plugin.settings.googleClientId = value;
                        await this.plugin.saveSettings();
                        this.refreshDisplay();
                    })
            );

        this.clientSecretSetting = new Setting(containerEl)
            .setName("Google client secret")
            .setDesc("Enter an OAuth 2.0 client secret from the Google Cloud console")
            .addText((text) => {
                text.inputEl.type = "password";
                text.setPlaceholder("Example: GOXXXX-...")
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
