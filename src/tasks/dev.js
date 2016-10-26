const browserSync = require("browser-sync");
const history = require("connect-history-api-fallback");
const _ = require("lodash");
const nodeWatch = require("node-watch");
const path = require("path");

const build = require("./build");
const config = require("./config");

function setupDevServer (options) {
    browserSync({
        server: {
            baseDir: options.buildDir,
            middleware: [history({
                rewrites: [
                    {from: /\/VERSION\.txt$/, to: "/VERSION.txt"},
                    {from: /\/CHANGELOG\.md$/, to: "/CHANGELOG.md"}
                ]
            })]
        },
        files: `${options.buildDir}/**/*`,
        port: 8080,
        ghostMode: false,
        injectChanges: false,
        notify: false,
        open: false,
        reloadDebounce: 1000
    });
}

function watch (watchPath, callback) {
    return nodeWatch(watchPath, _.debounce(callback, 100));
}

function setupWatchers (options) {
    watch(`${options.appDir}/main.html`, () => {
        build.mainHtml(options);
    });
    watch(`${options.rootDir}/.env`, () => {
        config(options);
    });
    watch(`${options.rootDir}/deps.json`, () => {
        build.allScripts(options, true);
        build.vendorFonts(options);
        build.vendorStyles(options);
    });
    watch(options.appDir, filename => {
        const extension = path.extname(filename);
        if (extension === ".js" || extension === ".jsx") {
            build.allScripts(options);
        }
    });
    watch(`${options.appDir}/assets`, () => {
        build.appAssets(options);
    });
}

function dev (options) {
    build(options);
    config(options);
    setupDevServer(options);
    setupWatchers(options);
}

module.exports = dev;
