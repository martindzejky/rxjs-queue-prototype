import { Observable, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { Command } from './command';

/**
 * Transport is a mock which would perform HTTP requests
 * in production. It is used for stubbing in the tests.
 * By default, it simulates small network latency and returns
 * empty data for reach received command.
 */
export class Transport {
    /**
     * Simulates a network request for sending the commands to an API
     * and receiving the data for each command.
     */
    send(commands: Array<Command>): Observable<Array<Record<string, string>>> {
        return of(commands).pipe(
            // simulate the network with a random delay
            this.simulatedDelay > 0 ? delay(this.simulatedDelay) : tap(),

            // the API would return some data for the commands
            map(commands =>
                commands.map(command => this.makeDataForCommand(command)),
            ),

            // the observable is completed by the `of` operator automatically
            // after it emits the data
        );
    }

    /**
     * This function is stubbed in tests to make better data
     * for incoming commands.
     */
    makeDataForCommand(_: Command): Record<string, string> {
        return {};
    }

    /**
     * Sets the simulated network delay, used in tests.
     */
    setSimulatedDelay(delay: number) {
        this.simulatedDelay = delay;
    }

    // PRIVATE

    /**
     * Simulated network delay, configurable in the tests.
     */
    private simulatedDelay = 0;
}
