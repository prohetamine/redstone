const setupSigner = async () => {
    const { appKit, BrowserProvider } = window.REDSTONE

    const walletProvider = appKit.getWalletProvider()
        , provider = new BrowserProvider(walletProvider)
        , signer = await provider.getSigner()
        , network = await provider.getNetwork()

    return {
        signer, 
        chainId: Number(network.chainId)
    }
}

export default setupSigner