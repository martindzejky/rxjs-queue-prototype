import { Command } from './command';
import { Subject, BehaviorSubject, from } from 'rxjs';
import { buffer, filter, flatMap, scan } from 'rxjs/operators';

/**
 * The purpose of this prototype - the **Queue**! It handles commands,
 * makes network requests, and does the best to implement all goals mentioned
 * in the README.
 */
export class Queue {
    constructor() {
        // create the subjects
        this.rawEnqueuedCommands = new Subject<Command>();
        this.counterSubject = new BehaviorSubject<number>(0);
        this.processSubject = new Subject<void>();

        this.initializeCounter();
        this.initializeQueueProcessing();
    }

    /**
     * Adds a new command to the queue for processing.
     */
    enqueue(command: Command): void {
        this.rawEnqueuedCommands.next(command);
    }

    /**
     * Forces the queue to process all commands.
     */
    process(): void {
        this.processSubject.next();
    }

    /**
     * Returns the length of the queue - i. e. the number of yet
     * unprocessed commands.
     */
    length(): number {
        return this.counterSubject.value;
    }

    // PRIVATE

    /**
     * Initialize the counter behaviour subject.
     */
    private initializeCounter() {
        this.rawEnqueuedCommands
            .pipe(scan(acc => acc + 1, 0))
            .subscribe(this.counterSubject);
    }

    /**
     * Initialize the manual process pipeline.
     */
    private initializeQueueProcessing() {
        this.rawEnqueuedCommands
            .pipe(
                buffer(this.processSubject),

                // convert the buffered command array back into
                // a sequence of emitted commands
                flatMap(commands => from(commands)),

                // filter only those that have a callback functions,
                // other commands are already done
                filter(command => !!command.callback),
            )
            .subscribe(command => {
                command.callback!({});
            });
    }

    /**
     * Counter subject for storing the current queue length.
     */
    private counterSubject: BehaviorSubject<number>;

    /**
     * This subject emits when the queue is manually triggered to process
     * its commands.
     */
    private processSubject: Subject<void>;

    /**
     * Raw commands coming from outside. Commands are pushed imperatively
     * into this subject.
     */
    private rawEnqueuedCommands: Subject<Command>;
}
