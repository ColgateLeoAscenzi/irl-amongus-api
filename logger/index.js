const winston = require('winston');
const { truthy } = require('../utils/filters');

/**
 * Create a simple format.
 * @return {logform.Format}
 */
const createSimpleFormat = () => {
    return winston.format.printf(({
                                      level,
                                      message = null,
                                      timestamp = null,
                                      ms = null,
                                      label = null,
                                      service = null,
                                      ...meta
                                  }) => {
        const parts = [
            level,
            timestamp ? `[${timestamp}]` : null,
            ms ? `[${ms}]` : null,
            label ? `[${label}]` : null,
            service ? `[${service}]` : null,
            message,
            Object.keys(meta).length > 0 ? JSON.stringify(meta) : null,
        ];
        return parts.filter(truthy).join(' ');
    });
};

/**
 * Get the combined format for a winston logger based on config.
 *
 * @param {boolean=} color
 * @param {boolean=} json
 * @param {logform.Format[]=} extraFormats
 * @return {logform.Format}
 */
const getFormat = (color = false, json = true, extraFormats = []) => {
    const formats = [
        color ? winston.format.colorize() : null,
        winston.format.splat(),
        winston.format.timestamp(),
        winston.format.ms(),
        json ? winston.format.json() : createSimpleFormat(),
        ...extraFormats,
    ];
    return winston.format.combine(...formats.filter(truthy));
};

const logger = winston.createLogger({
    level: 'info',
    format: getFormat(true, false),
    defaultMeta: { service: 'user-service' },
    transports: [new winston.transports.Console(),],
});

module.exports = {
    logger,
}