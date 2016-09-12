const cwd = process.cwd();

exports.NODE_ENV = (process.env.NODE_ENV || "development");
exports.EXEC_ENV = (process.env.EXEC_ENV || "browser");
exports.MINIFY_FILES = (exports.NODE_ENV === "production");
exports.APP_DIR = `${cwd}/app`;
exports.BUILD_DIR = `${cwd}/build`;
exports.DEPS_PATH = `${cwd}/deps.json`;
