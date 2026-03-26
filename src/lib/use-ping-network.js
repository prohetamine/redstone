import config from '../../config.js'
import { useEffect, useState } from 'react'
import reactEqual from './react-equal.js'
import PromiseQueueCache from './promise-queue-cache.js'

if (!window.REDSTONE.QUEUE) {
    window.REDSTONE.QUEUE = Array(config.blockChainsData.length).fill(true).map(() => new PromiseQueueCache())
}

const usePingNetwork = () => {
    const { useAppKitNetwork, JsonRpcProvider, Wallet, Contract } = window.REDSTONE

    const [statuses, setStatuses] = useState(Array(config.blockChainsData.length).fill(true))
        , network = useAppKitNetwork()

    const chainId = parseInt(network.chainId)

    const ping = () => Promise.all(
        config.blockChainsData.map(
            async (_, i) => {
                const cacheHash = `network-ping-${i}`
                const status = await window.REDSTONE.QUEUE[i].add(cacheHash, true, async () => {
                    try {
                        const { receiver: receiverAddress, publicRpc } = config.blockChainsData[i]

                        const _wallet = Wallet.createRandom()
                            , provider = new JsonRpcProvider(publicRpc)
                            , signer = new Wallet(_wallet.privateKey, provider)  

                        const receiver = new Contract(receiverAddress, config.ABI.receiver, signer)
                            , status = await receiver.pingNetwork()
                        
                        return {
                            data: status,
                            cache: 15000
                        }
                    } catch (err) {
                        console.log(err)
                        return {
                            data: -1,
                            cache: 0
                        }
                    }    
                }, true)

                setStatuses(_statuses => 
                    reactEqual(
                        _statuses, 
                        _statuses.map(
                            (_status, _i) => 
                                i === _i 
                                ? status !== -1 || status === true 
                                    ? true 
                                    : false 
                                : _status
                        )
                    )
                )
            }
        )
    )

    useEffect(() => {
       const timeId = setTimeout(ping, 1000)
           , intervalId = setInterval(ping, 120000)
        
        return () => {
            clearTimeout(timeId)
            clearInterval(intervalId)
        }
    }, [])

    return {
        ping,
        networks: statuses.find(status => status) ? true : false,
        currentNetwork: statuses[config.blockChainsData.findIndex(({ network: { id } }) => chainId === id)]
    }
}

export default usePingNetwork