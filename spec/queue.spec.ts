import { take, drop } from 'lodash';
import { Command } from '../src/command';
import { Queue } from '../src/queue';
import { QueueOptions } from '../src/queue-options';

describe('Queue', () => {
    let queueOptions: QueueOptions;
    let queue: Queue;

    beforeEach(() => {
        queueOptions = {
            debounceTime: 500,
            maxProcessedCommands: 10,
        };

        queue = new Queue(queueOptions);
    });

    describe('#enqueue', () => {
        it('should enqueue a command', () => {
            queue.enqueue({ name: 'ping' });

            // expect(queue.length()).toEqual(1);
        });

        it('should enqueue multiple commands', () => {
            queue.enqueue({ name: 'ping' });
            queue.enqueue({ name: 'ping' });
            queue.enqueue({ name: 'time' });

            // expect(queue.length()).toEqual(3);
        });
    });

    describe('#process', () => {
        it('should process enqueued commands immediately', () => {
            const pingCallback = jasmine.createSpy('ping');
            const timeCallback = jasmine.createSpy('time');

            queue.enqueue({ name: 'ping', callback: pingCallback });
            queue.enqueue({ name: 'time', callback: timeCallback });

            queue.process();

            expect(pingCallback).toHaveBeenCalled();
            expect(timeCallback).toHaveBeenCalled();
        });

        it('should not process commands enqueued after the call', () => {
            const pingCallback = jasmine.createSpy('ping');
            const timeCallback = jasmine.createSpy('time');

            queue.enqueue({ name: 'ping', callback: pingCallback });
            queue.process();
            queue.enqueue({ name: 'time', callback: timeCallback });

            expect(pingCallback).toHaveBeenCalled();
            expect(timeCallback).not.toHaveBeenCalled();
        });
    });

    describe('#startProcessing', () => {
        beforeEach(() => {
            jasmine.clock().install();
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it('should process commands after a debounce', () => {
            const callback = jasmine.createSpy('command');

            queue.startProcessing();
            queue.enqueue({ name: 'test', callback });

            expect(callback).not.toHaveBeenCalled();

            jasmine.clock().tick(queueOptions.debounceTime + 100);

            expect(callback).toHaveBeenCalled();
        });

        it('should process commands enqueued before processing started', () => {
            const callback = jasmine.createSpy('command');

            queue.enqueue({ name: 'test', callback });
            queue.enqueue({ name: 'time' });
            queue.enqueue({ name: 'cookies' });

            queue.startProcessing();
            jasmine.clock().tick(queueOptions.debounceTime + 100);

            expect(callback).toHaveBeenCalled();
        });

        it('should process commands after the buffer limit is reached', () => {
            queue.startProcessing();

            const commands: Command[] = [...Array(15)].map(
                (_, i) =>
                    ({
                        name: `test ${i}`,
                        callback: jasmine.createSpy(`command callback ${i}`),
                    } as Command),
            );

            commands.forEach(command => queue.enqueue(command));

            take(commands, queueOptions.maxProcessedCommands).forEach(command =>
                expect(command.callback).toHaveBeenCalled(),
            );

            take(
                drop(commands, queueOptions.maxProcessedCommands),
                queueOptions.maxProcessedCommands,
            ).forEach(command =>
                expect(command.callback).not.toHaveBeenCalled(),
            );
        });
    });
});
