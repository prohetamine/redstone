import config from '../../config'

const readCertificateCommission = async ({ chainId, cache, useCache = true }) => {
    const { JsonRpcProvider, Wallet, Contract } = window.REDSTONE

    const chainIndex = config.blockChainsData.findIndex(({ network: { id } }) => id === chainId)

    const defaultValue = 0

    const cacheHash = `cert-commission`
    const commission = await window.REDSTONE.QUEUE[chainIndex].add(cacheHash, useCache, async () => {
        try {
            const { receiver: receiverAddress, publicRpc } = config.blockChainsData[chainIndex]

            const _wallet = Wallet.createRandom()
                , provider = new JsonRpcProvider(publicRpc)
                , signer = new Wallet(_wallet.privateKey, provider)

            const receiver = new Contract(receiverAddress, config.ABI.receiver, signer)
                , commission = await receiver.getCertificateCommission()
            
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

export default readCertificateCommission