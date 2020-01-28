# Multivisor
[![Build Status](https://travis-ci.org/guy881/multivisor.svg?branch=develop)](https://travis-ci.org/guy881/multivisor)

A centralized supervisor UI (Web & CLI)

* Processes status always up to date
* Reactivity through asynchronous actions
* Notifications when state changes
* Mobile aware, SPA web page
* Powerful filters
* Interactive CLI

## Web interface

![multivisor on chrome desktop app mode](doc/multivisor_desktop.png)

## Command line interface

[![multivisor-cli](https://asciinema.org/a/8gQrjXDanvfafT7UnPXS1u0bp.png)](https://asciinema.org/a/8gQrjXDanvfafT7UnPXS1u0bp?autoplay=1&speed=2)

# Running the example from scratch

```bash
# Fetch the project:
git clone https://github.com/tiagocoutinho/multivisor
cd multivisor


# Install frontend dependencies
npm install
# Build for production with minification
npm run build

# install backend: feel free to use your favorite python virtual environment
# here. Otherwise you will need administrative privileges
pip install .

# Launch a few supervisors
mkdir examples/full_example/log
supervisord -c examples/full_example/supervisord_lid001.conf
supervisord -c examples/full_example/supervisord_lid002.conf
supervisord -c examples/full_example/supervisord_baslid001.conf

# Finally, launch multivisor:
multivisor -c examples/full_example/multivisor.conf
```

That's it!

## Web interface

Start a browser pointing to [localhost:22000](http://localhost:22000). On a mobile
device it should look something like this:

![multivisor on mobile](doc/multivisor_mobile.png)

## Command line interface

Type on the command line:
```
multivisor-cli
```

# Technologies

![multivisor diagram](doc/diagram.png)

The `multivisor` backend runs a [flask](http://flask.pocoo.org/) web server.

The `multivisor-cli` runs a
[prompt-toolkit 2](http://python-prompt-toolkit.rtfd.io) based console.

The frontend is based on [vue](https://vuejs.org/) +
[vuex](https://vuex.vuejs.org/) + [vuetify](https://vuetifyjs.com/).


# Configuration

## Supervisor

Make sure multivisor is installed in the same environment as the one supervisor(s) is(are) running.
Then, configure the multivisor rpc interface by adding the following lines
to your supervisord.conf:

```ini
[rpcinterface:multivisor]
supervisor.rpcinterface_factory = multivisor.rpc:make_rpc_interface
bind=*:9002
multivisor_keys=<some_secret_key>
```
Parameters:
* `bind` - address and port on which multivisor rpc interface will listen to multivisor server connections, 
it defaults to `*:9002`.
* `multivisor_keys` - comma-separated list of secret keys (much like `authorized_keys` in SSH) which will restrict 
access to multivisor servers which have this key provided in supervisor section config. More about this in 
security section.

Repeat the above procedure for every supervisor you have running.

## Multivisor

The `multivisor` web server relies on the multivisor rpc interface running on
each supervisor.

The multivisor web server is configured with a INI like configuration file
(much like supervisor itself). It is usually named *multivisor.conf* and it
must be passed as argument to multivisor when starting the server.

It consists of a `global` section where you can give an optional name to your
multivisor instance (default is *multivisor*. This name will appear on the top
left corner of multivisor the web page).

To add a new supervisor to the list simply add a section `[supervisor:<name>]`.
It accepts an optional `url` in the format `[<host>][:<port>]`. The default
is `<name>:9002`.

Here is some basic example:

```ini
[global]
name=ACME

[supervisor:roadrunner]
# since no url is given it will be roadrunner:9002

[supervisor:coyote]
# no host is given: defaults to coyote
url=:9011

[supervisor:bugsbunny]
# no port is given: defaults to 9002
url=bugsbunny.acme.org

[supervisor:daffyduck]
url=daffyduck.acme.org:9007

[supervisor:secured]
url=:9002
# same as multivisor secret key provided in rpc_interface config
multivisor_key=<some_secret_key>
```

Of course the multivisor itself can be configured in supervisor as a normal
program.

### Authentication
To protect multivisor from unwanted access, you can enable required authentication.
Specify `username` and `password` parameters in `global` section of your configuration file e.g.:
```ini
[global]
username=test
password=test
```
You can also specify `password` as SHA-1 hash in hex, with `{SHA}` prefix: e.g.
`{SHA}a94a8fe5ccb19ba61c4c0873d391e987982fbbd3` (example hash is `test` in SHA-1).

In order to use authentication, you also need to set `MULTIVISOR_SECRET_KEY` environmental variable,
as flask sessions module needs some secret value to create secure session.
You can generate some random hash easily using included script: `generate_secret_key.py`.

Remember to restart the server after changes in configuration file.

**Warning**: this authentication on its own doesn't protect your supervisors rpc interface
from other multivisor connecting to it, read more about this in the security section.

## Build & Install

```bash

# install frontend
npm install

# build for production with minification
npm run build

# install backend
pip install .

```

## Run

```bash
# serve at localhost:22000
multivisor -c multivisor.conf
```

Start a browser pointing to [localhost:22000](http://localhost:22000)

## Development mode

You can run the backend using the webpack dev server to facilitate your
development cycle:

First, start multivisor (which listens on 22000 by default):

```bash
python -m multivisor.server.web -c multivisor.conf
```

Now, in another console, run the webpack dev server (it will
transfer the requests between the browser and multivisor):

``` bash
npm run dev
```

That's it. If you modify `App.vue` for example, you should see the changes
directly on your browser.


## Security
The project uses [zerorpc library](https://github.com/0rpc/zerorpc-python/) to invoke commands on supervisors instances.
That's why it is required to specify custom rpc interface in supervisor config. However, zerorpc should be used only in 
private networks, as it doesn't come with any kind of authentication. So you can add a supervisor to your multivisor
instance if you know IP and port of exposed multivisor RPC interface and control processes on another machine. That 
can be a security issue if those ports are open on the server.

To address this issue, the project uses a special header with the signature of the send message, generated using 
security key provided in both supervisor and multivisor config. The secret key can be generated using the script 
`generate_secret_key`.

See example configuration below.

**supervisor**:
```ini
[rpcinterface:multivisor]
supervisor.rpcinterface_factory = multivisor.rpc:make_rpc_interface
multivisor_keys=<some_secret_key>,<another_secret_key>
```

**multivisor**:
```ini
[supervisor:lid001]
url=localhost:9012
multivisor_key=<some_secret_key>
```

In above example only multivisors which provided `multivisor_key` as `<some_secret_key>` or `<another_secret_key>` can
connect to the specified supervisor.