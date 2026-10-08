# Vendored zerorpc

This package is a trimmed, patched copy of
[zerorpc-python](https://github.com/0rpc/zerorpc-python), vendored directly
into multivisor. See `LICENSE` for the original MIT license and copyright.

## Why vendor instead of depend on it

`zerorpc` on PyPI has been unmaintained for years. The concrete problem is
`gevent_zmq.py`: a private shim that reimplements a gevent-aware zmq
`Context`/`Socket` (~150 lines, based on the old `traviscline/gevent-zeromq`
project) and has grown incompatible with recent pyzmq/gevent releases.

The originally proposed fix
([#113](https://github.com/tiagocoutinho/multivisor/issues/113)) was to drop
zerorpc entirely: `xmlrpc.client` for commands, raw `pyzmq` for events. That
would mean hand-rolling message framing, request/reply matching, heartbeats,
timeouts, and the streaming (`@stream`) support that `event_stream()` relies
on in both `multivisor/rpc.py` and `multivisor/multivisor.py`.

Instead, `gevent_zmq.py` was deleted and every import of it replaced with
`zmq.green` — pyzmq's own maintained module, descended from the same
upstream project `gevent_zmq.py` was based on. That's the actual fix for the
actual problem, without reimplementing the rest of the RPC protocol.

## What changed vs. upstream

- `gevent_zmq.py` removed; `context.py`, `events.py`, `core.py` now
  `import zmq.green as zmq` instead of `from . import gevent_zmq as zmq`.
- Dropped Python 2 compatibility: `from __future__ import ...`,
  `from builtins import ...`, `from future.utils import ...` removed
  (multivisor requires Python >= 3.10, so the `future` package is no longer
  a dependency at all).
- `inspect.getargspec` → `inspect.getfullargspec` (`getargspec` was removed
  in Python 3.11).
- `cli.py` and `version.py` dropped — multivisor never used the zerorpc CLI
  or its `__version__`.
- Unused transport classes removed: `Pusher`, `Puller`, `Publisher`,
  `Subscriber`, and the `fork_task_context` helper (PUSH/PULL/PUB/SUB
  sockets). multivisor only ever uses `Server`/`Client` (ROUTER/DEALER,
  request/reply + streaming replies).
- Fixed a latent bug in `events.py`: `SequentialSender._send` and
  `SequentialReceiver._recv` caught `except (GreenletExit, Timeout) as e:`
  and referenced `e` again after the block. In Python 3 that name is
  deleted when the `except` block exits (PEP 3110), so the intended
  re-raise crashed with `UnboundLocalError` instead. This is reachable in
  practice: `Sender`/`Receiver` (used by the ROUTER/DEALER sockets
  `Server`/`Client` actually open) call these methods directly, and a
  killed greenlet or timeout mid-send/recv — e.g. during shutdown — used to
  trigger it. Simplified to retry once and let any exception propagate
  naturally, which was the actual intent.
- Removed unused `gevent.queue`/`gevent.local`/`gevent.lock` imports left
  over from a shared upstream import block that didn't match per-file usage.

## What's still there unchanged (and why)

- The `__dict__`-based attribute tricks in `context.py` (the "pyzmq 13.0.0
  messed up with setattr" workaround) look like ancient cruft but are still
  required: tested against pyzmq 27.1.0, plain attribute assignment on a
  `zmq.Context` subclass still raises, because pyzmq's `AttrSettr` mixin
  intercepts `__setattr__` and tries to treat it as a socket option.
- The context/hook/middleware machinery in `context.py` is load-bearing:
  `multivisor/rpc.py` registers a `ServerMiddleware` via
  `context.register_middleware(...)` to post-process reply arguments.

## Known remaining simplification candidates (not done)

These are real but lower-value/higher-touch cleanups, left alone for now:

- Protocol v1/v2 backward-compat branches (`HeartBeatOnChannel._compat_v2`,
  `ServerBase._async_task`'s `protocol_v1` handling). Dead in practice since
  both client and server are this same vendored code (always protocol v3),
  but removing it touches several interacting spots for modest savings.
- The `_zerorpc_inspect`/`_zerorpc_list`/`_zerorpc_help`/`_zerorpc_args`/
  `_zerorpc_ping`/`_zerorpc_name` introspection builtins injected into every
  `Server`, and the `async=True` kwarg on `Client.__call__` — unused by
  multivisor but small and harmless to keep.

## What multivisor actually uses

`Server`, `Client`, `stream`, `Context`, `LostRemote`, `TimeoutExpired`,
`RemoteError` — imported in `multivisor/rpc.py`, `multivisor/server/rpc.py`,
and `multivisor/multivisor.py`.
