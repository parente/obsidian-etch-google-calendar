import { calendar_v3, calendar } from "@googleapis/calendar";
import { OAuth2Client, type Credentials } from "google-auth-library";

// Values required for Google Calendar API access and token management
export interface GoogleCalendarCredentials {
	clientId: string;
	clientSecret: string;
	accessToken: string;
	refreshToken: string;
	callbackUrl: string;
}

// Scopes required for Google Calendar API access
export const GOOGLE_CALENDAR_SCOPES: string[] = [
	"https://www.googleapis.com/auth/calendar.readonly",
];

export interface CalendarData {
	events: calendar_v3.Schema$Events | null;
}

export class GoogleCalendarClient {
	private auth: OAuth2Client;
	private credentials: GoogleCalendarCredentials;
	private calendar: calendar_v3.Calendar;
	private onTokensUpdated?: (tokens: Credentials) => Promise<void>;

	constructor(
		credentials: GoogleCalendarCredentials,
		onTokensUpdated?: (tokens: Credentials) => Promise<void>
	) {
		this.credentials = credentials;
		this.onTokensUpdated = onTokensUpdated;

		this.auth = new OAuth2Client({
			clientId: this.credentials.clientId,
			clientSecret: this.credentials.clientSecret,
			redirectUri: this.credentials.callbackUrl,
		});

		if (this.credentials.accessToken) {
			this.auth.setCredentials({
				access_token: this.credentials.accessToken,
				refresh_token: this.credentials.refreshToken,
			});

			// Set up automatic token refresh
			this.auth.on("tokens", (tokens) => {
				if (tokens.refresh_token) {
					this.credentials.refreshToken = tokens.refresh_token;
				}
				if (tokens.access_token) {
					this.credentials.accessToken = tokens.access_token;
				}
				// Notify that tokens have been updated
				void this.onTokensUpdated?.(tokens);
			});
		}

		this.calendar = calendar({ version: "v3", auth: this.auth });
	}

	async getEventsForDate(date: string): Promise<calendar_v3.Schema$Events | null> {
		try {
			if (!this.credentials.clientId || !this.credentials.clientSecret) {
				throw new Error("Google Calendar API credentials not configured");
			}

			const startOfDay = new Date(date);
			startOfDay.setHours(0, 0, 0, 0);

			const endOfDay = new Date(date);
			endOfDay.setHours(23, 59, 59, 999);

			const response = await this.calendar.events.list({
				calendarId: "primary",
				timeMin: startOfDay.toISOString(),
				timeMax: endOfDay.toISOString(),
				singleEvents: true,
				orderBy: "startTime",
			});

			return response.data;
		} catch (error) {
			console.error("Error fetching calendar events:", error);
			return null;
		}
	}

	cleanup(): void {
		this.auth.removeAllListeners();
	}
}
