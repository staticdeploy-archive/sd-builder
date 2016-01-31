#!/usr/bin/env node
const execSync = require("child_process").execSync;

const command = [
    `${__dirname}/../.bin/gulp`,
    `--gulpfile ${__dirname}/gulpfile.js`,
    `--cwd ${process.cwd()}`,
    `${process.argv.slice(2).join(" ")}`
].join(" ");

const options = {
    env: process.env,
    stdio: "inherit"
};

execSync(command, options);
