import { useEffect, useState } from 'react'
import murmur from 'murmurhash3js'
import PromiseQueueCache from '../lib/promise-queue-cache.js'
import { getCommissionID } from '../lib/commission.js'
import read from './read.js'
import update from '../lib/update.js'
import usePingNetwork from '../lib/use-ping-network.js'
import { emptyAddress } from '../lib/const.js'
import useApp from '../use-app.js'
import config from '../../config.js'
import useLoadingController from '../lib/use-loading-controller.js'

if (!window.REDSTONE.QUEUE) {
    window.REDSTONE.QUEUE = Array(config.blockChainsData.length).fill(true).map(() => new PromiseQueueCache())
}

const defaultArgs = { 
    value: '',
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
    primaryId: null
}

const useNote = (_id = null, args = defaultArgs) => {
    const { useAppKitNetwork, hostHash } = window.REDSTONE

    const { 
        value: userValue,  
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
    
    const id = _id ? `${hostHash}-${murmur.x86.hash128(_id)}` : `primary-${murmur.x86.hash128(primaryId)}`
        , copyId = murmur.x86.hash128(`${userCopyId}`)

    const params = [id, copyId, stas, self, once, single, randomHash, addressValue]

    const [isLoading, setIsLoading, setIsFinished] = useLoadingController(isConnected, isError, chainId, addr, load, cache, ...params)

    const updateValue = async (newValue = false) => {
       if (isError || !isConnected || !address) return false

        const isUpdated = await update({ type: 'noteWrite', address, params: [...params, (newValue || '').toString()] })
        if (!isUpdated) return isUpdated
        
        if (load) {
            setIsLoading(true)
            setIsFinished(false)
            await pingNetworks.ping()
            const data = await read({ cache, useCache: false, params: [...params, addr] })
            if (data !== false) {
                setValue(data)
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
                const data = await read({ cache, useCache: true, params: [...params, addr] })
                if (data !== false) {
                    setValue(data)
                }
                setIsFinished(true)
            }
        }, 100)
        
        return () => clearTimeout(timeId)
    }, [isConnected, isError, addr, chainId, cache, load, ...params])

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
        updateValue, 
        status: isError && load ? 'error' : isAllowDataRead ? isLoading ? 'pending' : 'success' : 'pending',
        getCommission: () => getCommissionID({ id, address })
    }
}

export default useNote