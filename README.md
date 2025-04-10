# Introduction

This project is for testing OrbitDB replication.

# TODOs

- [x] reuse the example database of https://github.com/lucaong/minisearch
  - https://github.com/lucaong/minisearch/tree/d46245015f34932058861ebeb1eb7fdf97ebaaae/examples

- [ ] In order to replicate the database with peers, the address is what you need to give to other peers in order for them to start replicating the database.
  https://github.com/orbitdb/orbitdb/blob/58fa496f2feca591c2a0359166c2299bdf5aef03/docs/DATABASES.md
  

- [ ] Use external pin service to Pin the OrbitDB

- [ ] run peer1.js and peer2.js in diff github actions jobs
  multi-peer-replication-test: Simulate a more realistic scenario where two peers run independently and discover each other over a simulated network. This tests peer discovery and replication in a less controlled setup.

- [ ] add tests for all the methods in the important API of https://api.orbitdb.org/
  See https://github.com/orbitdb/orbitdb/tree/58fa496f2feca591c2a0359166c2299bdf5aef03/test

- [ ] setup for browser env
