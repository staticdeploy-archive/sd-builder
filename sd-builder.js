#!/usr/bin/env node
const execSync = require("child_process").execSync;

const argv = process.argv.slice(2).join(" ");
execSync(
    `${__dirname}/node_modules/.bin/gulp --gulpfile ${__dirname}/gulpfile.js ${argv}`
);
