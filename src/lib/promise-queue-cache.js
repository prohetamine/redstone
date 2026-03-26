class PromiseQueueCache {
  constructor(interval = 100) {
    this.interval = interval
    this.queue = []
    this.running = false
    this.cache = new Map()
    this.pending = new Map()
  }

  cancelAll(prefix = '') {
    this.queue = this.queue.filter(({ id }) => {
      if (!id.startsWith(prefix)) return true

      const entry = this.pending.get(id)

      if (entry) {
        entry.cancel?.()
        entry.resolve(entry.defaultValue)
        this.pending.delete(id)
      }

      this.cache.delete(id)

      return false
    })

    for (const [id, entry] of [...this.pending.entries()]) {
      if (!id.startsWith(prefix)) continue

      entry.cancel?.()
      entry.resolve(entry.defaultValue)

      this.cache.delete(id)
      this.pending.delete(id)
    }
  }

  add(id, useCache = true, task, defaultValue = false) {
    const now = Date.now()

    if (useCache) {
      const cached = this.cache.get(id)
      if (cached && cached.expiresAt > now) {
        return cached.promise
      }
    } else {
      this.cache.delete(id)
    }

    if (this.pending.has(id)) {
      return this.pending.get(id).promise
    }

    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })

    this.pending.set(id, {
      promise,
      resolve,
      reject,
      defaultValue,
    })

    this.queue.push({ id, task })

    this._run()

    return promise
  }

  async _run() {
    if (this.running) return
    this.running = true

    while (this.queue.length) {
      const { id, task } = this.queue.shift()
      const entry = this.pending.get(id)
      if (!entry) continue

      try {
        const result = await task()
        const { data, cache } = result || {}

        if (cache && cache > 0) {
          this.cache.set(id, {
            promise: Promise.resolve(data),
            expiresAt: Date.now() + cache,
          })
        }

        entry.resolve(data)
      } catch (err) {
        this.cache.delete(id)
        entry.reject(err)
      }

      this.pending.delete(id)

      await new Promise(res => setTimeout(res, this.interval))
    }

    this.running = false
  }

  getPendingSize() {
    return this.pending.size
  }
}

export default PromiseQueueCache
