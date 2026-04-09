import config from '../config.js'
import { useEffect, useState } from 'react'
import murmur from 'murmurhash3js'
import reactEqual from './lib/react-equal.js'
import PromiseQueueCache from './lib/promise-queue-cache.js'
import usePingNetwork from './lib/use-ping-network.js'
import tableRowRead from './use-list/table-row-read.js'
import { emptyAddress } from './lib/const.js'
import useApp from './use-app.js'
import useLoadingController from './lib/use-loading-controller.js'

if (!window.REDSTONE.QUEUE) {
    window.REDSTONE.QUEUE = Array(config.blockChainsData.length).fill(true).map(() => new PromiseQueueCache())
}

const defaultArgs = { 
    address: null,
    cache: 1000,
    stas: false,
    once: false,
    self: false,
    selfRead: false,
    single: false,
    randomHash: false,
    addressValue: false,
    copyId: 0,
    load: true,
    watch: true, 
    interval: 30000,
    primaryId: null
}

const useReadListItem = (_id = null, _item, args = defaultArgs) => {
    const { useAppKitNetwork, hostHash } = window.REDSTONE

    const {
        address: userAddress, 
        cache,  
        stas, 
        once, 
        self,
        selfRead,
        single,
        randomHash,
        addressValue,
        copyId: userCopyId,
        load,
        watch, 
        interval,
        primaryId
    } = { ...defaultArgs, ...args }

    const { chainId: userChainId, index: userIndex } = _item

    const pingNetworks = usePingNetwork()
        , { address, isConnected } = useApp()
        , network = useAppKitNetwork()

    const [item, setItem] = useState(null)

    const addr = userAddress || address || emptyAddress

    const isError = !pingNetworks.networks 
        , isAllowDataRead = self ? selfRead ? !!(userAddress || address) : !!address : true

    const chainId = parseInt(network.chainId)

    const id = _id ? `${hostHash}-${murmur.x86.hash128(_id)}` : `primary-${murmur.x86.hash128(primaryId)}`
        , copyId = murmur.x86.hash128(`${userCopyId}`)

    const params = [id, copyId, stas, self, once, single, randomHash, addressValue]

    const [isLoading, setIsLoading, setIsFinished] = useLoadingController(isConnected, isError, chainId, addr, load, watch, interval, cache, ...params)    

    useEffect(() => {
        if (isError) return
        
        const timeId = setTimeout(async () => {
            if (load) {
                setIsLoading(true)
                setIsFinished(false)
                const chainIndex = config.blockChainsData.findIndex(({ network }) => network.id === userChainId)
                if (chainIndex === -1) {
                    setIsFinished(true)
                    return 
                }
                const item = await tableRowRead({ chainIndex, useCache: true, cache, params: [...params, addr, userIndex.toString()] })
                if (item.timestamp !== '0') {
                    setItem(_item => reactEqual(_item, {
                        ...item,
                        isDelete: item.text === '',
                        hasEdit: once
                            ? false
                            : isConnected
                                ? userChainId === item.chainId
                                    ? item.address?.toLowerCase() === address?.toLowerCase()
                                    : false
                                : null
                    }))
                }
                setIsFinished(true)
            }
        }, 100)

        const intervalId = setInterval(async () => {
            if (watch) {
                setIsLoading(true)
                setIsFinished(false)
                const chainIndex = config.blockChainsData.findIndex(({ network }) => network.id === userChainId)
                if (chainIndex === -1) {
                    setIsFinished(true)
                    return 
                }
                const item = await tableRowRead({ chainIndex, useCache: true, cache, params: [...params, addr, userIndex.toString()] })
                if (item.timestamp !== '0') {
                    setItem(_item => reactEqual(_item, {
                        ...item,
                        isDelete: item.text === '',
                        hasEdit: once
                            ? false
                            : isConnected
                                ? userChainId === item.chainId
                                    ? item.address?.toLowerCase() === address?.toLowerCase()
                                    : false
                                : null
                    }))
                }
                setIsFinished(true)
            }
        }, interval)

        return () => {
            clearTimeout(timeId)
            clearInterval(intervalId)
        }
    }, [isConnected, isError, userChainId, userIndex, chainId, addr, load, watch, interval, cache, ...params])

    useEffect(() => {
        const timeId = setTimeout(pingNetworks.ping, 100)
        return () => clearTimeout(timeId)
    }, [isConnected, chainId, addr])

    useEffect(() => {
        if (isError) return

        setIsLoading(true)
        setIsFinished(false)
        setItem(null)

        const timeId = setTimeout(async () => {
            if (load) {
                setIsLoading(true)
                setIsFinished(false)
                const chainIndex = config.blockChainsData.findIndex(({ network }) => network.id === userChainId)
                if (chainIndex === -1) {
                    setIsFinished(true)
                    return 
                }
                const item = await tableRowRead({ chainIndex, useCache: true, cache, params: [...params, addr, userIndex.toString()] })
                if (item.timestamp !== '0') {
                    setItem(_item => reactEqual(_item, {
                        ...item,
                        isDelete: item.text === '',
                        hasEdit: once
                            ? false
                            : isConnected
                                ? userChainId === item.chainId
                                    ? item.address?.toLowerCase() === address?.toLowerCase()
                                    : false
                                : null
                    }))
                }
                setIsFinished(true)
            }
        }, 100)

        return () => clearTimeout(timeId)
    }, [isConnected, chainId, address, ...params])

    return {
        value: isAllowDataRead ? item : null, 
        status: isError && load ? 'error' : isAllowDataRead && load ? isLoading ? 'pending' : 'success' : 'pending',
    }
}

export default useReadListItem