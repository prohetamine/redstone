import { useEffect, useState } from 'react'
import PromiseQueueCache from '../lib/promise-queue-cache.js'
import read from './read.js'
import usePingNetwork from '../lib/use-ping-network.js'
import useApp from '../use-app.js'
import config from '../../config.js'
import useLoadingController from '../lib/use-loading-controller.js'

if (!window.REDSTONE.QUEUE) {
    window.REDSTONE.QUEUE = Array(config.blockChainsData.length).fill(true).map(() => new PromiseQueueCache())
}

const defaultArgs = {
    cache: 1000,
    watch: false, 
    interval: 30000
}

const useReadStatistics = (args = defaultArgs) => {
    const { useAppKitNetwork } = window.REDSTONE

    const {   
        cache,
        watch, 
        interval,
    } = { ...defaultArgs, ...args }

    const pingNetworks = usePingNetwork()
        , { address, isConnected } = useApp()
        , network = useAppKitNetwork()

    const [value, setValue] = useState({
        notes: 0,
        lists: 0,
        counters: 0,
        certs: 0,
        coins: 0
    })

    const isError = !pingNetworks.networks

    const chainId = parseInt(network.chainId)

    const [isLoading, setIsLoading, setIsFinished] = useLoadingController(isConnected, isError, chainId)

    useEffect(() => {
        if (isError) return

        const timeId = setTimeout(async () => {
            setIsLoading(true)
            setIsFinished(false)
            await pingNetworks.ping()
            const data = await read({ cache, useCache: true })
            if (data !== false) {
                setValue(data)
            }
            setIsFinished(true)
        }, 100)
        
        const intervalId = setInterval(async () => {
            if (watch) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const data = await read({ cache, useCache: false })
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
    }, [isConnected, isError, chainId, cache, watch, interval])

    useEffect(() => {
        const timeId = setTimeout(pingNetworks.ping, 100)
        return () => clearTimeout(timeId)
    }, [isConnected, chainId])
    
    useEffect(() => {
        if (isError) return

        setIsLoading(true)
        setIsFinished(false)
        setValue({
            notes: 0,
            lists: 0,
            counters: 0,
            certs: 0,
            coins: 0
        })

        const timeId = setTimeout(async () => {
            setIsLoading(true)
            setIsFinished(false)
            await pingNetworks.ping()
            const data = await read({ cache, useCache: true })
            if (data !== false) {
                setValue(data)
            }
            setIsFinished(true)
        }, 100)

        return () => clearTimeout(timeId)
    }, [isConnected, chainId, address])

    return {
        value,
        status: isError ? 'error' : isLoading ? 'pending' : 'success'
    }
}

export default useReadStatistics