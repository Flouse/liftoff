import { createOrbitDB } from '@orbitdb/core'
import fs from 'fs'
import { initIPFSInstance } from './config/libp2p.js'

const PEER1_MULTIADDR_FILE = 'peer1.multiaddr'
const PEER1_DB_ADDRESS_FILE = 'peer1.dbaddress'

const run = async () => {
  const ipfs1 = await initIPFSInstance('./data/ipfs11')
  const directory = `./data/orbitdb-${Date.now()}`
  const orbitdb1 = await createOrbitDB({ ipfs: ipfs1, id: 'peer1', directory })
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
  }, 3000) // 3 seconds

  console.log('Peer 1 is active and ready for connections...')

  // Keep the process running for 10 seconds, then close
  // setTimeout(async () => {
  //   console.log('Peer 1: Closing database and stopping services...')
  //   await db1.close()
  //   await orbitdb1.stop()
  //   await ipfs1.stop()
  //   console.log('Peer 1: Done.')
  //   process.exit(0)
  // }, 10000)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
