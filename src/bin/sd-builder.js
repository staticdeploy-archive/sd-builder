#!/usr/bin/env node

const path = require("path");
const yargs = require("yargs");

const build = require("../tasks/build");
const config = require("../tasks/config");
const dev = require("../tasks/dev");
const pkg = require("../../package");

function withOptions (fn) {
    return options => fn({
        rootDir: options.rootDir,
        appDir: `${options.rootDir}/app`,
        buildDir: `${options.rootDir}/build`,
        minifyFiles: (options.NODE_ENV === "production"),
        NODE_ENV: options.NODE_ENV,
        EXEC_ENV: options.EXEC_ENV
    });
}

yargs
    .version(pkg.version)
    .help("h")
    .alias("h", "help")
    .wrap(100)
    .usage("Usage: $0 <command> <options>")
    .option("rootDir", {
        coerce: path.resolve,
        default: process.cwd(),
        global: true,
        description: "Project root directory"
    })
    .option("EXEC_ENV", {
        default: (process.env.EXEC_ENV || "browser"),
        global: true,
        description: "Build parameter EXEC_ENV"
    })
    .option("NODE_ENV", {
        default: (process.env.NODE_ENV || "development"),
        global: true,
        description: "Build parameter NODE_ENV"
    })
    .command({
        command: "build",
        describe: "Build the project",
        handler: withOptions(build)
    })
    .command({
        command: "config",
        describe: "Write the app configuration to `app-config.js`",
        handler: withOptions(config)
    })
    .command({
        command: "dev",
        describe: "Set up dev environment with auto-recompiling",
        handler: withOptions(dev)
    })
    .strict()
    .demand(1)
    .argv;
