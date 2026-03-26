import config from '../../config.js'
import { useEffect, useMemo, useState } from 'react'
import murmur from 'murmurhash3js'
import reactEqual from '../lib/react-equal.js'
import PromiseQueueCache from '../lib/promise-queue-cache.js'
import usePingNetwork from '../lib/use-ping-network.js'
import { getCommissionID } from '../lib/commission.js'
import update from '../lib/update.js'
import readRowsCount from './read-rows-count.js'
import tableRowRead from './table-row-read.js'
import { emptyAddress } from '../lib/const.js'
import useApp from '../use-app.js'
import useLoadingController from '../lib/use-loading-controller.js'

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

const useList = (_id = null, args = defaultArgs) => {
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

    const pingNetworks = usePingNetwork()
        , { address, isConnected } = useApp()
        , network = useAppKitNetwork()

    const [lastIndexs, setLastIndexs] = useState(Array(config.blockChainsData.length).fill(0))
    const [_items, setItemTables] = useState(Array(config.blockChainsData.length).fill([]))
    
    const items = useMemo(() => _items.flat().sort((a, b) => a.timestamp - b.timestamp), [_items])
    
    const lastIndex = lastIndexs.reduce((ctx, lastIndex) => ctx + lastIndex, 0)
    
    const addr = userAddress || address || emptyAddress

    const isFullLoad = load && items.length === lastIndex
        , isError = !pingNetworks.networks 
        , isAllowDataRead = self ? selfRead ? !!(userAddress || address) : !!address : true

    const chainId = parseInt(network.chainId)

    const id = _id ? `${hostHash}-${murmur.x86.hash128(_id)}` : `primary-${murmur.x86.hash128(primaryId)}`
        , copyId = murmur.x86.hash128(`${userCopyId}`)

    const params = [id, copyId, stas, self, once, single, randomHash, addressValue]

    const [isLoading, setIsLoading, setIsFinished] = useLoadingController(isConnected, isError, isFullLoad, items, lastIndexs, chainId, addr, load, watch, interval, cache, ...params)    

    const setLastIndexsHelper = _lastIndexs => {
        setLastIndexs(
            lastIndexs => 
                reactEqual(
                    lastIndexs, 
                    lastIndexs.map(
                        (lastIndex, i) => {
                            const index = _lastIndexs.findIndex(([_i]) => _i === i)
                            return (_lastIndexs[index] && _lastIndexs[index][1]) 
                                        ? _lastIndexs[index][1] 
                                        : lastIndex
                        }
                    )
                )
        )
    }

    const setItemTablesHelper = (chainIndex, item) => {
        setItemTables(
                itemTables => 
                    reactEqual(
                        itemTables, 
                        itemTables.map(
                            (items, _chainIndex) => 
                                _chainIndex === chainIndex
                                    ? [
                                        ...items.filter(
                                            _item => _item.index !== item.index
                                        ),
                                        {
                                            ...item,
                                            isDelete: item.text === '',
                                            hasEdit: once
                                                ? false
                                                : isConnected
                                                    ? chainId === item.chainId
                                                        ? item.address?.toLowerCase() === address?.toLowerCase()
                                                        : false
                                                    : null
                                        }
                                    ].sort((a, b) => a.index - b.index)
                                    : items
                        )
                    )
            )
    }

    const updateValue = async ({ index, chainId: _chainId }, data) => {
        if (isError || once || !isConnected || !address || _chainId !== chainId) return false

        const isUpdated = await update({ type: 'listRowUpdate', address, params: [...params, index.toString(), (data || '').toString()] })
        if (!isUpdated) return isUpdated

        if (load) {
            setIsLoading(true)
            setIsFinished(false)
            const chainIndex = config.blockChainsData.findIndex(({ network }) => network.id === chainId)
            await pingNetworks.ping()
            const lastIndexs = await readRowsCount({ cache, useCache: false, params: [...params, addr] })
                , item = await tableRowRead({ chainId, chainIndex, useCache: false, cache, params: [...params, addr, index.toString()] })
            setLastIndexsHelper(lastIndexs)
            setItemTablesHelper(chainIndex, item)
            setIsFinished(true)
        }

        return isUpdated
    }

    const addValue = async data => {
        if (isError || !isConnected || !address) return false

        const isUpdated = await update({ type: 'listRowWrite', address, params: [...params, (data || '').toString()] })
        if (!isUpdated) return isUpdated

        if (load) {
            setIsLoading(true)
            setIsFinished(false)
            await pingNetworks.ping()
            const _lastIndexs = await readRowsCount({ cache, useCache: false, params: [...params, addr] })
            setLastIndexsHelper(_lastIndexs)
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
                const _lastIndexs = await readRowsCount({ cache, useCache: false, params: [...params, addr] })
                setLastIndexsHelper(_lastIndexs)
                setIsFinished(true)
            }
        }, 100)

        const intervalId = setInterval(async () => {
            if (load && watch) {
                setIsLoading(true)
                setIsFinished(false)
                await pingNetworks.ping()
                const _lastIndexs = await readRowsCount({ cache, useCache: false, params: [...params, addr] })
                setLastIndexsHelper(_lastIndexs)
                setIsFinished(true)
            } 
        }, interval)
        
        return () => {
            clearTimeout(timeId)
            clearInterval(intervalId)
        }
    }, [isConnected, isError, addr, chainId, cache, lastIndexs, load, watch, ...params])

    useEffect(() => {
        if (isError) return

        const timeId = setTimeout(async () => {
            await Promise.all(
                lastIndexs.map(async (lastIndex, chainIndex) => {
                    if (lastIndex !== 0 && load) {
                        const offsetLoadCount = lastIndex - 3
                            , loadCount = isFullLoad
                                ? offsetLoadCount < -1
                                    ? -1
                                    : offsetLoadCount
                                : -1

                        for (let index = lastIndex - 1; index > loadCount; index--) {
                            setIsLoading(true)
                            setIsFinished(false)
                            const item = await tableRowRead({
                                chainIndex,
                                useCache: true,
                                cache,
                                params: [...params, addr, index.toString()]
                            })
                            setItemTablesHelper(chainIndex, item)
                            setIsFinished(true)
                        }
                    }
                })
            )
        }, 100)

        const intervalId = setInterval(async () => {
            if (watch && isFullLoad) {
                await Promise.all(
                    lastIndexs.map(async (lastIndex, chainIndex) => {
                        if (lastIndex !== 0) {
                            setIsLoading(true)
                            setIsFinished(false)
                            const index = Math.floor(lastIndex * Math.random())
                            const item = await tableRowRead({
                                chainIndex,
                                useCache: false,
                                cache,
                                params: [...params, addr, index.toString()]
                            })
                            setItemTablesHelper(chainIndex, item)
                            setIsFinished(true)
                        }
                    })
                )
            }
        }, interval)

        return () => {
            clearTimeout(timeId)
            clearInterval(intervalId)
        }
    }, [isConnected, isError, isFullLoad, lastIndexs, chainId, addr, load, watch, interval, cache, ...params])

    useEffect(() => {
        const timeId = setTimeout(pingNetworks.ping, 100)
        return () => clearTimeout(timeId)
    }, [isConnected, chainId, addr])

    useEffect(() => {
        if (isError) return

        setIsLoading(true)
        setIsFinished(false)
        setLastIndexs(Array(config.blockChainsData.length).fill(0))
        setItemTables(Array(config.blockChainsData.length).fill([]))
        
        const timeId = setTimeout(async () => {
            await Promise.all(
                lastIndexs.map(async (lastIndex, chainIndex) => {
                    if (lastIndex !== 0 && load) {
                        const offsetLoadCount = lastIndex - 3
                            , loadCount = isFullLoad
                                ? offsetLoadCount < -1
                                    ? -1
                                    : offsetLoadCount
                                : -1

                        for (let index = lastIndex - 1; index > loadCount; index--) {
                            setIsLoading(true)
                            setIsFinished(false)
                            const item = await tableRowRead({
                                chainIndex,
                                useCache: true,
                                cache,
                                params: [...params, addr, index.toString()]
                            })
                            setItemTablesHelper(chainIndex, item)
                            setIsFinished(true)
                        }
                    }
                })
            )
        }, 100)

        return () => clearTimeout(timeId)
    }, [isConnected, chainId, address, ...params])

    return {
        value: isAllowDataRead ? items.filter(({ isDelete }) => !isDelete) : [], 
        addValue, 
        updateValue, 
        status: isError && load ? 'error' : isAllowDataRead && load ? isLoading ? 'pending' : 'success' : 'pending',
        getCommission: () => getCommissionID({ id, address })
    }
}

export default useList