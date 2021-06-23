# ts-env-loader

Load configuration in typescript through environment variables

## Getting started

### Install

```
npm install --save ts-env-loader
```

### Usage

```typescript
import * as env from "ts-env-loader"

env.load({
  database: {
    host: env.string("DATABASE_HOST"),
    port: env.int("DATABASE_PORT"),
    username: env.string("DATABASE_USERNAME"),
    password: env.string("DATABASE_PASSWORD"),
    schema: env.string("DATABASE_SCHEMA")
  },
  testMode: env.boolean("TEST_MODE")
})
```

For following configuration (.env file):

```properties
DATABASE_HOST = host
DATABASE_PORT = 5432
DATABASE_USERNAME = username
DATABASE_PASSWORD = password
DATABASE_SCHEMA = schema
TEST_MODE = true
```

The result will be:

```typescript
{
  database: {
    host: "host",
    port: 5432,
    username: "username",
    password: "password",
    schema: "schema"
  },
  testMode: true
}
```

### Safe mode

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

### Dotenv support

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