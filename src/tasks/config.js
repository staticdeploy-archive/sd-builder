const dotenv = require("dotenv");
const fs = require("fs");
const _ = require("lodash");
const proGulp = require("pro-gulp");

const {NODE_ENV, BUILD_DIR} = require("../config");

module.exports = proGulp.task("config", () => {
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
    fs.writeFileSync(`${BUILD_DIR}/app-config.js`, code);
});
