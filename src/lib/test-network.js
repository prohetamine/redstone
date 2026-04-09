import { defineChain } from '@reown/appkit/networks'
import defaultIcon from './../assets/default-network.svg?react'
import bnbIcon from './../assets/bnb.svg?react'

const ip = '192.168.50.143'

export default [
  {
    network: defineChain({
      id: 31337,
      chainNamespace: 'eip155',
      name: 'networkTest',
      icon: defaultIcon,
      bgColor: '#FFB7B7',
      color: '#2D0000',
      rpcUrls: {
        default: {
          http: [`http://${ip}:8545`],
        }
      },
      blockExplorers: {
        default: { name: 'networkTest', url: 'https://bscscan.com' },
      }
    }),
    token: '0x512F7469BcC83089497506b5df64c6E246B39925',
    receiver: '0x67C109F60d55e89907C4d0Ac91103f1A8Ee86E7c',
    publicRpc: `http://${ip}:8545`
  },
  {
    network: defineChain({
      id: 14188,
      chainNamespace: 'eip155',
      name: 'networkTest2',
      icon: defaultIcon,
      bgColor: '#FFB7B7',
      color: '#2D0000',
      rpcUrls: {
        default: {
          http: [`http://${ip}:8546`],
        }
      },
      blockExplorers: {
        default: { name: 'networkTest2', url: 'https://polygonscan.com' },
      }
    }),
    token: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    receiver: '0x022D2B8173c7BCad83420d0953362335afB89355',
    publicRpc: `http://${ip}:8546`
  },
  {
    network: defineChain({
      id: 97,
      chainNamespace: 'eip155',
      name: 'BSC Testnet',
      icon: bnbIcon,
      bgColor: '#F0B90B',
      color: '#fff',
      rpcUrls: {
        default: {
          http: [`https://bsc-testnet-rpc.publicnode.com`],
        }
      },
      blockExplorers: {
        default: { name: 'testnet.bscscan.com', url: 'https://testnet.bscscan.com' },
      }
    }),
    token: '0xD566886eB93500e2BA464bd48c8D5A2556569253',
    receiver: '0x5179cB4c9D3A3d86C054E2cCE30E4D08B7526885',
    publicRpc: `https://bsc-testnet-rpc.publicnode.com`
  }
]