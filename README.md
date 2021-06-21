# ts-env

Load configuration in typescript through environment variables

## Getting started

### Install

```
npm install --save ts-env
```

### Usage

```typescript
import * as env from "ts-env"

env.load({
  database: {
    host: env.string("DATABASE_HOST"),
    port: env.int("DATBASE_PORT").default(5432),
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
