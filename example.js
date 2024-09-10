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

Hyperschema.toDisk(schema)

const hyperswitch = Hyperswitch.from(SCHEMA_DIR, SWITCH_DIR)
const ns2 = hyperswitch.namespace('example')  

Hyperswitch.toDisk(hyperswitch)
