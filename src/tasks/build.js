const {promisify} = require("bluebird");
const CleanCSS = require("clean-css");
const fileExists = require("file-exists");
const fs = require("fs-extra");
const {preprocessFileSync} = require("preprocess");
const shelljs = require("shelljs");
const webpack = require("webpack");

/*
*   Utils
*/

function getCommitSha (options) {
    try {
        return shelljs.exec("git rev-parse HEAD", {cwd: options.rootDir}).stdout;
    } catch (ignore) {
        console.warn("Failed to get commit sha via git command");
    }
    try {
        return shelljs.cat(`${options.rootDir}/.git/ORIG_HEAD`);
    } catch (ignore) {
        console.warn("Failed to get commit sha by reading from ORIG_HEAD");
    }
    return null;
}

function getDeps (options) {
    const depsPath = `${options.rootDir}/deps.json`;
    const deps = (
        fileExists(depsPath) ? fs.readJsonSync(depsPath) : {}
    );
    return {
        js: deps.js || [],
        css: deps.css || [],
        fonts: deps.fonts || []
    };
}

function minifyCss (css) {
    return new CleanCSS().minify(css).styles;
}

/*
*   Builders
*/

const mainHtml = options => {
    shelljs.mkdir("-p", options.buildDir);
    preprocessFileSync(
        `${options.appDir}/main.html`,
        `${options.buildDir}/index.html`,
        {
            EXEC_ENV: options.EXEC_ENV,
            NODE_ENV: options.NODE_ENV
        }
    );
};

const allScripts = (() => {
    let compiler = null;
    return (options, trashCompiler) => {
        if (trashCompiler) {
            compiler = null;
        }
        shelljs.mkdir("-p", `${options.buildDir}/_assets/js`);
        compiler = compiler || webpack({
            entry: `${options.appDir}/main.jsx`,
            devtool: "source-map",
            output: {
                path: `${options.buildDir}/_assets/js`,
                filename: "app.js"
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
                root: options.appDir,
                extensions: ["", ".js", ".json", ".jsx"]
            },
            plugins: [
                new webpack.DefinePlugin({
                    "process.env.NODE_ENV": JSON.stringify(options.NODE_ENV),
                    "process.env.EXEC_ENV": JSON.stringify(options.EXEC_ENV)
                }),
                new webpack.optimize.DedupePlugin(),
                (options.minifyFiles ? new webpack.optimize.UglifyJsPlugin() : null)
            ].filter(i => i)
        });
        return promisify(
            compiler.run.bind(compiler)
        )();
    };
})();

const appAssets = options => {
    shelljs.cp("-r", `${options.appDir}/assets/`, `${options.buildDir}/_assets/`);
};

const appVersion = options => {
    const pkg = fs.readJsonSync(`${options.rootDir}/package.json`);
    const commitSha = getCommitSha();
    const commitShaString = commitSha ? ` - ${commitSha}` : "";
    const version = `${pkg.version}${commitShaString}`;
    fs.writeFileSync(`${options.buildDir}/VERSION.txt`, version);
};

const appChangelog = options => {
    shelljs.cp(`${options.appDir}/CHANGELOG.md`, `${options.buildDir}/CHANGELOG.md`);
};

const vendorStyles = options => {
    const vendorCss = shelljs.cat(getDeps(options).css);
    fs.writeFileSync(
        `${options.buildDir}/_assets/css/vendor.css`,
        options.minifyFiles ? minifyCss(vendorCss) : vendorCss
    );
};

const vendorFonts = options => {
    shelljs.cp(
        getDeps(options).fonts,
        `${options.buildDir}/_assets/fonts/`
    );
};

const build = options => {
    return Promise.all([
        mainHtml(options),
        allScripts(options),
        appAssets(options),
        appVersion(options),
        appChangelog(options),
        vendorStyles(options),
        vendorFonts(options)
    ]);
};

/*
*   Exports
*/

Object.assign(build, {
    mainHtml,
    allScripts,
    appAssets,
    appVersion,
    appChangelog,
    vendorStyles,
    vendorFonts
});
module.exports = build;
