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
                switchNetwork(config.blockChainsData[0].network.id)
            }
        }
    }, [chainId, isConnected])

    return { 
        networks,
        chainId: parseInt(chainId),
        switchNetwork,
        isConnected, 
        open, 
        address
    }
}

export default useApp