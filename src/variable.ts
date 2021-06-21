import * as v from "idonttrustlikethat"

export class Variable<Value> {
  readonly name: string
  readonly validator: v.Validator<Value>

  constructor(name: string, validator: v.Validator<Value>) {
    this.name = name
    this.validator = validator
  }

  map = <NextValue>(fn: (value: Value) => NextValue): Variable<NextValue> => this.update(this.validator.map(fn))
  filter = (fn: (value: Value) => boolean): Variable<Value> => this.update(this.validator.filter(fn))
  then = <NextValue>(validator: v.Validator<NextValue>): Variable<NextValue> => this.update(this.validator.then(validator))
  and = <NextValue>(fn: (value: Value) => v.Result<string, NextValue>): Variable<NextValue> => this.update(this.validator.and(fn))
  withError = (errorFunction: (value: unknown) => string): Variable<Value> => this.update(this.validator.withError(errorFunction))
  tagged<TAG extends string>(this: Variable<string>): Variable<TAG>;
  tagged<TAG extends number>(this: Variable<number>): Variable<TAG>;
  tagged<TAG>(): Variable<TAG> {
    return this as {} as Variable<TAG>
  }
  nullable = (): Variable<Value | null | undefined> => this.update(this.validator.nullable());
  optional = (): Variable<Value | undefined> => this.update(this.validator.optional())
  default = (value: Value): Variable<Value> => this.update(this.validator.nullable().default(value))

  private update = <NextValue>(validator: v.Validator<NextValue>) => new Variable(this.name, validator)
}

export function variable<Value>(name: string, validator: v.Validator<Value>): Variable<Value> {
  return new Variable(name, validator)
}

export function string(name: string): Variable<string> {
  return variable(name, v.string)
}

export function int(name: string): Variable<number> {
  return variable(name, v.intFromString)
}

export function number(name: string): Variable<number> {
  return variable(name, v.numberFromString)
}

export function boolean(name: string): Variable<boolean> {
  return variable(name, v.booleanFromString)
}

type Literal = string | number | boolean | null | undefined
export function union<AcceptedValues extends Literal[]>(name: string, ...acceptedValues: AcceptedValues): Variable<AcceptedValues[number]> {
  return variable(name, v.union(...acceptedValues))
}

export function isoDate(name: string): Variable<Date> {
  return variable(name, v.isoDate)
}

export function relativeUrl(name: string, baseUrl?: string): Variable<string> {
  return variable(name, v.relativeUrl(baseUrl))
}

export function absoluteUrl(name: string): Variable<string> {
  return variable(name, v.absoluteUrl)
}

export function url(name: string): Variable<string> {
  return variable(name, v.url)
}

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