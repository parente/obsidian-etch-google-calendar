import { Notice, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, type EtchPluginSettings, EtchPluginSettingTab } from "settings";
import { type Credentials } from "google-auth-library";
import { GOOGLE_CALENDAR_SCOPES, GoogleCalendarClient, type GoogleCalendarCredentials } from "gcal";
import { OAuthServer } from "oauth";

export default class EtchPlugin extends Plugin {
	settings: EtchPluginSettings;
	oauthServer: OAuthServer;
	googleCalendar: GoogleCalendarClient;

	async onload() {
		// Create a local server to handle OAuth flows
		this.oauthServer = new OAuthServer();

		// Load saved settings
		await this.loadSettings();
		// Add a settings dialog tab
		this.addSettingTab(new EtchPluginSettingTab(this.app, this));

		// Try to initialize the calendar client
		this.initGoogleCalendarClient();
	}

	onunload() {
		this.googleCalendar?.cleanup();
		this.oauthServer?.cleanup();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<EtchPluginSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async authorizeGoogleCalendarAccess() {
		if (!this.settings.googleClientId || !this.settings.googleClientSecret) {
			// TODO: handle case https://github.com/obsidianmd/eslint-plugin/blob/master/docs/rules/ui/sentence-case.md
			new Notice("Both Google client ID and client secret are required.");
			return;
		}

		try {
			const tokens = await this.oauthServer.startOAuthFlow(
				{
					clientId: this.settings.googleClientId,
					clientSecret: this.settings.googleClientSecret,
				},
				GOOGLE_CALENDAR_SCOPES
			);
			if (tokens.access_token && tokens.refresh_token) {
				this.settings.googleAccessToken = tokens.access_token;
				this.settings.googleRefreshToken = tokens.refresh_token || "";
				await this.saveSettings();

				this.initGoogleCalendarClient();
			}
		} catch (error) {
			new Notice(`Authorization failed: ${error}`);
			console.error("Error during OAuth flow:", error);
		}
	}

	async initGoogleCalendarClient() {
		if (!this.settings.googleAccessToken || !this.settings.googleRefreshToken) {
			// Don't build the client until the user has authorized calendar access and we have
			// access and refresh tokens
			return;
		}

		const credentials: GoogleCalendarCredentials = {
			clientId: this.settings.googleClientId,
			clientSecret: this.settings.googleClientSecret,
			accessToken: this.settings.googleAccessToken,
			refreshToken: this.settings.googleRefreshToken,
			callbackUrl: this.oauthServer.callbackUrl,
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

		this.googleCalendar = new GoogleCalendarClient(credentials, onTokensUpdated);

		await this.registerMarkdownCodeBlockProcessor(
			"etch-google-calendar"
			createCodeBlockProcessor(this.googleCalendar)
		);
		
	}
}
