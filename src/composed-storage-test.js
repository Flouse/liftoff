import { dagCbor } from '@helia/dag-cbor';
import { createOrbitDB, IPFSAccessController, parseAddress } from '@orbitdb/core';
import 'dotenv/config';
import { base58btc } from 'multiformats/bases/base58';
import { CID } from 'multiformats/cid';
import { initIPFSInstance } from "./config/libp2p.js";

const run = async () => {
  const ipfsDirectory = './data/ipfs-composed-test';
  const orbitdbDirectory = './data/orbitdb-composed';
  const dbName = 'billboard-charts-1965-2015';

  try {
    // Initialize IPFS
    const heliaNode = await initIPFSInstance(ipfsDirectory); // TODO: init the peerId
    console.log(`IPFS PeerId: ${heliaNode.libp2p.peerId.toString()}`);

    const multiaddrs = heliaNode.libp2p.getMultiaddrs();
    console.log(`IPFS Multiaddrs: ${multiaddrs.map(ma => ma.toString()).join(', ')}`);

    // TODO: Create ComposedStorage
    // const ipfsBlockStorage = new IPFSBlockStorage({ ipfs: helia });
    // const lruStorage = new LRUStorage();
    // const composedStorage = new ComposedStorage({
    //   stores: [
    //     ipfsBlockStorage,
    //     lruStorage
    //   ]
    // })

    // Create OrbitDB instance
    const orbitdb = await createOrbitDB({ ipfs: heliaNode, directory: orbitdbDirectory });

    // Open database as a documents store
    const options = {
      type: 'documents',
      AccessController: IPFSAccessController({ write: ['*'] })
    }
    const dbAddressFromEnv = process.env.ORBITDB_ADDRESS;
    const dbIdentifier = dbAddressFromEnv || dbName;
    console.log(`Attempting to open database: ${dbIdentifier}`);
    let db = await orbitdb.open(dbIdentifier, options);

    if (!db) {
      console.error('Failed to open database');
      process.exit(1);
    }

    console.log(`Opened database at: ${db.address}`);
    const addr = parseAddress(db.address)
    const cid = CID.parse(addr.hash, base58btc)
    console.log('cid', cid.toString());
    const value = await dagCbor(heliaNode).get(cid);
    console.log('manifest', value);

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

      // TODO: Add more records to the database
      // const INDEX_BY = '_id';
      // for (const record of billboardData) {
      //   try {
      //     record[INDEX_BY] = record.id + 1; // Set _id to id for OrbitDB index
      //     await db.put(record);
      //   } catch (e) {
      //     console.error("error putting record", record, e)
      //   }
      // }
      // console.log(`Added ${billboardData.length} records to the database`);
    } else {
      console.log('Database already contains data, skipping data insertion.');
    }

    db.events.on('join', (peerID, heads) => {
      console.log(`New peer joined: ${peerID.toString()}`);
      console.log('Heads:', heads);
    });
    
    setInterval(async () => {
      const multiaddrs = heliaNode.libp2p.getMultiaddrs();
      console.log(`IPFS Multiaddrs: ${multiaddrs.map(ma => ma.toString()).join(', ')}`);

      // print connections
      const connections = heliaNode.libp2p.getConnections();
      console.log('Connections:', connections.map(conn => conn.remotePeer.toString()));
      console.log('Number of connections:', connections.length);
    }, 6000);

    console.log('Retrieving all records...')
    const allRecords = await db.all()
    console.log(allRecords.slice(-2));
    console.log('Number of records:', allRecords.length);

    // sleep for 30 minutes
    console.log('Sleeping for 30 minutes...');
    await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));

    console.log('Closing database and OrbitDB...');
    await db.close();
    await orbitdb.stop();
    await heliaNode.stop();
    console.log('Closed database and IPFS');
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
