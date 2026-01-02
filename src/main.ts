/**
 * Plugin entry point and controller.
 */
import { Notice, Plugin } from "obsidian";
import {
    DEFAULT_SETTINGS,
    EtchGoogleCalendarPluginSettingTab,
    type EtchGoogleCalendarPluginSettings,
} from "settings";
import { type Credentials } from "google-auth-library";
import { GOOGLE_CALENDAR_SCOPES, GoogleCalendarClient, type GoogleCalendarCredentials } from "gcal";
import { OAuthServer } from "oauth";
import DailyEvents from "./ui/DailyEventsBlock.svelte";
import { createSvelteEtcher } from "etcher";

export default class EtchGoogleCalendarPlugin extends Plugin {
    private oauthServer: OAuthServer;
    settings: EtchGoogleCalendarPluginSettings;
    gcalClient?: GoogleCalendarClient;

    async onload(): Promise<void> {
        // Create a local server to handle OAuth flows
        this.oauthServer = new OAuthServer();

        // Load saved settings
        await this.loadSettings();
        // Add a settings dialog tab
        this.addSettingTab(new EtchGoogleCalendarPluginSettingTab(this.app, this));

        // Try to initialize the calendar client with saved credentials
        this.initGoogleCalendarClient();

        // Register a Svelte code block processor to render and etch Google Calendar data
        this.registerMarkdownCodeBlockProcessor(
            "etch-google-calendar",
            createSvelteEtcher(this.app, this, DailyEvents)
        );
    }

    onunload(): void {
        this.oauthServer.cleanup();
        this.gcalClient?.cleanup();
        delete this.gcalClient;
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            (await this.loadData()) as Partial<EtchGoogleCalendarPluginSettings>
        );
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    /**
     * Starts the flow to authorize plugin access to the user's Google Calendar.
     */
    async authorizeGoogleCalendarAccess(): Promise<void> {
        if (!this.settings.googleClientId || !this.settings.googleClientSecret) {
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
            new Notice(`Google Calendar authorization failed: ${String(error)}`);
            console.error("Error during OAuth flow:", error);
        }
    }

    /**
     * Revokes plugin access to the user's Google Calendar by deleting stored credentials.
     */
    async revokeGoogleCalendarAccess(): Promise<void> {
        delete this.settings.googleAccessToken;
        delete this.settings.googleRefreshToken;
        await this.saveSettings();
        this.gcalClient?.cleanup();
        delete this.gcalClient;
    }

    private initGoogleCalendarClient(): void {
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

        this.gcalClient = new GoogleCalendarClient(credentials, onTokensUpdated);
    }
}
