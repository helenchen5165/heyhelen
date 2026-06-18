describe('ReadableStream in jsdom', () => {
  it('supports getReader', async () => {
    const rs = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(new TextEncoder().encode('hello'))
        ctrl.close()
      }
    })
    const reader = rs.getReader()
    const { done, value } = await reader.read()
    expect(done).toBe(false)
    expect(new TextDecoder().decode(value)).toBe('hello')
  })

  it('shows error from hook via a simple async', async () => {
    let caughtError: unknown = null
    const fakeFetch = async () => {
      const rs = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(new TextEncoder().encode('data: {"type":"done"}\n\n'))
          ctrl.close()
        }
      })
      return { ok: true, body: rs } as unknown as Response
    }

    try {
      const resp = await fakeFetch()
      if (!resp.ok || !resp.body) throw new Error('bad resp')
      const reader = resp.body.getReader()
      const { done, value } = await reader.read()
      console.log('Read ok, done=', done, 'value len=', value?.length)
    } catch (e) {
      caughtError = e
      console.error('Error:', e)
    }
    expect(caughtError).toBeNull()
  })
})
