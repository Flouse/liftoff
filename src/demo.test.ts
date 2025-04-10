import { test, expect } from 'bun:test'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'
import { LevelBlockstore } from 'blockstore-level'
import { Libp2pOptions } from './config/libp2p'

test('Simple OrbitDB Demo', async () => {
  // Create an IPFS instance.
  // Use a unique directory for the blockstore to avoid conflicts if run multiple times
  const blockstoreDir = `./data/ipfs/blocks-${Date.now()}`
  const blockstore = new LevelBlockstore(blockstoreDir)
  console.log(`Using blockstore directory: ${blockstoreDir}`)

  const libp2p = await createLibp2p(Libp2pOptions)
  const ipfs = await createHelia({ libp2p, blockstore })

  // Use a unique directory for OrbitDB data
  const directory = `./data/orbitdb-${Date.now()}`
  console.log(`Using OrbitDB directory: ${directory}`)
  const orbitdb = await createOrbitDB({ ipfs, directory })

  const db = await orbitdb.open('my-db') // Default type is 'events'
  console.log('my-db address:', db.address)

  // Add some records to the db.
  console.log('Adding records...')
  await db.add('hello world 1')
  await db.add('hello world 2')
  console.log('Records added.')

  // Print out the above records.
  console.log('Retrieving all records...')
  const allRecords = await db.all()
  console.log(allRecords)

  expect(allRecords.length).toBe(2)
  expect(allRecords[0].value).toBe('hello world 1')
  expect(allRecords[1].value).toBe('hello world 2')

  // Close your db and stop OrbitDB and IPFS.
  console.log('Closing database and stopping services...')
  await db.close()
  await orbitdb.stop()
  await ipfs.stop()
  console.log('Done.')
})
