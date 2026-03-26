import config from '../../config'

const readRowsCount = async ({ cache, useCache = true, params }) => {
    const { JsonRpcProvider, Wallet, Contract } = window.REDSTONE

    const lastIndexs = []

    for (let chainIndex = 0; chainIndex < config.blockChainsData.length; chainIndex++) {
        const defaultValue = 0

        const cacheHash = `${params.join('-')}-${chainIndex}`
        const result = await window.REDSTONE.QUEUE[chainIndex].add(cacheHash, useCache, async () => {
            try {
                const { receiver: receiverAddress, publicRpc } = config.blockChainsData[chainIndex]
                
                const _wallet = Wallet.createRandom()
                    , provider = new JsonRpcProvider(publicRpc)
                    , signer = new Wallet(_wallet.privateKey, provider)

                const receiver = new Contract(receiverAddress, config.ABI.receiver, signer)
                    , count = await receiver.listRowsCount(...params)

                return {
                    data: parseInt(count.toString()) || 0,
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

        lastIndexs.push([chainIndex, result])
    }

    return lastIndexs
}

export default readRowsCount