# Vendored from zerorpc-python, see LICENSE in this directory.


class ReqRep(object):

    def process_call(self, context, channel, req_event, functor):
        context.hook_server_before_exec(req_event)
        result = functor(*req_event.args)
        rep_event = channel.new_event(u'OK', (result,),
                context.hook_get_task_context())
        context.hook_server_after_exec(req_event, rep_event)
        channel.emit_event(rep_event)

    def accept_answer(self, event):
        return event.name in (u'OK', u'ERR')

    def process_answer(self, context, channel, req_event, rep_event,
            handle_remote_error):
        try:
            if rep_event.name == u'ERR':
                exception = handle_remote_error(rep_event)
                context.hook_client_after_request(req_event, rep_event, exception)
                raise exception
            context.hook_client_after_request(req_event, rep_event)
            return rep_event.args[0]
        finally:
            channel.close()


class ReqStream(object):

    def process_call(self, context, channel, req_event, functor):
        context.hook_server_before_exec(req_event)
        xheader = context.hook_get_task_context()
        for result in iter(functor(*req_event.args)):
            channel.emit(u'STREAM', result, xheader)
        done_event = channel.new_event(u'STREAM_DONE', None, xheader)
        # NOTE: "We" made the choice to call the hook once the stream is done,
        # the other choice was to call it at each iteration. I donu't think that
        # one choice is better than the other, so Iu'm fine with changing this
        # or adding the server_after_iteration and client_after_iteration hooks.
        context.hook_server_after_exec(req_event, done_event)
        channel.emit_event(done_event)

    def accept_answer(self, event):
        return event.name in (u'STREAM', u'STREAM_DONE')

    def process_answer(self, context, channel, req_event, rep_event,
            handle_remote_error):

        def is_stream_done(rep_event):
            return rep_event.name == u'STREAM_DONE'
        channel.on_close_if = is_stream_done

        def iterator(req_event, rep_event):
            try:
                while rep_event.name == u'STREAM':
                    # Like in process_call, we made the choice to call the
                    # after_exec hook only when the stream is done.
                    yield rep_event.args
                    rep_event = channel.recv()
                if rep_event.name == u'ERR':
                    exception = handle_remote_error(rep_event)
                    context.hook_client_after_request(req_event, rep_event, exception)
                    raise exception
                context.hook_client_after_request(req_event, rep_event)
            finally:
                channel.close()

        return iterator(req_event, rep_event)


patterns_list = [ReqStream(), ReqRep()]
