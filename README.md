# Rxjs Queue Prototype

Command queue prototype using [Rxjs](http://reactivex.io/) and
[Typescript](https://www.typescriptlang.org/).

## Goals

### Command

A command represents a query or a request for and API. The program schedules a
command when it wants some data from an API. It also registers a callback to be
called with the resulting data.

### Queue

The queue is responsible for handling commands from the application. It is
supposed to perform network requests to receive data queried by the program. At
the same time, it makes sure the network is not overloaded and its usage is
optimized, and that the commands are not lost and are eventually resolved.

These are the tasks of the queue:

-   Buffer commands in order to perform as few network requests as possible.
-   Perform API queries as soon as possible and resolve the provided callbacks
    with the received data.
-   Allow to limit the rate of network requests.
-   Allow to take a sample of commands and only send this sample to the API. The
    remaining commands are discarded.
-   Store the commands until the queue is told to start processing, at which
    point it starts making network requests and resolving command callbacks.

## Code

Build sources:

```
npm run build
```

Run tests:

```
npm run test
```
