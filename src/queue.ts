import { from, merge, Observable, Subject } from 'rxjs';
import {
    bufferWhen,
    debounceTime,
    filter,
    first,
    flatMap,
    map,
    mapTo,
    scan,
} from 'rxjs/operators';
import { Command } from './command';
import { QueueOptions } from './queue-options';

/**
 * The purpose of this prototype - the **Queue**! It handles commands,
 * makes network requests, and does the best to implement all goals mentioned
 * in the README.
 */
export class Queue {
    constructor(private options: QueueOptions) {
        // create the subjects
        this.rawEnqueuedCommands$ = new Subject<Command>();
        this.process$ = new Subject<void>();

        // make the queue observable
        this.queue$ = this.rawEnqueuedCommands$.pipe(
            // buffer commands so they are processed in bulk
            bufferWhen(() => this.makeBufferLimiter()),

            // convert the buffered command array back into
            // a sequence of emitted commands
            flatMap(commands => from(commands)),

            // filter only those that have a callback functions,
            // other commands are already done
            filter(command => !!command.callback),

            // call command callbacks
            map(command => {
                command.callback!({});
            }),
        );
    }

    /**
     * Adds a new command to the queue for processing.
     */
    enqueue(command: Command): void {
        this.rawEnqueuedCommands$.next(command);
    }

    /**
     * Forces the queue to process all commands.
     */
    process(): void {
        this.startProcessing();
        this.process$.next();
    }

    /**
     * Start processing incoming commands.
     * Also process any buffered commands already enqueued
     * before the processing started.
     */
    startProcessing(): void {
        if (!this.isProcessing) {
            this.isProcessing = true;
            this.queue$.subscribe();
        }
    }

    // PRIVATE

    /**
     * Make an observable that emits when the command buffer is
     * ready to be processed.
     */
    private makeBufferLimiter(): Observable<void> {
        // process observable
        const process$ = this.process$;

        // debouncing observable
        const debounce$ = this.rawEnqueuedCommands$.pipe(
            debounceTime(this.options.debounceTime),
        );

        // limit maximum commands in buffer
        const counterLimit$ = this.rawEnqueuedCommands$.pipe(
            scan(counter => counter + 1, 0),
            filter(count => count > this.options.maxProcessedCommands),
        );

        // make the final observable
        return merge(process$, debounce$, counterLimit$).pipe(
            // close the buffer as soon as the first merged
            // observable emits
            first(),

            mapTo(undefined),
        );
    }

    /**
     * True if the queue is processing commands.
     */
    private isProcessing = false;

    /**
     * This subject emits when the queue is manually triggered to process
     * its commands.
     */
    private readonly process$: Subject<void>;

    /**
     * Raw commands coming from outside. Commands are pushed imperatively
     * into this subject.
     */
    private readonly rawEnqueuedCommands$: Subject<Command>;

    /**
     * The final queue observable that, when subscribed, starts
     * processing commands.
     */
    private readonly queue$: Observable<void>;
}
