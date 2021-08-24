# Tokenization Service Contracts

The Tokenization Service's Smart Contract.

## How to use the smart contracts:

1. Install the tokenization service contracts:

```
npm install @jwalab/tokenization-service-contracts
```

2. Deploy with Taquito:

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
        items: MichelsonMap.fromLiteral({}),
        instances: MichelsonMap.fromLiteral({})
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
4. When an item in the Warehouse is purchased, and item instance is created and assigned to an user. The Warehouse item remains unaltered, its total quantity remains unaltered, but there's one fewer item left to be purchased (available_quantity). The instance is now mutable and can evolve independently from other instances of the same item.
5. An item's instance can be transferred to another user.
6. One more thing, an item in the Warehouse can be modified until the it's marked as `frozen`. Only after an item has been frozen can it be assigned to a user, to prevent a user from purchasing an item which caracteristics can still change.

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

#### 0.1.0 integrated contract and Granada:

| action                             | cost        |
| ---------------------------------- | ----------- |
| warehouse origination              | `0.57152ꜩ`  |
| create warehouse item              | `0.032072ꜩ` |
| Update same size warehouse item    | `0.001618ꜩ` |
| Update smaller size warehouse item | `0.001588ꜩ` |
| Update bigger size warehouse item  | `0.017936ꜩ` |
| Freeze item                        | `0.001552ꜩ` |
| Assign item to user                | `0.022876ꜩ` |
| Update instance                    | `0.010594ꜩ` |
| transfer instance to new user      | `0.001568ꜩ` |

#### Granada:

| action                             | cost        |
| ---------------------------------- | ----------- |
| warehouse origination              | `0.451211ꜩ` |
| inventory origination              | `0.386428ꜩ` |
| create warehouse item              | `0.031179ꜩ` |
| Update same size warehouse item    | `0.000706ꜩ` |
| Update smaller size warehouse item | `0.00068ꜩ`  |
| Update bigger size warehouse item  | `0.017023ꜩ` |
| Transfer item to inventory         | `0.020832ꜩ` |

#### Florence:

| action                             | cost        |
| ---------------------------------- | ----------- |
| warehouse origination              | `0.451804ꜩ` |
| inventory origination              | `0.386914ꜩ` |
| create warehouse item              | `0.03179ꜩ`  |
| Update same size warehouse item    | `0.001335ꜩ` |
| Update smaller size warehouse item | `0.001305ꜩ` |
| Update bigger size warehouse item  | `0.017653ꜩ` |
| Transfer item to inventory         | `0.022413ꜩ` |
