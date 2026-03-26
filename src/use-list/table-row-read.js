/* eslint-disable no-unused-vars */
import config from '../../config'

const tableRowRead = async ({ chainIndex, useCache = true, cache, params }) => {
    const { JsonRpcProvider, Wallet, Contract } = window.REDSTONE

    const index = params[9]
        , once = params[4]

    const { receiver: receiverAddress, publicRpc, network: { id } } = config.blockChainsData[chainIndex]

    const defaultValue = {
        address: '',
        chainId: 0,
        index: 0,
        text: '',
        timestamp: '0'
    }

    const cacheHash = `${params.join('-')}-${chainIndex}-${index}`
    
    const cacheAPI = await caches.open('redstone-cache')

    let data = null

     try {
        data = await cacheAPI.match(cacheHash).then(data => data.json())
    } catch (e) {
        data = await window.REDSTONE.QUEUE[chainIndex].add(cacheHash, useCache, async () => {
            try {
                const _wallet = Wallet.createRandom()
                    , provider = new JsonRpcProvider(publicRpc)
                    , signer = new Wallet(_wallet.privateKey, provider)

                const receiver = new Contract(receiverAddress, config.ABI.receiver, signer)
                    , text = await receiver.listRowRead(...params)
                    , data = JSON.parse(text.toString())
                
                return {
                    data: {
                        ...data,
                        chainId: id,
                        index: parseInt(data.index)
                    },
                    cache
                }
            } catch (err) {
                console.log(err)
                return {
                    data: defaultValue,
                    cache: 0
                }
            }
        }, defaultValue)
    }

    if (once && data !== false && data.timestamp !== '0') {
        const response = new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
        await cacheAPI.put(cacheHash, response)
    }

    return data
}

export default tableRowRead