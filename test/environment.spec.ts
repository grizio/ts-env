import { expect } from "chai"
import { object, string, array, number } from "idonttrustlikethat"
import * as env from "../src"

describe("environment", () => {
  afterEach(() => {
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

  it("should return the loaded environment into a Result when valid and mode 'return'", () => {
    const raw = { value: "value" }
    const result = env.load(raw, { mode: "return" })
    expect(result).to.deep.equal({
      ok: true,
      value: raw
    })
  })

  it("should return an error into a Result when valid and mode 'return' (instead of throw)", () => {
    const raw = { value: env.string("UNKNOWN") }
    const result = env.load(raw, { mode: "return" })
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
})