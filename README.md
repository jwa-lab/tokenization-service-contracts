# Tokenization Service Contracts

The Tokenization Service's Smart Contracts.
There are mostly 2 contracts:

1. The Warehouse, which contains all tokenized items, including their full description and quantities.
2. The Inventory, which stores a user's token updates over time.

## How to use the smart contracts:

1. Install the tokenization service contracts:

```
npm install @jwalab/tokenization-service-contracts
```

2. Deploy them with Taquito:

Example deploying the warehouse contract:

```
const { TezosToolkit, MichelsonMap } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');

const tokenizationServiceContracts = require('@jwalab/tokenization-service-contracts');

// using truffle's default accounts
// An account looks like this:
// alice: {
//      pkh: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
//      sk: "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq",
//      pk: "edpkvGfYw3LyB1UcCahKQk4rF2tvbMUk8GFiTuMjL75uGXrpvKXhjn"
// }
const accounts = require('./path/to/accounts');

const Tezos = new TezosToolkit();

Tezos.setProvider({
    rpc: 'http://localhost:20000',
    signer: new InMemorySigner(accounts.alice.sk)
})

Tezos.contract
  .originate({
    code: tokenizationServiceContracts.warehouse.michelson,
    storage: {
        owner: accounts.alice.pkh,
        version: "1",
        warehouse: MichelsonMap.fromLiteral({})
    },
  })
  .then((originationOp) => {
    console.log(`Waiting for confirmation of origination for ${originationOp.contractAddress}`);
    return originationOp.contract(1, 1);
  })
  .then(() => {
    console.log(`Origination completed.`);
  })
  .catch((error) => console.log(error));
```

### Smart Contract APIs

Our Smart Contracts are fully tested, please look at the `./test` folder to see how they work and how to configure their storage.

## Development

### Requirements

1. Items created in the Warehouse are truly immutable, their characteristics may never be altered. Just like a manufactured product once manufactured can't be altered. If a faulty item is minted, it must be discarded or sold as-is, or minted again.
2. Items in the Warehouse don't belong to anyone and can't be transferred. Items in the Warehouse are not owned, only linked to an originator.
3. Items in the Warehouse are semi-fungible. If an item is created with a quantity of 1000, all 1000 items have the same value and can be exchanged without destruction of value.
4. When an item in the Warehouse is purchased, its new owner will have an Inventory created and the item will be added to that Inventory as a mutable copy of the original item. The Warehouse item remains unaltered, its total quantity remains unaltered, but there's one fewer item left to be purchased (available_quantity).
5. When an item owner alters an item they have purchased, the changes are recorded in the Inventory. The item there is simply mutated. Since all mutations are recorded as an entrypoint call, we can recreate an audit trail of changes using an indexer.
6. An item can be transferred between compatible inventories. Only the originator of the contract is able to initiate a transfer and only the owner of the Warehouse contract is able to mutate objects in the inventory (not yet implemented).
7. One more thing, an item in the Warehouse can be modified until the `no_update_after` timestamp is in the past. We call it an expiration date as it prevents items from being modified after that date. We say that when the item can't be modified anymore, it's frozen. An item can be frozen quickly by calling the appropriate entrypoint. Until the expiration date is reached, the date can be removed or pushed further in the future.

### Project Structure

The Tezos contracts are written in the `./contracts` folder.

### Getting Started

1. Start by cloning this repository
1. run `npm install` in this folder

#### Test the contracts using the built-in sandbox

Start a tezos node first, use minilab or

```
docker run -d -p 20000:20000 -e block_time=2 tqtezos/flextesa:20210602 granabox start
```

Then run the tests:

```
npm run test
```

### Cost estimation:

#### Granada:

warehouse origination cost 0.451211ꜩ
inventory origination cost 0.386428ꜩ
create warehouse item cost 0.031179ꜩ
Update same size warehouse item cost 0.000706ꜩ
Update smaller size warehouse item cost 0.00068ꜩ
Update bigger size warehouse item cost 0.017023ꜩ
Transfer item to inventory 0.020832ꜩ

#### Florence:

warehouse origination cost 0.451804ꜩ
inventory origination cost 0.386914ꜩ
create warehouse item cost 0.03179ꜩ
Update same size warehouse item cost 0.001335ꜩ
Update smaller size warehouse item cost 0.001305ꜩ
Update bigger size warehouse item cost 0.017653ꜩ
Transfer item to inventory 0.022413ꜩ
