function checkTypes(obj, typedef, all) {
  if (!obj) throw new TypeError('checkTypes(Object obj) expected')
  if (!typedef) throw new TypeError('checkTypes(, Object typedef) expected')
  if (typeof all !== 'boolean') throw new TypeError('checkTypes(,, Boolean all) expected')

  for (let [ key, value ] of Object.entries(obj)) {
    if (!typedef[key]) return false

    switch (typedef[key]) {
      case Number:
        if (typeof value !== 'number') return false
        else break
      case String:
        if (typeof value !== 'string') return false
        else break
      case Boolean:
        if (typeof value !== 'boolean') return false
        else break
      case Array:
        if (!Array.isArray(value)) return false
        else break
      default:
        if (!checkTypes(value, typedef[key], all)) return false
        else break
    }
  }

  if (all) {
    // check all keys are there
    for (let key of Object.keys(typedef)) {
      if (!obj[key]) return false
    }
  }

  return true
}

module.exports = checkTypes
