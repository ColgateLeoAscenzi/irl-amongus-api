const { logger } = require('./index');

const logInfo = (msg) => {
    logger.info(msg);
};

const logError = (error) => {
    logger.error(error);
};

module.exports = {
    logInfo,
    logError,
};
