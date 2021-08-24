const { TezosToolkit, MichelsonMap } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const warehouseContract = require("../build/contracts/warehouse.json");

const { getWarehouseInstanceAt, originateContract } = require("./utils");

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

    describe("When I add a new frozen item with a quantity of 1 AND I assign it to a user", () => {
        beforeAll(async () => {
            const addOperation = await warehouseInstance.methods
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

            await addOperation.confirmation(1);

            const assignOperation = await warehouseInstance.methods
                .assign_item(0, 1, "user_123")
                .send();

            await assignOperation.confirmation(1);
        });

        describe("When I update the instance", () => {
            let warehouseStorage;

            beforeAll(async () => {
                const operation = await warehouseInstance.methods
                    .update_instance(
                        0,
                        1,
                        MichelsonMap.fromLiteral({
                            XP: "98"
                        })
                    )
                    .send();

                await operation.confirmation(1);

                warehouseStorage = await warehouseInstance.storage();
            });

            it("Then updates the instance", async () => {
                const obj = await getWarehouseInstanceAt(
                    warehouseStorage,
                    0,
                    1
                );

                expect(obj).toEqual({
                    user_id: "user_123",
                    data: {
                        XP: "98"
                    }
                });
            });
        });
    });

    describe("When I update an instance that doesn't exist", () => {
        it("Then fails with an error", async () => {
            try {
                await warehouseInstance.methods
                    .update_instance(
                        3,
                        1,
                        MichelsonMap.fromLiteral({
                            XP: "98"
                        })
                    )
                    .send();
            } catch (err) {
                expect(err.message).toEqual("NO_SUCH_INSTANCE");
            }
        });
    });
});
