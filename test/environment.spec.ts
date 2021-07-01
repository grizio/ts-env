import { expect } from "chai"
import { object, string, array, number } from "idonttrustlikethat"
import * as env from "../src"

describe("environment", () => {
  let baseNodeEnv: string | undefined = undefined
  beforeEach(() => {
    baseNodeEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    process.env.NODE_ENV = baseNodeEnv

    for (let key in process.env) {
      if (key.startsWith("XXX_")) {
        delete process.env[key]
      }
    }
  })

  it("should correctly load an environment without any environment variable", () => {
    const rawConfiguration = {
      value1: "Some string",
      value2: true,
      value3: 12,
      value4: [1, 2],
      value5: {
        value51: "Some attribute"
      }
    }

    const result = env.load(rawConfiguration)

    expect(result).to.deep.equal(rawConfiguration)
  })

  it("should correctly read environment variables", () => {
    process.env.XXX_DATABASE_HOST = "host"
    process.env.XXX_DATABASE_USERNAME = "username"
    process.env.XXX_DATABASE_PASSWORD = "password"
    process.env.XXX_DATABASE_SCHEMA = "schema"
    process.env.XXX_TEST_MODE = "true"
    process.env.XXX_WORKERS = "17"

    const result = env.load({
      database: {
        host: env.string("XXX_DATABASE_HOST"),
        port: env.int("XXX_DATBASE_PORT").default(5432),
        username: env.string("XXX_DATABASE_USERNAME"),
        password: env.string("XXX_DATABASE_PASSWORD"),
        schema: env.string("XXX_DATABASE_SCHEMA")
      },
      testMode: env.boolean("XXX_TEST_MODE"),
      workers: env.int("XXX_WORKERS")
    })

    expect(result).to.deep.equal({
      database: {
        host: "host",
        port: 5432,
        username: "username",
        password: "password",
        schema: "schema"
      },
      testMode: true,
      workers: 17
    })
  })

  it("should correctly read a json value", () => {
    const rawJson = {
      some: "variable",
      other: [
        { inline: 12 },
        { inline: 22 }
      ]
    }
    process.env.XXX_JSON = JSON.stringify(rawJson)

    const result = env.load({
      json: env.json("XXX_JSON", object({
        some: string,
        other: array(object({ inline: number }))
      }))
    })

    expect(result).to.deep.equal({
      json: rawJson
    })
  })

  it("should return the loaded environment into a Result when using `loadSafe`", () => {
    const raw = { value: "value" }
    const result = env.loadSafe(raw)
    expect(result).to.deep.equal({
      ok: true,
      value: raw
    })
  })

  it("should return an error into a Result when valid and using `loadSafe`", () => {
    const raw = { value: env.string("UNKNOWN") }
    const result = env.loadSafe(raw)
    expect(result).to.deep.equal({
      ok: false,
      errors: [
        {
          message: "Expected string, got undefined",
          path: "value"
        }
      ]
    })
  })

  it("should correctly test NODE_ENV value", () => {
    testNodeEnvValue("development", "development")
    testNodeEnvValue("dev", "development")
    testNodeEnvValue("test", "test")
    testNodeEnvValue("production", "production")
    testNodeEnvValue("prod", "production")

    process.env.NODE_ENV = "invalid"
    expect(() => env.load({
      nodeEnv: env.nodeEnv
    })).to.throw()
  })

  function testNodeEnvValue(value: string, expected: string) {
    process.env.NODE_ENV = value
    const result = env.load({
      nodeEnv: env.nodeEnv
    })
    expect(result).to.deep.equal({ nodeEnv: expected })
  }

  it("should correctly test NODE_ENV value (development, test, production)", () => {
    testNodeEnvCase("development", { isDev: true, isTest: false, isProd: false })
    testNodeEnvCase("dev", { isDev: true, isTest: false, isProd: false })

    testNodeEnvCase("test", { isDev: false, isTest: true, isProd: false })

    testNodeEnvCase("production", { isDev: false, isTest: false, isProd: true })
    testNodeEnvCase("prod", { isDev: false, isTest: false, isProd: true })
  })

  function testNodeEnvCase(nodeEnv: string, expected: { isDev: boolean, isTest: boolean, isProd: boolean }) {
    process.env.NODE_ENV = nodeEnv
    const result = env.load({
      isDev: env.isDevelopment,
      isTest: env.isTest,
      isProd: env.isProduction
    })
    expect(result).to.deep.equal(expected)
  }

  it("should check port validation", () => {
    process.env.XXX_PORT = "1234"
    const result = env.load({ port: env.port("XXX_PORT") })
    expect(result).to.deep.equal({ port: 1234 })

    expect(() => {
      process.env.XXX_PORT = "0"
      env.load({ port: env.port("XXX_PORT") })
    }).to.throw()
    expect(() => {
      process.env.XXX_PORT = "65536"
      env.load({ port: env.port("XXX_PORT") })
    }).to.throw()
  })
})