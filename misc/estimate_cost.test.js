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
            owner: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
            version: "1",
            items: MichelsonMap.fromLiteral({}),
            instances: MichelsonMap.fromLiteral({})
        }
    });

    context.warehouseAddress = originationOp.contractAddress;

    await originationOp.confirmation(1, 1);
}

async function addItem(...item) {
    const contract = await Tezos.contract.at(context.warehouseAddress);

    const originationOp = await contract.methods.add_item(...item).send();

    await originationOp.confirmation(1, 1);
}

async function updateItem(...item) {
    const contract = await Tezos.contract.at(context.warehouseAddress);

    const originationOp = await contract.methods.update_item(...item).send();

    await originationOp.confirmation(1, 1);
}

async function freezeItem(id) {
    const contract = await Tezos.contract.at(context.warehouseAddress);

    const originationOp = await contract.methods.freeze_item(id).send();

    await originationOp.confirmation(1, 1);
}

async function assignItem(itemId, instanceNumber, userId) {
    const contract = await Tezos.contract.at(context.warehouseAddress);

    const originationOp = await contract.methods
        .assign_item(itemId, instanceNumber, userId)
        .send();

    await originationOp.confirmation(1, 1);
}

async function updateInstance(itemId, instanceNumber, data) {
    const contract = await Tezos.contract.at(context.warehouseAddress);

    const originationOp = await contract.methods
        .update_instance(itemId, instanceNumber, data)
        .send();

    await originationOp.confirmation(1, 1);
}

async function transferInstance(itemId, instanceNumber, userId) {
    const contract = await Tezos.contract.at(context.warehouseAddress);

    const originationOp = await contract.methods
        .transfer_instance(itemId, instanceNumber, userId)
        .send();

    await originationOp.confirmation(1, 1);
}

async function estimateCost(name, operation) {
    const balanceBefore = await Tezos.tz.getBalance(
        "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb"
    );

    await operation();

    const balanceAfter = await Tezos.tz.getBalance(
        "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb"
    );
    console.log(
        name,
        `${(balanceBefore.toNumber() - balanceAfter.toNumber()) / 1000000}ꜩ`
    );
}

(async function run() {
    try {
        await estimateCost("warehouse origination cost", originateWarehouse);

        await estimateCost(
            "create warehouse item cost",
            addItem.bind(
                null,
                10,
                MichelsonMap.fromLiteral({
                    XP: "97"
                }),
                false,
                0,
                "Karim Benzema",
                10
            )
        );

        await estimateCost(
            "Update same size warehouse item cost",
            updateItem.bind(
                null,
                10,
                MichelsonMap.fromLiteral({
                    XP: "10"
                }),
                false,
                0,
                "Same length ~",
                10
            )
        );

        await estimateCost(
            "Update smaller size warehouse item cost",
            updateItem.bind(
                null,
                10,
                MichelsonMap.fromLiteral({}),
                false,
                0,
                "Same",
                10
            )
        );

        await estimateCost(
            "Update bigger size warehouse item cost",
            updateItem.bind(
                null,
                10,
                MichelsonMap.fromLiteral({
                    XP: "10",
                    CLUB: "real madrid"
                }),
                false,
                0,
                "this is a much bigger item or at least a bit bigger",
                10
            )
        );

        await estimateCost("Freeze item cost", freezeItem.bind(null, 0));

        await estimateCost(
            "Assign item to user cost",
            assignItem.bind(null, 0, 1, "user_123")
        );

        await estimateCost(
            "Update instance cost",
            updateInstance.bind(
                null,
                0,
                1,
                MichelsonMap.fromLiteral({
                    XP: "99",
                    CLUB: "JUVE"
                })
            )
        );

        await estimateCost(
            "transfer instance to new user cost",
            transferInstance.bind(null, 0, 1, "user_124")
        );
    } catch (err) {
        console.log(err);
    }
})();
