import * as v from "idonttrustlikethat"
import { Variable } from "./variable"
import type { DotenvConfigOptions } from "dotenv"

export type Option = {
  dotenv?: DotenvOption
}
type DotenvOption = {
  when: "always" | "not-production" | (() => boolean)
  config?: DotenvConfigOptions
}

type Result<Config> = {
  [P in keyof Config]: Config[P] extends string ? string
  : Config[P] extends number ? number
  : Config[P] extends boolean ? boolean
  : Config[P] extends Variable<infer T> ? T
  : Result<Config[P]>
}

/**
 * Loads environment variables.
 * 
 * If there is any issue (missing variable, invalid value…), throws an error.
 * Accumulate errors before throwing to validate all at once.
 * 
 * The resulting type is infered from given configuration.
 * 
 * 
 * @example
 * ```ts
 * export const environment = env.load({
 *   testMode: env.boolean("TEST_MODE"),
 *   applicationName: "app"
 * })
 * ```
 * 
 * @example Dotenv support
 * ```ts
 * export const environment = env.load({
 *   someString: env.string("XXX_SOME_STRING")
 * }, {
 *   dotenv: {
 *     when: "not-production",
 *     config: { path: path.join(__dirname, "test.env") }
 *   }
 * })
 * ```
 * 
 * @see {@link https://github.com/grizio/ts-env-loader#envload | More information on README}
 * @see {@link https://github.com/grizio/ts-env-loader#dotenv-support | More information on dotenv support}
 */
export function load<Config>(config: Config, option?: Option): Result<Config> {
  const result = loadSafe(config, option)
  if (result.ok) {
    return result.value
  } else {
    throw new Error(`Could not load environment variables: ${JSON.stringify(result.errors)}`)
  }
}

/**
 * Loads environment variables.
 * 
 * Unlike {@link load}, returns a {@link v.Validation} instead of throwing an error.
 * 
 * @see https://github.com/grizio/ts-env-loader#safe-mode
 */
export function loadSafe<Config>(config: Config, option?: Option): v.Validation<Result<Config>> {
  if (option?.dotenv !== undefined) {
    loadDotenv(option.dotenv)
  }

  const data = loadData(config)
  const validator = buildValidator(config) as v.Validator<Result<Config>>
  return validator.validate(data)
}

function loadDotenv(option: DotenvOption): void {
  if (option.when === "always") {
    require("dotenv").config(option.config)
  } else if (option.when === "not-production") {
    if (process.env.NODE_ENV !== "production") {
      require("dotenv").config(option.config)
    }
  } else if (option.when()) {
    require("dotenv").config(option.config)
  }
}

function loadData<T>(value: T): unknown {
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value
  } else if (Array.isArray(value)) {
    return value.map(loadData)
  } else if (value instanceof Variable) {
    return process.env[value.name]
  } else {
    const result: any = {}
    for (let key in value) {
      result[key] = loadData(value[key])
    }
    return result
  }
}

function buildValidator<T>(value: T): v.Validator<any> {
  if (typeof value === "boolean") {
    return v.boolean
  } else if (typeof value === "number") {
    return v.number
  } else if (typeof value === "string") {
    return v.string
  } else if (Array.isArray(value)) {
    return v.tuple(...value.map(buildValidator))
  } else if (value instanceof Variable) {
    return value.validator
  } else {
    const result: any = {}
    for (let key in value) {
      result[key] = buildValidator(value[key])
    }
    return v.object(result)
  }
}