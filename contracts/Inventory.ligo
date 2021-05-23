type item_data is record [
    data: map (string, string);
]

type item_instances is map(nat, item_data)

type storage is record [
    inventory: big_map (nat, item_instances);
]

type transfer_storage is record [
    inventory: big_map (nat, item_instances);
]

type transfer_parameter is record[
    data: item_data;
    instance_number: nat;
    item_id: nat;
    new_inventory_address: address
]

type parameter is record [
    data: item_data;
    instance_number: nat;
    item_id: nat
]

type inventory_parameter is
    Assign_item of parameter

type action is 
    Assign_item_proxy of parameter
|   Remove_item of parameter
|   Transfer_item of transfer_parameter
|   Update_item of parameter


[@inline] const ignore_item_data = [%Michelson ({| {DROP;UNIT} |} : item_data -> unit)]

type return is list (operation) * storage;

function assign_item (const params: parameter; var storage: storage): return is
    block {
        const instances_map: option (item_instances) = storage.inventory[params.item_id];

        case instances_map of
            None -> block {
                const new_instances_map : item_instances = map [params.instance_number -> params.data];

                storage.inventory := Big_map.add (params.item_id, new_instances_map, storage.inventory)
            }
            | Some (im) -> block {
                const updated_im = Map.add (params.instance_number, params.data, im);

                storage.inventory := Big_map.add (params.item_id, updated_im, storage.inventory)
            }
        end;
    } with ((nil: list (operation)), storage)

function update_item (const params: parameter; var storage: storage): return is
    block {
        const instances_map: option (item_instances) = storage.inventory[params.item_id];

        case instances_map of
            None -> failwith ("NO_SUCH_ITEM_IN_INVENTORY")
            | Some (im) -> block {
                const instance: option (item_data) = im [params.instance_number];

                case instance of
                    None -> failwith("NO_SUCH_INSTANCE_NUMBER")
                |   Some (i) -> block {
                    ignore_item_data (i);
                    const updated_im : item_instances = Map.update (params.instance_number, Some (params.data), im);
                    storage.inventory [params.item_id] := updated_im
                }
                end;
            }
        end;
    } with ((nil: list (operation)), storage)

function remove_item (const params: parameter; var storage: storage): return is
    block {
        const instances_map: option (item_instances) = storage.inventory[params.item_id];

        case instances_map of
            None -> failwith ("NO_SUCH_ITEM_IN_INVENTORY")
            | Some (im) -> block {
                const instance: option (item_data) = im [params.instance_number];

                case instance of
                    None -> failwith("NO_SUCH_INSTANCE_NUMBER")
                |   Some (i) -> block {
                    ignore_item_data (i);
                      const removed_im : item_instances = Map.remove (params.instance_number, im);
                      storage.inventory [params.item_id] := removed_im
                }
                end;
            }
        end;
    } with ((nil: list (operation)), storage)

function transfer_item (const params: transfer_parameter; var storage: storage):return is
    block {
        var ops : list (operation) := nil;
        const found_item: option (item_instances) = storage.inventory[params.item_id];
        case found_item of
            None -> failwith ("NO_SUCH_ITEM_IN_INVENTORY")
            | Some (fi) -> block {
                const instance: option (item_data) = fi [params.instance_number];
                case instance of
                    None -> failwith("NO_SUCH_INSTANCE_NUMBER")
                |   Some (i) -> block {
                    ignore_item_data (i);
                    const removed_fi : item_instances = Map.remove (params.instance_number, fi);
                    storage.inventory [params.item_id] := removed_fi;

                    const new_inventory : contract (inventory_parameter) =
                        case (Tezos.get_entrypoint_opt ("%assign_item", params.new_inventory_address) : option (contract (inventory_parameter))) of
                            Some (contract) -> contract
                            | None -> (failwith ("CONTRACT_NOT_FOUND") : contract (inventory_parameter))
                        end;

                    const assign_action : inventory_parameter = Assign_item (record [
                        data = params.data;
                        instance_number = params.instance_number;
                        item_id = params.item_id;
                    ]);

                    const op : operation = Tezos.transaction (assign_action, 0tez, new_inventory);
                    ops := list [op];
                }
            end;
            }
        end;
    } with (ops, storage)

function main (const action: action; const storage: storage): return is
    case action of
        Assign_item_proxy (i) -> assign_item (i, storage)
    |   Remove_item (i) -> remove_item (i, storage)
    |   Update_item (i) -> update_item (i, storage)
    |   Transfer_item (fi) -> transfer_item (fi, storage)
    end
