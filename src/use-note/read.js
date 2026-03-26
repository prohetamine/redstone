/* eslint-disable no-unused-vars */
import config from '../../config'

const read = async ({ cache, useCache = true, params }) => {
    const { JsonRpcProvider, Wallet, Contract } = window.REDSTONE

    const address = params[8]
        , self = params[3]
        , once = params[4]

    if (!address) return false

    const datas = []
    let errorCount = 0

    for (let b = 0; b < config.blockChainsData.length; b++) {
        const defaultValue = {
            text: '',
            timestamp: '0'
        }

        const cacheHash = `${params.join('-')}-${b}`

        const cacheAPI = await caches.open('redstone-cache')

        let data = null

        try {
            data = await cacheAPI.match(cacheHash).then(data => data.json())
        } catch (e) {
            data = await window.REDSTONE.QUEUE[b].add(cacheHash, useCache, async () => {
                try {
                    const { receiver: receiverAddress, publicRpc } = config.blockChainsData[b]

                    const _wallet = Wallet.createRandom()
                        , provider = new JsonRpcProvider(publicRpc)
                        , signer = new Wallet(_wallet.privateKey, provider)

                    const receiver = new Contract(receiverAddress, config.ABI.receiver, signer)
                        , text = await receiver.noteRead(...params)
                        , parsed = JSON.parse(text)

                    return {
                        data: {
                            text: parsed?.text ?? '',
                            timestamp: parsed?.timestamp ?? '0'
                        },
                        cache
                    }
                } catch (err) {
                    console.log(err)
                    return {
                        data: false,
                        cache: 0
                    }
                }
            }, defaultValue)
        }

        if (data === false) {
            errorCount++
        }

        if (once && data !== false && data.timestamp !== '0') {
            const response = new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
            await cacheAPI.put(cacheHash, response)
        }

        datas.push(data)
    }

    const isNetworkFailure = self
            ? errorCount > 0
            : errorCount === config.blockChainsData.length

    if (isNetworkFailure) {
        return false
    }

    const main = datas.filter(f => f).sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp)
    )

    return main[0].text
}

export default read