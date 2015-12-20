import {promisify} from "bluebird";
import browserSync from "browser-sync";
import fs from "fs";
import gulp from "gulp";
import gulpLoadPlugins from "gulp-load-plugins";
import mkdirp from "mkdirp";
import proGulp from "pro-gulp";
import webpack from "webpack";

const gp = gulpLoadPlugins();



/*
*   Constants
*/

const deps = JSON.parse(
    fs.readFileSync(`${process.cwd()}/deps.json`)
);
const testDir = `${process.cwd()}/test`;
const appDir = `${process.cwd()}/app`;
const buildDir = `${process.cwd()}/build`;


/*
*   Builders
*/

proGulp.task("buildMainHtml", function () {
    return gulp.src(`${appDir}/main.html`)
        .pipe(gp.rename("index.html"))
        .pipe(gulp.dest(`${buildDir}/`));
});

proGulp.task("buildAllScripts", (function () {
    mkdirp.sync(`${buildDir}/_assets/js`);
    var compiler = webpack({
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
            extensions: [".js", ".json", ".jsx"]
        },
        plugins: [
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.CommonsChunkPlugin(
                "vendor",
                `${buildDir}/_assets/js/vendor.js`
            )
        ]
    });
    return promisify(::compiler.run);
})());

proGulp.task("buildAppAssets", function () {
    return gulp.src(`${appDir}/assets/**/*`)
        .pipe(gulp.dest(`${buildDir}/_assets/`));
});

proGulp.task("buildVendorStyles", function () {
    return gulp.src(deps.css)
        .pipe(gp.concat("vendor.css"))
        .pipe(gulp.dest(`${buildDir}/_assets/css/`));
});

proGulp.task("buildVendorFonts", function () {
    return gulp.src(deps.fonts)
        .pipe(gulp.dest(`${buildDir}/_assets/fonts/`));
});

proGulp.task("build", proGulp.parallel([
    "buildMainHtml",
    "buildAllScripts",
    "buildAppAssets",
    "buildVendorStyles",
    "buildVendorFonts"
]));

gulp.task("build", proGulp.task("build"));



/*
*   Linter
*/

gulp.task("lint", function () {
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

proGulp.task("test", function () {
    return gulp.src(`${testDir}/**/*.js`)
        .pipe(gp.spawnMocha({
            compilers: "jsx:babel-register",
            env: {
                NODE_PATH: `${appDir}:${testDir}`
            }
        }))
        .on("error", function () {
            // Swallow errors
            this.emit("end");
        });
});

gulp.task("test", proGulp.task("test"));



/*
*   Tasks to setup the development environment
*/

proGulp.task("setupDevServer", function () {
    browserSync({
        server: {
            baseDir: buildDir
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

proGulp.task("setupWatchers", function () {
    gulp.watch(
        `${appDir}/main.html`,
        proGulp.task("buildMainHtml")
    );
    gulp.watch(
        [`${appDir}/**/*.jsx`, `${appDir}/**/*.js`],
        proGulp.parallel(["buildAppScripts", "test"])
    );
    gulp.watch(
        `${appDir}/assets/**/*`,
        proGulp.task("buildAppAssets")
    );
    gulp.watch(
        [`${testDir}/**/*.jsx`, `${testDir}/**/*.js`],
        proGulp.task("test")
    );
});

gulp.task("dev", proGulp.sequence([
    "build",
    "test",
    "setupDevServer",
    "setupWatchers"
]));



/*
*   Default task
*/

gulp.task("default", function () {
    gp.util.log("");
    gp.util.log("Usage: " + gp.util.colors.blue("sd-builder [TASK]"));
    gp.util.log("");
    gp.util.log("Available tasks:");
    gp.util.log("  " + gp.util.colors.green("build") + "    build the project");
    gp.util.log("  " + gp.util.colors.green("dev") + "      set up dev environment with auto-recompiling");
    gp.util.log("  " + gp.util.colors.green("lint") + "     lints application source code");
    gp.util.log("  " + gp.util.colors.green("test") + "     runs tests");
    gp.util.log("");
});
