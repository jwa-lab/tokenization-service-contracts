import {
    ContractAbstraction,
    ContractMethod,
    ContractProvider,
    MichelsonMap
} from "@taquito/taquito";

import { BigNumber } from "bignumber.js";

export interface MichelsonWarehouseItem {
    available_quantity: BigNumber;
    data: MichelsonMap<string, string>;
    frozen: boolean;
    item_id: BigNumber;
    name: string;
    total_quantity: BigNumber;
    [key: string]:
        | MichelsonMap<string, string>
        | boolean
        | string
        | BigNumber;
}

export type WarehouseBigMap = MichelsonMap<string, MichelsonWarehouseItem>;

export interface WarehouseStorage {
    owner: string;
    version: string;
    warehouse: WarehouseBigMap;
}

export interface WarehouseContract
    extends ContractAbstraction<ContractProvider> {
    storage: <WarehouseStorage>() => Promise<WarehouseStorage>;
    methods: {
        add_item(
            available_quantity: number,
            data: MichelsonMap<string, string>,
            frozen: boolean,
            item_id: number,
            name: string,
            total_quantity: number
        ): ContractMethod<ContractProvider>;

        update_item(
            available_quantity: number,
            data: MichelsonMap<string, string>,
            frozen: boolean,
            item_id: number,
            name: string,
            no_update_after: string | undefined,
            total_quantity: number
        ): ContractMethod<ContractProvider>;

        freeze_item(item_id: number): ContractMethod<ContractProvider>;

        assign_item_proxy(
            inventory_address: string,
            item_id: number,
            instance_number: number
        ): ContractMethod<ContractProvider>;
    };
}

export interface WarehouseData {
    [k: string]: string;
}

export interface JSONWarehouseItem {
    available_quantity: number;
    data: { [k: string]: string };
    frozen: boolean;
    item_id: number;
    name: string;
    total_quantity: number;
    [key: string]: 
        | { [k: string]: string }
        | boolean
        | string
        | number;
}

export type LinearWarehouseItem = [
    number,
    MichelsonMap<string, string>,
    boolean,
    number,
    string,
    number
];

export class WarehouseItem {
    readonly available_quantity: BigNumber;
    readonly data: WarehouseData;
    readonly frozen: boolean;
    readonly item_id: BigNumber;
    readonly name: string;
    readonly total_quantity: BigNumber;

    constructor(object: { [k: string]: unknown }) {
        this.available_quantity = getKey(
            object,
            "available_quantity"
        ) as BigNumber;
        this.data = getKey(object, "data") as WarehouseData;
        this.frozen = getKey(object, "frozen") as boolean;
        this.item_id = getKey(object, "item_id") as BigNumber;
        this.name = object.name as string;
        this.total_quantity = getKey(object, "total_quantity") as BigNumber;

        this.validateData(this.data);
    }

    toMichelsonArguments(): LinearWarehouseItem {
        const warehouseItem = {
            available_quantity: this.available_quantity,
            data: MichelsonMap.fromLiteral(this.data),
            frozen: this.frozen,
            item_id: this.item_id,
            name: this.name,
            total_quantity: this.total_quantity
        } as MichelsonWarehouseItem;

        return Object.keys(warehouseItem)
            .sort()
            .map((key: string) => warehouseItem[key]) as LinearWarehouseItem;
    }

    static fromMichelson(michelson: MichelsonWarehouseItem): JSONWarehouseItem {
        return {
            available_quantity: michelson.available_quantity.toNumber(),
            data: Object.fromEntries(michelson.data.entries()),
            frozen: michelson.frozen,
            item_id: michelson.item_id.toNumber(),
            name: michelson.name.toString(),
            total_quantity: michelson.total_quantity.toNumber()
        };
    }

    private validateData(data: WarehouseData): void {
        if (Object.values(data).some((datum) => typeof datum !== "string")) {
            throw new Error(`WarehouseItem: Data must be 'string'`);
        }
    }
}

function getKey(object: { [k: string]: unknown }, key: string) {
    if (!(key in object)) {
        throw new Error(
            `WarehouseItem: Key ${key} is not present in warehouseItem`
        );
    } else {
        return object[key];
    }
}
