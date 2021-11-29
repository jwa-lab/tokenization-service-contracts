const { TezosToolkit, MichelsonMap } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const warehouseContract = require("../build/contracts/warehouse.json");

const Tezos = new TezosToolkit("http://localhost:20000");

Tezos.setProvider({
    signer: new InMemorySigner(
        "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq"
    )
});

const context = {};

async function originateWarehouse() {
    const originationOp = await Tezos.contract.originate({
        code: warehouseContract,
        storage: {
            owners: ["tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb"],
            version: "1",
            items: MichelsonMap.fromLiteral({}),
            instances: MichelsonMap.fromLiteral({})
        }
    });

    context.warehouseAddress = originationOp.contractAddress;

    await originationOp.confirmation();
}

async function addItem(...item) {
    const contract = await Tezos.contract.at(context.warehouseAddress);

    return contract.methods.add_item(...item).send();
}

async function updateItem(...item) {
    const contract = await Tezos.contract.at(context.warehouseAddress);

    const originationOp = await contract.methods.update_item(...item).send();

    await originationOp.confirmation();
}

(async function run() {
    try {
        console.log("originating warehouse", new Date());
        await originateWarehouse();

        console.log(`originated at`, context.warehouseAddress, new Date());

        const operation = await addItem(
            10,
            MichelsonMap.fromLiteral({
                XP: "97"
            }),
            false,
            0,
            "Karim Benzema",
            10
        );

        console.log(JSON.stringify(operation.hash));

        // console.log('item generated')

        // console.log('counter', (await Tezos.rpc.getContract(signer)), new Date());

        // await addItem(
        //     10,
        //     MichelsonMap.fromLiteral({
        //         XP: "97"
        //     }),
        //     false,
        //     0,
        //     "Karim Benzema",
        //     10
        // )

        // console.log('counter', (await Tezos.rpc.getContract(signer)), new Date());

        // await updateItem(
        //     10,
        //     MichelsonMap.fromLiteral({
        //         XP: "97"
        //     }),
        //     false,
        //     0,
        //     "Karim Benzema",
        //     10
        // )

        // console.log("generated item 1", new Date());
        // console.log('counter', (await Tezos.rpc.getContract(signer)));

        // await addItem(
        //     10,
        //     MichelsonMap.fromLiteral({
        //         XP: "97"
        //     }),
        //     false,
        //     1,
        //     "Karim Benzema",
        //     10
        // )
        // console.log('counter', (await Tezos.rpc.getContract(signer)));

        // await updateItem(
        //     10,
        //     MichelsonMap.fromLiteral({
        //         XP: "97"
        //     }),
        //     false,
        //     1,
        //     "Karim Benzema",
        //     10
        // )
        // console.log('counter', (await Tezos.rpc.getContract(context.warehouseAddress)));

        // console.log("generated item 2", new Date());

        // await addItem(
        //     10,
        //     MichelsonMap.fromLiteral({
        //         XP: "97"
        //     }),
        //     false,
        //     2,
        //     "Karim Benzema",
        //     10
        // )

        // await updateItem(
        //     10,
        //     MichelsonMap.fromLiteral({
        //         XP: "97"
        //     }),
        //     false,
        //     2,
        //     "Karim Benzema",
        //     10
        // )

        // console.log("generated item 3", new Date());

        // await addItem(
        //     10,
        //     MichelsonMap.fromLiteral({
        //         XP: "97"
        //     }),
        //     false,
        //     3,
        //     "Karim Benzema",
        //     10
        // )

        // await updateItem(
        //     10,
        //     MichelsonMap.fromLiteral({
        //         XP: "97"
        //     }),
        //     false,
        //     3,
        //     "Karim Benzema",
        //     10
        // )

        // console.log("generated item 4", new Date());

        // await addItem(
        //     10,
        //     MichelsonMap.fromLiteral({
        //         XP: "97"
        //     }),
        //     false,
        //     4,
        //     "Karim Benzema",
        //     10
        // )

        // await updateItem(
        //     10,
        //     MichelsonMap.fromLiteral({
        //         XP: "97"
        //     }),
        //     false,
        //     4,
        //     "Karim Benzema",
        //     10
        // )

        // console.log("generated item 5", new Date());
    } catch (err) {
        console.log(err);
    }
})();
