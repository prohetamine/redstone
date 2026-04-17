/* eslint-disable no-unused-vars */
const  switchNetwork = async chainIdDecimal => {
    const { appKit } = window.REDSTONE

    const walletProvider = appKit.getWalletProvider()
    const chainIdHex = '0x' + chainIdDecimal.toString(16)

    try {
        await walletProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
        })
        return true
    } catch (switchError) {
        return false
    }
}

export default switchNetwork