import { ipcMain, Event } from 'electron';

import { TableName, 
    IpcChannel, 
    ItemType, 
    IWhereItem,
    IItem,
    IFindStatement,
    IFindCondition, } from './vendor';

import { addItem, updateItem, getItems } from './crud';
import { getList } from './fsOps';

export const onRequestSummary = ipcMain.on('summary-request', async (event, bookPath) => {
    event.returnValue = getList(`../app/${bookPath}`) 
})

export const onAddItem = ipcMain.on('add-item', async (event, item) =>{
    const table = item.table;
    let _item: ItemType;
    await addItem(item).then(_ => _item = _);

    event.returnValue = _item;
});

export const onUpdateItem = ipcMain.on('update-item', async (event, _item) =>{
    const table = _item.table;

    let item: ItemType;
    await updateItem(_item).then(_ => item = _);

    event.returnValue = item;
});

export const onGetItems = ipcMain.on('get-items', async (event, getParam) => {
    const table = getParam.table;

    let items: Array<ItemType>;
    await getItems(getParam).then(_ => items = _);
    event.returnValue = items;
});
