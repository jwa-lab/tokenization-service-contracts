export * from "./src/warehouse";

export interface Contract {
    contractName: string;
    michelson: object[];
}

const contracts = {
    warehouse: {
        contractName: "Warehouse",
        michelson: require("./warehouse.json")
    }
} as {
    [k: string]: Contract;
};

export default contracts;
