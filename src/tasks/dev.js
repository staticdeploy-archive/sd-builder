const browserSync = require("browser-sync");
const history = require("connect-history-api-fallback");
const gulp = require("gulp");

const {APP_DIR, BUILD_DIR, DEPS_PATH} = require("../config");
const build = require("./build");
const config = require("./config");

function setupDevServer () {
    browserSync({
        server: {
            baseDir: BUILD_DIR,
            middleware: [history({
                rewrites: [
                    {from: /\/VERSION\.txt$/, to: "/VERSION.txt"},
                    {from: /\/CHANGELOG\.md$/, to: "/CHANGELOG.md"}
                ]
            })]
        },
        files: `${BUILD_DIR}/**/*`,
        port: 8080,
        ghostMode: false,
        injectChanges: false,
        notify: false,
        open: false,
        reloadDebounce: 1000
    });
}

function setupWatchers () {
    gulp.watch(`${APP_DIR}/main.html`, build.mainHtml);
    gulp.watch(`${APP_DIR}/.env`, config);
    gulp.watch([`${APP_DIR}/**/*.jsx`, `${APP_DIR}/**/*.js`], build.allScripts);
    gulp.watch(`${APP_DIR}/assets/**/*`, build.appAssets);
    gulp.watch(DEPS_PATH, () => Promise.all([
        build.allScripts(true),
        build.vendorFonts(),
        build.vendorStyles()
    ]));
}

module.exports = function dev () {
    build();
    config();
    setupDevServer();
    setupWatchers();
};
