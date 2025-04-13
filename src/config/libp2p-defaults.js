import { gossipsub } from '@chainsafe/libp2p-gossipsub';
// https://github.com/ipfs/helia/blob/7e3212331b1c0f74c424e300069f9f/packages/helia/src/index.ts#L43
import { libp2pDefaults } from 'helia';

/**
 * https://github.com/ipfs/helia/blob/main/packages/helia/src/utils/libp2p-defaults.ts
 */
const defaults = libp2pDefaults();

defaults.services.pubsub = gossipsub({ allowPublishToZeroTopicPeers: true });
export default defaults;
