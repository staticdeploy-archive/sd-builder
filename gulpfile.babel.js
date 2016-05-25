import {promisify} from "bluebird";
import browserSync from "browser-sync";
import {execSync} from "child_process";
import history from "connect-history-api-fallback";
import dotenv from "dotenv";
import fs from "fs";
import gulp from "gulp";
import gulpLoadPlugins from "gulp-load-plugins";
import _ from "lodash";
import mkdirp from "mkdirp";
import proGulp from "pro-gulp";
import webpack from "webpack";

const gp = gulpLoadPlugins();



/*
*   Constants
*/
const {NODE_ENV = "development", EXEC_ENV = "browser"} = process.env;
const MINIFY_FILES = (NODE_ENV === "production");
const testDir = `${process.cwd()}/test`;
const appDir = `${process.cwd()}/app`;
const buildDir = `${process.cwd()}/build`;
const depsPath = `${process.cwd()}/deps.json`;
const npmDir = `${process.cwd()}/node_modules/.bin`;



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
    return gulp.src(`${appDir}/main.html`)
        .pipe(gp.preprocess({context: {EXEC_ENV, NODE_ENV}}))
        .pipe(gp.rename("index.html"))
        .pipe(gulp.dest(`${buildDir}/`));
});

proGulp.task("buildAllScripts", (() => {
    const deps = JSON.parse(fs.readFileSync(depsPath));
    mkdirp.sync(`${buildDir}/_assets/js`);
    const compiler = webpack({
        entry: {
            app: `${appDir}/main.jsx`,
            vendor: deps.js
        },
        devtool: "source-map",
        output: {
            filename: `${buildDir}/_assets/js/app.js`
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
            root: appDir,
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
                `${buildDir}/_assets/js/vendor.js`
            ),
            (MINIFY_FILES ? new webpack.optimize.UglifyJsPlugin() : null)
        ].filter(i => i)
    });
    return promisify(::compiler.run);
})());

proGulp.task("buildAppAssets", () => {
    return gulp.src(`${appDir}/assets/**/*`)
        .pipe(gulp.dest(`${buildDir}/_assets/`));
});

proGulp.task("buildAppVersion", () => {
    const pkg = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`, "utf8"));
    const commitSha = getCommitSha();
    const commitShaString = commitSha ? ` - ${commitSha}` : "";
    const version = `${pkg.version}${commitShaString}`;
    fs.writeFileSync(`${buildDir}/VERSION`, version);
});

proGulp.task("buildVendorStyles", () => {
    const deps = JSON.parse(fs.readFileSync(depsPath));
    return gulp.src(deps.css)
        .pipe(gp.concat("vendor.css"))
        .pipe(gp.if(MINIFY_FILES, gp.cssnano()))
        .pipe(gulp.dest(`${buildDir}/_assets/css/`));
});

proGulp.task("buildVendorFonts", () => {
    const deps = JSON.parse(fs.readFileSync(depsPath));
    return gulp.src(deps.fonts)
        .pipe(gulp.dest(`${buildDir}/_assets/fonts/`));
});

proGulp.task("build", proGulp.parallel([
    "buildMainHtml",
    "buildAllScripts",
    "buildAppAssets",
    "buildAppVersion",
    "buildVendorStyles",
    "buildVendorFonts"
]));

gulp.task("build", proGulp.task("build"));



/*
*   Config generator
*/

proGulp.task("config", () => {
    var config = {};
    if (NODE_ENV === "development") {
        // In development, read from the `.env` file
        try {
            const env = fs.readFileSync(`${process.cwd()}/.env`);
            config = dotenv.parse(env);
        } catch (ignore) {
            console.log("Failed to read configuration from file `.env`");
        }
    }
    if (NODE_ENV === "production") {
        // In production, read from the `process.env` but only those variables
        // having a key that starts with __APP_CONFIG__
        const prefixRegexp = /^__APP_CONFIG__/;
        config = _(process.env)
            .pickBy((value, key) => prefixRegexp.test(key))
            .mapKeys((value, key) => key.replace(prefixRegexp, ""));
    }
    const code = `window.APP_CONFIG = ${JSON.stringify(config, null, 4)};`;
    fs.writeFileSync(`${buildDir}/app-config.js`, code);
});

gulp.task("config", proGulp.task("config"));



/*
*   Linter
*/

gulp.task("lint", () => {
    const srcs = [
        `${appDir}/**/*.js`,
        `${appDir}/**/*.jsx`,
        `!${appDir}/assets/**/*`,
        `${testDir}/**/*.js`,
        `${testDir}/**/*.jsx`
    ];
    return gulp.src(srcs)
        .pipe(gp.eslint())
        .pipe(gp.eslint.format())
        .pipe(gp.eslint.failAfterError());
});



/*
*   Testers
*/

proGulp.task("test", () => {
    return gulp.src([`${testDir}/**/*.js`, `${testDir}/**/*.jsx`])
        .pipe(gp.spawnMocha({
            compilers: "jsx:babel-register",
            env: {
                NODE_ENV: "test",
                NODE_PATH: `${appDir}`
            }
        }))
        .on("error", function () {
            // Swallow errors
            this.emit("end");
        });
});

gulp.task("test", proGulp.task("test"));

proGulp.task("coverage", () => {
    const command = [
        "env NODE_ENV=\"test\"",
        `env NODE_PATH="${appDir}"`,
        `${npmDir}/babel-node`,
        `${npmDir}/isparta cover --include "**/*.js" --include "**/*.jsx"`,
        `${npmDir}/_mocha -- test/*.js* test/**/*.js*`
    ].join(" ");
    execSync(command, {
        env: process.env,
        stdio: "inherit"
    });
});

gulp.task("coverage", proGulp.task("coverage"));



/*
*   Tasks to setup the development environment
*/

proGulp.task("setupDevServer", () => {
    browserSync({
        server: {
            baseDir: buildDir,
            middleware: [history()]
        },
        files: `${buildDir}/**/*`,
        port: 8080,
        ghostMode: false,
        injectChanges: false,
        notify: false,
        open: false,
        reloadDebounce: 1000
    });
});

proGulp.task("setupWatchers", () => {
    gulp.watch(
        `${appDir}/main.html`,
        proGulp.task("buildMainHtml")
    );
    gulp.watch(
        `${appDir}/.env`,
        proGulp.task("config")
    );
    gulp.watch(
        [`${appDir}/**/*.jsx`, `${appDir}/**/*.js`],
        proGulp.parallel(["buildAllScripts", "test"])
    );
    gulp.watch(
        `${appDir}/assets/**/*`,
        proGulp.task("buildAppAssets")
    );
    gulp.watch(
        [`${testDir}/**/*.jsx`, `${testDir}/**/*.js`],
        proGulp.task("test")
    );
    gulp.watch(
        depsPath,
        proGulp.parallel(["buildAllScripts", "buildVendorFonts", "buildVendorStyles", "test"])
    );
});

gulp.task("dev", proGulp.sequence([
    "build",
    "config",
    "test",
    "setupDevServer",
    "setupWatchers"
]));



/*
*   Default task
*/

gulp.task("default", () => {
    gp.util.log("");
    gp.util.log("Usage: " + gp.util.colors.blue("sd-builder [TASK]"));
    gp.util.log("");
    gp.util.log("Available tasks:");
    gp.util.log("  " + gp.util.colors.green("build") + "    build the project");
    gp.util.log("  " + gp.util.colors.green("config") + "   write the configuration to app-config.js");
    gp.util.log("  " + gp.util.colors.green("dev") + "      set up dev environment with auto-recompiling");
    gp.util.log("  " + gp.util.colors.green("lint") + "     lint application source code");
    gp.util.log("  " + gp.util.colors.green("test") + "     run tests");
    gp.util.log("  " + gp.util.colors.green("coverage") + " run tests and calculate coverage");
    gp.util.log("");
});
