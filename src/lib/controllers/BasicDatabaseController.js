// @flow

import checkTypes from '../util/checkTypes'
import Datastore from 'nedb-promise'

// Async superset of Map
export default class BasicDatabaseController {
  db: Datastore
  dataSchema: Object

  constructor(db: Datastore, dataSchema: Object) {
    this.db = db

    // UserData, TeamData, etc
    this.dataSchema = dataSchema
  }

  async typecheckAll() {
    const items = await BasicDatabaseController.prototype.list.apply(this)

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

  async has(id: string) {
    return (await this.db.findOne({ _id: id }, { _id: 1 })) !== null
  }

  async add(id: string, data: Object) {
    if (!checkTypes(data, this.dataSchema, true)) throw new TypeError('BasicDatabaseController#add(, (object following data schema) data) expected')

    await this.db.insert(Object.assign({ _id: id }, data))
  }

  async delete(id: string) {
    await this.db.remove({ _id: id }, {})
  }

  async get(id: string) {
    const doc = await this.db.findOne({ _id: id }, { _id: 0 })
    if (doc === null) throw new Error('BasicDatabaseController#get() item not found')

    return doc
  }

  async set(id: string, data: Object) {
    if (!checkTypes(data, this.dataSchema, false)) throw new TypeError('BasicDatabaseController(, (object following data schema) data) expected)')

    return await this.update(id, { $set: data })
  }

  async update(id: string, query: Object) {
    const [ updated, doc ] = await this.db.update({ _id: id }, query, { returnUpdatedDocs: true, multi: false })
    if (updated === 0) throw new Error('BasicDatabaseController#update() item not found')

    delete doc._id
    return doc
  }

  async getProperty(id: string, key: string) {
    const doc = await this.db.findOne({ _id: id }, { _id: 0, [key]: 1 })
    if (doc === null) throw new Error('BasicDatabaseController#getProperty() item not found')

    return doc[key]
  }

  async setProperty(id: string, key: string, value: any) {
    return await this.set(id, { [key]: value })
  }

  async findByProperty(key: string, value: any) {
    return (await this.db.find({ [key]: value })).map(doc => doc._id)
  }
}
