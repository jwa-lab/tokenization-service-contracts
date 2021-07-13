const { TezosToolkit, MichelsonMap } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const inventoryContract = require("../build/contracts/inventory.json");
const warehouseContract = require("../build/contracts/warehouse.json");

const {
    getInventoryItemtAt,
    originateContract
} = require("./utils");

describe("Given Warehouse and Inventory are deployed", () => {
    let warehouseInstance;
    let oldInventoryInstance;
    let newInventoryInstance;
    let tezos;

    beforeAll(async () => {
        tezos = new TezosToolkit("http://localhost:20000");

        tezos.setProvider({
            signer: new InMemorySigner(
                "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq"
            )
        });

        warehouseInstance = await originateContract(tezos, warehouseContract, {
            owner: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
            version: "1",
            warehouse: MichelsonMap.fromLiteral({})
        });

        oldInventoryInstance = await originateContract(
            tezos,
            inventoryContract,
            MichelsonMap.fromLiteral({})
        );

        newInventoryInstance = await originateContract(
            tezos,
            inventoryContract,
            MichelsonMap.fromLiteral({})
        );
    });

    describe("When I add a new item with a quantity of 1", () => {
        beforeAll(async () => {
            const operation = await warehouseInstance.methods
                .add_item(
                    1,
                    MichelsonMap.fromLiteral({
                        XP: "97"
                    }),
                    9,
                    "Karim Benzema",
                    undefined,
                    1
                )
                .send();

            await operation.confirmation(1);
        });

        describe("And I assign it to an inventory", () => {
            let oldInventoryStorage;
            let newInventoryStorage;

            beforeAll(async () => {
                const operation = await warehouseInstance.methods
                    .assign_item_proxy(oldInventoryInstance.address, 9, 1)
                    .send();

                await operation.confirmation(1);

                oldInventoryStorage = await oldInventoryInstance.storage();
                newInventoryStorage = await newInventoryInstance.storage();
            });
            
            describe("And I transfer it to another inventory", () => {

                beforeAll(async () => {
                    const operation = await oldInventoryInstance.methods
                        .transfer_item_proxy(
                            MichelsonMap.fromLiteral({
                                XP: "97"
                            }),
                            9,
                            1,                            
                            newInventoryInstance.address
                        )
                        .send();
                    
                    await operation.confirmation(1);
                });

                it("Then assigns the item to new the inventory", async () => {
                    const obj = await getInventoryItemtAt(newInventoryStorage, 9, 1);
    
                    expect(obj).toEqual({
                        data: {}
                    });
                });

                it("Then removes the item from the old inventory", async () => {
                    try {
                        await getInventoryItemtAt(oldInventoryStorage, 9, 1);
    
                        console.error(
                            "Will fail: transfer_item should throw an error since the item is no more in the old inventory"
                        );
                        expect.fail(
                            "transfer_item should throw an error if the item doesn't exist"
                        );
                    } catch (err) {
                        expect(err.message).toEqual("ITEM_NOT_FOUND");
                    }
                });
            });
        });

        describe("When I transfer an item to an inventory that doesn't exist", () => {
            beforeAll(async () => {
                const operation = await oldInventoryInstance.methods
                        .transfer_item_proxy(
                            MichelsonMap.fromLiteral({
                                XP: "97"
                            }),
                            9,
                            1,                            
                            newInventoryInstance.address
                        )
                        .send();
                    
                    await operation.confirmation(1);
            });

            it("Then fails with an explicit error", async () => {
                try {
                    const operation = await oldInventoryInstance.methods
                        .transfer_item_proxy(
                            MichelsonMap.fromLiteral({
                                XP: "97"
                            }),
                            9,
                            1,                            
                            newInventoryInstance.address
                        )
                        .send();
                    
                    await operation.confirmation(1);

                    console.error(
                        "Will fail: transfer_item should throw an error since the inventory contract doesn't exist"
                    );
                    expect.fail(
                        "transfer_item should throw an error if the contract doesn't exist"
                    );
                } catch (err) {
                    expect(err.message).toEqual("CONTRACT_NOT_FOUND");
                }
            });
        });
    });
});
