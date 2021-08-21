async function getInventoryItemAt(storage, userId, itemId, instanceNumber) {
    const user_inventory = await storage.get(userId);
    const instance_map = Object.fromEntries(user_inventory.entries())[String(itemId)];
    return inventoryItemToObject(Object.fromEntries(instance_map.entries())[String(instanceNumber)]);
}

async function hasInventoryItemAt(storage, userId, itemId, instanceNumber) {
    const user_inventory = await storage.get(userId);
    const instance_map = Object.fromEntries(user_inventory.entries())[String(itemId)];
    return Boolean(Object.fromEntries(instance_map.entries())[String(instanceNumber)]);
}

function inventoryItemToObject(itemData) {
    return {
        data: Object.fromEntries(itemData.entries())
    };
}

function warehouseItemToObject(item) {
    return {
        available_quantity: item.available_quantity.toNumber(),
        data: Object.fromEntries(item.data.entries()),
        frozen: item.frozen,
        item_id: item.item_id.toNumber(),
        name: item.name,
        total_quantity: item.total_quantity.toNumber()
    };
}

async function originateContract(tezos, code, storage) {
    const originatonOperation = await tezos.contract.originate({
        code,
        storage
    });

    const { contractAddress } = originatonOperation;

    console.log('contract deployed at', contractAddress);

    await originatonOperation.confirmation(1);

    return tezos.contract.at(contractAddress);
}

module.exports = {
    warehouseItemToObject,
    inventoryItemToObject,
    getInventoryItemAt,
    hasInventoryItemAt,
    originateContract
};
