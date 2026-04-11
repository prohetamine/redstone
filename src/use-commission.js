import { useEffect, useState } from 'react'
import PromiseQueueCache from './lib/promise-queue-cache.js'
import update from './lib/update.js'
import { getCertificateCommission, getOwnerCommission } from './lib/commission.js'
import usePingNetwork from './lib/use-ping-network.js'
import useApp from './use-app.js'
import config from './../config.js'
import useLoadingController from './lib/use-loading-controller.js'

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
    const { useAppKitNetwork } = window.REDSTONE

    const { 
        load,
        watch, 
        interval,
        cache
    } = { ...defaultArgs, ...args }

    const pingNetworks = usePingNetwork()
        , { address, isConnected } = useApp()
        , network = useAppKitNetwork()

    const [value, setValue] = useState({
        owner: 0,
        cert: 0
    })
    
    const isError = !pingNetworks.currentNetwork

    const chainId = parseInt(network.chainId)

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
        if (isError || !isConnected) return

        const timeId = setTimeout(async () => {
            if (load) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                
                const certCommission = await getCertificateCommission({ address })
                    , ownerCommission = await getOwnerCommission({ address })

                if (
                    certCommission.commission !== false && 
                    ownerCommission.commission !== false
                ) {
                    setValue({
                        cert: certCommission.commission,
                        owner: ownerCommission.commission
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
                const certCommission = await getCertificateCommission({ address })
                    , ownerCommission = await getOwnerCommission({ address })

                if (
                    certCommission.commission !== false && 
                    ownerCommission.commission !== false
                ) {
                    setValue({
                        cert: certCommission.commission,
                        owner: ownerCommission.commission
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
        if (isError || !isConnected) return

        setIsLoading(true)
        setIsFinished(false)
        setValue(0)

        const timeId = setTimeout(async () => {
            if (load) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const certCommission = await getCertificateCommission({ address })
                    , ownerCommission = await getOwnerCommission({ address })

                if (
                    certCommission.commission !== false && 
                    ownerCommission.commission !== false
                ) {
                    setValue({
                        cert: certCommission.commission,
                        owner: ownerCommission.commission
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
        status: isError ? 'error' : isLoading ? 'pending' : 'success'
    }
}

export default useCommission