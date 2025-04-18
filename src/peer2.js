import { multiaddr } from '@multiformats/multiaddr'
import { createOrbitDB } from '@orbitdb/core'
import { Voyager } from '@orbitdb/voyager'
import fs from 'fs'
import { initIPFSInstance } from './config/libp2p.js'

// const PEER1_MULTIADDR_FILE = 'peer1.multiaddr'
const PEER1_DB_ADDRESS_FILE = 'peer1.dbaddress'

const run = async () => {
  // Read the multiaddr from file
  // const peer1MultiaddrString = fs.readFileSync(PEER1_MULTIADDR_FILE, 'utf8').trim().split('\n')[0]
  // console.log(`Peer 2: Read peer1 multiaddr string from ${PEER1_MULTIADDR_FILE}: ${peer1MultiaddrString}`)

  const peer1DbAddress = fs.readFileSync(PEER1_DB_ADDRESS_FILE, 'utf8').trim()
  console.log(`Peer 2: Read peer1 db address from ${PEER1_DB_ADDRESS_FILE}: ${peer1DbAddress}`)

  const ipfs2 = await initIPFSInstance('./data/ipfs12')
  const directory = `./data/orbitdb-${Date.now()}`
  const orbitdb2 = await createOrbitDB({ ipfs: ipfs2, id: 'peer2', directory })

  // connect to voyager
  const voyagerAddress = process.env.VOYAGER_ADDRESS
  let voyager = undefined
  if (!voyagerAddress) {
    console.error("Error: VOYAGER_ADDRESS environment variable not set.")
  } else {
    console.log('Peer 2: Dialing voyager multiaddr:', voyagerAddress);
    voyager = await Voyager({ orbitdb: orbitdb2, address: multiaddr(voyagerAddress) })
  }

  const db2 = await orbitdb2.open(peer1DbAddress)

  let db2Updated = false
  db2.events.on('update', async (entry) => {
    db2Updated = true
    console.log('Peer 2: Database updated', entry)
  })

  // Wait for the database to update, with a timeout
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('timeout'))
    }, 60000)

    const checkInterval = setInterval(() => {
      if (db2Updated) {
        clearTimeout(timeout)
        clearInterval(checkInterval)
        resolve()
      }
    }, 1000)
  })

  // Print out the above records.
  console.log('Retrieving all records from Peer2...')
  const allRecords = await db2.all()
  console.log(allRecords)

  console.log('Peer 2: Replication successful!')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
