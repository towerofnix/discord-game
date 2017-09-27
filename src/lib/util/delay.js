function delay(ms) {
  if (typeof ms !== 'number') throw new TypeError('delay(number ms) expected')

  return new Promise(resolve => {
    setTimeout(() => resolve(), ms)
  })
}

module.exports = delay
