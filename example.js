const Spaceschema = require('spaceschema')

const SCHEMA_DIR = './spec/hyperschema'

const schema = Spaceschema.from(SCHEMA_DIR)
const ns1 = schema.namespace('example')

ns1.register({
  name: 'request1',
  fields: [
    { name: 'field1', type: 'uint' },
    { name: 'field2', type: 'string' }
  ]
})

ns1.register({
  name: 'request2',
  fields: [
    { name: 'field1', type: 'string' },
    { name: 'field2', type: 'uint' }
  ]
})

// Write the schema to disk
Spaceschema.toDisk(schema)

const Spacedispatch = require('spacedispatch')

const DISPATCH_DIR = './spec/spacedispatch'
const spacedispatch = Spacedispatch.from(SCHEMA_DIR, DISPATCH_DIR)

const ns2 = spacedispatch.namespace('example')

// Define commands and associate them with requests
ns2.register({
  name: 'command1',
  requestType: '@example/request1'
})
ns2.register({
  name: 'command2',
  requestType: '@example/request1'
})
ns2.register({
  name: 'command3',
  requestType: '@example/request2'
})

// Write the spacedispatch configuration to disk
Spacedispatch.toDisk(spacedispatch)

const { Router, dispatch } = require('./spec/spacedispatch')

const router = new Router()

// Register handlers for commands
router.add('@example/command1', (data, context) => {
  console.log('Handler for command1 executed:', data, context)
  return { success: true }
})

router.add('@example/command2', (data, context) => {
  console.log('Handler for command2 executed:', data, context)
  return { success: true }
})

router.add('@example/command3', (data, context) => {
  console.log('Handler for command3 executed:', data, context)
  return { success: true }
})

const context = { user: 'exampleUser' }

// Dispatch a command1 message
const encodedMessage1 = dispatch('@example/command1', { field1: 42, field2: 'hello' })
router.dispatch(encodedMessage1, context)

// Dispatch a command3 message
const encodedMessage2 = dispatch('@example/command3', { field1: 'world', field2: 99 })
router.dispatch(encodedMessage2, context)
