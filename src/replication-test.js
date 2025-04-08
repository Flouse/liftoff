import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { LevelBlockstore } from 'blockstore-level'
import { createOrbitDB } from '@orbitdb/core'
import { Libp2pOptions } from '../config/libp2p.js'

// Our ipfs instances will be connecting over tcp. You can find out more about peer connectivity at https://connectivity.libp2p.io/.
const initIPFSInstance = async (dir) => {
  const blockstore = new LevelBlockstore(dir)
  const libp2p = await createLibp2p(Libp2pOptions)
  return createHelia({ libp2p, blockstore })
}

const run = async () => {
  const ipfs1 = await initIPFSInstance('./data/ipfs1')
  const ipfs2 = await initIPFSInstance('./data/ipfs2')

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
    console.log("Joined", peerId, (await ipfs1.id()).id)
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
