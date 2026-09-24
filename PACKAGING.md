# Packaging for PyPi

## Frontend

Requires a recent version of nodejs that can be installed with Conda/Pixi for instance.

1. Check for vulnerability with

```
npm audit
...
20 vulnerabilities (1 moderate, 19 high)
```

To address issues that do not require attention, run:

```
npm audit fix
```

Note that some vulnerabilities may concern only build tools and thus are not something to worry to much about.

2. Build the frontend

To build the frontend in the `dist` folder, run

```
npm run build
```

## Backend and Wheel

Once the frontend is built, one can generate the Python wheel as usual with:

```
python -m build
...
removing build/bdist.linux-x86_64/wheel
Successfully built multivisor-7.0.0rc1.tar.gz and multivisor-7.0.0rc1-py3-none-any.whl
```

Uploading the package to PyPi requires `twine`:

```
twine upload dist/multivisor-7.0.0rc1-py3-none-any.whl
```
