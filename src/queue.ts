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
     * Start processing incoming commands.
     * Also process any buffered commands already enqueued
     * before the processing started.
     */
    startProcessing(): void {}

    // PRIVATE

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
