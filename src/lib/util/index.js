module.exports = {
  prompt: require('./prompt'),
  log: Object.assign({},
    require('./log').log,
    require('./logFatal').log),
}
