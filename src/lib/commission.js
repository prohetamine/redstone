import config from '../../config.js'
import setupSigner from './setup-singer.js'

const getCommissionID = async ({ id, address }) => {
    try {
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
    } catch (err) {
        console.log(err)
        return false
    }
}

const getCertificateCommission = async ({ address }) => {
    try {
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
    } catch (err) {
        console.log(err)
        return false
    }
}

const getOwnerCommission = async ({ address }) => {
    try {
        const { Contract } = window.REDSTONE
    
        const { signer, chainId } = await setupSigner()
            , _address = config.blockChainsData.find(({ network }) => network.id === chainId)
            , receiver = new Contract(_address.receiver, config.ABI.receiver, signer)
            , commission = await receiver.getOwnerCommission()

        return { 
            commission: parseInt(commission),
            chainId, 
            address 
        }    
    } catch (err) {
        console.log(err)
        return false
    }
}

export {
    getCommissionID,
    getCertificateCommission,
    getOwnerCommission
}
