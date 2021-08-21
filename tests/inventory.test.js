const { TezosToolkit, MichelsonMap } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const { originateContract, getInventoryItemAt } = require("./utils");

const inventoryContract = require("../build/contracts/inventory.json");

describe("Given Inventory is deployed", () => {
    let inventoryInstance;
    let storage;
    let tezos;

    beforeAll(async () => {
        tezos = new TezosToolkit("http://localhost:20000");

        tezos.setProvider({
            signer: new InMemorySigner(
                "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq"
            )
        });

        inventoryInstance = await originateContract(
            tezos,
            inventoryContract,
            MichelsonMap.fromLiteral({})
        );
    });

    describe("When assigning a new item", () => {
        beforeAll(async () => {
            const operation = await inventoryInstance.methods
                .assign_item(
                    MichelsonMap.fromLiteral({
                        XP: "97"
                    }),
                    12,
                    2,
                    "user_123"
                )
                .send();

            await operation.confirmation(1);

            storage = await inventoryInstance.storage();
        });

        it("Then assigns the item to the user", async () => {
            const obj = await getInventoryItemAt(storage, "user_123", 2, 12);

            expect(obj).toEqual({
                data: {
                    XP: "97"
                }
            });
        });

        describe("When I update this instance", () => {
            beforeAll(async () => {
                const operation = await inventoryInstance.methods
                .update_item(
                    MichelsonMap.fromLiteral({
                        XP: "98"
                    }),
                    12,
                    2,
                    "user_123"
                )
                .send();

                await operation.confirmation(1);

                storage = await inventoryInstance.storage();
            });

            it("Then updates the instance", async () => {
                const obj = await getInventoryItemAt(storage, "user_123", 2, 12);

                expect(obj).toEqual({
                    data: {
                        XP: "98"
                    }
                });
            });
        });

        describe("And When I assign it again", () => {
            it("Then fails with an error", async () => {
                try {
                    const operation = await inventoryInstance.methods
                    .assign_item(
                        MichelsonMap.fromLiteral({
                            XP: "97"
                        }),
                        12,
                        2,
                        "user_123"
                    )
                    .send();

                    await operation.confirmation(1);

                    storage = await inventoryInstance.storage();

                    console.error(
                        "Will fail: Assign_Item should throw an Error if the item and instance have already been assigned"
                    );
    
                    fail(
                        "Assign_Item should throw an Error if the item and instance have already been assigned"
                    );
                } catch (err) {
                    expect(err.message).toBe("ITEM_INSTANCE_ALREADY_ASSIGNED");
                }
            });
        });

        describe("When I assign another instance of the same item", () => {
            beforeAll(async () => {
                const operation = await inventoryInstance.methods
                    .assign_item(
                        MichelsonMap.fromLiteral({
                            XP: "97"
                        }),
                        13,
                        2,
                        "user_123"
                    )
                    .send();
    
                await operation.confirmation(1);
    
                storage = await inventoryInstance.storage();
            });
    
            it("Then assigns the item to the user", async () => {
                const obj = await getInventoryItemAt(storage, "user_123", 2, 13);
    
                expect(obj).toEqual({
                    data: {
                        XP: "97"
                    }
                });
            });

            describe("When I update this instance", () => {
                beforeAll(async () => {
                    const operation = await inventoryInstance.methods
                    .update_item(
                        MichelsonMap.fromLiteral({
                            XP: "99"
                        }),
                        13,
                        2,
                        "user_123"
                    )
                    .send();
    
                    await operation.confirmation(1);
    
                    storage = await inventoryInstance.storage();
                });
    
                it("Then updates the instance", async () => {
                    const obj = await getInventoryItemAt(storage, "user_123", 2, 13);
    
                    expect(obj).toEqual({
                        data: {
                            XP: "99"
                        }
                    });
                });
            });
        });

        describe("When I assign another item to the same user", () => {
            beforeAll(async () => {
                const operation = await inventoryInstance.methods
                    .assign_item(
                        MichelsonMap.fromLiteral({
                            XP: "97"
                        }),
                        1,
                        3,
                        "user_123"
                    )
                    .send();
    
                await operation.confirmation(1);
    
                storage = await inventoryInstance.storage();
            });
    
            it("Then assigns the new item to the user", async () => {
                const obj = await getInventoryItemAt(storage, "user_123", 3, 1);
    
                expect(obj).toEqual({
                    data: {
                        XP: "97"
                    }
                });
            });
        });
    });
});
