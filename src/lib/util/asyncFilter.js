export default function asyncFilter(filterFunc) {
  return function(array) {
    const discard = Symbol()
    return Promise.all(array.map(async item => (await filterFunc(item)) ? item : discard))
      .then(items => items.filter(item => item !== discard))
  }
}
