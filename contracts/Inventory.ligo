type item_data is map (string, string);

type item_instances is map(nat, item_data);

type user_inventory is map(nat, item_instances);

type storage is record [
    inventory: big_map (string, user_inventory);
]

type assign_item_parameters is record [
    data: item_data;
    instance_number: nat;
    item_id: nat;
    user_id: string;
]

type action is 
    Assign_item of assign_item_parameters
|   Update_item of assign_item_parameters

type return is list (operation) * storage;

function assign_item (const params: assign_item_parameters; var storage: storage): return is
    block {
        const user_inventory: option (user_inventory) = storage.inventory[params.user_id];

        case user_inventory of
            None -> block {
                const new_instances_map: item_instances = map [params.instance_number -> params.data];
                const new_user_inventory: user_inventory = map [params.item_id -> new_instances_map];

                storage.inventory := Big_map.add (params.user_id, new_user_inventory, storage.inventory);
            }
            | Some (ui) -> block {
                const instances_map: option (item_instances) = ui[params.item_id];
                var upserted_instances_map: item_instances := Map.empty;

                case instances_map of
                    None -> block {
                        upserted_instances_map := map [params.instance_number -> params.data];
                    }
                    | Some (im) -> block {
                        const instance: option (item_data) = im[params.instance_number];

                        case instance of
                            None -> block {
                                upserted_instances_map := Map.add(params.instance_number, params.data, im);
                            }
                            | Some (_i) -> failwith("ITEM_INSTANCE_ALREADY_ASSIGNED")
                            end;
                    }
                end;

                const updated_user_inventory: user_inventory = Map.add (params.item_id, upserted_instances_map, ui);
                storage.inventory := Big_map.add (params.user_id, updated_user_inventory, storage.inventory);
            }
        end;
    } with ((nil: list (operation)), storage)

function update_item (const params: assign_item_parameters; var storage: storage): return is
    block {
        const user_inventory: option (user_inventory) = storage.inventory[params.user_id];

        case user_inventory of 
            None -> failwith("NO_SUCH_USER_ID")
            | Some (ui) -> block {
                const instances_map: option (item_instances) = ui[params.item_id];

                case instances_map of
                    None -> failwith("NO_SUCH_ITEM_ID")
                    | Some (im) -> block {
                        const instance: option (item_data) = im[params.instance_number];

                        case instance of
                            None -> failwith("NO_SUCH_INSTANCE_NUMBER")
                            | Some (_i) -> block {
                                const updated_im : item_instances = Map.add (params.instance_number, params.data, im);
                                const updated_ui : user_inventory = Map.add (params.item_id, updated_im, ui);

                                storage.inventory := Big_map.add (params.user_id, updated_ui, storage.inventory);
                            }
                        end;
                    }
                end;
            }
        end;

    } with ((nil: list (operation)), storage)


function main (const action: action; const storage: storage): return is
    case action of
        Assign_item (p) -> assign_item (p, storage)
    |   Update_item (p) -> update_item (p, storage)
    end
