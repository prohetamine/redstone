/* eslint-disable no-unused-vars */
import syncFetch from 'sync-fetch'

const pingRpc = url => {
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 15000)

    const data = syncFetch(url, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: []
      })
    }).json()

    return !!data.result
  } catch (err) {
    return false
  }
}

export default pingRpc