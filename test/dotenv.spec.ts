import { expect } from "chai"
import * as path from "path"
import * as env from "../src"
import { Option } from "../src"

describe("dotenv support", () => {
  let previousNodeEnv: string | undefined
  beforeEach(() => {
    previousNodeEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    for (let key in process.env) {
      if (key.startsWith("XXX_")) {
        delete process.env[key]
      }
    }
    process.env.NODE_ENV = previousNodeEnv
  })

  it("should correctly load dotenv configuration file when always enabled in test", () => {
    dotenvTestCase({ nodeEnv: "test", when: "always" })
  })

  it("should correctly load dotenv configuration file when always enabled in dev", () => {
    dotenvTestCase({ nodeEnv: "development", when: "always" })
  })

  it("should correctly load dotenv configuration file when always enabled in production", () => {
    dotenvTestCase({ nodeEnv: "production", when: "always" })
  })

  it("should correctly load dotenv configuration file when not-production in test", () => {
    dotenvTestCase({ nodeEnv: "test", when: "not-production" })
  })

  it("should correctly load dotenv configuration file when not-production in dev", () => {
    dotenvTestCase({ nodeEnv: "development", when: "not-production" })
  })

  it("should not load dotenv configuration file when not-production in production", () => {
    failingDotenvTestCase({ nodeEnv: "production", when: "not-production" })
  })

  it("should correctly load dotenv configuration file when given function is true", () => {
    dotenvTestCase({ nodeEnv: "test", when: () => true })
  })

  it("should not load dotenv configuration file when given function is false", () => {
    failingDotenvTestCase({ nodeEnv: "test", when: () => false })
  })

  function dotenvTestCase({ nodeEnv, when }: { nodeEnv: string, when: NonNullable<Option["dotenv"]>["when"] }) {
    process.env.NODE_ENV = nodeEnv
    const result = env.load({
      someString: env.string("XXX_SOME_STRING"),
      someInt: env.int("XXX_SOME_INT"),
    }, {
      dotenv: {
        when: when,
        config: {
          path: path.join(__dirname, "test.env")
        }
      }
    })
    expect(result).to.deep.equal({
      someString: "Hello world",
      someInt: 42
    })
  }

  function failingDotenvTestCase({ nodeEnv, when }: { nodeEnv: string, when: NonNullable<Option["dotenv"]>["when"] }) {
    process.env.NODE_ENV = nodeEnv
    expect(() => env.load({
      someString: env.string("XXX_SOME_STRING"),
      someInt: env.int("XXX_SOME_INT"),
    }, {
      dotenv: {
        when: when,
        config: {
          path: path.join(__dirname, "test.env")
        }
      }
    })).to.throw()
  }
})