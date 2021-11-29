const { TezosToolkit, MichelsonMap } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

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

        const transferParams = warehouse.methods.add_item(
            10,
            MichelsonMap.fromLiteral({
                XP: "97"
            }),
            false,
            0,
            "Karim Benzema",
            10
        ).toTransferParams();

        console.log(transferParams);

        const estimate = await Tezos.estimate.transfer(transferParams);

        console.log({
            burnFeeMutez : estimate.burnFeeMutez, 
            gasLimit : estimate.gasLimit, 
            minimalFeeMutez : estimate.minimalFeeMutez, 
            storageLimit : estimate.storageLimit, 
            suggestedFeeMutez : estimate.suggestedFeeMutez, 
            totalCost : estimate.totalCost, 
            usingBaseFeeMutez : estimate.usingBaseFeeMutez,
            opSize: estimate.opSize,
            minimalFeePerStorageByteMutez: estimate.minimalFeePerStorageByteMutez,
            baseFeeMutez: estimate.baseFeeMutez
        });
    } catch (err) {
        console.log(err);
    }
})();
