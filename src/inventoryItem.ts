import {
    ContractAbstraction,
    ContractMethod,
    ContractProvider,
    MichelsonMap
} from "@taquito/taquito";

export type JSONInventoryItem = { [k: string]: string };

export type InventoryStorage = MichelsonMap<
    string,
    MichelsonMap<string, MichelsonMap<string, MichelsonMap<string, string>>>
>;

export interface InventoryContract
    extends ContractAbstraction<ContractProvider> {
    storage: <InventoryStorage>() => Promise<InventoryStorage>;
    methods: {
        assign_item(
            data: MichelsonMap<string, string>,
            instance_number: number,
            item_id: number,
            user_id: string
        ): ContractMethod<ContractProvider>;

        update_item(
            data: MichelsonMap<string, string>,
            instance_number: number,
            item_id: number,
            user_id: string
        ): ContractMethod<ContractProvider>;
    };
}

export function toMichelsonInventoryItem(
    data: JSONInventoryItem
): MichelsonMap<string, string> {
    return MichelsonMap.fromLiteral(data) as MichelsonMap<string, string>;
}

export function fromMichelsonInventoryItem(
    data: MichelsonMap<string, string>
): JSONInventoryItem {
    return Object.fromEntries(data.entries());
}
