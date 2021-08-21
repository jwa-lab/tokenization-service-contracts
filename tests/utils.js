async function getInventoryItemAt(storage, itemId, instanceNumber) {
    const instance_map = await storage.get(String(itemId));
    const entries = Object.fromEntries(instance_map.entries());
    return inventoryItemToObject(entries[String(instanceNumber)]);
}

async function hasInventoryItemAt(storage, itemId, instanceNumber) {
    const instance_map = await storage.get(String(itemId));
    const entries = Object.fromEntries(instance_map.entries());
    return Boolean(entries[String(instanceNumber)]);
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
