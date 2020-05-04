/**
 * Command encapsulates a query for a data from an API.
 * It describes the data sent to the API and specifies a callback to be
 * called with the data from the API.
 *
 * To keep things simple in this prototype, the request and response data
 * types are limited to simple dictionaries of strings.
 */
export interface Command {
    name: string;
    queryData?: Record<string, string>;
    callback?: (data: Record<string, string>) => void;
}
