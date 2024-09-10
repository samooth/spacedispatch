const p = require('path')
const fs = require('fs')
const tmp = require('test-tmp')

const Hyperschema = require('hyperschema')
const Hyperswitch = require('../..')

class TestBuilder {
  constructor (dir) {
    this.dir = dir
    this.schemaDir = p.join(dir, 'hyperschema')
    this.switchDir = p.join(dir, 'hyperswitch')
    this.module = null
    this.version = 0
  }

  rebuild (builder) {
    const schema = Hyperschema.from(this.schemaDir)
    builder.schema(schema)
    Hyperschema.toDisk(schema)
    const hyperswitch = Hyperswitch.from(this.schemaDir, this.switchDir)
    builder.switch(hyperswitch)
    Hyperswitch.toDisk(hyperswitch)

    if (this.module) {
      delete require.cache[require.resolve(this.switchDir)]
      delete require.cache[require.resolve(p.join(this.switchDir, 'switch.json'))]
    }

    this.module = require(this.switchDir)
    this.json = require(p.join(this.switchDir, 'switch.json'))

    return schema
  }
}

async function createTestSchema (t) {
  const dir = await tmp(t, { dir: p.join(__dirname, '../test-storage') })

  // Copy the runtime into the tmp dir so that we don't need to override it in the codegen
  const runtimePath = p.join(dir, 'node_modules', 'hyperswitch', 'runtime.js')
  await fs.promises.mkdir(p.dirname(runtimePath), { recursive: true })
  await fs.promises.copyFile(p.resolve(dir, '../../../runtime.js'), runtimePath)

  return new TestBuilder(dir)
}

module.exports = {
  createTestSchema
}
