import config from '../../config.js'
import setupSigner from './setup-singer.js'
import switchNetwork from './switch-network.js'

const getCommissionID = async ({ id, address }) => {
    try {
        const { Contract } = window.REDSTONE

        const { signer, chainId } = await setupSigner()

        let _address = config.blockChainsData.find(({ network }) => network.id === chainId)

        if (!_address) {
            await switchNetwork(config.blockChainsData[0].network.id)
            _address = config.blockChainsData[0] 
        }

        const receiver = new Contract(_address.receiver, config.ABI.receiver, signer)
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

export {
    getCommissionID
}
