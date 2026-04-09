import config from '../../config.js'
import setupSigner from './setup-singer.js'

const getCommissionID = async ({ id, address }) => {
    const { Contract } = window.REDSTONE

    const { signer, chainId } = await setupSigner()
        , _address = config.blockChainsData.find(({ network }) => network.id === chainId)
        , receiver = new Contract(_address.receiver, config.ABI.receiver, signer)
        , commission = await receiver.getCommissionID(id)

    return { 
        commission: parseInt(commission),
        chainId, 
        address 
    }
}

const getCertificateCommission = async ({ address }) => {
    const { Contract } = window.REDSTONE

    const { signer, chainId } = await setupSigner()
        , _address = config.blockChainsData.find(({ network }) => network.id === chainId)
        , receiver = new Contract(_address.receiver, config.ABI.receiver, signer)
        , commission = await receiver.getCertificateCommission()

    return { 
        commission: parseInt(commission),
        chainId, 
        address 
    }
}

const getOwnerCommission = async () => {
    const { Contract } = window.REDSTONE
    
    const { signer, chainId } = await setupSigner()
        , _address = config.blockChainsData.find(({ network }) => network.id === chainId)
        , receiver = new Contract(_address.receiver, config.ABI.receiver, signer)
        , commission = await receiver.getOwnerCommission()

    return parseInt(commission)
}

export {
    getCommissionID,
    getCertificateCommission,
    getOwnerCommission
}
