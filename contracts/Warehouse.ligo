type item_data is map (string, string);

type item_metadata is record [
    available_quantity: nat;
    data: item_data;
    frozen: bool;
    item_id: nat;
    name: string;
    total_quantity: nat;
]

type instance_metadata is record [
    data: item_data;
    user_id: string;
]

// itemId, instanceNumber, userId
type assign_parameter is nat * nat * string;

// itemId, instanceNumber, data
type update_instance_parameter is nat * nat * item_data;

// itemId, instanceNumber, userId
type transfer_parameter is nat * nat * string;

type parameter is 
    Add_item of item_metadata
|   Update_item of item_metadata
|   Freeze_item of nat
|   Assign_item of assign_parameter
|   Update_instance of update_instance_parameter
|   Transfer_instance of transfer_parameter

type instances_key is record [
    item_id: nat;
    instance_number: nat;
]

type storage is record [
    owner: address;
    version: string;
    items: big_map (nat, item_metadata);
    instances: big_map (instances_key, instance_metadata);
]

type return is list (operation) * storage;

function add (var item: item_metadata; var storage: storage): return is
    block {
        const found_item: option (item_metadata) = storage.items [item.item_id];

        case found_item of
            None -> storage.items := Big_map.add (item.item_id, item, storage.items)
        |   Some (_i) -> failwith ("ITEM_ID_ALREADY_EXISTS")
        end;
    } with ((nil: list (operation)), storage)

function update (const item: item_metadata; var storage: storage): return is
    block {
        const found_item: option (item_metadata) = storage.items [item.item_id];

        case found_item of
            None -> failwith ("ITEM_ID_DOESNT_EXIST")
        |   Some (fi) -> {
            if (fi.frozen) then {
                failwith ("ITEM_IS_FROZEN");
            } else {
                storage.items := Big_map.update (item.item_id, Some (item), storage.items);
            }
        }
        end;
    } with ((nil: list (operation)), storage)

function freeze (const id: nat; var storage: storage): return is
    block {
        const found_item: option (item_metadata) = storage.items [id];

        case found_item of 
            None -> failwith ("ITEM_ID_DOESNT_EXIST")
        |   Some (fi) -> {
            if (fi.frozen) then {
                skip;
            } else {
                var updated_i := fi;

                updated_i.frozen := True;
                storage.items := Big_map.update (fi.item_id, Some (updated_i), storage.items);
            }
        }
        end;
    } with ((nil: list (operation)), storage)

function assign (const params: assign_parameter; var storage: storage): return is
    block {
        const found_item: option (item_metadata) = storage.items[params.0];

        case found_item of
            None -> failwith ("ITEM_DOESNT_EXIST")
            | Some (fit) -> {
                if (fit.frozen) then {
                    const available_quantity : nat = fit.available_quantity;
                    const total_quantity : nat = fit.total_quantity;
            
                    if (available_quantity = 0n or params.1 > total_quantity) then {
                        failwith ("NO_AVAILABLE_ITEM");
                    } else {
                        const key: instances_key = record [
                            item_id = params.0;
                            instance_number = params.1;
                        ];

                        const found_instance: option (instance_metadata) = storage.instances[key];

                        case found_instance of
                            None -> {
                                const new_instance_record : instance_metadata = record [
                                    user_id = params.2;
                                    data = (Map.empty: item_data);
                                ];

                                storage.instances := Big_map.update (key, Some (new_instance_record), storage.instances)
                            }
                            | Some (_fin) -> failwith ("INSTANCE_ALREADY_ASSIGNED")
                        end;

                        const updated_fit = fit with record [ available_quantity = abs (fit.available_quantity - 1n) ];
                        storage.items[params.0] := updated_fit
                    }
                } else {
                    failwith ("ITEM_MUST_BE_FROZEN_BEFORE_ASSIGN");
                }
            }
        end;
    } with ((nil: list (operation)), storage)

function update_instance (const params: update_instance_parameter; var storage: storage): return is
    block {
        const key: instances_key = record [
            item_id = params.0;
            instance_number = params.1;
        ];

        const found_instance: option (instance_metadata) = storage.instances[key];

        case found_instance of
            None -> failwith ("NO_SUCH_INSTANCE")
            | Some (fi) -> {
                const updated_fi = fi with record [ data = params.2 ];
                storage.instances := Big_map.update (key, Some (updated_fi), storage.instances);
            }
        end;
    } with ((nil: list (operation)), storage)

function transfer (const params: transfer_parameter; var storage: storage): return is
    block {
        const key: instances_key = record [
            item_id = params.0;
            instance_number = params.1;
        ];

        const found_instance: option (instance_metadata) = storage.instances[key];

        case found_instance of
            None -> failwith ("NO_SUCH_INSTANCE")
            | Some (fi) -> {
                const updated_fi = fi with record [ user_id = params.2 ];
                storage.instances := Big_map.update (key, Some (updated_fi), storage.instances);
            }
        end;
    } with ((nil: list (operation)), storage)

function main (const action: parameter; const storage : storage): return is
    case action of
        Add_item (i) -> add (i, storage)
    |   Update_item (i) -> update (i, storage)
    |   Freeze_item (id) -> freeze (id, storage)
    |   Assign_item (ap) -> assign (ap, storage)
    |   Update_instance (uip) -> update_instance (uip, storage)
    |   Transfer_instance (tp) -> transfer (tp, storage)
    end
