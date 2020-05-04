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
});
