async function getInventoryItemtAt(storage, itemId, instanceNumber) {
    const instance_map = await storage.get(String(itemId));
    const entries = Object.fromEntries(instance_map.entries());
    return inventoryItemToObject(entries[String(instanceNumber)]);
}

function inventoryItemToObject(itemData) {
    return {
        data: Object.fromEntries(itemData.entries())
    };
}

function warehouseItemToObject(item) {
    return {
        no_update_after: item.no_update_after
            ? getISODateNoMs(new Date(item.no_update_after))
            : undefined,
        item_id: item.item_id.toNumber(),
        name: item.name,
        total_quantity: item.total_quantity.toNumber(),
        available_quantity: item.available_quantity.toNumber(),
        data: Object.fromEntries(item.data.entries())
    };
}

function getISODateNoMs(date = new Date()) {
    date.setMilliseconds(0);
    return date.toISOString();
}

module.exports = {
    getISODateNoMs,
    warehouseItemToObject,
    inventoryItemToObject,
    getInventoryItemtAt
};
