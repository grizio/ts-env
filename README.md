# ts-env-loader

Load configuration in typescript through environment variables

* [Getting started](#getting-started)
  * [Install](#install)
  * [Usage](#usage)
* [API](#api)
  * [env.load](#envload)
    * [Dotenv support](#dotenv-support)
    * [Safe mode](#safe-mode)
  * [Variables](#variables)
    * [env.string](#envstring)
    * [env.int](#envint)
    * [env.number](#envnumber)
    * [env.boolean](#envboolean)
    * [env.union](#envunion)
    * [env.isoDate](#envisodate)
    * [env.port](#envport)
    * [env.relativeUrl](#envrelativeurl)
    * [env.absoluteUrl](#envabsoluteurl)
    * [env.url](#envurl)
    * [env.json](#envjson)
    * [env.nodeEnv](#envnodeenv)
    * [env.isDevelopment, env.isTest, env.isProduction](#envisdevelopment-envistest-envisproduction)
    * [Validation chaining](#validation-chaining)
    * [variable.nullable, variable.optional](#variablenullable-variableoptional)
    * [variable.default](#variabledefault)
    * [env.variable (custom validation)](#envvariable-custom-validation)



## Getting started

### Install

```
npm install --save ts-env-loader
```

### Usage

```typescript
import * as env from "ts-env-loader"

// Load: will throw if an error happens
const environment = env.load({
  database: {
    // Requires the environment variable DATABASE_HOST to be a string
    host: env.string("DATABASE_HOST"),
    port: env.int("DATABASE_PORT"),
    user: env.string("DATABASE_USER"),
    password: env.string("DATABASE_PASSWORD"),
    database: env.string("DATABASE_DATABASE")
  },
  testMode: env.boolean("TEST_MODE"),
  logger: {
    // Use raw values to group your logger configuration at one place but only variabilize some values
    name: "application",
    minLevel: env.union("LOGGER_MIN_LEVEL", "debug", "info", "warn", "error")
  }
})

// Usage
import { Client } from "pg"
const client = new Client({
  host: environment.database.host,
  port: environment.database.port,
  user: environment.database.user,
  password: environment.database.password,
  database: environment.database.database,
})

// The following line also works because types are valid
const client = new Client(environment.database)
```

For following configuration (.env file):

```properties
DATABASE_HOST = host
DATABASE_PORT = 5432
DATABASE_USER = user
DATABASE_PASSWORD = password
DATABASE_SCHEMA = schema
TEST_MODE = true
LOGGER_MIN_LEVEL = debug
```

The result will be:

```typescript
{
  database: {
    host: "host",
    port: 5432,
    user: "user",
    password: "password",
    schema: "schema"
  },
  testMode: true,
  logger: {
    name: "application",
    minLevel: "debug"
  }
}
```

## API

### `env.load`

Loads the configuration and replace environment variables with their respective values.
If an environment variable is missing or invalid, throws an error.

Errors are accumulated so if you have several errors, you can check them all at once.

Example:

```typescript
// typeof environment = { testMode: boolean, applicationName: "app" }
const environment = env.load({
  testMode: env.boolean("TEST_MODE"),
  applicationName: "app"
})
```

Most of the time, you will specify environment variables (`env.type("VARIABLE_NAME")`).
However, if you want to group your configurations, you can use raw values directly.

#### Dotenv support

If you want to use [dotenv](https://github.com/motdotla/dotenv), install it:

```
npm install --save dotenv
```

Then add the following configuration:

```typescript
import * as env from "ts-env-loader"

env.load({
  someString: env.string("XXX_SOME_STRING")
}, {
  dotenv: {
    when: "not-production",
    config: {
      path: path.join(__dirname, "test.env")
    }
  }
})
```

Configure `when` so the loader know when to call dotenv:

* `always`: always call dotenv
* `not-production`: always call dotenv **except** in production
* `() => boolean`: call dotenv when the given function returns `true`

`config` is a `DotenvConfigOptions` so we let you look at [its documentation](https://github.com/motdotla/dotenv#options).

#### Safe mode

By default, the library throws when an environment variable does not exist or has an invalid format.
However, if you want to catch errors, you can use the safe mode:

```typescript
const result = env.loadSafe({ variable: env.string("VARIABLE") })
if (result.ok) {
  const config = result.value
  // launch the application
} else {
  const errors: Array<{ message: string, path: string }> = result.errors
  // display errors or do whatever you need
}
```

In the majority of cases, you do not need to use this safe mode.
You want to stop the application when starting if some configuration is missing to avoid lazy crashes.

It can be useful in very specific cases if you need to accumulate errors with other systems before crashing.

The options are exactly the same than `env.load`.

### Variables

The library gives you some helpers to type environment variables.

#### `env.string`

Accept only string values, if you provide `true` or `42`, it will result to `"true"` or `"42"`

```typescript
function string(name: string): Variable<string>
```

#### `env.int`

Accept only int values

```typescript
function int(name: string): Variable<number>
```

#### `env.number`

Accept all number values

```typescript
function number(name: string): Variable<number>
```

#### `env.boolean`

Accept only boolean values (`true` and `false`)

```typescript
function boolean(name: string): Variable<boolean>
```

#### `env.union`

Accept only one of the provided values.

```typescript
type Literal = string | number | boolean | null | undefined
function union<AcceptedValues extends Literal[]>(name: string, ...acceptedValues: AcceptedValues): Variable<AcceptedValues[number]>


env.union("LOG_LEVEL", "debug", "info", "warn", "error")
// resulting type: "debug" | "info" | "warn" | "error"
```

#### `env.isoDate`

Accept a date in ISO format (ex: `2011-10-05T14:48:00.000Z`).

```typescript
function isoDate(name: string): Variable<Date>
```

#### `env.port`

Accept only port values (int between 1 and 65535)

```typescript
function port(name: string): Variable<number>
```

#### `env.relativeUrl`

Accept a relative URL (without `http://`).
You can specify a `baseUrl` but it will not be in the resulting value.

```typescript
function relativeUrl(name: string, baseUrl?: string): Variable<string>
```

#### `env.absoluteUrl`

Accept an absolute URL (with `http://`).

```typescript
function absoluteUrl(name: string): Variable<string>
```

#### `env.url`

Accept either a `relativeUrl` or an `absoluteUrl`.

```typescript
function url(name: string): Variable<string>
```

#### `env.json`

If you need to include a complex type in you environment variables, you can use a JSON format.
The validator must be a validator from library [idonttrustlikethat](https://github.com/AlexGalays/idonttrustlikethat).
This library is built on top of it (the previous variables are taken from its API).

```typescript
function json<Value>(name: string, validator: v.Validator<Value>): Variable<Value>
```

For instance, if you want to define a set of tokens, you can do the following:

```typescript
import * as env from "ts-env-loader"
import { array, string } from "idonttrustlikethat"

env.json("TOKENS", array(string))
// resulting type: Array<string>

// .env
TOKENS = ["foo", "bar"]
```

The type of `env.json` can be anything, really.
But please have a though for your coworkers managing your application and avoid abusing of it. 🙏

#### `env.nodeEnv`

Shortcut to test `NODE_ENV` and ensure it will be either `development`, `test` or `production`.
Accepts aliases `dev` and `prod` too and convert them to `development` and `production` respectively.

```typescript
const environment = env.load({
  nodeEnv: env.nodeEnv
})

// type of environment.nodeEnv: "development" | "test" | "production"
```

If `NODE_ENV` is anything but accepted values, it will return an error.

#### `env.isDevelopment`, `env.isTest`, `env.isProduction`

Shortcuts to test `NODE_ENV` environment variable and store it as boolean.

```typescript
// NODE_ENV = "test"
const environment = env.load({
  isDev: env.isDevelopment,
  isTest: env.isTest,
  isProd: env.isProduction
})
expect(result).to.deep.equal({
  isDev: false,
  isTest: true,
  isProd: false
})
```

Accepted `NODE_ENV` values for each case:

* `isDevelopment`: `dev` or `development`
* `isTest`: `test`
* `isProduction`: `prod` or `production`

These validation never return an error. If you pass `NODE_ENV=foo`, all three variables will be `false`.

#### Validation chaining

If you want to add constraints in your variables, you can chain validations:

```typescript
port: env.int("PORT").filter(port => port > 0)
```

Technically, `ts-env-loader` uses the same API that `Validation` from [idonttrustlikethat](https://github.com/AlexGalays/idonttrustlikethat).
Please visit its documentation for more information.

Implemented API:

* [map](https://github.com/AlexGalays/idonttrustlikethat#map-filter)
* [filter](https://github.com/AlexGalays/idonttrustlikethat#map-filter)
* [then](https://github.com/AlexGalays/idonttrustlikethat#then)
* [and](https://github.com/AlexGalays/idonttrustlikethat#and)
* [withError](https://github.com/AlexGalays/idonttrustlikethat#customize-error-messages)
* [tagged](https://github.com/AlexGalays/idonttrustlikethat#tagged-stringnumber)
* [nullable](https://github.com/AlexGalays/idonttrustlikethat#optional-nullable) - see below
* [optional](https://github.com/AlexGalays/idonttrustlikethat#optional-nullable) - see below
* [default](https://github.com/AlexGalays/idonttrustlikethat#default) - see below

#### `variable.nullable`, `variable.optional`

By default, a declared variable is required (neither `null` nor `undefined`).
If you want to make it optional or nullable, explicit it:

```typescript
const environment = env.load({
  featureFlags: {
    hello: env.string("HELLO").optional(),
    goodbye: env.string("GOODBYE").nullable()
  }
})

// Usage
if (environment.featureFlags.hello !== undefined) {
  console.log(`hello ${environment.featureFlags.hello}`)
}
if (environment.featureFlags.goodbye !== undefined) {
  console.log(`hello ${environment.featureFlags.goodbye}`)
}
```

#### `variable.default`

By default, a declared variable is required.
However in some cases you want a `default` value to ensure no crash and a valid value when an environment did not provide the value.

```typescript
const environment = env.load({
  featureFlags: {
    newFeature: env.boolean("NEW_FEATURE").default(false)
  }
})

// Usage
if (environment.featureFlags.newFeature) {
  // Do shining things
}
```

Avoid abusing of default values. They can have unexpected side effects and make configuration more complex.
They are relevant when you have new features behind feature flags.

If you want to have values in dev or test environment, prefer using dotenv or another tool.
See [Dotenv support](#dotenv-support) for more information.

#### `env.variable` (custom validation)

If you already have a custom validation in your application (used in your model for instance), you can reuse them here.
All validations built from [idonttrustlikethat](https://github.com/AlexGalays/idonttrustlikethat) are accepted.

```typescript
// Somewhere in you application
import { string } from "idonttrustlikethat"
const alphaNumString = string.filter(value => value.match(/^[a-zA-Z0-9]+$/))

// In your configuration
import * as env from "ts-env-loader"
env.load({
  instanceName: env.variable("INSTANCE_NAME", alphaNumString)
})
```

⚠️ Environment variables are **always** strings.
If you want to validate a `number` (or `int` or `boolean`),
either use [Validation chaining](#validation-chaining) or [numberFromString](https://github.com/AlexGalays/idonttrustlikethat#numberFromString) at starting point.
