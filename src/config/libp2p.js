import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { bootstrap } from '@libp2p/bootstrap'
import { yamux } from '@chainsafe/libp2p-yamux'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { identify } from '@libp2p/identify'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import { tcp } from '@libp2p/tcp'
import { LevelBlockstore } from 'blockstore-level'
import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { dcutr } from '@libp2p/dcutr'
import { kadDHT } from '@libp2p/kad-dht'
import { ping } from '@libp2p/ping'



export const Libp2pOptions = {
  peerDiscovery: [
    bootstrap({
      list: [
        // IPFS_OFFICIAL_BOOTSTRAPS: Amino DHT Bootstrappers
        // https://docs.ipfs.tech/concepts/public-utilities/#amino-dht-bootstrappers
        "/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
        "/dnsaddr/sv15.bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
        "/dnsaddr/am6.bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
        "/dnsaddr/ny5.bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
        "/dnsaddr/va1.bootstrap.libp2p.io/p2p/12D3KooWKnDdG3iXw9eTFijk3EWSunZcFi54Zka4wmtqtt6rPxc8",

        // PUBLIC_BOOTSTRAP
        "/ip4/35.220.212.56/tcp/4001/p2p/12D3KooWJ6MTkNM8Bu8DzNiRm1GY3Wqh8U8Pp1zRWap6xY3MvsNw",
        "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
        "/ip4/104.131.131.82/udp/4001/quic-v1/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",

        // LIBP2P_BOOTSTRAP, FIXME: cannot resolve bootstrap.libp2p.io: Unknown host
        // "/dnsaddr/bootstrap.libp2p.io/p2p/12D3KooWQiJMV63WiHBbmdZr3jPrr7ZrH1WAM5VTiZ7bSk2fwzvm",
        // "/dnsaddr/bootstrap.libp2p.io/p2p/12D3KooWEzx6rCWrb1R3dAk6urW6X1XH3NwQZz9fktZu4rhQa3j3",
        // "/dnsaddr/bootstrap.libp2p.io/p2p/12D3KooWD71WtxGTVKa2EgaX21kh2RXHHyNwX6u1k7bTWbtSA3UQ",
        // "/dnsaddr/bootstrap.libp2p.io/p2p/12D3KooWEtp8K2npfkiZBVG1ELvLyBrHrA4rdToZ5znniS6T7Gbn",
      ]
    })
  ],
  addresses: {
    listen: [
      '/ip4/0.0.0.0/tcp/0', '/ip4/0.0.0.0/tcp/0/ws', '/ip4/0.0.0.0/udp/0/quic'
    ]
  },
  transports: [
    tcp(),
    webSockets()
  ],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    identify: identify(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
    dcutr: dcutr(),
    aminoDHT: kadDHT({
      protocol: '/ipfs/kad/1.0.0',
      // TODO: peerInfoMapper: removePrivateAddressesMapper
    }),
    ping: ping(),
  }
}

/**
 * Initializes an IPFS instance with a given directory and peer ID.
 * If no peer ID is provided, a new one is generated.
 *
 * @param {*} dir
 * @param {*} peerId
 *
 * @returns {Promise<Helia>} The initialized Helia instance.
 */
export const initIPFSInstance = async (dir, peerId) => {
  // TODO: check the default value of createLibp2p's options.privateKey
  // see https://github.com/libp2p/js-libp2p/blob/e4f603f51603810440d43e92718e666f164571bb/packages/libp2p/src/index.ts#L199-L201
  if (peerId == null) {
    const keyPair = await generateKeyPair('Ed25519')
    peerId = await peerIdFromPrivateKey(keyPair)
    console.log(`Generated PeerId: ${peerId.toString()}`)
  }

  const blockstore = new LevelBlockstore(dir)
  const libp2pConfig = { ...Libp2pOptions, peerId }
  const libp2p = await createLibp2p(libp2pConfig)
  return createHelia({ libp2p, blockstore })
}
