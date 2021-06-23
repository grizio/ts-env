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
    port: env.int("DATABASE_PORT").default(5432),
    username: env.string("DATABASE_USERNAME"),
    password: env.string("DATABASE_PASSWORD"),
    schema: env.string("DATABASE_SCHEMA")
  },
  testMode: env.boolean("TEST_MODE"),
  workers: env.int("WORKERS")
})
```

For following configuration (.env file):

```properties
DATABASE_HOST = host
DATABASE_USERNAME = username
DATABASE_PASSWORD = password
DATABASE_SCHEMA = schema
TEST_MODE = true
WORKERS = 17
```

The result will be:

```typescript
{
  database: {
    host: "host",
    port: 5432, // The default value because the environment variable was not set
    username: "username",
    password: "password",
    schema: "schema"
  },
  testMode: true,
  workers: 17
}
```

### Dotenv support

If you want to use dotenv, install it:

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
* `not-production`: always call dotenv except in production
* `() => boolean`: call dotenv when the given function returns `true`

`config` is a `DotenvConfigOptions` so we let you look at [its documentation](https://github.com/motdotla/dotenv#options).