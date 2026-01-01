/**
 * Google Calendar API client for fetching calendar events.
 *
 * Adapted from https://github.com/lexafaxine/GoogleCalendarImporter
 */
import { calendar_v3, calendar } from "@googleapis/calendar";
import { OAuth2Client, type Credentials } from "google-auth-library";
import moment from "moment-timezone";

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

    /**
     * Gets the timezone of a calendar.
     *
     * @param calendarId Defaults to "primary"
     * @returns IANA timezone name
     */
    async getCalendarTimeZone(calendarId: string = "primary"): Promise<string> {
        try {
            const calGet = await this.calendar.calendars.get({
                calendarId: "primary",
            });
            return calGet.data.timeZone || "UTC";
        } catch (error) {
            console.error("Error fetching calendar timezone:", error);
            const message =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred fetching calendar timezone";
            throw new Error(`Failed to fetch calendar timezone: ${message}`);
        }
    }

    /**
     * Filters out events that do not start on the specified date, to handle spillover events from
     * previous or next days.
     */
    private filterSpilloverEvents(
        events: calendar_v3.Schema$Event[],
        date: string,
        calendarTimeZone: string
    ): calendar_v3.Schema$Event[] {
        const startOfDay = moment.tz(date, calendarTimeZone).startOf("day");
        const endOfDay = moment.tz(date, calendarTimeZone).endOf("day");

        return events.filter((event) => {
            // Keep all-day events
            if (event.start?.date && !event.start?.dateTime) {
                return true;
            }
            // Drop anything else without a start time
            const startTime = event.start?.dateTime;
            if (!startTime) return false;
            // Keep any event starting within the day
            const eventStart = moment.tz(startTime, calendarTimeZone);
            return eventStart.isSameOrAfter(startOfDay) && eventStart.isSameOrBefore(endOfDay);
        });
    }

    /**
     * Gets events for a single date in a calendar's configured timezone.
     *
     * @param date in YYYY-MM-DD format
     * @param calendarId Defaults to "primary"
     * @param eventTypes Optional array of event types to filter by
     * @returns Events or null on error
     */
    async getEventsForDate({
        date,
        calendarId = "primary",
        eventTypes,
    }: {
        date: string;
        calendarId?: string;
        eventTypes?: string[];
    }): Promise<calendar_v3.Schema$Events> {
        try {
            const calendarTimeZone = await this.getCalendarTimeZone(calendarId);

            // Query for events falling within the start and end of a day *in the calendar's
            // timezone offset*
            const timeMin = moment.tz(`${date} 00:00:00.000`, calendarTimeZone).format();
            const timeMax = moment.tz(`${date} 23:59:59.999`, calendarTimeZone).format();

            const evtList = await this.calendar.events.list({
                calendarId: calendarId,
                timeMin,
                timeMax,
                singleEvents: true,
                eventTypes: eventTypes,
                orderBy: "startTime",
            });

            // Filter to only include events that *start* on the given date
            if (evtList.data.items) {
                evtList.data.items = this.filterSpilloverEvents(
                    evtList.data.items,
                    date,
                    calendarTimeZone
                );
            }

            return evtList.data;
        } catch (error) {
            console.error("Error fetching calendar events:", error);
            const message =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred fetching calendar events";
            throw new Error(`Failed to fetch calendar events: ${message}`);
        }
    }

    cleanup(): void {
        this.auth.removeAllListeners();
    }
}
