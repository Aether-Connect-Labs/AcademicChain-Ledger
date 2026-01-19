
const { createAgent, IResolver, IKeyManager } = require('@veramo/core');
const { IDataManager } = require('@veramo/data-store');
const { DIDManager, MemoryDIDStore } = require('@veramo/did-manager');
const { KeyManager, MemoryKeyStore } = require('@veramo/key-manager');
const { KeyManagementSystem } = require('@veramo/kms-local');
const { DIDResolverPlugin } = require('@veramo/did-resolver');
const { Resolver } = require('did-resolver');
const { getResolver: getWebResolver } = require('web-did-resolver');

const dbFile = 'database.sqlite';

if (!process.env.ACADEMIC_CHAIN_API_KEY) {
  throw new Error('Security Error: ACADEMIC_CHAIN_API_KEY is missing. Agent initialization aborted.');
}

// Agent setup
const agent = createAgent({
  plugins: [
    new KeyManager({
      store: new MemoryKeyStore(),
      kms: {
        local: new KeyManagementSystem(),
      },
    }),
    new DIDManager({
      store: new MemoryDIDStore(),
      defaultProvider: 'did:web',
      providers: {
        'did:web': new (require('@veramo/did-provider-web').WebDIDProvider)({
          defaultKms: 'local',
        }),
      },
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...getWebResolver(),
      }),
    }),
  ],
});

module.exports = agent;
