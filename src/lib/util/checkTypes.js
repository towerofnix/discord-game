import chalk from 'chalk'
let outEnabled = true // XXX ew but it works :D

function out(msg) {
  if (!outEnabled) return
  console.error(chalk`{bgRed [typecheck]} ${msg}`)
}

export default function checkTypes(obj, typedef, all) {
  if (!obj) throw new TypeError('checkTypes(Object obj) expected')
  if (!typedef) throw new TypeError('checkTypes(, Object typedef) expected')
  if (typeof all !== 'boolean') throw new TypeError('checkTypes(,, Boolean all) expected')

  for (const [ key, value ] of Object.entries(obj)) {
    if (!typedef[key]) {
      out(`Unexpected key ${key} on object`)
      return false
    }

    if (checkType(typedef[key], value, all) === false) return false
  }

  if (all) {
    // check all keys are there
    for (const key of Object.keys(typedef)) {
      if (typeof obj[key] === 'undefined' && typedef[key]._checkTypes !== 'maybe') {
        out(`Expected key ${key} to exist on object`)
        return false
      }
    }
  }

  return true
}

function stringify(T) {
  switch (T) {
    case Number: return "Number"
    case String: return "String"
    case Boolean: return "Boolean"
    case Array: return "Array"
    case Function: return "Function"
    case Object: return "Object"
    case null: return "null"
  }

  switch (T._checkTypes) {
    case 'value': return `Value(${T.value})`
    case 'either': return `Either(${T.types.map(stringify).join(', ')})`
    case 'maybe': return `Maybe(${stringify(T.type)})`
  }

  return '?'
}

function stringifyValue(v) {
  switch (typeof v) {
    case 'string': return `"${v.replace(/"/g, '\\"')}"`
    case 'function': return `<function ${v.name}>`
  }

  return v
}

export function checkType(def, value, all) {
  switch (def) {
    case Number:
      if (typeof value !== 'number') {
        out(`Expected ${stringifyValue(value)} to be Number`)
        return false
      } else break
    case String:
      if (typeof value !== 'string') {
        out(`Expected ${stringifyValue(value)} to be String`)
        return false
      } else break
    case Boolean:
      if (typeof value !== 'boolean') {
        out(`Expected ${stringifyValue(value)} to be Boolean`)
        return false
      } else break
    case Array:
      if (!Array.isArray(value)) {
        out(`Expected ${stringifyValue(value)} to be Array`)
        return false
      } else break
    case Function:
      if (typeof value !== 'function') {
        out(`Expected ${stringifyValue(value)} to be Function`)
        return false
      } else break
    case Object:
      if (typeof value !== 'object') {
        out(`Expected ${stringifyValue(value)} to be Object`)
        return false
      } else break
    case null:
      if (value !== null) {
        out(`Expected ${stringifyValue(value)} to be null`)
        return false
      } else break
    default:
      switch (def._checkTypes) {
        case 'either':
          outEnabled = false

          for (const T of def.types) {
            if (checkType(T, value, all) === true) {
              outEnabled = true
              return true
            }
          }

          outEnabled = true

          out(`Expected ${stringifyValue(value)} to be Either(${def.types.map(stringify).join(', ')})`)

          return false
        case 'maybe':
          // undefined | null | T is ok
          if (value === undefined) break
          if (value === null) break

          outEnabled = false
          if (!checkType(def.T, value, all)) {
            outEnabled = true
            out(`Expected ${stringifyValue(value)} to be Maybe(${stringify(def.T)})`)

            return false
          }
          outEnabled = true
          break
        case 'value':
          if (def.value !== value) {
            out(`Expected ${stringifyValue(value)} === ${def.value}`)
            return false
          } else break
        case 'any':
          break
        default:
          // Nested typedef
          if (!checkTypes(def, value, all)) return false
      }
  }

  return true
}

export function Either(...types) {
  return { _checkTypes: 'either', types }
}

export function Maybe(T) {
  return { _checkTypes: 'maybe', T }
}

export function Value(value) {
  return { _checkTypes: 'value', value }
}

export const Any = { _checkTypes: 'any' }
