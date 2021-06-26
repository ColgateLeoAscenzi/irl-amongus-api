const {logger} = require("./index");

const logInfo = (error) => {
    logger['info'](error);
};

const logError = (error) => {
    logger['error'](error);
};

module.exports = {
    logInfo,
    logError,
};