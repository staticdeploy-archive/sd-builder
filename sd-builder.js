#!/usr/bin/env node
const execSync = require("child_process").execSync;

execSync([
    `${__dirname}/../.bin/gulp`,
    `--gulpfile ${__dirname}/gulpfile.js`,
    `--cwd ${process.cwd()}`,
    `${process.argv.slice(2).join(" ")}`
].join(" "));
