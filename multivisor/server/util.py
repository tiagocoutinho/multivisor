import hashlib
import functools

from flask import session, abort


def is_login_valid(app, username, password):
    username = username.strip()
    password = password.strip()

    correct_username = app.multivisor.config["username"]
    correct_password = app.multivisor.config["password"]
    return constant_time_compare(username, correct_username) and constant_time_compare(
        password, correct_password
    )


def constant_time_compare(val1, val2):
    """
    Returns True if the two strings are equal, False otherwise.

    The time taken is independent of the number of characters that match.

    For the sake of simplicity, this function executes in constant time only
    when the two strings have the same length. It short-circuits when they
    have different lengths.

    Taken from Django Source Code
    """
    val1 = hashlib.sha1(val1).hexdigest()
    if val2.startswith("{SHA}"):  # password can be specified as SHA-1 hash in config
        val2 = val2.split("{SHA}")[1]
    else:
        val2 = hashlib.sha1(val2).hexdigest()
    if len(val1) != len(val2):
        return False
    result = 0
    for x, y in zip(val1, val2):
        result |= ord(x) ^ ord(y)
    return result == 0


def login_required(app):
    """
    Decorator to mark view as requiring being logged in
    """

    def decorator(func):
        @functools.wraps(func)
        def wrapper_login_required(*args, **kwargs):
            auth_on = app.multivisor.use_authentication

            if not auth_on or "username" in session:
                return func(*args, **kwargs)

            # user not authenticated, return 401
            abort(401)

        return wrapper_login_required

    return decorator
