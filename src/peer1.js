import { createOrbitDB } from '@orbitdb/core'
import { LevelBlockstore } from 'blockstore-level'
import fs from 'fs'
import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { initIPFSInstance } from './config/ipfs.js'
import { Libp2pOptions } from './config/libp2p.js'

const PEER1_MULTIADDR_FILE = 'peer1.multiaddr'
const PEER1_DB_ADDRESS_FILE = 'peer1.dbaddress'

// TODO: move this to a config file
const initIPFSInstance = async (dir) => {
  const blockstore = new LevelBlockstore(dir)
  const libp2p = await createLibp2p(Libp2pOptions)
  return createHelia({ libp2p, blockstore })
}

const run = async () => {
  const ipfs1 = await initIPFSInstance('./data/ipfs11')
  const orbitdbDir = `./data/orbitdb-${Date.now()}`
  const orbitdb1 = await createOrbitDB({ ipfs: ipfs1, id: 'peer1', directory: orbitdbDir })
  const db1 = await orbitdb1.open('peer1-db-2025')

  // Write the peer's multiaddrs to a file
  const multiaddrs = ipfs1.libp2p.getMultiaddrs()
    .map(ma => ma.toString())
    .filter(ma => !ma.includes('/ip4/127.0.0.1'))
  fs.writeFileSync(PEER1_MULTIADDR_FILE, multiaddrs.join('\n'))
  console.log(`Peer 1 multiaddrs written to ${PEER1_MULTIADDR_FILE}`)

  // Write the database address to a file
  fs.writeFileSync(PEER1_DB_ADDRESS_FILE, db1.address.toString())
  console.log(`Peer 1 database address written to ${PEER1_DB_ADDRESS_FILE}`)

  // Add some data after a delay
  setTimeout(async () => {
    await db1.add('hello world from peer 1 - 1')
    await db1.add('hello world from peer 1 - 2')
    console.log('Peer 1 added data')
  }, 10000) // 10 seconds

  // Keep the process running
  console.log('Peer 1 running, waiting for connections...')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
