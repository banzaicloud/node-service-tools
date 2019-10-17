import * as joi from 'joi'
import { LoggerOptions } from 'pino'

const envVarsSchema = joi
  .object({
    LOGGER_LEVEL: joi
      .string()
      .valid(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .when('NODE_ENV', {
        is: 'development',
        then: joi.string().default('debug'),
      })
      .when('NODE_ENV', {
        is: 'production',
        then: joi.string().default('info'),
      })
      .when('NODE_ENV', {
        is: 'test',
        then: joi.string().default('fatal'),
      }),
    LOGGER_REDACT_FIELDS: joi
      .string()
      .default('password, pass, authorization, auth, cookie, _object')
      .description('Comma separated list of field names to remove from objects'),
    NODE_ENV: joi.string().default('production'),
  })
  .unknown()
  .required()

export default function getConfig() {

  if (!process.env.LOGGER_LEVEL)
    process.env.LOGGER_LEVEL = "debug"

  const { value: envVars, error } = joi.validate(process.env, envVarsSchema, { abortEarly: false })
  if (error) {
    // don't expose environment variables in stack traces / logs
    delete error._object
    throw error
  }

  const redactFields = envVars
    .LOGGER_REDACT_FIELDS!.split(',')
    .map((field) => field.trim())
    .filter(Boolean)

  // NOTE: remeve when type includes redact field
  const config: LoggerOptions & { redact: string[] } = {
    level: envVars.LOGGER_LEVEL,
    redact: redactFields,
  }

  return config
}
