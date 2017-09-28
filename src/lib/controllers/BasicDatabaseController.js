const { checkTypes } = require('../util')

// async superset of Map
class BasicDatabaseController {
  constructor(db, dataSchema) {
    this.db = db

    // UserData, TeamData, etc
    this.dataSchema = dataSchema
  }

  async list() {
    return (await this.db.find({}, { _id: 1 })).map(item => item._id)
  }

  async has(id) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#has(String id) expected')
    return (await this.db.findOne({ _id: id }, { _id: 1})) !== null
  }

  async add(id, data) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#add(String id) expected')
    if (!data || !checkTypes(data, dataSchema, true)) throw new TypeError('BasicDatabaseController#add(, (object following data schema) data) expected')

    await this.db.insert(Object.assign({ _id: id }, data))
  }

  async delete(id) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#delete(String id) expected')

    await this.db.remove({ _id: id }, {})
  }

  async get(id) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#get(String id) expected')

    const doc = await this.db.findOne({ _id: id }, { _id: 0 })
    if (doc === null) throw new Error('BasicDatabaseController#get() item not found')

    return doc
  }

  async set(id, data) {
    if (!id || typeof id !== 'string') throw new TypeError('BasicDatabaseController#set(String id) expected')
    if (!data || !checkTypes(data, this.dataSchema, false)) throw new TypeError('BasicDatabaseController(, (object following data schema) data) expected)')

    const [ updated, doc ] = await this.db.update({ _id: id }, { $set: data }, { returnUpdatedDocs: true, multi: false })
    if (updated === 0) throw new Error('BasicDatabaseController#set() item not found')

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
