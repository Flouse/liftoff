# Introduction

This project is for testing OrbitDB replication.

# TODOs

- [ ] run peer1.js and peer2.js in diff github actions jobs
- [ ] add tests for all the methods in the important API of https://api.orbitdb.org/

- read https://raw.githubusercontent.com/orbitdb/orbitdb/58fa496f2feca591c2a0359166c2299bdf5aef03/docs/REPLICATION.md  and design 2 Github actions jobs to test OrbitDB replication
  - One instance creates a database, the other opens it using the first's address, data is added to the first, and the test verifies if the data replicates to the second instance.
  - [x] The test should be able to run in parallel with other tests, so it should not use any global state.
  - [ ] multi-peer-replication-test: Simulate a more realistic scenario where two peers run independently and discover each other over a simulated network. This tests peer discovery and replication in a less controlled setup.

- speed up a connection between two peers by "dialling-in" to one peer from another.
  // The decentralized nature if IPFS can make it slow for peers to find one 
  // another. You can speed up a connection between two peers by "dialling-in"
  // to one peer from another.
  /* 
  await ipfs2.libp2p.save(ipfs1.libp2p.peerId, { multiaddr: ipfs1.libp2p.getMultiaddrs() })
  await ipfs2.libp2p.dial(ipfs1.libp2p.peerId)
  */
  See https://github.com/orbitdb/orbitdb/blob/58fa496f2feca591c2a0359166c2299bdf5aef03/docs/REPLICATION.md

- [ ] setup for browser env
- [ ] Use pin service to Pin the OrbitDB
