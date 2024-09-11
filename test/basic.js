const test = require('brittle')

const { createTestSchema } = require('./helpers')

test('basic sync switch', async t => {
  t.plan(6)

  const hs = await createTestSchema(t)
  hs.rebuild({
    schema: schema => {
      const ns = schema.namespace('test')
      ns.register({
        name: 'request',
        fields: [
          {
            name: 'id',
            type: 'uint'
          },
          {
            name: 'str',
            type: 'string'
          }
        ]
      })
    },
    switch: hyperswitch => {
      const ns = hyperswitch.namespace('test')
      ns.register({
        name: 'test-request-1',
        requestType: '@test/request'
      })
      ns.register({
        name: 'test-request-2',
        requestType: '@test/request'
      })
    }
  })
  const { dispatch, Router } = hs.module

  const r = new Router()
  r.add('@test/test-request-1', (req, ctx) => {
    t.is(ctx, 'some-context')
    t.is(req.id, 10)
    t.is(req.str, 'hello')
  })
  r.add('@test/test-request-2', (req, ctx) => {
    t.is(ctx, 'another-context')
    t.is(req.id, 20)
    t.is(req.str, 'world')
  })

  await r.dispatch(dispatch('@test/test-request-1', { id: 10, str: 'hello' }), 'some-context')
  await r.dispatch(dispatch('@test/test-request-2', { id: 20, str: 'world' }), 'another-context')
})
