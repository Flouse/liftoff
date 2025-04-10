import { initIPFSInstance } from "./config/libp2p.js";
import { createOrbitDB } from '@orbitdb/core'

const run = async () => {
  const ipfs1 = await initIPFSInstance('./data/ipfs1', undefined)
  console.log(`IPFS1 PeerId: ${ipfs1.libp2p.peerId.toString()}`);
  console.log(`IPFS1 multiaddr: ${ipfs1.libp2p.getMultiaddrs()}`);

  const ipfs2 = await initIPFSInstance('./data/ipfs2', undefined)
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
  db2.events.on('join', async (peerId: any, heads: any) => {
    // The peerId of the ipfs1 node.
    console.log("Joined", peerId, ipfs1.libp2p.peerId.toString())
  });

  // Listen for any updates to db2.
  // If we want to listen for new data on db2, add an "update" listener to db1.
  db2.events.on('update', async (entry: any) => {
    db2Updated = true
    console.log("Updated", entry)
  });

  // We write 100 records to db1. This will automatically replicate on db2
  for (let i = 1; i <= 100; i++) {
    await db1.add(`record ${i}`)
  }

  // wait for db2 to complete updating.
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('timeout'))
    }, 30000)
    setInterval(() => {
      if (db2Updated) {
        clearTimeout(timeout)
        resolve(undefined)
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
