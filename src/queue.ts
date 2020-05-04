import { Command } from './command';
import { Subject, BehaviorSubject } from 'rxjs';
import { scan } from 'rxjs/operators';

/**
 * The purpose of this prototype - the **Queue**! It handles commands,
 * makes network requests, and does the best to implement all goals mentioned
 * in the README.
 */
export class Queue {
    constructor() {
        // create the subjects
        this.rawEnqueuedCommands = new Subject<Command>();
        this.counter = new BehaviorSubject<number>(0);

        this.initializeCounter();
    }

    /**
     * Adds a new command to the queue for processing.
     */
    enqueue(command: Command): void {
        this.rawEnqueuedCommands.next(command);
    }

    /**
     * Returns the length of the queue - i. e. the number of yet
     * unprocessed commands.
     */
    length(): number {
        return this.counter.value;
    }

    // PRIVATE

    /**
     * Initialize the counter behaviour subject.
     */
    private initializeCounter() {
        this.rawEnqueuedCommands
            .pipe(scan(acc => acc + 1, 0))
            .subscribe(this.counter);
    }

    /**
     * Counter subject for storing the current queue length.
     */
    private counter: BehaviorSubject<number>;

    /**
     * Raw commands coming from outside. Commands are pushed imperatively
     * into this subject.
     */
    private rawEnqueuedCommands: Subject<Command>;
}
