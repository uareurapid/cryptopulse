import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import { isDefined } from '../utils/util.js';
// all the types of modules/components
export const LOGGER_MODULE_NAMES = {
    HTTP: 'http',
    // P2P: 'p2p',
    DATABASE: 'database',
    INDEXER: 'indexer',
    CONFIG: 'config',
    ALL_COMBINED: 'all',
    CORE: 'core',
    WALLETS: 'wallets',
    TOKENS: 'tokens'
};
// we can setup custom exceptionHandlers as part of initial config options
// exceptionHandlers: [
//     new transports.File({ filename: 'exceptions.log' })
//   ]
// OR enable it later
// Call exceptions.handle with a transport to handle exceptions
// logger.exceptions.handle(
//     new transports.File({ filename: 'exceptions.log' })
//   );
const EXCEPTIONS_HANDLER = 'exceptions.log';
// Some constants for logging
export const LOG_LEVELS_NUM = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
};
export const LOG_LEVELS_STR = {
    LEVEL_ERROR: 'error',
    LEVEL_WARN: 'warn',
    LEVEL_INFO: 'info',
    LEVEL_HTTP: 'http',
    LEVEL_VERBOSE: 'verbose',
    LEVEL_DEBUG: 'debug',
    LEVEL_SILLY: 'silly'
};
const LOG_LEVELS_EMOJI = {
    error: '\u{1F631}', // face scremaing in panic
    debug: '\u{1F9D0}', // face with monocle
    warn: '\u{26a0} \u{FE0F}', // warning
    verbose: '\u{1F4AC}', // speech ballon
    info: '\u{1F449}', // point right
    http: '\u{1F98A}', // firefox homage :-)
    silly: '\u{1F92A}' // zany face
};
// we might want these somewhere else
export const GENERIC_EMOJIS = {
    EMOJI_CHECK_MARK: '\u{2705}',
    EMOJI_CROSS_MARK: '\u{274C}',
    EMOJI_OCEAN_WAVE: '\u{1F30A}',
    EMOJI_TO_MOON: '\u{1F680}' // rocket emoji
};
export function getLoggerLevelEmoji(level) {
    const emoji = LOG_LEVELS_EMOJI[level];
    if (!emoji) {
        return GENERIC_EMOJIS.EMOJI_OCEAN_WAVE;
    }
    return emoji;
}
export const LOG_COLORS = {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'green',
    http: 'blue',
    verbose: 'white'
};
// for a custom logger transport
let INSTANCE_COUNT = 0;
export const MAX_LOGGER_INSTANCES = 10;
export const NUM_LOGGER_INSTANCES = INSTANCE_COUNT;
// log locations
function USE_FILE_TRANSPORT() {
    return isDefined(process.env.LOG_FILES) && process.env.LOG_FILES !== 'false';
}
// default to true, if not explicitly set otherwise AND no other locations defined
function USE_CONSOLE_TRANSPORT() {
    return isDefined(process.env.LOG_CONSOLE && process.env.LOG_CONSOLE !== 'false') || !USE_FILE_TRANSPORT();
}
// if not set, then gets default 'development' level & colors
export function isDevelopmentEnvironment() {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development';
}
// if we have something set on process.env use that
const getConfiguredLogLevel = () => {
    const envLevel = process.env.LOG_LEVEL;
    // do case insensitive check
    if (envLevel && Object.values(LOG_LEVELS_STR).includes(envLevel === null || envLevel === void 0 ? void 0 : envLevel.toLowerCase())) {
        return envLevel === null || envLevel === void 0 ? void 0 : envLevel.toLowerCase();
    }
    return null;
};
const CONFIG_LOG_LEVEL = getConfiguredLogLevel();
export const getDefaultLevel = () => {
    return (CONFIG_LOG_LEVEL ||
        (isDevelopmentEnvironment() ? LOG_LEVELS_STR.LEVEL_DEBUG : LOG_LEVELS_STR.LEVEL_INFO));
};
if (isDevelopmentEnvironment()) {
    winston.addColors(LOG_COLORS);
}
const format = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`), winston.format.prettyPrint());
const alignedWithColorsAndTime = winston.format.combine(winston.format.colorize({ all: true }), winston.format.timestamp(), winston.format.align(), winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message.trim()}`));
const consoleColorFormatting = {
    // format: winston.format.combine(format, winston.format.colorize({ all: true }))
    format: winston.format.combine(alignedWithColorsAndTime, winston.format.colorize())
};
// ex: we caa also have a simpler format for console only
// format: winston.format.combine(
//     winston.format.colorize(),
//     winston.format.simple()
//   )
export const defaultConsoleTransport = new winston.transports.Console(Object.assign({}, consoleColorFormatting));
function getDefaultOptions(moduleName) {
    const defaultOpts = {
        level: getDefaultLevel(),
        levels: LOG_LEVELS_NUM,
        format,
        transports: getDefaultLoggerTransports(moduleName),
        exceptionHandlers: [
            new winston.transports.File({ dirname: 'logs/', filename: EXCEPTIONS_HANDLER })
        ]
    };
    return defaultOpts;
}
export function buildDefaultLogger() {
    const logger = winston.createLogger(getDefaultOptions(LOGGER_MODULE_NAMES.ALL_COMBINED));
    INSTANCE_COUNT++;
    return logger;
}
/**
 * options example:
 * {
        filename: 'error.log',
        dirname: 'logs/',
        level: 'error',
        handleExceptions: true
  },
 *
 * @param options
 * @returns
 */
export function buildCustomFileTransport(moduleName, options) {
    if (!moduleName) {
        moduleName = LOGGER_MODULE_NAMES.ALL_COMBINED;
    }
    if (!options) {
        options = {
            filename: moduleName + '.log',
            dirname: 'logs/',
            level: getDefaultLevel(),
            handleExceptions: true
        };
    }
    return new winston.transports.File(Object.assign({}, options));
}
export function getDefaultLoggerTransports(moduleOrComponentName) {
    const transports = [];
    // account for runtime changes done by tests (force read again value)
    if (USE_FILE_TRANSPORT()) {
        // always log to file
        transports.push(buildCustomFileTransport(moduleOrComponentName));
    }
    if (USE_CONSOLE_TRANSPORT()) {
        transports.push(defaultConsoleTransport);
    }
    return transports;
}
/**
 *
 * @param moduleName
 * @param options
 * options are:
 * stream: any Node.js stream. If an objectMode stream is provided then the entire info object will be written.
 * Otherwise info[MESSAGE] will be written.
 * level: Level of messages that this transport should log (default: level set on parent logger).
 * silent: Boolean flag indicating whether to suppress output (default false).
 * eol: Line-ending character to use. (default: os.EOL).
 * @returns
 */
export function buildCustomStreamTransport(options) {
    if (!options) {
        options = {
            stream: fs.createWriteStream('/dev/null'),
            level: getDefaultLevel(),
            handleExceptions: true
        };
    }
    return new winston.transports.Stream(Object.assign({}, options));
}
/**
 * Example to build a daily rotate file
 * We can use it on the initials transports config, or add it later with 'addTransport()' method bellow
 * In this case it will zip the archived files
 * The max file size is 20Mb and it will keep the logs for 14 days
 * More here:
 * https://www.npmjs.com/package/winston-daily-rotate-file
 * @param moduleName
 * @param zippedArchive
 * @param maxSize
 * @param maxFiles
 * @returns
 */
export function buildDailyRotateFile(moduleName, zippedArchive = true, maxSize = '20m', // 20 Mb by default
maxFiles = '14d' // 14 days by deafult
) {
    const transport = new DailyRotateFile({
        filename: moduleName + '-%DATE%.log',
        datePattern: 'YYYY-MM-DD-HH',
        dirname: 'logs/',
        zippedArchive,
        maxSize,
        maxFiles,
        extension: '.log'
    });
    return transport;
}
/**
 * Customize the logger options
 */
export class CustomNodeLogger {
    constructor(options) {
        INSTANCE_COUNT++;
        if (INSTANCE_COUNT === MAX_LOGGER_INSTANCES) {
            // after 10 instances we get warnings about possible memory leaks
            console.warn(`You already have ${INSTANCE_COUNT} instances of Logger. Please consider reusing some of them!`);
        }
        else if (INSTANCE_COUNT > MAX_LOGGER_INSTANCES) {
            INSTANCE_COUNT--;
            throw new Error(`You have reached the maximum number of Logger instances considered safe (${MAX_LOGGER_INSTANCES}). Please consider reusing some of them!`);
        }
        if (!options) {
            this.logger = buildDefaultLogger();
            this.loggerOptions = Object.assign(Object.assign({}, getDefaultOptions(LOGGER_MODULE_NAMES.ALL_COMBINED)), { moduleName: LOGGER_MODULE_NAMES.ALL_COMBINED });
            this.logger.log(LOG_LEVELS_STR.LEVEL_INFO, 'Info! Calling CustomNodeLogger without any logger options, will just use defaults...');
        }
        else {
            this.logger = winston.createLogger(Object.assign({}, options));
            this.loggerOptions = options;
        }
    }
    removeTransport(winston) {
        this.logger.remove(winston);
    }
    addTransport(winston) {
        this.logger.add(winston);
    }
    getTransports() {
        return this.logger.transports;
    }
    getLogger() {
        return this.logger;
    }
    // should correspond also to filename when logging to a file
    getModuleName() {
        return this.loggerOptions.moduleName;
    }
    getLoggerLevel() {
        return this.loggerOptions.level ? this.loggerOptions.level : getDefaultLevel();
    }
    // some shorter versions
    debug(message) {
        this.log(LOG_LEVELS_STR.LEVEL_DEBUG, message, true);
    }
    warn(message) {
        this.log(LOG_LEVELS_STR.LEVEL_WARN, message, true);
    }
    info(message) {
        this.log(LOG_LEVELS_STR.LEVEL_INFO, message, true);
    }
    error(message) {
        this.log(LOG_LEVELS_STR.LEVEL_ERROR, message, true);
    }
    trace(message) {
        this.log(LOG_LEVELS_STR.LEVEL_SILLY, message, true);
    }
    verbose(message) {
        this.log(LOG_LEVELS_STR.LEVEL_VERBOSE, message, true);
    }
    // wrapper function for logging with custom logger
    log(level = LOG_LEVELS_STR.LEVEL_INFO, message, includeModuleName = false) {
        this.getLogger().log(level, includeModuleName ? this.buildMessage(message) : `\n${message}`, { moduleName: this.getModuleName().toUpperCase() });
        // }
    }
    logMessage(message, includeModuleName = false) {
        const level = this.getLoggerLevel() || getDefaultLevel();
        this.log(level, includeModuleName ? this.buildMessage(message) : message, includeModuleName);
    }
    // supports emoji :-)? Experimental, might not work properly on some transports
    // Usage:
    // logger.logMessageWithEmoji(`HTTP port: ${config.httpPort}`, true, GENERIC_EMOJIS.EMOJI_CHECK_MARK);
    // logger.logMessageWithEmoji(`HTTP port: ${config.httpPort}`, true, );
    logMessageWithEmoji(message, includeModuleName = false, emoji, level) {
        if (!level)
            level = this.getLoggerLevel() || getDefaultLevel();
        let msg = message;
        if (emoji) {
            msg = emoji.concat(' ').concat(msg);
        }
        else {
            msg = getLoggerLevelEmoji(this.getLoggerLevel()).concat(' ').concat(msg);
        }
        this.log(level, msg, includeModuleName);
    }
    // prefix the message with the module/component name (optional)
    buildMessage(message) {
        const cpName = this.getModuleName();
        if (cpName) {
            message = cpName.toUpperCase() + ':\t' + '\n' + message;
        }
        return message;
    }
}
// kind of a factory function for different modules/components
export function getCustomLoggerForModule(moduleOrComponentName, logLevel) {
    if (!moduleOrComponentName) {
        moduleOrComponentName = LOGGER_MODULE_NAMES.ALL_COMBINED;
    }
    const logger = new CustomNodeLogger(
    /* pass any custom options here */ {
        level: logLevel || getDefaultLevel(),
        levels: LOG_LEVELS_NUM,
        moduleName: moduleOrComponentName,
        defaultMeta: { component: moduleOrComponentName.toUpperCase() },
        transports: getDefaultLoggerTransports(moduleOrComponentName),
        exceptionHandlers: [
            new winston.transports.File({
                dirname: 'logs/',
                filename: moduleOrComponentName + '_' + EXCEPTIONS_HANDLER
            })
        ]
    });
    return logger;
}
//# sourceMappingURL=Logger.js.map