import { useEffect, useState } from 'react'
import config from '../config'

const useApp = () => {
    const { useAppKit, useAppKitAccount, useAppKitNetwork, networks } = window.REDSTONE

    const { open } = useAppKit()
        , { 
            address: _address, 
            isConnected: _isConnected 
        } = useAppKitAccount({ namespace: 'eip155' })
        , { switchNetwork, chainId } = useAppKitNetwork()
        
    const [isConnected, setIsConnected] = useState(false)
        , [address, setAddress] = useState(null) 

    useEffect(() => {
        const timeId = setTimeout(() => 
            setIsConnected(_isConnected)
        , 100)

        return () => clearTimeout(timeId)
    }, [_isConnected])

    useEffect(() => {
        const timeId = setTimeout(() => 
            setAddress(_address?.toLowerCase())
        , 100)

        return () => clearTimeout(timeId)
    }, [_address])

    useEffect(() => {
        if (isConnected) {
            let chain = config.blockChainsData.find(({ network }) => network.id === chainId)

            if (!chain) {
                const chainIdTestnet = config.blockChainsData.find(({ network }) => network.id === 97)
                    , chainIdBSC = config.blockChainsData.find(({ network }) => network.id === 56)
                    , chainIdLocal = config.blockChainsData.find(({ network }) => network.id === 31337)
    
                if (chainIdTestnet) {
                    switchNetwork(chain.network.id)
                } else {
                    if (chainIdBSC) {
                        switchNetwork(chainIdBSC.network.id)
                    } else {
                        switchNetwork(chainIdLocal.network.id)
                    }
                }
            }
        }
    }, [chainId, isConnected])

    return { 
        networks,
        chainId: Number(chainId),
        switchNetwork,
        isConnected, 
        open, 
        address
    }
}

export default useApp