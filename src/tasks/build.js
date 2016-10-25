const {promisify} = require("bluebird");
const {execSync} = require("child_process");
const fs = require("fs");
const gulp = require("gulp");
const gulpLoadPlugins = require("gulp-load-plugins");
const mkdirp = require("mkdirp");
const proGulp = require("pro-gulp");
const webpack = require("webpack");

const gp = gulpLoadPlugins();

/*
*   Constants
*/

const {
    NODE_ENV,
    EXEC_ENV,
    MINIFY_FILES,
    APP_DIR,
    BUILD_DIR,
    DEPS_PATH
} = require("../config");

/*
*   Utils
*/

function getCommitSha () {
    try {
        return execSync("git rev-parse HEAD").toString();
    } catch (ignore) {
        console.warn("Failed to get commit sha via git command");
    }
    try {
        return execSync("cat .git/ORIG_HEAD").toString();
    } catch (ignore) {
        console.warn("Failed to get commit sha by reading from ORIG_HEAD");
    }
    return null;
}

/*
*   Builders
*/

proGulp.task("buildMainHtml", () => {
    return gulp.src(`${APP_DIR}/main.html`)
        .pipe(gp.preprocess({context: {EXEC_ENV, NODE_ENV}}))
        .pipe(gp.rename("index.html"))
        .pipe(gulp.dest(`${BUILD_DIR}/`));
});

proGulp.task("buildAllScripts", (() => {
    var compiler = null;
    return trashCompiler => {
        if (trashCompiler) {
            compiler = null;
        }
        const deps = JSON.parse(fs.readFileSync(DEPS_PATH));
        mkdirp.sync(`${BUILD_DIR}/_assets/js`);
        compiler = compiler || webpack({
            entry: {
                app: `${APP_DIR}/main.jsx`,
                vendor: deps.js
            },
            devtool: "source-map",
            output: {
                filename: `${BUILD_DIR}/_assets/js/app.js`
            },
            module: {
                loaders: [
                    {
                        test: /\.jsx?$/,
                        exclude: /node_modules/,
                        loader: "babel"
                    },
                    {
                        test: /\.json$/,
                        loader: "json"
                    }
                ]
            },
            resolve: {
                root: APP_DIR,
                extensions: ["", ".js", ".json", ".jsx"]
            },
            plugins: [
                new webpack.DefinePlugin({
                    "process.env.NODE_ENV": JSON.stringify(NODE_ENV),
                    "process.env.EXEC_ENV": JSON.stringify(EXEC_ENV)
                }),
                new webpack.optimize.DedupePlugin(),
                new webpack.optimize.CommonsChunkPlugin(
                    "vendor",
                    `${BUILD_DIR}/_assets/js/vendor.js`
                ),
                (MINIFY_FILES ? new webpack.optimize.UglifyJsPlugin() : null)
            ].filter(i => i)
        });
        return promisify(compiler.run, {context: compiler})();
    };
})());

proGulp.task("buildAppAssets", () => {
    return gulp.src(`${APP_DIR}/assets/**/*`)
        .pipe(gulp.dest(`${BUILD_DIR}/_assets/`));
});

proGulp.task("buildAppVersion", () => {
    const pkg = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`, "utf8"));
    const commitSha = getCommitSha();
    const commitShaString = commitSha ? ` - ${commitSha}` : "";
    const version = `${pkg.version}${commitShaString}`;
    fs.writeFileSync(`${BUILD_DIR}/VERSION.txt`, version);
});

proGulp.task("buildAppChangelog", () => {
    return gulp.src(`${process.cwd()}/CHANGELOG.md`)
        .pipe(gulp.dest(`${BUILD_DIR}/`));
});

proGulp.task("buildVendorStyles", () => {
    const deps = JSON.parse(fs.readFileSync(DEPS_PATH));
    return gulp.src(deps.css)
        .pipe(gp.concat("vendor.css"))
        .pipe(gp.if(MINIFY_FILES, gp.cssnano()))
        .pipe(gulp.dest(`${BUILD_DIR}/_assets/css/`));
});

proGulp.task("buildVendorFonts", () => {
    const deps = JSON.parse(fs.readFileSync(DEPS_PATH));
    return gulp.src(deps.fonts)
        .pipe(gulp.dest(`${BUILD_DIR}/_assets/fonts/`));
});

/*
*   Exports
*/

const build = proGulp.parallel([
    "buildMainHtml",
    "buildAllScripts",
    "buildAppAssets",
    "buildAppVersion",
    "buildAppChangelog",
    "buildVendorStyles",
    "buildVendorFonts"
]);
Object.assign(build, {
    mainHtml: proGulp.task("buildMainHtml"),
    allScripts: proGulp.task("buildAllScripts"),
    appAssets: proGulp.task("buildAppAssets"),
    appVersion: proGulp.task("buildAppVersion"),
    appChangelog: proGulp.task("buildAppChangelog"),
    vendorStyles: proGulp.task("buildVendorStyles"),
    vendorFonts: proGulp.task("buildVendorFonts")
});
module.exports = build;
