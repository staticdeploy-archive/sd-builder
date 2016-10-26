const {expect} = require("chai");
const fs = require("fs");
const mockFs = require("mock-fs");
const rewire = require("rewire");

const build = rewire("tasks/build");

describe("mainHtml", () => {

    const options = {
        appDir: "app",
        buildDir: "build",
        NODE_ENV: "development",
        EXEC_ENV: "browser"
    };
    afterEach(() => {
        mockFs.restore();
    });

    it("generates a build/index.html file", () => {
        const html = `
            <!doctype html>
            <title>Test</title>
        `;
        mockFs({app: {"main.html": html}});
        build.mainHtml(options);
        const indexHtml = fs.readFileSync("build/index.html", "utf8");
        expect(indexHtml).to.equal(html);
    });

    it("preprocesses it with preprocess passing options NODE_ENV and EXEC_ENV as context", () => {
        const html = `
            <!doctype html>
            <title>Test</title>
            <p><!-- @echo NODE_ENV --></p>
            <p><!-- @echo EXEC_ENV --></p>
        `;
        mockFs({app: {"main.html": html}});
        build.mainHtml(options);
        const indexHtml = fs.readFileSync("build/index.html", "utf8");
        expect(indexHtml).to.equal(`
            <!doctype html>
            <title>Test</title>
            <p>development</p>
            <p>browser</p>
        `);
    });

});
