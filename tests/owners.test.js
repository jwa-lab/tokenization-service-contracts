const { TezosToolkit, MichelsonMap } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const { originateContract } = require("./utils");

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
            owners: ["tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb"],
            version: "1",
            items: MichelsonMap.fromLiteral({}),
            instances: MichelsonMap.fromLiteral({})
        });
    });

    describe("When removing the only user", () => {
        it("Then fails with an error as at least 1 owner is required", async () => {
            try {
                await warehouseInstance.methods
                    .remove_owner("tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb")
                    .send();

                throw new Error(
                    "Remove_owner should throw an error if the resulting list of owners is empty"
                );
            } catch (err) {
                expect(err.message).toEqual("REQUIRES_AT_LEAST_ONE_OWNER");
            }
        });
    });

    describe("When adding another user", () => {
        let owners;

        beforeEach(async () => {
            const operation = await warehouseInstance.methods
                .add_owner("tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6")
                .send();

            await operation.confirmation(1);

            owners = (await warehouseInstance.storage()).owners;
        });

        it("Then adds the owner to the list", async () => {
            expect(owners).toEqual([
                "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
                "tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6"
            ]);
        });

        describe("When removing a user", () => {
            let owners;

            beforeEach(async () => {
                const operation = await warehouseInstance.methods
                    .remove_owner("tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb")
                    .send();

                await operation.confirmation(1);

                owners = (await warehouseInstance.storage()).owners;
            });

            it("Then removes the owner from the list", async () => {
                expect(owners).toEqual([
                    "tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6"
                ]);
            });
        });
    });
});
