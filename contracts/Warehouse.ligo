type item_metadata is record [
    available_quantity: nat;
    data: map (string, string);
    frozen: bool;
    item_id : nat;
    name: string;
    total_quantity: nat;
]

type inventory_assign_parameter is record [
    data: map (string, string);
    instance_number: nat;
    item_id: nat
]

type inventory_parameter is
    Assign_item of inventory_assign_parameter

type assign_parameter is address * nat * nat;

type parameter is 
    Add_item of item_metadata
|   Assign_item_proxy of assign_parameter
|   Update_item of item_metadata
|   Freeze_item of nat 

type storage is record [
    owner: address;
    version: string;
    warehouse: big_map (nat, item_metadata);
]

type return is list (operation) * storage;

function add (var item: item_metadata; var storage: storage): return is
    block {
        const found_item: option (item_metadata) = storage.warehouse [item.item_id];

        case found_item of
            None -> storage.warehouse := Big_map.add (item.item_id, item, storage.warehouse)
        |   Some (_i) -> failwith ("ITEM_ID_ALREADY_EXISTS")
        end;
    } with ((nil: list (operation)), storage)

function update (const item: item_metadata; var storage: storage): return is
    block {
        const found_item: option (item_metadata) = storage.warehouse [item.item_id];

        case found_item of
            None -> failwith ("ITEM_ID_DOESNT_EXIST")
        |   Some (fi) -> {
            if (fi.frozen) then {
                failwith ("ITEM_IS_FROZEN") 
            } else {
                storage.warehouse := Big_map.update (item.item_id, Some (item), storage.warehouse);
            }
        }
        end;
    } with ((nil: list (operation)), storage)

function assign (const params: assign_parameter; var storage: storage): return is
    block {
        var ops : list (operation) := nil;
        const found_item: option (item_metadata) = storage.warehouse[params.1];

        case found_item of
            None -> failwith ("ITEM_DOESNT_EXIST")
            | Some (fi) -> {
                const available_quantity : nat = fi.available_quantity;
                const total_quantity : nat = fi.total_quantity;
        
                if available_quantity = 0n or params.2 > total_quantity then {
                    failwith ("NO_AVAILABLE_ITEM");
                } else {
                    const inventory : contract (inventory_parameter) =
                        case (Tezos.get_entrypoint_opt ("%assign_item_inventory", params.0) : option (contract (inventory_parameter))) of
                            Some (contract) -> contract
                            | None -> (failwith ("CONTRACT_NOT_FOUND") : contract (inventory_parameter))
                        end;

                    const action : inventory_parameter = Assign_item (record [
                        data = (Map.empty: map (string, string));
                        instance_number = params.2;
                        item_id = params.1;
                    ]);

                    const op : operation = Tezos.transaction (action, 0tez, inventory);
                    ops := list [op];

                    const updated_fi = fi with record [ available_quantity = abs (fi.available_quantity - 1n) ];
                    storage.warehouse[params.1] := updated_fi
                }
            }
        end;
    } with (ops, storage)

function freeze (const id: nat; var storage: storage): return is
    block {
        const found_item: option (item_metadata) = storage.warehouse [id];

        case found_item of 
            None -> failwith ("ITEM_ID_DOESNT_EXIST")
        |   Some (fi) -> {
            if (fi.frozen) then {
                skip
            } else {
                var updated_i := fi;
                updated_i.frozen := True;
                storage.warehouse := Big_map.update (fi.item_id, Some (updated_i), storage.warehouse);
            }
        }
        end;
    } with ((nil: list (operation)), storage)

function main (const action : parameter; const storage : storage): return is
    case action of
        Add_item (i) -> add (i, storage)
    |   Assign_item_proxy (ap) -> assign (ap, storage)
    |   Update_item (i) -> update (i, storage)
    |   Freeze_item (id) -> freeze (id, storage)
    end
