import { createLibp2p } from 'libp2p'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import { createHelia } from 'helia'
import { LevelBlockstore } from 'blockstore-level'
import { createOrbitDB } from '@orbitdb/core'
import { Libp2pOptions } from '../config/libp2p.js'

// Our ipfs instances will be connecting over tcp. You can find out more about peer connectivity at https://connectivity.libp2p.io/.
const initIPFSInstance = async (dir, peerId) => {
  const blockstore = new LevelBlockstore(dir)
  // Create a copy of the options and add the peerId
  const libp2pConfig = { ...Libp2pOptions, peerId }
  const libp2p = await createLibp2p(libp2pConfig)
  return createHelia({ libp2p, blockstore })
}

const run = async () => {
  // Generate distinct Peer IDs for each instance
  const privateKey1 = await generateKeyPair('Ed25519')
  const peerId1 = await peerIdFromPrivateKey(privateKey1)

  const privateKey2 = await generateKeyPair('Ed25519')
  const peerId2 = await peerIdFromPrivateKey(privateKey2)

  const ipfs1 = await initIPFSInstance('./data/ipfs1', peerId1)
  console.log(`IPFS1 PeerId: ${ipfs1.libp2p.peerId.toString()}`);
  console.log(`IPFS1 multiaddr: ${ipfs1.libp2p.getMultiaddrs()}`);

  const ipfs2 = await initIPFSInstance('./data/ipfs2', peerId2)
  console.log(`IPFS2 PeerId: ${ipfs2.libp2p.peerId.toString()}`);
  console.log(`IPFS2 multiaddr: ${ipfs2.libp2p.getMultiaddrs()}`);

  // The decentralized nature if IPFS can make it slow for peers to find one 
  // another. You can speed up a connection between two peers by "dialling-in"
  // to one peer from another.
  // await ipfs2.libp2p.safeDispatchEvent(ipfs1.libp2p.peerId, { multiaddr: ipfs1.libp2p.getMultiaddrs() })
  await ipfs2.libp2p.dial(ipfs1.libp2p.getMultiaddrs()[0])

  const orbitdb1 = await createOrbitDB({ ipfs: ipfs1, id: 'userA', directory: './data/orbitdb1' })
  const orbitdb2 = await createOrbitDB({ ipfs: ipfs2, id: 'userB', directory: './data/orbitdb2' })

  // This opens a new db. Default db type will be 'events'.
  const db1 = await orbitdb1.open('db-2025')

  // We connect to the first db using its address. This initiates a
  // synchronization of the heads between db1 and db2.
  const db2 = await orbitdb2.open(db1.address)

  let db2Updated = false

  // Listen for the connection of ipfs1 to ipfs2.
  // If we want to listen for connections from ipfs2 to ipfs1, add a "join"
  // listener to db1.
  db2.events.on('join', async (peerId, heads) => {
    // The peerId of the ipfs1 node.
    console.log("Joined", peerId, ipfs1.libp2p.peerId.toString())
  })

  // Listen for any updates to db2.
  // If we want to listen for new data on db2, add an "update" listener to db1.
  db2.events.on('update', async (entry) => {
    db2Updated = true
    console.log("Updated", entry)
  })

  // We write some data to db1. This will automatically replicated on db2
  await db1.add('hello world 1')
  await db1.add('hello world 2')
  await db1.add('hello world 3')
  await db1.add('hello world 4')

  // wait for db2 to complete updating.
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('timeout'))
    }, 30000)
    setInterval(() => {
      if (db2Updated) {
        clearTimeout(timeout)
        resolve()
      }
    }, 1000)
  })

  // Close db1 and its underlying ipfs peer.
  await db1.close()
  await orbitdb1.stop()
  await ipfs1.stop()

  // Close db2 and its underlying ipfs peer.
  await db2.close()
  await orbitdb2.stop()
  await ipfs2.stop()

  console.log("Basic replication test successful")
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
