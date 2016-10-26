const {coroutine, delay} = require("bluebird");
const {expect} = require("chai");
const fs = require("fs");
const mockFs = require("mock-fs");
const rewire = require("rewire");

const build = rewire("tasks/build");

describe("allScripts", () => {

    const cwd = process.cwd();
    const options = {
        rootDir: cwd,
        appDir: `${cwd}/app`,
        buildDir: `${cwd}/build`,
        NODE_ENV: "development",
        EXEC_ENV: "browser"
    };
    afterEach(() => {
        mockFs.restore();
    });

    it("generates a build/_assets/js/app.js file", coroutine(function *() {
        const jsx = `
            // COMMENT
        `;
        mockFs({
            "app": {"main.jsx": jsx},
            ".babelrc": "{}"
        });
        yield build.allScripts(options);
        console.log(
            fs.readdirSync("build/_assets/js")
        );
        const appJs = fs.readFileSync("build/_assets/js/app.js", "utf8");
        console.log(appJs);
    }));

    // it("preprocesses it with preprocess passing options NODE_ENV and EXEC_ENV as context", () => {
    //     const html = `
    //         <!doctype html>
    //         <title>Test</title>
    //         <p><!-- @echo NODE_ENV --></p>
    //         <p><!-- @echo EXEC_ENV --></p>
    //     `;
    //     mockFs({app: {"main.html": html}});
    //     build.mainHtml(options);
    //     const index = fs.readFileSync("build/index.html", "utf8");
    //     expect(index).to.equal(`
    //         <!doctype html>
    //         <title>Test</title>
    //         <p>development</p>
    //         <p>browser</p>
    //     `);
    // });

});
