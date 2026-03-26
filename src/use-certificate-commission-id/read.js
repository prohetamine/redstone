import config from '../../config'

const read = async ({ chainId, cache, useCache = true, params }) => {
    const { JsonRpcProvider, Wallet, Contract } = window.REDSTONE

    const id = params[0]
    const chainIndex = config.blockChainsData.findIndex(({ network: { id } }) => id === chainId)

    const defaultValue = 0

    const cacheHash = `commission-${id}`
    const commission = await window.REDSTONE.QUEUE[chainIndex].add(cacheHash, useCache, async () => {
        try {
            const { receiver: receiverAddress, publicRpc } = config.blockChainsData[chainIndex]

            const _wallet = Wallet.createRandom()
                , provider = new JsonRpcProvider(publicRpc)
                , signer = new Wallet(_wallet.privateKey, provider)

            const receiver = new Contract(receiverAddress, config.ABI.receiver, signer)
                , commission = await receiver.getCommissionID(id)
            
            return {
                data: parseInt(commission),
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

    return commission
}

export default read