import { ComposedStorage, createOrbitDB, IPFSBlockStorage, LRUStorage } from '@orbitdb/core';
// import { LRUStorage } from '@orbitdb/core'; // Try named import
import { assert } from 'chai';
import { initIPFSInstance } from "./config/libp2p.js";

const run = async () => {
  const ipfsDirectory = './data/ipfs-composed-test'
  const orbitdbDirectory = './data/orbitdb-composed'

  // Initialize IPFS
  const ipfs = await initIPFSInstance(ipfsDirectory, undefined);
  console.log(`IPFS PeerId: ${ipfs.libp2p.peerId.toString()}`);


  // Create OrbitDB instance
  const orbitdb = await createOrbitDB({ ipfs: ipfs });

  const dbName = 'composed-db';
    let db;

  // Test: Add data and verify persistence
  try {
    // Fetch Billboard data
    const billboardDataUrl = 'https://raw.githubusercontent.com/lucaong/minisearch/d46245015f34932058861ebeb1eb7fdf97ebaaae/examples/billboard_1965-2015.json';
    const response = await fetch(billboardDataUrl);
    const billboardData = await response.json();

    // Open database as a documents store
    const options = { type: 'documents' }
    db = await orbitdb.open<{ key: string, value: any }>('billboard-charts', options);

    if (!db) {
      console.error('Failed to open database');
      process.exit(1);
      return;
    }

    console.log(`Opened database at: ${db.address}`);

    // Add each record to the database
    for (const record of billboardData) {
      try {
        await db.put(record.weekID, record);
      } catch (e) {
        console.error("error putting record", record, e)
      }
    }
    console.log(`Added ${billboardData.length} records to the database`);

    // Add data
    // await db.add({ key: 'test', value: 'initial value' });
    const initialValue = await db.get('1965-07-10');
    assert.exists(initialValue, 'Initial value should match');
    console.log('Added initial data:', initialValue);

    // Close database and OrbitDB
    await db.close();
    await orbitdb.stop();
    await ipfs.stop();
    console.log('Closed database and IPFS');

    // Re-initialize IPFS and OrbitDB
    const ipfs2 = await initIPFSInstance(ipfsDirectory, undefined);
    const orbitdb2 = await createOrbitDB({ ipfs: ipfs2 });

    // Reopen database
    const db2 = await orbitdb2.open(dbName);
    console.log(`Reopened database at: ${db2.address}`);

    // Verify data
    const retrievedValue = await db2.get('test');
    assert.deepStrictEqual(retrievedValue, [{ key: 'test', value: 'initial value' }], 'Retrieved value should match initial value');
    console.log('Retrieved data:', retrievedValue);

    // Clean up
    await db2.close();
    await orbitdb2.stop();
    await ipfs2.stop();
    console.log('Test completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
