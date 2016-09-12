#!/usr/bin/env node

const yargs = require("yargs");

const build = require("../tasks/build");
const config = require("../tasks/config");
const dev = require("../tasks/dev");
const pkg = require("../../package");

yargs
    .version(pkg.version)
    .help("h")
    .alias("h", "help")
    .wrap(100)
    .usage("Usage: $0 <command>")
    .command({
        command: "build",
        describe: "Build the project",
        handler: build
    })
    .command({
        command: "config",
        describe: "Write the app configuration to `app-config.js`",
        handler: config
    })
    .command({
        command: "dev",
        describe: "Set up dev environment with auto-recompiling",
        handler: dev
    })
    .strict()
    .demand(1)
    .argv;
