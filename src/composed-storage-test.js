import { ComposedStorage, createOrbitDB, IPFSBlockStorage, LRUStorage } from '@orbitdb/core';
import { assert } from 'chai';
import { initIPFSInstance } from "./config/libp2p.js";

const run = async () => {
  const ipfsDirectory = './data/ipfs-composed-test'
  const orbitdbDirectory = './data/orbitdb-composed'
  const dbName = 'billboard-charts';

  try {
    // Initialize IPFS
    const ipfs = await initIPFSInstance(ipfsDirectory); // TODO: init the peerId
    console.log(`IPFS PeerId: ${ipfs.libp2p.peerId.toString()}`);

    const multiaddrs = ipfs.libp2p.getMultiaddrs();
    console.log(`IPFS Multiaddrs: ${multiaddrs.map(ma => ma.toString()).join(', ')}`);

    // TODO: Create ComposedStorage
    // const ipfsBlockStorage = new IPFSBlockStorage({ ipfs });
    // const lruStorage = new LRUStorage();
    // const composedStorage = new ComposedStorage({
    //   stores: [
    //     ipfsBlockStorage,
    //     lruStorage
    //   ]
    // })

    // Create OrbitDB instance
    const orbitdb = await createOrbitDB({ ipfs, directory: orbitdbDirectory });

    // Open database as a documents store
    const options = { type: 'documents' }
    let db = await orbitdb.open(dbName, options);

    if (!db) {
      console.error('Failed to open database');
      process.exit(1);
    }

    console.log(`Opened database at: ${db.address}`);

    // Check if data already exists
    const existingData = await db.get(0);
    if (!existingData) {
      // Fetch Billboard data
      const billboardDataUrl = 'https://raw.githubusercontent.com/lucaong/minisearch/d46245015f34932058861ebeb1eb7fdf97ebaaae/examples/billboard_1965-2015.json';
      const response = await fetch(billboardDataUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch billboard data: ${response.status} ${response.statusText}`);
      }
      const billboardData = await response.json();

      // Add each record to the database
      for (const record of billboardData) {
        try {
          record._id = record.id; // Set _id to id for OrbitDB index
          await db.put(record);
        } catch (e) {
          console.error("error putting record", record, e)
        }
      }
      console.log(`Added ${billboardData.length} records to the database`);
    } else {
      console.log('Database already contains data, skipping data insertion.');
    }

    // Close database and OrbitDB
    await db.close();
    await orbitdb.stop();
    await ipfs.stop();
    console.log('Closed database and IPFS');

    // Re-initialize IPFS and OrbitDB
    // const ipfs2 = await initIPFSInstance(ipfsDirectory, undefined);

    // Create ComposedStorage for the reopened instance
    // const ipfsBlockStorage2 = new IPFSBlockStorage({ ipfs: ipfs2 });
    // const lruStorage2 = new LRUStorage();
    // const composedStorage2 = new ComposedStorage({
    //   stores: [
    //     ipfsBlockStorage2,
    //     lruStorage2
    //   ]
    // })

    // const orbitdb2 = await createOrbitDB({ ipfs: ipfs2 });
    // orbitdb2.storage = composedStorage2

    // Reopen database
    // const db2 = await orbitdb2.open(dbName, options);
    // console.log(`Reopened database at: ${db2.address}`);

    // Verify data
    // const retrievedValue = await db2.get(0);
    // assert.exists(retrievedValue, 'Retrieved value should exist');
    // console.log('Retrieved data:', retrievedValue);

    // Clean up
    // await db2.close();
    // await orbitdb2.stop();
    // await ipfs2.stop();

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
