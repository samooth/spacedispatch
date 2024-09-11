const Hyperschema = require('hyperschema')
const Hyperdispatch = require('.')

const SCHEMA_DIR = './output/hyperschema'
const DISPATCH_DIR = './output/hyperdispatch'

const schema = Hyperschema.from(SCHEMA_DIR)
const ns1 = schema.namespace('example')

ns1.register({
  name: 'request1',
  fields: [
    {
      name: 'field1',
      type: 'uint'
    },
    {
      name: 'field2',
      type: 'string'
    }
  ]
})
ns1.register({
  name: 'request2',
  fields: [
    {
      name: 'field1',
      type: 'string'
    },
    {
      name: 'field2',
      type: 'uint'
    }
  ]
})

Hyperschema.toDisk(schema)

const hyperdispatch = Hyperdispatch.from(SCHEMA_DIR, DISPATCH_DIR)
const ns2 = hyperdispatch.namespace('example')

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

Hyperdispatch.toDisk(hyperdispatch)
