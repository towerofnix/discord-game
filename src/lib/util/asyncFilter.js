export default function asyncFilter(filterFunc) {
  return function(array) {
    const discard = Symbol()
    return Promise.all(array.map(item => filterFunc(item).then(bool => bool ? item : discard)))
      .then(items => items.filter(item => item !== discard))
  }
}
