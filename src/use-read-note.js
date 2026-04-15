import { useEffect, useState } from 'react'
import murmur from 'murmurhash3js'
import PromiseQueueCache from './lib/promise-queue-cache.js'
import read from './use-note/read.js'
import usePingNetwork from './lib/use-ping-network.js'
import { emptyAddress } from './lib/const.js'
import useApp from './use-app.js'
import config from '../config.js'
import useLoadingController from './lib/use-loading-controller.js'

if (!window.REDSTONE.QUEUE) {
    window.REDSTONE.QUEUE = Array(config.blockChainsData.length).fill(true).map(() => new PromiseQueueCache())
}

const defaultArgs = {
    value: '',
    address: null,
    paymentAddress: null,
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
    watch: false, 
    interval: 30000,
    primaryId: null
}

const useReadStorage = (_id = null, args = defaultArgs) => {
    const { useAppKitNetwork, hostHash } = window.REDSTONE

    const {  
        value: userValue,  
        address: userAddress, 
        paymentAddress,
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

    const pingNetworks = usePingNetwork()
        , { address, isConnected } = useApp()
        , network = useAppKitNetwork()

    const [value, setValue] = useState(userValue)

    const addr = userAddress || address || emptyAddress

    const isError = !pingNetworks.networks
        , isAllowDataRead = self ? selfRead ? !!(userAddress || address) : !!address : true

    const chainId = parseInt(network.chainId)

    const id = `${_id ? `${hostHash}-${murmur.x86.hash128(_id)}` : `primary-${murmur.x86.hash128(primaryId)}`}${stas ? (paymentAddress || '').toLowerCase() : ''}`
        , copyId = murmur.x86.hash128(`${userCopyId}`)
    
    const params = [id, copyId, stas, self, once, single, randomHash, addressValue]

    const [isLoading, setIsLoading, setIsFinished] = useLoadingController(isConnected, isError, chainId, addr, load, watch, interval, cache, ...params)

    useEffect(() => {
        if (isError) return

        const timeId = setTimeout(async () => {
            if (load) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const data = await read({ cache, useCache: true, params: [...params, addr] })
                if (data !== false) {
                    setValue(data)
                }
                setIsFinished(true)
            }
        }, 100)
        
        const intervalId = setInterval(async () => {
            if (watch) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const data = await read({ cache, useCache: false, params: [...params, addr] })
                if (data !== false) {
                    setValue(data)
                }
                setIsFinished(true)
            }
        }, interval)

        return () => {
            clearTimeout(timeId)
            clearInterval(intervalId)
        }
    }, [isConnected, isError, addr, userValue, chainId, cache, load, watch, interval, ...params])

    useEffect(() => {
        const timeId = setTimeout(pingNetworks.ping, 100)
        return () => clearTimeout(timeId)
    }, [isConnected, chainId, addr])
    
    useEffect(() => {
        if (isError) return

        setIsLoading(true)
        setIsFinished(false)
        setValue(userValue)

        const timeId = setTimeout(async () => {
            if (load) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const data = await read({ cache, useCache: true, params: [...params, addr] })
                if (data !== false) {
                    setValue(data)
                }
                setIsFinished(true)
            }
        }, 100)

        return () => clearTimeout(timeId)
    }, [isConnected, chainId, address, ...params])

    const _value = isAllowDataRead ? (value || userValue) : ''

    return {
        value: _value,
        status: isError && load ? 'error' : isAllowDataRead && load ? isLoading ? 'pending' : 'success' : 'pending',
    }
}

export default useReadStorage