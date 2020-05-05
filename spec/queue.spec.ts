import { Queue } from '../src/queue';

describe('Queue', () => {
    let queue: Queue;

    beforeEach(() => {
        queue = new Queue();
    });

    describe('#enqueue', () => {
        it('should enqueue a command', () => {
            queue.enqueue({ name: 'ping' });

            expect(queue.length()).toEqual(1);
        });

        it('should enqueue multiple commands', () => {
            queue.enqueue({ name: 'ping' });
            queue.enqueue({ name: 'ping' });
            queue.enqueue({ name: 'time' });

            expect(queue.length()).toEqual(3);
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

            jasmine.clock().tick(1000);

            expect(callback).toHaveBeenCalled();
        });
    });
});
