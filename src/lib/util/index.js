module.exports = {
  log: Object.assign({},
    require('./log').log,
    require('./logFatal').log),
}
