const p = require('path')
const fs = require('fs')
const Spaceschema = require('spaceschema')

const generateCode = require('./lib/codegen')

const CODE_FILE_NAME = 'index.js'
const MESSAGES_FILE_NAME = 'messages.js'
const DISPATCH_JSON_FILE_NAME = 'dispatch.json'

class SpacedispatchNamespace {
  constructor (spacedispatch, name) {
    this.spacedispatch = spacedispatch
    this.name = name
  }

  register (description) {
    const fqn = '@' + this.name + '/' + description.name
    this.spacedispatch.register(fqn, description)
  }
}

module.exports = class Spacedispatch {
  constructor (schema, dispatchJson, { offset, dispatchDir = null, schemaDir = null } = {}) {
    this.schema = schema
    this.version = dispatchJson ? dispatchJson.version : 0
    this.offset = dispatchJson ? dispatchJson.offset : (offset || 0)
    this.dispatchDir = dispatchDir
    this.schemaDir = schemaDir

    this.namespaces = new Map()
    this.handlersByName = new Map()
    this.handlersById = new Map()
    this.handlers = []

    this.currentOffset = this.offset || 0

    this.changed = false
    this.initializing = true
    if (dispatchJson) {
      for (let i = 0; i < dispatchJson.schema.length; i++) {
        const description = dispatchJson.schema[i]
        this.register(description.name, description)
      }
    }
    this.initializing = false
  }

  static esm = false

  namespace (name) {
    return new SpacedispatchNamespace(this, name)
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

  static from (schemaJson, dispatchJson, opts) {
    const schema = Spaceschema.from(schemaJson)
    if (typeof dispatchJson === 'string') {
      const jsonFilePath = p.join(p.resolve(dispatchJson), DISPATCH_JSON_FILE_NAME)
      let exists = false
      try {
        fs.statSync(jsonFilePath)
        exists = true
      } catch (err) {
        if (err.code !== 'ENOENT') throw err
      }
      opts = { ...opts, dispatchDir: dispatchJson, schemaDir: schemaJson }
      if (exists) return new this(schema, JSON.parse(fs.readFileSync(jsonFilePath)), opts)
      return new this(schema, null, opts)
    }
    return new this(schema, dispatchJson, opts)
  }

  toCode ({ esm = this.constructor.esm, filename } = {}) {
    return generateCode(this, { esm, filename })
  }

  static toDisk (spacedispatch, dispatchDir, opts = {}) {
    if (typeof dispatchDir === 'object' && dispatchDir) {
      opts = dispatchDir
      dispatchDir = null
    }
    if (typeof opts.esm === 'undefined') {
      opts = { ...opts, esm: this.esm }
    }
    if (!dispatchDir) dispatchDir = spacedispatch.dispatchDir
    fs.mkdirSync(dispatchDir, { recursive: true })

    const messagesPath = p.join(p.resolve(dispatchDir), MESSAGES_FILE_NAME)
    const dispatchJsonPath = p.join(p.resolve(dispatchDir), DISPATCH_JSON_FILE_NAME)
    const codePath = p.join(p.resolve(dispatchDir), CODE_FILE_NAME)

    fs.writeFileSync(dispatchJsonPath, JSON.stringify(spacedispatch.toJSON(), null, 2), { encoding: 'utf-8' })
    fs.writeFileSync(messagesPath, spacedispatch.schema.toCode(opts), { encoding: 'utf-8' })
    fs.writeFileSync(codePath, generateCode(spacedispatch, opts), { encoding: 'utf-8' })
  }
}
