[![npm version](https://badge.fury.io/js/sd-builder.svg)](https://badge.fury.io/js/sd-builder)
[![Dependency Status](https://david-dm.org/staticdeploy/sd-builder.svg)](https://david-dm.org/staticdeploy/sd-builder)
[![devDependency Status](https://david-dm.org/staticdeploy/sd-builder/dev-status.svg)](https://david-dm.org/staticdeploy/sd-builder#info=devDependencies)

# sd-builder

Opinionated builder for react web projects.

## Usage

* `sd-builder dev` sets up dev environment with auto-recompiling
* `sd-builder build` builds the project
* `sd-builder config` writes the app configuration to `app-config.js`

## Main conventions

### Html

* The builder expects there to be an `app/main.html` file, which is compiled
  into `build/index.html`. For now the compilation consists in a simple a
  copy/paste.

### JS

* The builder expects there to be an `app/main.jsx` file, which is used as
  `webpack`'s entry point. The generated bundle is written to
  `build/_assets/js/app.js`.

* Files are compiled by babel. It's up to the user to specify which plugins to
  use by installing and listing them in a `.babelrc` config file.

* npm modules listed in `deps.json`'s `js` array are separated from the main
  bundle and compiled into `build/_assets/js/vendor.js`.

* During `webpack`'s compilation `NODE_PATH` includes the `app` directory.

* It's possible to `require` / `import` `.js`, `.jsx` and `.json` files.

* Source maps are always generated.

### Assets

* The content of the folder `app/assets` will be recursively copied into
  `build/_assets`.

### CSS

* Files listed in `deps.json`'s `css` array are bundled (concat) into
  `build/_assets/css/vendor.css`.

### Fonts

* Files listed in `deps.json`'s `fonts` array are copied (concat) into
  `build/_assets/fonts`.

### Version

* the build generates a `VERSION.txt` file (written to `build/VERSION.txt`)
  with the following format:
  * if building in a git repository, `[package.json version] - [git commit sha]`
  * otherwise, `[package.json version]`

### Changelog

* when a `CHANGELOG.md` file is present, it's copied to `build/CHANGELOG.md`

## Configuration

Running `sd-builder config` a `build/app-config.js` file is generated, exporting
one global variable, `window.APP_CONFIG`, which is a map of key-value pairs
gathered from:

* the `.env` file when `NODE_ENV=development`
* environment variables prefixed by `__APP_CONFIG__` file when
  `NODE_ENV=production`

You should add `app-config.js` script in your `main.html` file.

```html
<script src="app-config.js"></script>
```

## Build customization via build-time environment variables

At build time, the following environment variables can be used to customize the
build:

* `NODE_ENV`: defaults to `development`
* `EXEC_ENV`: defaults to `browser`

The variables are:

* passed to [gulp-preprocess](https://github.com/jas/gulp-preprocess) when
  building `main.html`
* passed to webpack `DefinePlugin` when building js files

Example `main.html` build customization:

```html
<!-- @if EXEC_ENV=='cordova' -->
<!--
    This ends up in the compiled index.html only when, in the build
    environment, process.env.EXEC_ENV === "cordova"
-->
<script src="cordova.js"></script>
<!-- @endif -->
```

Example js build customization:

```js
console.log(process.env.EXEC_ENV);
/*
*   When in the build environment process.env.EXEC_ENV === "cordova", the above
*   line of code will be compiled into the line `console.log("cordova");`
*/
```

When `NODE_ENV=production` JS and CSS files are minified.
