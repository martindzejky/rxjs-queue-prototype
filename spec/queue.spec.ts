import { take, drop } from 'lodash';
import { VirtualTimeScheduler } from 'rxjs';
import { Command } from '../src/command';
import { Queue } from '../src/queue';
import { QueueOptions } from '../src/queue-options';
import { Transport } from '../src/transport';

describe('Queue', () => {
    let scheduler: VirtualTimeScheduler;
    let transport: Transport;
    let queueOptions: QueueOptions;
    let queue: Queue;

    beforeEach(() => {
        scheduler = new VirtualTimeScheduler();
        transport = new Transport(scheduler);

        spyOn(transport, 'send').and.callThrough();

        spyOn(transport, 'makeDataForCommand').and.callFake(command => ({
            data: `${command.name} data`,
        }));

        queueOptions = {
            debounceTime: 500,
            maxProcessedCommands: 10,
        };

        queue = new Queue(queueOptions, transport);
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

        it('should not process commands after the buffer limit is reached', () => {
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

        it('should send commands in bulk through the transport', () => {
            const callback = jasmine.createSpy('command');

            queue.enqueue({ name: 'test', callback });
            queue.enqueue({ name: 'ping' });
            queue.enqueue({ name: 'ping' });
            queue.enqueue({ name: 'ping' });
            queue.startProcessing();

            jasmine.clock().tick(queueOptions.debounceTime + 100);

            expect(transport.send).toHaveBeenCalledTimes(1);
            expect(transport.makeDataForCommand).toHaveBeenCalledTimes(4);

            expect(callback).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    data: 'test data',
                }),
            );
        });

        // disabled because I don't know how to force the delay operator to "tick"
        it('should handle random network delays', () => {
            transport.setSimulatedDelay(Math.random() * 200 + 100);

            const callback = jasmine.createSpy('command');

            queue.enqueue({ name: 'test', callback });
            queue.enqueue({ name: 'ping' });
            queue.enqueue({ name: 'ping' });
            queue.startProcessing();

            jasmine.clock().tick(queueOptions.debounceTime + 100);

            // flush the transport scheduler. for some reason, jasmine.clock().tick()
            // does not work with the delay operator :shrug:
            scheduler.flush();

            expect(callback).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    data: 'test data',
                }),
            );
        });
    });
});
