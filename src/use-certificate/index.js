import { useEffect, useState } from 'react'
import murmur from 'murmurhash3js'
import PromiseQueueCache from '../lib/promise-queue-cache.js'
import update from '../lib/update.js'
import usePingNetwork from '../lib/use-ping-network.js'
import useApp from '../use-app.js'
import config from '../../config.js'
import useLoadingController from '../lib/use-loading-controller.js'
import readCommissionId from '../use-commission/read-commission-id.js'
import readCertificateCommission from '../use-commission/read-certificate-commission.js'

if (!window.REDSTONE.QUEUE) {
    window.REDSTONE.QUEUE = Array(config.blockChainsData.length).fill(true).map(() => new PromiseQueueCache())
}

const defaultArgs = {
    load: true,
    watch: false, 
    interval: 30000,
    cache: 1000,
    primaryId: null,
    paymentAddress: null,
}

const useCertificate = (_id = null, args = defaultArgs) => {
    const { hostHash } = window.REDSTONE

    const { 
        load,
        watch, 
        interval,
        cache,
        primaryId,
        paymentAddress
    } = { ...defaultArgs, ...args }

    const pingNetworks = usePingNetwork()
        , { address, isConnected, chainId } = useApp()
        
    const [value, setValue] = useState(0)
    
    const isError = !pingNetworks.currentNetwork

    const id = _id ? `${hostHash}-${murmur.x86.hash128(_id)}` : `primary-${murmur.x86.hash128(primaryId)}`
        , certId = `${id}${paymentAddress.toLowerCase()}`

    const [isLoading, setIsLoading, setIsFinished] = useLoadingController(isConnected, isError, chainId, load, watch, interval, cache)

    const getCommission = async () => {    
        const commission = await readCertificateCommission({ chainId, cache, useCache: false })

        return {
            chainId,
            address,
            commission
        }
    }

    const updateValue = async (newValue = false) => {
        if (isError || !isConnected || !address) return false

        const isUpdated = await update({ type: 'certificateCommissionID', address, params: [id, newValue ? newValue : (value || 0).toString()] })
        if (!isUpdated) return isUpdated
        
        if (load) {
            setIsLoading(true)
            setIsFinished(false)
            await pingNetworks.ping()
            const commission = await readCommissionId({ cache, chainId, useCache: false, params: [certId] })
            if (commission !== false) {
                setValue(commission)
            }
            setIsFinished(true)
        }

        return isUpdated
    }

    const recheckValue = async () => {
        if (isError || !isConnected || !address) return false
        
        setIsLoading(true)
        setIsFinished(false)
        await pingNetworks.ping()
        const commission = await readCommissionId({ cache, chainId, useCache: false, params: [certId] })
        setIsFinished(true)
        if (commission !== false) {
            setValue(commission)
            return {
                getCommission,
                recheckValue,
                value: parseInt(commission), 
                updateValue, 
                status
            }
        }

        return false
    }

    useEffect(() => {
        if (isError) return

        const timeId = setTimeout(async () => {
            if (load) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const commission = await readCommissionId({ useCache: true, chainId, cache, params: [certId] })
                if (commission !== false) {
                    setValue(commission)
                }
                setIsFinished(true)
            } 
        }, 100)

        const intervalId = setInterval(async () => {
            if (watch) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const commission = await readCommissionId({ useCache: false, chainId, cache, params: [certId] })
                if (commission !== false) {
                    setValue(commission)
                }
                setIsFinished(true)
            }
        }, interval)

        return () => {
            clearTimeout(timeId)
            clearInterval(intervalId)
        }
    }, [isConnected, isError, address, id, certId, chainId, load, watch, interval])

    useEffect(() => {
        const timeId = setTimeout(pingNetworks.ping, 100)
        return () => clearTimeout(timeId)
    }, [isConnected, chainId, address])

    useEffect(() => {
        if (isError) return
        
        setIsLoading(true)
        setIsFinished(false)
        setValue(0)

        const timeId = setTimeout(async () => {
            if (load) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const commission = await readCommissionId({ useCache: true, chainId, cache, params: [certId] })
                if (commission !== false) {
                    setValue(commission)
                }
                setIsFinished(true)
            } 
        }, 100)

        return () => clearTimeout(timeId)
    }, [isConnected, chainId, address, id, certId])

    return {
        getCommission,
        recheckValue,
        value, 
        updateValue, 
        status: isError ? 'error' : isLoading && load ? 'pending' : 'success'
    }
}

export default useCertificate