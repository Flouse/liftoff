import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { identify } from '@libp2p/identify'
import { mdns } from '@libp2p/mdns'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import { tcp } from '@libp2p/tcp'
import { LevelBlockstore } from 'blockstore-level'
import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'


export const Libp2pOptions = {
  peerDiscovery: [
    mdns()
  ],
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0']
  },
  transports: [
    tcp()
  ],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    identify: identify(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true })
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
