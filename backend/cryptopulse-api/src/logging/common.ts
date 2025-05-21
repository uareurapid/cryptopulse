import {
  CustomNodeLogger,
  getCustomLoggerForModule,
  LOGGER_MODULE_NAMES
} from './Logger.js'

// TODO gather all the logger instances used here
// right now they are scatered all hover the place
// should keep Max 10
// 1
// wallets
export const WALLETS_LOGGER: CustomNodeLogger = getCustomLoggerForModule(
  LOGGER_MODULE_NAMES.WALLETS
)

// 2
// tokens
export const TOKENS_LOGGER: CustomNodeLogger = getCustomLoggerForModule(
  LOGGER_MODULE_NAMES.TOKENS
)
// 3
// Core stuff
export const CORE_LOGGER: CustomNodeLogger = getCustomLoggerForModule(
  LOGGER_MODULE_NAMES.CORE
)
// 4
// DB
export const DATABASE_LOGGER: CustomNodeLogger = getCustomLoggerForModule(
  LOGGER_MODULE_NAMES.DATABASE
)
// 5
// http
// use this logger instance on all HTTP related stuff
export const HTTP_LOGGER: CustomNodeLogger = getCustomLoggerForModule(
  LOGGER_MODULE_NAMES.HTTP
)
// 6
// indexer
export const INDEXER_LOGGER: CustomNodeLogger = getCustomLoggerForModule(
  LOGGER_MODULE_NAMES.INDEXER
)

