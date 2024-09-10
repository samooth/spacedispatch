const Hyperschema = require('hyperschema')
const Hyperswitch = require('.')

const SCHEMA_DIR = './output/hyperschema'
const SWITCH_DIR = './output/hyperswitch'

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

const hyperswitch = Hyperswitch.from(SCHEMA_DIR, SWITCH_DIR)
const ns2 = hyperswitch.namespace('example')

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

Hyperswitch.toDisk(hyperswitch)
