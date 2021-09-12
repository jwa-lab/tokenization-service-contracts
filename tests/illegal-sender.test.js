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
                "edsk3RFfvaFaxbHx8BMtEW1rKQcPtDML3LXjNqMNLCzC3wLC1bWbAt"
            )
        });

        warehouseInstance = await originateContract(tezos, warehouseContract, {
            owner: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
            version: "1",
            items: MichelsonMap.fromLiteral({}),
            instances: MichelsonMap.fromLiteral({})
        });
    });

    describe("When another user tries adding a new item", () => {
        it("Then fails since only the contract's owner is allowed to", async () => {
            try {
                await warehouseInstance.methods
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

                throw new Error(
                    "Assign_item should throw an error if the caller isn't the owner"
                );
            } catch (err) {
                expect(err.message).toEqual("ILLEGAL_SENDER");
            }
        });
    });
});
