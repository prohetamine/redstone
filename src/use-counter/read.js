import config from '../../config'

const read = async ({ useCache = true, cache, params }) => {
    const { JsonRpcProvider, Wallet, Contract } = window.REDSTONE

    const self = params[3]

    const copies = []
    let errorCount = 0
    
    for (let chainIndex = 0; chainIndex < config.blockChainsData.length; chainIndex++) {
        const defaultValue = { 
            count: 0,
            voted: false
        }

        const cacheHash = `${params.join('-')}-${chainIndex}`
        const data = await window.REDSTONE.QUEUE[chainIndex].add(cacheHash, useCache, async () => {
            try {
                const { receiver: receiverAddress, publicRpc } = config.blockChainsData[chainIndex]

                const _wallet = Wallet.createRandom()
                    , provider = new JsonRpcProvider(publicRpc)
                    , signer = new Wallet(_wallet.privateKey, provider)

                const receiver = new Contract(receiverAddress, config.ABI.receiver, signer)
                    , text = await receiver.counterRead(...params)

                return {
                    data: JSON.parse(text),
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
        
        if (data === false) {
            errorCount++
        }

        copies.push(data)
    }

    const isNetworkFailure = self
        ? errorCount > 0
        : errorCount === config.blockChainsData.length

    if (isNetworkFailure) {
        return false
    }

    return {
        count: copies.filter(f => f).reduce((ctx, { count }) => ctx + count, 0),
        voted: !!copies.filter(f => f).find(({ voted }) => voted)
    }
}

export default read