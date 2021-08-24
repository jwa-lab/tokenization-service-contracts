const { TezosToolkit, MichelsonMap } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const warehouseContract = require("../build/contracts/warehouse.json");

const {
    warehouseItemToObject,
    getWarehouseInstanceAt,
    originateContract
} = require("./utils");

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

    describe("When I add a new frozen item with a quantity of 1", () => {
        beforeAll(async () => {
            const operation = await warehouseInstance.methods
                .add_item(
                    1,
                    MichelsonMap.fromLiteral({
                        XP: "97"
                    }),
                    true,
                    0,
                    "Karim Benzema",
                    1
                )
                .send();

            await operation.confirmation(1);
        });

        describe("And I assign an instance", () => {
            let warehouseStorage;

            beforeAll(async () => {
                const operation = await warehouseInstance.methods
                    .assign_item(0, 1, "user_123")
                    .send();

                await operation.confirmation(1);

                warehouseStorage = await warehouseInstance.storage();
            });

            it("Then creates the instance AND the data field is empty", async () => {
                const obj = await getWarehouseInstanceAt(
                    warehouseStorage,
                    0,
                    1
                );

                expect(obj).toEqual({
                    user_id: "user_123",
                    data: {}
                });
            });

            it("Then decrements the available quantity for the item", async () => {
                const item = await warehouseStorage.items.get("0");

                const obj = warehouseItemToObject(item);

                expect(obj).toEqual({
                    available_quantity: 0,
                    data: {
                        XP: "97"
                    },
                    frozen: true,
                    item_id: 0,
                    name: "Karim Benzema",
                    total_quantity: 1
                });
            });

            describe("When I assign the item again", () => {
                it("Then fails since there are no available items anymore", async () => {
                    try {
                        await warehouseInstance.methods
                            .assign_item(0, 2, "user_123")
                            .send();

                        console.error(
                            "Will fail: Assign_item_proxy should throw an error since the available_quantity is 0n"
                        );

                        fail(
                            "Assign_item_proxy should throw an error if the available_quantity is 0n"
                        );
                    } catch (err) {
                        expect(err.message).toEqual("NO_AVAILABLE_ITEM");
                    }
                });
            });
        });

        describe("When I add a non frozen item with a quantity of 1", () => {
            beforeAll(async () => {
                const operation = await warehouseInstance.methods
                    .add_item(
                        1,
                        MichelsonMap.fromLiteral({
                            XP: "97"
                        }),
                        false,
                        1,
                        "Karim Benzema",
                        1
                    )
                    .send();

                await operation.confirmation(1);
            });

            describe("And I assign an instance", () => {
                it("Then fails with an error", async () => {
                    try {
                        await warehouseInstance.methods
                            .assign_item(1, 1, "user_123")
                            .send();
                    } catch (err) {
                        expect(err.message).toEqual(
                            "ITEM_MUST_BE_FROZEN_BEFORE_ASSIGN"
                        );
                    }
                });
            });
        });
    });

    describe("When I add a new frozen item with a quantity of 2", () => {
        beforeAll(async () => {
            const addOperation = await warehouseInstance.methods
                .add_item(
                    2,
                    MichelsonMap.fromLiteral({
                        XP: "97"
                    }),
                    true,
                    2,
                    "Karim Benzema",
                    2
                )
                .send();

            await addOperation.confirmation(1);

            const assignOperation = await warehouseInstance.methods
                .assign_item(2, 1, "user_123")
                .send();

            await assignOperation.confirmation(1);
        });

        describe("And I assign the same instance again", () => {
            it("Then fails with an error", async () => {
                try {
                    await warehouseInstance.methods
                        .assign_item(2, 1, "user_123")
                        .send();
                } catch (err) {
                    expect(err.message).toEqual("INSTANCE_ALREADY_ASSIGNED");
                }
            });
        });
    });

    describe("When I assign an item that doesn't exist", () => {
        it("Then fails with an error", async () => {
            try {
                await warehouseInstance.methods
                    .assign_item(1000, 1, "user_123")
                    .send();
            } catch (err) {
                expect(err.message).toEqual("ITEM_DOESNT_EXIST");
            }
        });
    });
});
