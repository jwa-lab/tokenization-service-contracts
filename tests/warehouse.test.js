const { TezosToolkit, MichelsonMap } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const {
    warehouseItemToObject,
    getISODateNoMs,
    originateContract
} = require("./utils");

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
            warehouse: MichelsonMap.fromLiteral({})
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
                    0,
                    "Christiano Ronaldo",
                    undefined,
                    10
                )
                .send();

            await operation.confirmation(1);

            storage = await warehouseInstance.storage();
        });

        it("Then adds the item to the warehouse", async () => {
            const item = await storage.warehouse.get("0");
            const obj = warehouseItemToObject(item);

            expect(obj).toEqual({
                available_quantity: 10,
                data: {
                    XP: "97"
                },
                item_id: 0,
                name: "Christiano Ronaldo",
                no_update_after: undefined,
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
                            0,
                            "Christiano Ronaldo",
                            undefined,
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
                        0,
                        "Christiano Ronaldo",
                        undefined,
                        100
                    )
                    .send();

                await operation.confirmation(1);
            });

            it("Then updates the item in the warehouse", async () => {
                const item = await storage.warehouse.get("0");
                const obj = warehouseItemToObject(item);

                expect(obj).toEqual({
                    available_quantity: 100,
                    data: {
                        XP: "98",
                        CLUB: "JUVE"
                    },
                    item_id: 0,
                    name: "Christiano Ronaldo",
                    no_update_after: undefined,
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
                            1234,
                            "Christiano Ronaldo",
                            undefined,
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
    });

    describe("When adding a new item without time left for modifications", () => {
        let storage;
        let noUpdateAfter;

        beforeAll(async () => {
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 1);
            noUpdateAfter = getISODateNoMs(pastDate);

            const operation = await warehouseInstance.methods
                .add_item(
                    10,
                    MichelsonMap.fromLiteral({
                        XP: "97"
                    }),
                    100,
                    "Christiano Ronaldo",
                    noUpdateAfter,
                    10
                )
                .send();

            await operation.confirmation(1);

            storage = await warehouseInstance.storage();
        });

        it("Then has a matching `no_update_after` timestamp", async () => {
            const item = await storage.warehouse.get("100");
            const obj = warehouseItemToObject(item);

            expect(obj).toEqual({
                available_quantity: 10,
                data: {
                    XP: "97"
                },
                item_id: 100,
                name: "Christiano Ronaldo",
                no_update_after: noUpdateAfter,
                total_quantity: 10
            });
        });

        it("Then may not be modified anymore", async () => {
            try {
                const operation = await warehouseInstance.methods
                    .update_item(
                        10,
                        MichelsonMap.fromLiteral({
                            XP: "98"
                        }),
                        100,
                        "Christiano Ronaldo",
                        undefined,
                        10
                    )
                    .send();

                await operation.confirmation(1);

                console.error(
                    "Will fail: Update_Item should throw an Error if the items `no_update_after` timestamp is in the past"
                );

                fail(
                    "Update_Item should throw an Error if the items `no_update_after` timestamp is in the past"
                );
            } catch (err) {
                expect(err.message).toEqual("ITEM_IS_FROZEN");
            }
        });
    });

    describe("When adding a new item with time left for modifications", () => {
        let storage;
        let noUpdateAfter;

        beforeAll(async () => {
            const futureDate = new Date();
            futureDate.setHours(futureDate.getHours() + 1);
            noUpdateAfter = getISODateNoMs(futureDate);

            const operation = await warehouseInstance.methods
                .add_item(
                    10,
                    MichelsonMap.fromLiteral({
                        XP: "97"
                    }),
                    200,
                    "Christiano Ronaldo",
                    noUpdateAfter,
                    10
                )
                .send();

            await operation.confirmation(1);

            storage = await warehouseInstance.storage();
        });

        it("Then has a matching `no_update_after` timestamp", async () => {
            const item = await storage.warehouse.get("200");
            const obj = warehouseItemToObject(item);

            expect(obj).toEqual({
                available_quantity: 10,
                data: {
                    XP: "97"
                },
                item_id: 200,
                name: "Christiano Ronaldo",
                no_update_after: noUpdateAfter,
                total_quantity: 10
            });
        });

        describe("And when I modify it again", () => {
            beforeAll(async () => {
                const operation = await warehouseInstance.methods
                    .update_item(
                        10,
                        MichelsonMap.fromLiteral({
                            XP: "98"
                        }),
                        200,
                        "Christiano Ronaldo",
                        noUpdateAfter,
                        10
                    )
                    .send();

                await operation.confirmation(1);

                storage = await warehouseInstance.storage();
            });

            it("Then allows me to update it", async () => {
                const item = await storage.warehouse.get("200");
                const obj = warehouseItemToObject(item);

                expect(obj).toEqual({
                    available_quantity: 10,
                    data: {
                        XP: "98"
                    },
                    item_id: 200,
                    name: "Christiano Ronaldo",
                    no_update_after: noUpdateAfter,
                    total_quantity: 10
                });
            });
        });

        describe("And when I freeze it", () => {
            beforeAll(async () => {
                const operation = await warehouseInstance.methods
                    .freeze_item(200)
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
                            200,
                            "Christiano Ronaldo",
                            undefined,
                            10
                        )
                        .send();

                    await operation.confirmation(1);

                    console.error(
                        "Will fail: Update_Item should throw an Error if the items `no_update_after` timestamp is in the past"
                    );

                    fail(
                        "Update_Item should throw an Error if the items `no_update_after` timestamp is in the past"
                    );
                } catch (err) {
                    expect(err.message).toEqual("ITEM_IS_FROZEN");
                }
            });

            describe("When freezing an item that is already frozen", () => {
                it("Then fails with an explicit error", async () => {
                    try {
                        const operation = await warehouseInstance.methods
                            .freeze_item(200)
                            .send();

                        await operation.confirmation(1);

                        console.error(
                            "Will fail: Freeze_Item should throw an Error if item is already frozen as it should be immutable"
                        );

                        fail(
                            "Freeze Item should throw an Error if item is already frozen as it should be immutable"
                        );
                    } catch (err) {
                        expect(err.message).toEqual("ITEM_IS_FROZEN");
                    }
                });
            });
        });
    });
});
