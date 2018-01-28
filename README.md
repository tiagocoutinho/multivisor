# Multivisor

A centralized supervisor web UI inspired by [cesi](https://github.com/gamegos/cesi).

## Prepare Setup

Create a *multivisor.conf* describing your supervisors:

``` toml
[global]
name="Simpson's multivisor"

[supervisor:homer1]
host="homer.simpsons.com"

[supervisor:homer2]
host="homer.simpsons.com"
port=9002

[supervisor:bart]
host="bart.simpsons.com"
```

## Build

``` bash

# change to frontend directory
cd frontend

# install dependencies
npm install

# build for production with minification
npm run build

cd ..

# install python dependencies

pip install -r requirements.txt

```

## Run

``` bash
# serve at localhost:22000
./multivisor -c multivisor.conf
```

Start a browser pointing to [localhost:22000](http://localhost:22000)
