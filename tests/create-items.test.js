const { TezosToolkit, MichelsonMap } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const { warehouseItemToObject, originateContract } = require("./utils");

const warehouseContract = require("../build/contracts/warehouse.json");

describe("Given Warehouse is deployed", () => {
    let warehouseInstance;
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
            items: MichelsonMap.fromLiteral({}),
            instances: MichelsonMap.fromLiteral({})
        });
    });

    describe("When getting the storage", () => {
        let storage;

        beforeAll(async () => {
            storage = await warehouseInstance.storage();
        });

        it("Then returns the current version", () => {
            expect(storage.version).toEqual("1");
        });

        it("Then returns the owner", () => {
            expect(storage.owner).toEqual(
                "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb"
            );
        });
    });

    describe("When adding a new item", () => {
        let storage;

        beforeAll(async () => {
            const operation = await warehouseInstance.methods
                .add_item(
                    10,
                    MichelsonMap.fromLiteral({
                        XP: "97"
                    }),
                    false,
                    0,
                    "Christiano Ronaldo",
                    10
                )
                .send();

            await operation.confirmation(1);

            storage = await warehouseInstance.storage();
        });

        it("Then adds the item to the warehouse", async () => {
            const item = await storage.items.get("0");
            const obj = warehouseItemToObject(item);

            expect(obj).toEqual({
                available_quantity: 10,
                data: {
                    XP: "97"
                },
                frozen: false,
                item_id: 0,
                name: "Christiano Ronaldo",
                total_quantity: 10
            });
        });

        describe("When adding an item with the same item ID", () => {
            it("Then fails with an explicit error", async () => {
                try {
                    const operation = await warehouseInstance.methods
                        .add_item(
                            10,
                            MichelsonMap.fromLiteral({
                                XP: "97"
                            }),
                            false,
                            0,
                            "Christiano Ronaldo",
                            10
                        )
                        .send();

                    await operation.confirmation(1);

                    console.error(
                        "Will fail: Add_Item should throw an Error if Warehouse already possesses an item with the same ID"
                    );

                    fail(
                        "Add Item should throw an Error if Warehouse already possesses an item with the same ID"
                    );
                } catch (err) {
                    expect(err.message).toEqual("ITEM_ID_ALREADY_EXISTS");
                }
            });
        });

        describe("When updating the item", () => {
            beforeAll(async () => {
                const operation = await warehouseInstance.methods
                    .update_item(
                        100,
                        MichelsonMap.fromLiteral({
                            XP: "98",
                            CLUB: "JUVE"
                        }),
                        false,
                        0,
                        "Christiano Ronaldo",
                        100
                    )
                    .send();

                await operation.confirmation(1);
            });

            it("Then updates the item in the warehouse", async () => {
                const item = await storage.items.get("0");
                const obj = warehouseItemToObject(item);

                expect(obj).toEqual({
                    available_quantity: 100,
                    data: {
                        XP: "98",
                        CLUB: "JUVE"
                    },
                    frozen: false,
                    item_id: 0,
                    name: "Christiano Ronaldo",
                    total_quantity: 100
                });
            });
        });

        describe("When updating an item that doesn't exist", () => {
            it("Then fails with an explicit error", async () => {
                try {
                    const operation = await warehouseInstance.methods
                        .update_item(
                            10,
                            MichelsonMap.fromLiteral({
                                XP: "97"
                            }),
                            false,
                            1234,
                            "Christiano Ronaldo",
                            10
                        )
                        .send();

                    await operation.confirmation(1);

                    console.error(
                        "Will fail: Update_Item should throw an Error if Warehouse doesn't possess an item with this ID"
                    );

                    fail(
                        "Add Item should throw an Error if Warehouse doesn't possess an item with this ID"
                    );
                } catch (err) {
                    expect(err.message).toEqual("ITEM_ID_DOESNT_EXIST");
                }
            });
        });

        describe("And when I freeze it", () => {
            beforeAll(async () => {
                const operation = await warehouseInstance.methods
                    .freeze_item(0)
                    .send();
                await operation.confirmation(1);
            });

            it("Then doesn't allow me to update it anymore", async () => {
                try {
                    const operation = await warehouseInstance.methods
                        .update_item(
                            10,
                            MichelsonMap.fromLiteral({
                                XP: "99"
                            }),
                            true,
                            0,
                            "Christiano Ronaldo",
                            10
                        )
                        .send();

                    await operation.confirmation(1);

                    console.error(
                        "Will fail: Update_Item should throw an Error if the item is frozen"
                    );

                    fail(
                        "Update_Item should throw an Error if the item is frozen"
                    );
                } catch (err) {
                    expect(err.message).toEqual("ITEM_IS_FROZEN");
                }
            });

            describe("When freezing an item that is already frozen", () => {
                it("Then no error is thrown", async () => {
                    const operation = await warehouseInstance.methods
                        .freeze_item(0)
                        .send();

                    await operation.confirmation(1);
                });
            });
        });
    });

    describe("When adding a frozen item", () => {
        let storage;

        beforeAll(async () => {
            const operation = await warehouseInstance.methods
                .add_item(
                    10,
                    MichelsonMap.fromLiteral({
                        XP: "97"
                    }),
                    true,
                    100,
                    "Christiano Ronaldo",
                    10
                )
                .send();

            await operation.confirmation(1);

            storage = await warehouseInstance.storage();
        });

        it("Then may not be modified anymore", async () => {
            try {
                const operation = await warehouseInstance.methods
                    .update_item(
                        10,
                        MichelsonMap.fromLiteral({
                            XP: "98"
                        }),
                        true,
                        100,
                        "Christiano Ronaldo",
                        10
                    )
                    .send();

                await operation.confirmation(1);

                console.error(
                    "Will fail: Update_Item should throw an Error if the item is frozen"
                );

                fail("Update_Item should throw an Error if the item is frozen");
            } catch (err) {
                expect(err.message).toEqual("ITEM_IS_FROZEN");
            }
        });
    });
});
