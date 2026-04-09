import { createAppKit, AppKitProvider, useAppKit, useAppKitAccount, useAppKitProvider, useAppKitNetwork } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { BrowserProvider, Contract, JsonRpcProvider, Wallet, MaxUint256 } from 'ethers'
import murmur from 'murmurhash3js'
import _config from '../config.js'

if (!window.REDSTONE) {
  window.REDSTONE = {
    useAppKit,
    useAppKitAccount,
    useAppKitProvider,
    BrowserProvider,
    Contract,
    JsonRpcProvider,
    Wallet,
    MaxUint256,
    useAppKitNetwork
  }
}

const RedstoneProvider = ({ children, config }) => {
  if (!window.REDSTONE.appKit) {
    const networks = _config.blockChainsData.map(({ network }) => network)
    window.REDSTONE.networks = networks
    window.REDSTONE.appKit = createAppKit({
      projectId: config.projectId,
      adapters: [new EthersAdapter()],
      networks: networks,
      metadata: config.metadata
    })
  }

  if (config.host) {
    window.REDSTONE.hostHash = murmur.x86.hash128(config.host) || murmur.x86.hash128(window.location.host)
  }

  return AppKitProvider({ children, ...config })
}

export default RedstoneProvider