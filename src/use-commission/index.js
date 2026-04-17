import { useEffect, useState } from 'react'
import PromiseQueueCache from '../lib/promise-queue-cache.js'
import update from '../lib/update.js'
import usePingNetwork from '../lib/use-ping-network.js'
import useApp from '../use-app.js'
import config from '../../config.js'
import useLoadingController from '../lib/use-loading-controller.js'
import readCertificateCommission from './read-certificate-commission.js'
import readOwnerCommission from './read-owner-commission.js'

if (!window.REDSTONE.QUEUE) {
    window.REDSTONE.QUEUE = Array(config.blockChainsData.length).fill(true).map(() => new PromiseQueueCache())
}

const defaultArgs = {
    load: true,
    watch: false, 
    interval: 600000,
    cache: 10000
}

const useCommission = (args = defaultArgs) => {
    const { 
        load,
        watch, 
        interval,
        cache
    } = { ...defaultArgs, ...args }

    const pingNetworks = usePingNetwork()
        , { address, isConnected, chainId } = useApp()

    const [value, setValue] = useState({
        owner: 0,
        cert: 0
    })
    
    const isError = !pingNetworks.currentNetwork

    const [isLoading, setIsLoading, setIsFinished] = useLoadingController(isConnected, isError, chainId, load, watch, interval, cache)

    const updateOwnerCommission = async count => {
        if (isError || !isConnected) return false

        const isUpdated = await update({ type: 'setOwnerCommission', address, params: [count] })
        return isUpdated
    }

    const updateCertificateCommission = async count => {
        if (isError || !isConnected) return false

        const isUpdated = await update({ type: 'setCertificateCommission', address, params: [count] })
        return isUpdated
    }

    useEffect(() => {
        if (isError) return

        const timeId = setTimeout(async () => {
            if (load) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const certCommission = await readCertificateCommission({ chainId, cache, useCache: false })
                    , ownerCommission = await readOwnerCommission({ chainId, cache, useCache: false })

                if (
                    certCommission !== false && 
                    ownerCommission !== false
                ) {
                    setValue({
                        cert: certCommission,
                        owner: ownerCommission
                    })
                }
                setIsFinished(true)
            } 
        }, 100)

        const intervalId = setInterval(async () => {
            if (watch) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const certCommission = await readCertificateCommission({ chainId, cache, useCache: true })
                    , ownerCommission = await readOwnerCommission({ chainId, cache, useCache: true })

                if (
                    certCommission !== false && 
                    ownerCommission !== false
                ) {
                    setValue({
                        cert: certCommission,
                        owner: ownerCommission
                    })
                }
                setIsFinished(true)
            }
        }, interval)

        return () => {
            clearTimeout(timeId)
            clearInterval(intervalId)
        }
    }, [isConnected, isError, address, chainId, load, watch, interval])

    useEffect(() => {
        const timeId = setTimeout(pingNetworks.ping, 100)
        return () => clearTimeout(timeId)
    }, [isConnected, chainId, address])

    useEffect(() => {
        if (isError) return

        setIsLoading(true)
        setIsFinished(false)
        setValue({
            cert: 0,
            owner: 0
        })

        const timeId = setTimeout(async () => {
            if (load) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const certCommission = await readCertificateCommission({ chainId, cache, useCache: true })
                    , ownerCommission = await readOwnerCommission({ chainId, cache, useCache: true })

                if (
                    certCommission !== false && 
                    ownerCommission !== false
                ) {
                    setValue({
                        cert: certCommission,
                        owner: ownerCommission
                    })
                }
                setIsFinished(true)
            } 
        }, 100)

        return () => clearTimeout(timeId)
    }, [isConnected, chainId, address])

    return {
        updateOwnerCommission,
        updateCertificateCommission,
        value, 
        status: isError ? 'error' : isLoading && load ? 'pending' : 'success'
    }
}

export default useCommission