import sys
import logging
import xmlrpc.client

from os import environ
from functools import partial

from gevent import spawn
from gevent.lock import RLock
from gevent.queue import Queue
from gevent.fileobject import FileObject
from zerorpc import stream, Server, LostRemote
from supervisor.childutils import getRPCInterface


READY = "READY\n"
ACKNOWLEDGED = "RESULT 2\nOK"
DEFAULT_BIND = "tcp://*:9002"


def signal(stream, msg):
    stream.write(msg)
    stream.flush()


def wait_for_event(stream):
    header_line = stream.readline()
    event = dict((x.split(":") for x in header_line.split()))
    payload_str = stream.read(int(event["len"]))
    event["payload"] = dict((x.split(":") for x in payload_str.split()))
    return event


def event_producer_loop(dispatch):
    istream = FileObject(sys.stdin)
    ostream = FileObject(sys.stdout, mode='w')
    while True:
        signal(ostream, READY)
        event = wait_for_event(istream)
        dispatch(event)
        signal(ostream, ACKNOWLEDGED)


def event_consumer_loop(queue, handler):
    for event in queue:
        try:
            handler(event)
        except:
            logging.exception("Error processing %s", event)


get_rpc = partial(getRPCInterface, environ)


def build_method(supervisor, name):
    subsystem_name, func_name = name.split(".", 1)
    def method(*args):
        subsystem = getattr(supervisor.rpc, subsystem_name)
        with supervisor.lock:
            return getattr(subsystem, func_name)(*args)
    method.__name__ = func_name
    return func_name, method


class Supervisor(object):

    def __init__(self, xml_rpc):
        self.event_channels = set()
        self.lock = RLock()
        self.rpc = xml_rpc
        for name in self.rpc.system.listMethods():
            setattr(self, *build_method(self, name))

    @stream
    def event_stream(self):
        logging.info("client connected to stream")
        channel = Queue()
        self.event_channels.add(channel)
        try:
            yield "First event to trigger connection. Please ignore me!"
            for event in channel:
                yield event
        except LostRemote as e:
            logging.info("remote end of stream disconnected")
        finally:
            self.event_channels.remove(channel)

    def publish_event(self, event):
        name = event["eventname"]
        if name.startswith("TICK"):
            return
        event = dict(event)
        if name.startswith("PROCESS_STATE"):
            payload = event["payload"]
            pname = "{}:{}".format(payload["groupname"], payload["processname"])
            logging.info("handling %s of %s", name, pname)
            try:
                payload["process"] = self.getProcessInfo(pname)
            except xmlrpc.client.Fault:
                # probably supervisor is shutting down
                logging.warn("probably shutting down...")
                return
        elif not name.startswith("SUPERVISOR_STATE"):
            logging.warning("ignored %s", name)
            return
        for channel in self.event_channels:
            channel.put(event)


def run(xml_rpc, bind=DEFAULT_BIND):
    channel = Queue()
    supervisor = Supervisor(xml_rpc)
    t1 = spawn(event_consumer_loop, channel, supervisor.publish_event)
    t2 = spawn(event_producer_loop, channel.put)
    server = Server(supervisor)
    server.bind(bind)
    server.run()


def main(args=None):
    import gevent.monkey

    gevent.monkey.patch_all(thread=False, sys=True)

    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--bind", help="bind address", default=DEFAULT_BIND)
    parser.add_argument(
        "--log-level",
        help="log level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARN", "ERROR"],
    )
    options = parser.parse_args(args)

    log_level = getattr(logging, options.log_level.upper())
    log_fmt = "%(levelname)s %(asctime)-15s %(name)s: %(message)s"
    logging.basicConfig(level=log_level, format=log_fmt)

    bind = options.bind
    if "://" not in bind:
        bind = "tcp://" + bind
    try:
        rpc = get_rpc()
    except KeyError:
        print("multivisor-rpc can only run as supervisor eventlistener", file=sys.stderr)
        exit(1)
    run(rpc, bind)


if __name__ == "__main__":
    main()
