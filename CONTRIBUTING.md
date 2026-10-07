# Contributing

## Build & Install

```bash

# install frontend
npm install

# build for production with minification
npm run build

# install backend
pip install -e .

```

Alternatively, with [pixi](https://pixi.sh), which provides the `backend`,
`frontend`, `test` and `lint` environments defined in `pixi.toml`:

```bash
# install frontend
pixi run -e frontend npm install

# build for production with minification (runs `npm audit fix` first)
pixi run -e frontend build-frontend
```

The pixi environments install the backend dependencies when first used.

## Run

```bash
# serve at localhost:22000
multivisor -c multivisor.conf
# or
pixi run -e backend python -m multivisor.server.web -c multivisor.conf
```

Start a browser pointing to [localhost:22000](http://localhost:22000)

## Development mode

You can run the backend using the vite dev server to facilitate your
development cycle:

First, start multivisor (which listens on 22000 by default):

```bash
python -m multivisor.server.web -c multivisor.conf
# or, with examples/full_example/multivisor.conf
pixi run -e backend dev-backend
```

Now, in another console, run the vite dev server (it will
transfer the requests between the browser and multivisor):

``` bash
npm run dev
# or
pixi run -e frontend dev-frontend
```

That's it. If you modify `App.vue` for example, you should see the changes
directly on your browser.

## Tests

```bash
# backend tests
pixi run -e test test

# frontend unit tests
npm test
# or
pixi run -e frontend test-frontend
```

Frontend unit tests are `src/**/*.test.js` files run with [Vitest](https://vitest.dev).

## Linting

```bash
# backend
pixi run -e lint lint

# frontend
npm run lint
npm run format
# or
pixi run -e frontend npm run lint
pixi run -e frontend npm run format
```

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request and on
pushes to `develop`:

- `lint`: backend linting
- `test`: backend tests
- `test-frontend`: frontend unit tests and production build

## Packaging

See [PACKAGING.md](PACKAGING.md).
