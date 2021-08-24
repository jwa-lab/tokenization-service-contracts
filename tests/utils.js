async function getWarehouseInstanceAt(storage, itemId, instanceNumber) {
    const instanceObject = await storage.instances.get({
        item_id: itemId,
        instance_number: instanceNumber
    });

    return warehouseInstanceToObject(instanceObject);
}

async function hasWarehouseInstanceAt(storage, itemId, instanceNumber) {
    const instanceObject = await storage.instances.get({
        item_id: itemId,
        instance_number: instanceNumber
    });

    return Boolean(instanceObject);
}

function warehouseInstanceToObject(michelsonObject) {
    return {
        user_id: michelsonObject.user_id,
        data: Object.fromEntries(michelsonObject.data.entries())
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

    await originatonOperation.confirmation(1, 1);

    return tezos.contract.at(contractAddress);
}

module.exports = {
    warehouseItemToObject,
    warehouseInstanceToObject,
    getWarehouseInstanceAt,
    hasWarehouseInstanceAt,
    originateContract
};
