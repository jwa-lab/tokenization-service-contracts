type item_data is map (string, string);

type item_instances is map(nat, item_data)

type storage is record [
    inventory: big_map (nat, item_instances);
]

type remove_item_parameter is nat * nat;

type transfer_parameter is record [
    instance_number: nat;
    item_id: nat;
    new_inventory_address: address
]

type parameter is record [
    data: item_data;
    instance_number: nat;
    item_id: nat
]

type assign_parameter is
    Assign_item of parameter
    
type remove_parameter is
    Remove_item of remove_item_parameter

type action is 
    Assign_item_inventory of parameter
|   Remove_item_proxy of remove_item_parameter
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

function remove_item (const params: remove_item_parameter; var storage: storage): return is
    block {
        const instances_map: option (item_instances) = storage.inventory[params.1];

        case instances_map of
            None -> failwith ("NO_SUCH_ITEM_IN_INVENTORY")
            | Some (im) -> block {
                const instance: option (item_data) = im [params.0];

                case instance of
                    None -> failwith("NO_SUCH_INSTANCE_NUMBER")
                |   Some (i) -> block {
                    ignore_item_data (i);
                      const removed_im : item_instances = Map.remove (params.0, im);
                      storage.inventory [params.1] := removed_im
                }
                end;
            }
        end;
    } with ((nil: list (operation)), storage)

function transfer_item (const params: transfer_parameter; var storage: storage): return is
    block {

        var ops : list (operation) := nil;
        const instances_map: option (item_instances) = storage.inventory[params.item_id];

        case instances_map of
            None -> failwith ("NO_SUCH_ITEM_IN_INVENTORY")
            | Some (im) -> block {

                const instance: option (item_data) = im [params.instance_number];

                case instance of
                    None -> failwith("NO_SUCH_INSTANCE_NUMBER")
                |   Some (i) -> block {

                    const inventory : contract (remove_parameter) =
                        case (Tezos.get_entrypoint_opt ("%remove_item_proxy", Tezos.self_address) : option (contract (remove_parameter))) of
                            Some (contract) -> contract
                            | None -> (failwith ("CONTRACT_NOT_FOUND") : contract (remove_parameter))
                        end;

                    const remove_action : remove_parameter = Remove_item (
                        params.instance_number,
                        params.item_id
                    );
                    
                    const remove_op : operation = Tezos.transaction (remove_action, 0tez, inventory);

                    const new_inventory : contract (assign_parameter) =
                        case (Tezos.get_entrypoint_opt ("%assign_item_inventory", params.new_inventory_address) : option (contract (assign_parameter))) of
                            Some (contract) -> contract
                            | None -> (failwith ("CONTRACT_NOT_FOUND") : contract (assign_parameter))
                        end;

                    const assign_action : assign_parameter = Assign_item (record [
                        data = i;
                        instance_number = params.instance_number;
                        item_id = params.item_id;
                    ]);

                    const assign_op : operation = Tezos.transaction (assign_action, 0tez, new_inventory);

                    ops := list [assign_op; remove_op];
                }
                end;
            }
        end;
    } with (ops, storage)

function main (const action: action; const storage: storage): return is
    case action of
        Assign_item_inventory (i) -> assign_item (i, storage)
    |   Remove_item_proxy (i) -> remove_item (i, storage)
    |   Transfer_item (i) -> transfer_item (i, storage)
    |   Update_item (i) -> update_item (i, storage)
    end
