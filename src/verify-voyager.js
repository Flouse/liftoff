import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'
import { Voyager } from '@orbitdb/voyager'

async function verifyVoyager(voyagerAddress) {
  const libp2p = await createLibp2p()
  const ipfs = await createHelia({ libp2p })
  const orbitdb = await createOrbitDB({ ipfs })

  try {
    const voyager = await Voyager({ orbitdb, address: voyagerAddress })
    const db = await orbitdb.open('verification-db')
    console.log("Verification successful!")
    process.exit(0)
  } catch (error) {
    console.error("Verification failed:", error)
    process.exit(1)
  } finally {
    await orbitdb.stop()
    await ipfs.stop()
    await libp2p.stop()
  }
}

const voyagerAddress = process.env.VOYAGER_ADDRESS
verifyVoyager(voyagerAddress)