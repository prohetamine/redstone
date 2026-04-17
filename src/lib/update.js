import config from '../../config'
import setupSigner from './setup-singer'
import switchNetwork from './switch-network'

const update = async ({ type, address, params }) => {
    const { Contract, MaxUint256 } = window.REDSTONE

    const id = params[0]
        , stas = params[2]

    const { chainId } = await setupSigner()
        , _address = config.blockChainsData.find(({ network }) => network.id === chainId)

    if (!_address) {
        const chainIdTestnet = config.blockChainsData.find(({ network }) => network.id === 97)
            , chainIdBSC = config.blockChainsData.find(({ network }) => network.id === 56)
            , chainIdLocal = config.blockChainsData.find(({ network }) => network.id === 31337)

        if (chainIdTestnet) {
            await switchNetwork(chainIdTestnet.network.id)
        } else {
            if (chainIdBSC) {
                await switchNetwork(chainIdBSC.network.id)
            } else {
                await switchNetwork(chainIdLocal.network.id)
            }
        }
    }

    try {
        const { signer, chainId } = await setupSigner()
            , _address = config.blockChainsData.find(({ network }) => network.id === chainId)

        const token = new Contract(_address.token, config.ABI.token, signer)
            , receiver = new Contract(_address.receiver, config.ABI.receiver, signer)

        const allowance = await token.allowance(address, _address.receiver)
            , amount = type === 'certificateCommissionID' 
                            ? await receiver.getCertificateCommission() 
                            : stas 
                                ? await receiver.getCommissionID(id) 
                                : 0

        if (allowance < amount) {
            const approveTx = await token.approve(_address.receiver, MaxUint256)
            await approveTx.wait()
        }

        const receiverTx = await receiver[type](...params)
        const tx = await receiverTx.wait()

        if (tx.status === 1) {
            return true    
        }
    } catch (err) {
        console.error(err)
    }

    return false
}

export default update
