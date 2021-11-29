const { TezosToolkit, MichelsonMap, OpKind } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");
const { randomBytes } = require("crypto");

const warehouseContract = require("../build/contracts/warehouse.json");

const Tezos = new TezosToolkit("http://localhost:20000");
Tezos.setProvider({
    signer: new InMemorySigner(
        "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq"
    )
});

(async function run() {
    try {
        const originationOp = await Tezos.contract.originate({
            balance: "0" ,
            code: warehouseContract,
            storage: {
                owner: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
                version: "1",
                items: MichelsonMap.fromLiteral({}),
                instances: MichelsonMap.fromLiteral({})
            }
        });

        const contract = await originationOp.contract();
        console.log('contract deployed at', contract.address);
        const warehouse = await Tezos.contract.at(contract.address);

        console.log('contract status', originationOp.status);

        // const batchOpEstimate = await Tezos.estimate.batch([
        const batchOp = await Tezos.wallet.batch([
            {
                kind: OpKind.TRANSACTION,
                ...warehouse.methods.add_item(
                    10,
                    MichelsonMap.fromLiteral({
                        XP: "97"
                    }),
                    false,
                    11,
                    "Karim Basdfasdfsfenzema",
                    10
                ).toTransferParams()
            },
            {
                kind: OpKind.TRANSACTION,
                ...warehouse.methods.update_item(
                    1,
                    MichelsonMap.fromLiteral({
                        XP: "99"
                    }),
                    false,
                    11,
                    "Karim Befsdfasdfsnzsdfsdfema",
                    1
                ).toTransferParams()
            },
            {
                kind: OpKind.TRANSACTION,
                ...warehouse.methods.update_item(
                    1,
                    MichelsonMap.fromLiteral({
                        XP: "978"
                    }),
                    false,
                    11,
                    "Karim BENZEMA!!!",
                    1
                ).toTransferParams()
            },
            {
                kind: OpKind.TRANSACTION,
                ...warehouse.methods.assign_item(
                    11,1,'me'
                ).toTransferParams()
            },
            // {
            //     kind: OpKind.TRANSACTION,
            //     ...warehouse.methods.update_item(
            //         1,
            //         MichelsonMap.fromLiteral({
            //             XP:  new Array(50000).fill("A").join("")
            //         }),
            //         false,
            //         11,
            //         "Karim Befsdfasdfsnzsdfsdfema",
            //         1
            //     ).toTransferParams()
            // }
        ]);

        // console.log(batchOpEstimate[0].totalCost, batchOpEstimate[0].totalCost)

        const op = await batchOp.send();

        console.log(op)

        // console.log(batchOpEstimate.map(estimate => ({
        //         burnFeeMutez : estimate.burnFeeMutez, 
        //         gasLimit : estimate.gasLimit, 
        //         minimalFeeMutez : estimate.minimalFeeMutez, 
        //         storageLimit : estimate.storageLimit, 
        //         suggestedFeeMutez : estimate.suggestedFeeMutez, 
        //         totalCost : estimate.totalCost, 
        //         usingBaseFeeMutez : estimate.usingBaseFeeMutez,
        //         opSize: estimate.opSize,
        //         minimalFeePerStorageByteMutez: estimate.minimalFeePerStorageByteMutez,
        //         baseFeeMutez: estimate.baseFeeMutez
        // })));
    } catch (err) {
        console.log(err);
    }
})();
