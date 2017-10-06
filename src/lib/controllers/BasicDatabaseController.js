const { checkTypes } = require('../util')

// async superset of Map
class BasicDatabaseController {
  constructor(db, dataSchema) {
    if (!db) throw new TypeError('new BasicDatabaseController(nedb.DataStore db) expected')
    if (!dataSchema || typeof dataSchema !== 'object') throw new TypeError('new BasicDatabaseController(object dataSchema) expected')

    this.db = db

    // UserData, TeamData, etc
    this.dataSchema = dataSchema
  }

  async typecheckAll() {
    const items = await this.list()

    for (const id of items) {
      const item = await this.get(id)

      if (checkTypes(item, this.dataSchema, true) === false) {
        throw new TypeError(`${this.constructor.name} type check failed! `)
      }
    }
  }

  async list() {
    return (await this.db.find({}, { _id: 1 })).map(item => item._id)
  }

  async has(id) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#has(string id) expected')
    return (await this.db.findOne({ _id: id }, { _id: 1})) !== null
  }

  async add(id, data) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#add(string id) expected')
    if (!data || !checkTypes(data, this.dataSchema, true)) throw new TypeError('BasicDatabaseController#add(, (object following data schema) data) expected')

    await this.db.insert(Object.assign({ _id: id }, data))
  }

  async delete(id) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#delete(string id) expected')

    await this.db.remove({ _id: id }, {})
  }

  async get(id) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#get(string id) expected')

    const doc = await this.db.findOne({ _id: id }, { _id: 0 })
    if (doc === null) throw new Error('BasicDatabaseController#get() item not found')

    return doc
  }

  async set(id, data) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#set(string id) expected')
    if (!data || !checkTypes(data, this.dataSchema, false)) throw new TypeError('BasicDatabaseController(, (object following data schema) data) expected)')

    return await this.update(id, { $set: data })
  }

  async update(id, query) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#update(string id) expected')
    if (!query || typeof query !== 'object') throw new TypeError('BasicDatabaseController#update(object query) expected')

    const [ updated, doc ] = await this.db.update({ _id: id }, query, { returnUpdatedDocs: true, multi: false })
    if (updated === 0) throw new Error('BasicDatabaseController#update() item not found')

    delete doc._id
    return doc
  }

  async getProperty(id, key) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#getProperty(String id) expected')

    const doc = await this.db.findOne({ _id: id }, { _id: 0, [key]: 1 })
    if (doc === null) throw new Error('BasicDatabaseController#getProperty() item not found')

    return doc[key]
  }

  async setProperty(id, key, value) {
    return await this.set(id, { [key]: value })
  }
}

module.exports = { BasicDatabaseController }
