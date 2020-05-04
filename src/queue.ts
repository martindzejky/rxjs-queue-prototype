import { Command } from './command';

/**
 * The purpose of this prototype - the **Queue**! It handles commands,
 * makes network requests, and does the best to implement all goals mentioned
 * in the README.
 */
export class Queue {
    /**
     * Adds a new command to the queue for processing.
     */
    enqueue(command: Command): void {
        command.name;
    }

    /**
     * Returns the length of the queue - i. e. the number of yet
     * unprocessed commands.
     */
    length(): number {
        return 0;
    }
}
