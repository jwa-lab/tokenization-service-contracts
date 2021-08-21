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
                .assign_item_inventory(
                    MichelsonMap.fromLiteral({
                        XP: "97"
                    }),
                    12,
                    2
                )
                .send();

            await operation.confirmation();

            storage = await inventoryInstance.storage();
        });

        it("Then assigns the item to the inventory", async () => {
            const obj = await getInventoryItemAt(storage, 2, 12);

            expect(obj).toEqual({
                data: {
                    XP: "97"
                }
            });
        });

        describe("When updating the item", () => {
            beforeAll(async () => {
                const operation = await inventoryInstance.methods
                    .update_item(
                        MichelsonMap.fromLiteral({
                            XP: "98"
                        }),
                        12,
                        2
                    )
                    .send();

                await operation.confirmation(1);

                storage = await inventoryInstance.storage();
            });

            it("Then updates the assigned item", async () => {
                const obj = await getInventoryItemAt(storage, 2, 12);

                expect(obj).toEqual({
                    data: {
                        XP: "98"
                    }
                });
            });
        });

        it("Then fails When updating an unassigned item", async () => {
            try {
                const operation = await inventoryInstance.methods
                    .update_item(
                        MichelsonMap.fromLiteral({
                            XP: "98"
                        }),
                        12,
                        3
                    )
                    .send();

                await operation.confirmation(1);

                console.error(
                    "Will fail: Assign_Item should throw an Error if the item isn't assign to this inventory"
                );

                fail(
                    "Assign_Item should throw an Error if the item isn't assigned to this inventory"
                );
            } catch (err) {
                expect(err.message).toEqual("NO_SUCH_ITEM_IN_INVENTORY");
            }
        });

        it("Then fails When updating an unassigned item instance", async () => {
            try {
                const operation = await inventoryInstance.methods
                    .update_item(
                        MichelsonMap.fromLiteral({
                            XP: "98"
                        }),
                        13,
                        2
                    )
                    .send();

                await operation.confirmation(1);

                console.error(
                    "Will fail: Assign_Item should throw an Error if the item instance isn't assign to this inventory"
                );

                fail(
                    "Assign_Item should throw an Error if the item instance isn't assigned to this inventory"
                );
            } catch (err) {
                expect(err.message).toEqual("NO_SUCH_INSTANCE_NUMBER");
            }
        });
    });
});
