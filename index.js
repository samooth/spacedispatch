const p = require('path')
const fs = require('fs')
const Hyperschema = require('hyperschema')

const generateCode = require('./lib/codegen')

const CODE_FILE_NAME = 'index.js'
const MESSAGES_FILE_NAME = 'messages.js'
const SWITCH_JSON_FILE_NAME = 'switch.json'

class HyperswitchNamespace {
  constructor (hyperswitch, name) {
    this.hyperswitch = hyperswitch
    this.name = name
  }

  register (description) {
    const fqn = '@' + this.name + '/' + description.name
    this.hyperswitch.register(fqn, description)
  }
}

module.exports = class Hyperswitch {
  constructor (schema, switchJson, { offset, switchDir = null, schemaDir = null } = {}) {
    this.schema = schema
    this.version = switchJson ? switchJson.version : 0
    this.offset = switchJson ? switchJson.offset : (offset || 0)
    this.switchDir = switchDir
    this.schemaDir = schemaDir

    this.namespaces = new Map()
    this.handlersByName = new Map()
    this.handlersById = new Map()
    this.handlers = []

    this.currentOffset = this.offset || 0

    this.changed = false
    this.initializing = true
    if (switchJson) {
      for (let i = 0; i < switchJson.schema.length; i++) {
        const description = switchJson.schema[i]
        this.register(description.name, description)
      }
    }
    this.initializing = false
  }

  namespace (name) {
    return new HyperswitchNamespace(this, name)
  }

  register (fqn, description) {
    const existingByName = this.handlersByName.get(fqn)
    const existingById = Number.isInteger(description.id) ? this.handlersById.get(description.id) : null
    if (existingByName && existingById) {
      if (existingByName !== existingById) throw new Error('ID/Name mismatch for handler: ' + fqn)
      if (Number.isInteger(description.id) && (existingByName.id !== description.id)) {
        throw new Error('Cannot change the assigned ID for handler: ' + fqn)
      }
    }

    const type = this.schema.resolve(description.requestType)
    if (!type) throw new Error('Invalid request type')

    if (existingByName && (existingByName.type !== type)) {
      throw new Error('Cannot alter the request type for a handler')
    }

    if (!this.initializing && !existingByName && !this.changed) {
      this.changed = true
      this.version += 1
    }

    const id = Number.isInteger(description.id) ? description.id : this.currentOffset++

    const handler = {
      id,
      type,
      name: fqn,
      requestType: description.requestType,
      version: Number.isInteger(description.version) ? description.version : this.version
    }

    this.handlersById.set(id, handler)
    this.handlersByName.set(fqn, handler)
    if (!existingByName) {
      this.handlers.push(handler)
    }
  }

  toJSON () {
    return {
      version: this.version,
      schema: this.handlers.map(({ type, ...h }) => h)
    }
  }

  static from (schemaJson, switchJson) {
    const schema = Hyperschema.from(schemaJson)
    if (typeof switchJson === 'string') {
      const jsonFilePath = p.join(p.resolve(switchJson), SWITCH_JSON_FILE_NAME)
      let exists = false
      try {
        fs.statSync(jsonFilePath)
        exists = true
      } catch (err) {
        if (err.code !== 'ENOENT') throw err
      }
      const opts = { switchDir: switchJson, schemaDir: schemaJson }
      if (exists) return new this(schema, JSON.parse(fs.readFileSync(jsonFilePath)), opts)
      return new this(schema, null, opts)
    }
    return new this(schema, switchJson)
  }

  static toDisk (hyperswitch, switchDir) {
    if (!switchDir) switchDir = hyperswitch.switchDir
    fs.mkdirSync(switchDir, { recursive: true })

    const messagesPath = p.join(p.resolve(switchDir), MESSAGES_FILE_NAME)
    const switchJsonPath = p.join(p.resolve(switchDir), SWITCH_JSON_FILE_NAME)
    const codePath = p.join(p.resolve(switchDir), CODE_FILE_NAME)

    fs.writeFileSync(switchJsonPath, JSON.stringify(hyperswitch.toJSON(), null, 2), { encoding: 'utf-8' })
    fs.writeFileSync(messagesPath, hyperswitch.schema.toCode(), { encoding: 'utf-8' })
    fs.writeFileSync(codePath, generateCode(hyperswitch), { encoding: 'utf-8' })
  }
}
