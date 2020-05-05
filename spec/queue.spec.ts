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
    });
});
