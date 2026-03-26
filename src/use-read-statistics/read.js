import config from '../../config'

const read = async ({ cache, useCache = true }) => {
    const { JsonRpcProvider, Wallet, Contract } = window.REDSTONE

    const copies = []

    for (let b = 0; b < config.blockChainsData.length; b++) {
        const defaultValue = false

        const cacheHash = `statistics-${b}`
        const result = await window.REDSTONE.QUEUE[b].add(cacheHash, useCache, async () => {
            try {
                const { receiver: receiverAddress, publicRpc } = config.blockChainsData[b]

                const _wallet = Wallet.createRandom()
                    , provider = new JsonRpcProvider(publicRpc)
                    , signer = new Wallet(_wallet.privateKey, provider)

                const receiver = new Contract(receiverAddress, config.ABI.receiver, signer)
                    , text = await receiver.statusRead()
                    , data = JSON.parse(text)

                return {
                    data,
                    cache
                }
            } catch (err) {
                console.log(err)
                return {
                    data: false,
                    cache: 0
                }
            }
        }, defaultValue)

        copies.push(result)
    }

    const statistics = copies.filter(f => f).reduce((ctx, chain) => {
        ctx.notes += parseInt(chain.notes) || 0
        ctx.lists += parseInt(chain.lists) || 0
        ctx.counters += parseInt(chain.counters) || 0
        ctx.certs += parseInt(chain.certs) || 0
        ctx.coins += parseInt(chain.coins) || 0
        return ctx
    }, {
        notes: 0,
        lists: 0,
        counters: 0,
        certs: 0,
        coins: 0
    })

    return statistics
}

export default read