import { useEffect, useState } from 'react'
import murmur from 'murmurhash3js'
import PromiseQueueCache from '../lib/promise-queue-cache.js'
import usePingNetwork from '../lib/use-ping-network.js'
import update from '../lib/update.js'
import read from './read.js'
import { emptyAddress } from '../lib/const.js'
import useApp from '../use-app.js'
import config from '../../config.js'
import useLoadingController from '../lib/use-loading-controller.js'
import readCommissionId from '../use-commission/read-commission-id.js'

if (!window.REDSTONE.QUEUE) {
    window.REDSTONE.QUEUE = Array(config.blockChainsData.length).fill(true).map(() => new PromiseQueueCache())
}

const defaultArgs = { 
    value: { count: 0, voted: false }, 
    address: null,
    paymentAddress: null,
    cache: 1000,
    stas: false,
    once: false,
    self: false,
    selfRead: false,
    single: false,
    switching: false,
    copyId: 0,
    load: true,
    watch: true,
    interval: 30000,
    primaryId: null
}

const useCounter = (_id = null, args = defaultArgs) => {
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
        switching,
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
    
    const id = `${_id ? `${hostHash}-${murmur.x86.hash128(_id)}` : `primary-${murmur.x86.hash128(primaryId)}`}${(paymentAddress || '').toLowerCase()}`
        , copyId = murmur.x86.hash128(`${userCopyId}`)

    const params = [id, copyId, stas, self, once, single, switching]

    const [isLoading, setIsLoading, setIsFinished] = useLoadingController(isConnected, isError, chainId, addr, load, watch, interval, cache, ...params)
    
    const updateValue = async () => {
        if (isError || !isConnected || !address) return false

        const isUpdated = await update({ type: 'counterWrite', address, params })
        if (!isUpdated) return isUpdated
        
        if (load) {
            setIsLoading(true)
            setIsFinished(false)
            await pingNetworks.ping()
            const data = await read({ cache, useCache: false, params: [...params, addr] })
            if (data !== false) {
                setValue(data || userValue)
            }
            setIsFinished(true)
        }
        
        return isUpdated
    }

    useEffect(() => {
       if (isError) return

        const timeId = setTimeout(async () => {
            if (load) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const data = await read({ useCache: true, cache, params: [...params, addr] })
                if (data !== false) {
                    setValue(data || userValue)
                }
                setIsFinished(true)
            }
        }, 100)

        const intervalId = setInterval(async () => {
            if (load && watch) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const data = await read({ useCache: false, cache, params: [...params, addr] })
                if (data !== false) {
                    setValue(data || userValue)
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
                const data = await read({ useCache: true, cache, params: [...params, addr] })
                if (data !== false) {
                    setValue(data || userValue)
                }
                setIsFinished(true)
            }
        }, 100)

        return () => clearTimeout(timeId)
    }, [isConnected, chainId, address, ...params])

    return {
        value: isAllowDataRead ? value : userValue, 
        updateValue, 
        status: isError && load ? 'error' : isAllowDataRead && load ? isLoading ? 'pending' : 'success' : 'pending',
        getCommission: async () => {
            const commission = await readCommissionId({ chainId, cache, useCache: true, params: [id] })
        
            return {
                commission,
                address,
                chainId
            }
        }
    }
}

export default useCounter