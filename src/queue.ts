import { from, merge, Observable, ReplaySubject, Subject, zip } from 'rxjs';
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
import { Transport } from './transport';

/**
 * The purpose of this prototype - the **Queue**! It handles commands,
 * makes network requests, and does the best to implement all goals mentioned
 * in the README.
 */
export class Queue {
    constructor(private options: QueueOptions, transport: Transport) {
        // create the subjects
        this.rawEnqueuedCommands$ = new Subject<Command>();
        this.replayedCommands$ = new ReplaySubject<Command>();
        this.process$ = new Subject<void>();

        // start by making an observable of buffered commands
        const bufferedCommands$ = this.rawEnqueuedCommands$.pipe(
            // buffer commands so they are processed in bulk
            bufferWhen(() => this.makeBufferLimiter()),

            // filter empty buffers, could be triggered by calling process()
            // manually multiple times
            filter(buffer => buffer.length > 0),
        );

        // next, make an observable for the network requests
        const networkData$ = bufferedCommands$.pipe(
            // send the commands to the API
            flatMap(commands => transport.send(commands)),

            // convert the data array into a series of emitted
            // data objects
            flatMap(data => from(data)),
        );

        // next, prepare an observable that just emits
        // the buffered commands one by one
        const commandsOneByOne$ = bufferedCommands$.pipe(
            // convert the buffered command array back into
            // a sequence of emitted commands
            flatMap(commands => from(commands)),
        );

        // finally, make the queue observable
        this.queue$ = zip(
            // zip together commands and their data from the network.
            // there should always be the same amount of commands and network
            // data so zip makes perfect sense here
            commandsOneByOne$,
            networkData$,
        ).pipe(
            // filter only those commands that have a callback function,
            // other commands are already finished and apparently don't need
            // the network data
            filter(([command]) => !!command.callback),

            // call command callbacks with the data from the network
            map(([command, data]) => {
                command.callback!(data);
            }),
        );
    }

    /**
     * Adds a new command to the queue for processing.
     */
    enqueue(command: Command): void {
        this.rawEnqueuedCommands$.next(command);

        // if not processing yet, store the commands in
        // a replay subject for later
        if (!this.isProcessing) {
            this.replayedCommands$.next(command);
        }
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
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        // subscribe to the queue observable, triggering the process
        this.queue$.subscribe({
            error: err => {
                throw err;
            },
        });

        // replay all stored commands enqueued before the processing started
        this.replayedCommands$.subscribe(this.rawEnqueuedCommands$);
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
     * Used for storing commands that are enqueued before
     * processing starts.
     */
    private readonly replayedCommands$: ReplaySubject<Command>;

    /**
     * The final queue observable that, when subscribed, starts
     * processing commands.
     */
    private readonly queue$: Observable<void>;
}
