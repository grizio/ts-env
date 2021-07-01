import * as v from "idonttrustlikethat"

export class Variable<Value> {
  readonly name: string
  readonly validator: v.Validator<Value>

  constructor(name: string, validator: v.Validator<Value>) {
    this.name = name
    this.validator = validator
  }

  /**
   * Applies a transformation to the value.
   * 
   * @example
   * ```ts
   * env.number("SOME_VARIABLE").map(x => x + 1)
   * ```
   * 
   * @see {@link https://github.com/AlexGalays/idonttrustlikethat#map-filter | Validator.map}
   */
  map = <NextValue>(fn: (value: Value) => NextValue): Variable<NextValue> => this.update(this.validator.map(fn))

  /**
   * Applies another control to the value.
   * 
   * @example
   * ```ts
   * env.number("POSITIVE_VALUE").filter(x => x >= 0)
   * ```
   * 
   * @see {@link https://github.com/AlexGalays/idonttrustlikethat#map-filter | Validator.filter}
   */
  filter = (fn: (value: Value) => boolean): Variable<Value> => this.update(this.validator.filter(fn))

  /**
   * Chains with another validator, in series.
   * 
   * @example
   * ```ts
   * declare const intToDate: Validator<Date>
   * env.number("SOME_TIMESTAMP").then(intToDate)
   * ```
   * 
   * @see {@link https://github.com/AlexGalays/idonttrustlikethat#then | Validator.then}
   */
  then = <NextValue>(validator: v.Validator<NextValue>): Variable<NextValue> => this.update(this.validator.then(validator))

  /**
   * Further refines this validator's output.
   * 
   * @example
   * ```ts
   * env.absoluteUrl("SERVICE_HOSTNAME").and(str => str.startsWith("http") ? Ok(str) : Err("http url expected")
   * ```
   * 
   * @see {@link https://github.com/AlexGalays/idonttrustlikethat#and | Validator.and}
   */
  and = <NextValue>(fn: (value: Value) => v.Result<string, NextValue>): Variable<NextValue> => this.update(this.validator.and(fn))

  /**
   * Swaps the default error string with a custom one.
   * 
   * @example
   * ```ts
   * env.number("SOME_PORT").withError(value => `Expected port number, got ${value}`)
   * ```
   */
  withError = (errorFunction: (value: unknown) => string): Variable<Value> => this.update(this.validator.withError(errorFunction))

  /**
   * Refines a string to make it more strongly typed.
   * 
   * @see {@link https://github.com/AlexGalays/idonttrustlikethat#tagged-stringnumber | Validator.tagged}
   */
  tagged<TAG extends string>(this: Variable<string>): Variable<TAG>;
  
  /**
   * Refines a string to make it more strongly typed.
   * 
   * @see {@link https://github.com/AlexGalays/idonttrustlikethat#tagged-stringnumber | Validator.tagged}
   */
  tagged<TAG extends number>(this: Variable<number>): Variable<TAG>;
  tagged<TAG>(): Variable<TAG> {
    return this as {} as Variable<TAG>
  }
  
  /**
   * Accepts `null` and `undefined` values.
   * 
   * @example
   * ```ts
   * env.string("APPLICATION_ICON").map(value => value === "" ? null : value).nullable()
   * ```
   * 
   * @see {@link https://github.com/AlexGalays/idonttrustlikethat#optional-nullable | Validator.nullable}
   */
  nullable = (): Variable<Value | null | undefined> => this.update(this.validator.nullable());
  
  /**
   * Accepts `undefined` values.
   * 
   * @example
   * ```ts
   * env.string("APPLICATION_ICON").map(value => value === "" ? undefined : value).optional()
   * ```
   * 
   * @see {@link https://github.com/AlexGalays/idonttrustlikethat#optional-nullable | Validator.optional}
   */
  optional = (): Variable<Value | undefined> => this.update(this.validator.optional())

  /**
   * Returns a default value if no value was given.
   * 
   * @example
   * ```ts
   * env.boolean("ENABLE_SOME_FEATURE_FLAG").default(false)
   * ```
   * 
   * @see {@link https://github.com/AlexGalays/idonttrustlikethat#default | Validator.default}
   */
  default = (value: Value): Variable<Value> => this.update(this.validator.nullable().default(value))

  private update = <NextValue>(validator: v.Validator<NextValue>) => new Variable(this.name, validator)
}

/** Declare an environment variable with a custom validator. */
export function variable<Value>(name: string, validator: v.Validator<Value>): Variable<Value> {
  return new Variable(name, validator)
}

/** Declare an environment variable as a string */
export function string(name: string): Variable<string> {
  return variable(name, v.string)
}

/** Declare an environment variable as a int */
export function int(name: string): Variable<number> {
  return variable(name, v.intFromString)
}

/** Declare an environment variable as any number */
export function number(name: string): Variable<number> {
  return variable(name, v.numberFromString)
}

/** Declare an environment variable as a boolean */
export function boolean(name: string): Variable<boolean> {
  return variable(name, v.booleanFromString)
}

type Literal = string | number | boolean | null | undefined
/**
 * Declare an environment variable as a union type
 * 
 * @example
 * ```ts
 * env.union("LOG_LEVEL", "debug", "info", "warn", "error")
 * // resulting type: "debug" | "info" | "warn" | "error"
 * ```
 */
export function union<AcceptedValues extends Literal[]>(name: string, ...acceptedValues: AcceptedValues): Variable<AcceptedValues[number]> {
  return variable(name, v.union(...acceptedValues))
}

/** Declare an environment variable as a date (ISO 8601) */
export function isoDate(name: string): Variable<Date> {
  return variable(name, v.isoDate)
}

/**
 * Declare an environment variable as a relative URL.
 * You can specify a `baseUrl` to test your URL but it will NOT be in the resulting value.
 * The validation tries to create an {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/URL | URL}
 * from the environment value and `baseUrl` (default `http://some-domain.com`).
 * 
 * @example
 * ```ts
 * env.relativeUrl("FALLBACK_URL", "http://my-own-domain.dev")
 * // with FALLBACK_URL = "/not-found", resulting value = "/not-found"
 * ```
 */
export function relativeUrl(name: string, baseUrl?: string): Variable<string> {
  return variable(name, v.relativeUrl(baseUrl))
}

/**
 * Declare an environment variable as an absolute URL (starting with `http://` or any protocol).
 * The validation tries to create an {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/URL | URL} from the environment value.
 * 
 * @example
 * ```ts
 * env.relativeUrl("SERVICE_HOSTNAME")
 * // Accepted: "http://some-host.dev/some-service", "ftp://some-host.dev/some-service"
 * // Refused: "/some-service", "//some-host.dev/some-service"
 * ```
 */
export function absoluteUrl(name: string): Variable<string> {
  return variable(name, v.absoluteUrl)
}

/**
 * Declare an environment variable as an URL, either absolute or relative.
 * @see {@link relativeUrl}
 * @see {@link absoluteUrl}
 */
export function url(name: string): Variable<string> {
  return variable(name, v.url)
}

/**
 * Declare an environment variable as a complex json value.
 * 
 * If you need to include a complex type in you environment variables, you can use a JSON format.
 * The validator must be a validator from library {@link https://github.com/AlexGalays/idonttrustlikethat | idonttrustlikethat}.
 * 
 * @example
 * ```ts
 * import * as env from "ts-env-loader"
 * import { array, string } from "idonttrustlikethat"
 * 
 * env.json("TOKENS", array(string))
 * // resulting type: Array<string>
 * 
 * @remarks
 * The type of env.json can be anything, really.
 * But please have a though for your coworkers managing your application and avoid abusing of it. 🙏
 * ```
 */
export function json<Value>(name: string, validator: v.Validator<Value>): Variable<Value> {
  return variable(
    name,
    v.string.and((str) => {
      try {
        const json = JSON.parse(str)
        return v.Ok(json)
      } catch (e) {
        return v.Err(e)
      }
    }).then(validator)
  )
}

/**
 * Shortcut to extract NODE_ENV and ensure it will be either `development`, `test` or `production`.
 * 
 * Accepts aliases `dev` and `prod` too.
 */
export const nodeEnv: Variable<"development" | "test" | "production"> = string("NODE_ENV").and(value => {
  if (value === "development" || value === "dev") {
    return v.Ok("development")
  } else if (value === "test") {
    return v.Ok("test")
  } else if (value === "production" || value === "prod") {
    return v.Ok("production")
  } else {
    return v.Err(`Expected "development", "test" or "production", got "${value}"`)
  }
})

/** Shortcut to extract NODE_ENV value and check if it is `development` */
export const isDevelopment: Variable<boolean> = string("NODE_ENV").map(_ => _ === "development" || _ === "dev")

/** Shortcut to extract NODE_ENV value and check if it is `test` */
export const isTest: Variable<boolean> = string("NODE_ENV").map(_ => _ === "test")

/** Shortcut to extract NODE_ENV value and check if it is `production` */
export const isProduction: Variable<boolean> = string("NODE_ENV").map(_ => _ === "production" || _ === "prod")