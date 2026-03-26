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
    receiver: '0x9505E8B8546cC9015B2c015826d25821CC48C153',
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
    receiver: '0x810090f35DFA6B18b5EB59d298e2A2443a2811E2',
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
    receiver: '0xC08B8Ab6d6ac31374d37B26D530E1Ee5Be8d6406',
    publicRpc: `https://bsc-testnet-rpc.publicnode.com`
  }
]