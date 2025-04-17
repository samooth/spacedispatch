const p = require('path')
const fs = require('fs')
const tmp = require('test-tmp')

const Spaceschema = require('spaceschema')
const Spacedispatch = require('../../builder.cjs')

class TestBuilder {
  constructor (dir) {
    this.dir = dir
    this.schemaDir = p.join(dir, 'hyperschema')
    this.dispatchDir = p.join(dir, 'spacedispatch')
    this.module = null
    this.version = 0
  }

  rebuild (builder, opts) {
    const schema = Spaceschema.from(this.schemaDir)
    builder.schema(schema)
    Spaceschema.toDisk(schema)
    const spacedispatch = Spacedispatch.from(this.schemaDir, this.dispatchDir, opts)
    builder.dispatch(spacedispatch)
    Spacedispatch.toDisk(spacedispatch)

    if (this.module) {
      delete require.cache[require.resolve(this.dispatchDir)]
      delete require.cache[require.resolve(p.join(this.dispatchDir, 'dispatch.json'))]
    }

    this.module = require(this.dispatchDir)
    this.json = require(p.join(this.dispatchDir, 'dispatch.json'))

    return schema
  }
}

async function createTestSchema (t) {
  const dir = await tmp(t, { dir: p.join(__dirname, '../test-storage') })

  // Copy the runtime into the tmp dir so that we don't need to override it in the codegen
  const runtimePath = p.join(dir, 'node_modules', 'spacedispatch', 'runtime.cjs')
  await fs.promises.mkdir(p.dirname(runtimePath), { recursive: true })
  await fs.promises.copyFile(p.resolve(dir, '../../../runtime.cjs'), runtimePath)

  return new TestBuilder(dir)
}

module.exports = {
  createTestSchema
}
