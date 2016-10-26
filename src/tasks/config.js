const dotenv = require("dotenv");
const fs = require("fs");
const _ = require("lodash");

function config (options) {
    let cfg = {};
    if (options.NODE_ENV === "development") {
        // In development, read from the `.env` file
        try {
            const env = fs.readFileSync(`${process.cwd()}/.env`);
            cfg = dotenv.parse(env);
        } catch (ignore) {
            console.log("Failed to read configuration from file `.env`");
        }
    }
    if (options.NODE_ENV === "production") {
        // In production, read from the `process.env` but only those variables
        // having a key that starts with __APP_CONFIG__
        const prefixRegexp = /^__APP_CONFIG__/;
        cfg = _(process.env)
            .pickBy((value, key) => prefixRegexp.test(key))
            .mapKeys((value, key) => key.replace(prefixRegexp, ""));
    }
    const code = `window.APP_CONFIG = ${JSON.stringify(cfg, null, 4)};`;
    fs.writeFileSync(`${options.buildDir}/app-config.js`, code);
}

module.exports = config;
