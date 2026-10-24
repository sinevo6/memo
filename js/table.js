// ==========================================
// テーブル行・データ管理ロジック
// ==========================================
let selectedProducts = [];
let selectedPosaProducts = [];
let selectedOwnedEquipment = [];

function updateAddButtonCells(tbodyId, cellClassName, addActionCallback) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr:not([style*="display: none"])');
    
    tbody.querySelectorAll(`.${cellClassName}`).forEach(cell => {
        cell.innerHTML = '';
    });

    if (rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        const targetCell = lastRow.querySelector(`.${cellClassName}`);
        if (targetCell) {
            const addBtn = document.createElement('button');
            addBtn.className = 'add-btn-circle';
            addBtn.textContent = '+';
            addBtn.title = '行追加';
            addBtn.addEventListener('click', addActionCallback);
            targetCell.appendChild(addBtn);
        }
    }
}

// 1. 商品テーブル関連
function attachTableEvents() {
    const tbody = document.getElementById('product-tbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr.product-row:not(#product-row-template)').forEach(tr => {
        const qtyInput = tr.querySelector('.quantity');
        const priceInput = tr.querySelector('.price');
        const totalCell = tr.querySelector('.total');
        const deleteBtn = tr.querySelector('.delete-product-btn');
        const warrantySelect = tr.querySelector('.warranty-select');

        bindEventDiscountMenu(priceInput);

        function recalc() {
            const qty = parseInt(qtyInput.textContent.replace(/,/g, ''), 10) || 0;
            const price = parseInt(priceInput.textContent.replace(/,/g, ''), 10) || 0;
            const total = qty * price;
            totalCell.textContent = total !== 0 ? total.toLocaleString() : '';
            calculateTotals();
        }
        if (qtyInput) qtyInput.addEventListener('input', recalc);
        if (priceInput) priceInput.addEventListener('input', recalc);

        if (warrantySelect && !warrantySelect.dataset.listenerAttached) {
            warrantySelect.dataset.listenerAttached = 'true';
            warrantySelect.addEventListener('change', () => {
                if (warrantySelect.value === '加入') {
                    const totalVal = parseInt(totalCell.textContent.replace(/,/g, ''), 10) || 0;
                    
                    if (totalVal < 11000) {
                        alert("延長保証対象外です。ご購入金額1万円（税別）以上が対象です。");
                        warrantySelect.value = "";
                        return;
                    }

                    let warrantyName = totalVal >= 55000 ? "Ksあんしん延長保証5年" : "Ksあんしん延長保証3年";
                    let warrantyPrice = Math.floor(totalVal * 0.05);

                    const template = document.getElementById('product-row-template');
                    const clone = template.cloneNode(true);
                    clone.removeAttribute('id');
                    clone.className = 'product-row';
                    clone.style.display = '';

                    clone.querySelector('.product-type').textContent = warrantyName;
                    clone.querySelector('.price').textContent = warrantyPrice > 0 ? warrantyPrice.toLocaleString() : '';
                    clone.querySelector('.total').textContent = warrantyPrice > 0 ? warrantyPrice.toLocaleString() : '';
                    
                    tr.after(clone);
                    attachTableEvents();
                }
            });
        }

        if (deleteBtn && !deleteBtn.dataset.listenerAttached) {
            deleteBtn.dataset.listenerAttached = 'true';
            deleteBtn.addEventListener('click', () => {
                const validRows = tbody.querySelectorAll('tr.product-row:not(#product-row-template)');

                if (validRows.length > 1) {
                    tr.remove();
                    updateProductRowNumbers();
                    updateAddButtonCells('product-tbody', 'add-btn-cell', addProductRowHandler);
                    calculateTotals();
                } else {
                    if (qtyInput) qtyInput.textContent = '1';
                    if (priceInput) priceInput.textContent = '';
                    if (totalCell) totalCell.textContent = '';
                    tr.querySelector('.product-type').textContent = '';
                    tr.querySelector('.jan-cell').textContent = '';
                    tr.querySelector('.barcode-svg').innerHTML = '';
                    tr.querySelector('.warranty-select').value = '';
                    calculateTotals();
                }
            });
        }
    });
    updateProductRowNumbers();
    updateAddButtonCells('product-tbody', 'add-btn-cell', addProductRowHandler);
    generateBarcodesForContainer('#product-tbody');
    calculateTotals();
}

function updateProductRowNumbers() {
    const rows = document.querySelectorAll('#product-tbody tr.product-row:not(#product-row-template)');
    rows.forEach((tr, index) => {
        const noCell = tr.querySelector('.row-no');
        if (noCell) noCell.textContent = index + 1;
    });
}

function addProductRowHandler() {
    const template = document.getElementById('product-row-template');
    if (!template) return;
    const clone = template.cloneNode(true);
    clone.removeAttribute('id');
    clone.className = 'product-row';
    clone.style.display = '';
    document.getElementById('product-tbody').appendChild(clone);
    attachTableEvents();
}

// モーダル等から商品を追加する際の中継関数（1行目が空ならそこに挿入、それ以外なら追加）
function addProductToTable(item) {
    const tbody = document.getElementById('product-tbody');
    const template = document.getElementById('product-row-template');
    if (!tbody || !template) return;

    const displayModel = item.storeCode ? `${item.storeCode}\n${item.model}` : item.model;
    let formattedPrice = '';
    let calculatedTotal = '';
    if (item.price !== undefined && item.price !== '' && !isNaN(item.price)) {
        const numericPrice = parseInt(item.price, 10);
        formattedPrice = numericPrice.toLocaleString();
        calculatedTotal = numericPrice.toLocaleString();
    }

    const validRows = tbody.querySelectorAll('tr.product-row:not(#product-row-template)');
    let targetRow = null;

    if (validRows.length === 1) {
        const firstType = validRows[0].querySelector('.product-type').textContent.trim();
        const firstPrice = validRows[0].querySelector('.price').textContent.trim();
        if (!firstType && !firstPrice) {
            targetRow = validRows[0];
        }
    }

    if (targetRow) {
        targetRow.querySelector('.product-type').textContent = displayModel;
        targetRow.querySelector('.jan-cell').textContent = item.jan;
        targetRow.querySelector('.price').textContent = formattedPrice;
        targetRow.querySelector('.total').textContent = calculatedTotal;
        targetRow.dataset.originalPrice = item.price || '0';
        targetRow.dataset.baseModelText = displayModel;
    } else {
        const clone = template.cloneNode(true);
        clone.removeAttribute('id');
        clone.className = 'product-row';
        clone.style.display = '';
        
        clone.querySelector('.product-type').textContent = displayModel;
        clone.querySelector('.jan-cell').textContent = item.jan;
        clone.querySelector('.price').textContent = formattedPrice;
        clone.querySelector('.total').textContent = calculatedTotal;

        clone.dataset.originalPrice = item.price || '0';
        clone.dataset.baseModelText = displayModel;

        tbody.appendChild(clone);
    }

    generateBarcodesForContainer('#product-tbody');
    attachTableEvents();
}

function updateMainTable() {
    // 初期化用：行が全くない場合に空行を1つ作る
    const tbody = document.getElementById('product-tbody');
    const template = document.getElementById('product-row-template');
    if (!tbody || !template) return;
    const validRows = tbody.querySelectorAll('tr.product-row:not(#product-row-template)');
    if (validRows.length === 0) {
        addProductRowHandler();
    }
}

// 2. 作業テーブル関連
function initWorkTable() {
    const tbody = document.getElementById('work-rows');
    const template = document.getElementById('work-row-template');
    if (!tbody || !template) return;
    tbody.innerHTML = '';
    tbody.appendChild(template);
    const clone = template.cloneNode(true);
    clone.removeAttribute('id');
    clone.className = 'work-row';
    clone.style.display = '';
    tbody.appendChild(clone);
    attachWorkTableEvents();
}

function addWorkToTable(item) {
    const tbody = document.getElementById('work-rows');
    const template = document.getElementById('work-row-template');
    if (!tbody || !template) return;

    let formattedPrice = '';
    let calculatedTotal = '';
    if (item.price && !isNaN(item.price)) {
        const numPrice = parseInt(item.price, 10);
        formattedPrice = numPrice.toLocaleString();
        calculatedTotal = numPrice.toLocaleString();
    }

    const validRows = tbody.querySelectorAll('tr.work-row:not(#work-row-template)');
    let targetRow = null;

    if (validRows.length === 1) {
        const firstItem = validRows[0].querySelector('.work-item').textContent.trim();
        const firstPrice = validRows[0].querySelector('.work-price').textContent.trim();
        if (!firstItem && !firstPrice) {
            targetRow = validRows[0];
        }
    }

    if (targetRow) {
        targetRow.querySelector('.work-code').textContent = item.code;
        targetRow.querySelector('.work-item').textContent = item.item;
        targetRow.querySelector('.work-janCode').textContent = item.jan;
        targetRow.querySelector('.work-price').textContent = formattedPrice;
        targetRow.querySelector('.work-lineTotal').textContent = calculatedTotal;
    } else {
        const clone = template.cloneNode(true);
        clone.removeAttribute('id');
        clone.className = 'work-row';
        clone.style.display = '';

        clone.querySelector('.work-code').textContent = item.code;
        clone.querySelector('.work-item').textContent = item.item;
        clone.querySelector('.work-janCode').textContent = item.jan;
        clone.querySelector('.work-price').textContent = formattedPrice;
        clone.querySelector('.work-lineTotal').textContent = calculatedTotal;

        tbody.appendChild(clone);
    }

    generateBarcodesForContainer('#work-rows');
    attachWorkTableEvents();
}

function updateWorkTable() {
    const tbody = document.getElementById('work-rows');
    const template = document.getElementById('work-row-template');
    if (!tbody || !template) return;
    const validRows = tbody.querySelectorAll('tr.work-row:not(#work-row-template)');
    if (validRows.length === 0) {
        addWorkRowHandler();
    }
}

function attachWorkTableEvents() {
    const tbody = document.getElementById('work-rows');
    if (!tbody) return;
    tbody.querySelectorAll('tr.work-row:not(#work-row-template)').forEach(tr => {
        const qtyInput = tr.querySelector('.work-quantity');
        const priceInput = tr.querySelector('.work-price');
        const totalCell = tr.querySelector('.work-lineTotal');
        const deleteBtn = tr.querySelector('.delete-work-btn');

        function recalcWork() {
            const qty = parseInt(qtyInput.textContent.replace(/,/g, ''), 10) || 0;
            const price = parseInt(priceInput.textContent.replace(/,/g, ''), 10) || 0;
            const total = qty * price;
            totalCell.textContent = total !== 0 ? total.toLocaleString() : '';
            calculateTotals();
        }

        if (qtyInput && !qtyInput.dataset.listenerAttached) {
            qtyInput.dataset.listenerAttached = 'true';
            qtyInput.addEventListener('input', recalcWork);
        }
        if (priceInput && !priceInput.dataset.listenerAttached) {
            priceInput.dataset.listenerAttached = 'true';
            priceInput.addEventListener('input', recalcWork);
        }

        if (deleteBtn && !deleteBtn.dataset.listenerAttached) {
            deleteBtn.dataset.listenerAttached = 'true';
            deleteBtn.addEventListener('click', () => {
                const validRows = tbody.querySelectorAll('tr.work-row:not(#work-row-template)');

                if (validRows.length > 1) {
                    tr.remove();
                    updateWorkRowNumbers();
                    updateAddButtonCells('work-rows', 'work-add-btn-cell', addWorkRowHandler);
                    calculateTotals();
                } else {
                    if (qtyInput) qtyInput.textContent = '1';
                    if (priceInput) priceInput.textContent = '';
                    if (totalCell) totalCell.textContent = '';
                    tr.querySelector('.work-code').textContent = '';
                    tr.querySelector('.work-item').textContent = '';
                    tr.querySelector('.work-janCode').textContent = '';
                    tr.querySelector('.work-barCode svg').innerHTML = '';
                    calculateTotals();
                }
            });
        }
    });
    updateWorkRowNumbers();
    updateAddButtonCells('work-rows', 'work-add-btn-cell', addWorkRowHandler);
    generateBarcodesForContainer('#work-rows');
    calculateTotals();
}

function updateWorkRowNumbers() {
    const rows = document.querySelectorAll('#work-rows tr.work-row:not(#work-row-template)');
    rows.forEach((tr, index) => {
        const noCell = tr.querySelector('.work-no');
        if (noCell) noCell.textContent = index + 1;
    });
}

function addWorkRowHandler() {
    const template = document.getElementById('work-row-template');
    if (!template) return;
    const clone = template.cloneNode(true);
    clone.removeAttribute('id');
    clone.className = 'work-row';
    clone.style.display = '';
    document.getElementById('work-rows').appendChild(clone);
    attachWorkTableEvents();
}

// 3. POSAテーブル関連
function attachPosaTableEvents() {
    const tbody = document.getElementById('posa-rows');
    if (!tbody) return;
    tbody.querySelectorAll('tr.posa-row:not(#posa-row-template)').forEach(tr => {
        const qtyInput = tr.querySelector('.posa-quantity');
        const priceInput = tr.querySelector('.posa-price');
        const totalCell = tr.querySelector('.posa-lineTotal');
        const deleteBtn = tr.querySelector('.delete-posa-btn');

        bindEventDiscountMenu(priceInput);

        function recalcPosa() {
            const qty = parseInt(qtyInput.textContent.replace(/,/g, ''), 10) || 0;
            const price = parseInt(priceInput.textContent.replace(/,/g, ''), 10) || 0;
            const total = qty * price;
            totalCell.textContent = total !== 0 ? total.toLocaleString() : '';
            calculateTotals();
        }

        if (qtyInput) qtyInput.addEventListener('input', recalcPosa);
        if (priceInput) priceInput.addEventListener('input', recalcPosa);

        if (deleteBtn && !deleteBtn.dataset.listenerAttached) {
            deleteBtn.dataset.listenerAttached = 'true';
            deleteBtn.addEventListener('click', () => {
                const validRows = tbody.querySelectorAll('tr.posa-row:not(#posa-row-template)');

                if (validRows.length > 1) {
                    tr.remove();
                    updatePosaRowNumbers();
                    updateAddButtonCells('posa-rows', 'posa-add-btn-cell', addPosaRowHandler);
                    calculateTotals();
                } else {
                    if (qtyInput) qtyInput.textContent = '1';
                    if (priceInput) priceInput.textContent = '';
                    if (totalCell) totalCell.textContent = '';
                    tr.querySelector('.posa-type').textContent = '';
                    calculateTotals();
                }

                if (tbody.querySelectorAll('tr.posa-row:not(#posa-row-template)').length === 0) {
                    const posaSec = document.getElementById('posa-section');
                    if (posaSec) posaSec.style.display = 'none';
                }
            });
        }
    });
    updatePosaRowNumbers();
    updateAddButtonCells('posa-rows', 'posa-add-btn-cell', addPosaRowHandler);
    calculateTotals();
}

function updatePosaRowNumbers() {
    const rows = document.querySelectorAll('#posa-rows tr.posa-row:not(#posa-row-template)');
    rows.forEach((tr, index) => {
        const noCell = tr.querySelector('.posa-no');
        if (noCell) noCell.textContent = index + 1;
    });
}

function addPosaRowHandler() {
    const template = document.getElementById('posa-row-template');
    if (!template) return;
    const clone = template.cloneNode(true);
    clone.removeAttribute('id');
    clone.className = 'posa-row';
    clone.style.display = '';
    
    clone.querySelector('.posa-type').textContent = '';
    clone.querySelector('.posa-price').textContent = '';
    clone.querySelector('.posa-lineTotal').textContent = '';

    document.getElementById('posa-rows').appendChild(clone);
    attachPosaTableEvents();
}

function addPosaToTable(item) {
    const posaSection = document.getElementById('posa-section');
    const tbody = document.getElementById('posa-rows');
    const template = document.getElementById('posa-row-template');
    if (!posaSection || !tbody || !template) return;

    posaSection.style.display = 'block';

    const displayModel = item.storeCode ? `${item.storeCode}\n${item.model}` : item.model;
    let formattedPrice = '';
    let calculatedTotal = '';
    if (item.price && !isNaN(item.price)) {
        const numericPrice = parseInt(item.price, 10);
        formattedPrice = numericPrice.toLocaleString();
        calculatedTotal = numericPrice.toLocaleString();
    }

    const validRows = tbody.querySelectorAll('tr.posa-row:not(#posa-row-template)');
    let targetRow = null;

    if (validRows.length === 1) {
        const firstType = validRows[0].querySelector('.posa-type').textContent.trim();
        const firstPrice = validRows[0].querySelector('.posa-price').textContent.trim();
        if (!firstType && !firstPrice) {
            targetRow = validRows[0];
        }
    }

    if (targetRow) {
        targetRow.querySelector('.posa-type').textContent = displayModel;
        targetRow.querySelector('.posa-price').textContent = formattedPrice;
        targetRow.querySelector('.posa-lineTotal').textContent = calculatedTotal;
        targetRow.dataset.originalPrice = item.price || '0';
        targetRow.dataset.baseModelText = displayModel;
    } else {
        const clone = template.cloneNode(true);
        clone.removeAttribute('id');
        clone.className = 'posa-row';
        clone.style.display = '';
        
        clone.querySelector('.posa-type').textContent = displayModel;
        clone.querySelector('.posa-price').textContent = formattedPrice;
        clone.querySelector('.posa-lineTotal').textContent = calculatedTotal;

        clone.dataset.originalPrice = item.price || '0';
        clone.dataset.baseModelText = displayModel;

        tbody.appendChild(clone);
    }

    attachPosaTableEvents();
}

function updatePosaTable() {
    const posaSection = document.getElementById('posa-section');
    const tbody = document.getElementById('posa-rows');
    const template = document.getElementById('posa-row-template');
    if (!posaSection || !tbody || !template) return;
    const validRows = tbody.querySelectorAll('tr.posa-row:not(#posa-row-template)');
    if (validRows.length === 0) {
        const clone = template.cloneNode(true);
        clone.removeAttribute('id');
        clone.className = 'posa-row';
        clone.style.display = '';
        tbody.appendChild(clone);
        attachPosaTableEvents();
    }
}

// 4. お客様所有機器テーブル関連
function initOwnedTable() {
    const tbody = document.getElementById('owned-equipment-tbody');
    const template = document.getElementById('owned-equipment-row-template');
    if (!tbody || !template) return;
    tbody.innerHTML = '';
    tbody.appendChild(template);
    const clone = template.cloneNode(true);
    clone.removeAttribute('id');
    clone.className = 'owned-equipment-row';
    clone.style.display = '';
    tbody.appendChild(clone);
    attachOwnedTableEvents();
}

function addOwnedToTable(item) {
    const tbody = document.getElementById('owned-equipment-tbody');
    const template = document.getElementById('owned-equipment-row-template');
    if (!tbody || !template) return;

    const validRows = tbody.querySelectorAll('tr.owned-equipment-row:not(#owned-equipment-row-template)');
    let targetRow = null;

    if (validRows.length === 1) {
        const firstType = validRows[0].querySelector('.owned-equipment-type').textContent.trim();
        const firstModel = validRows[0].querySelector('.product-model-cell').textContent.trim();
        if (!firstType && !firstModel) {
            targetRow = validRows[0];
        }
    }

    if (targetRow) {
        targetRow.querySelector('.owned-equipment-type').textContent = item.name;
        targetRow.querySelector('.product-model-cell').textContent = item.model;
    } else {
        const clone = template.cloneNode(true);
        clone.removeAttribute('id');
        clone.className = 'owned-equipment-row';
        clone.style.display = '';
        
        clone.querySelector('.owned-equipment-type').textContent = item.name;
        clone.querySelector('.product-model-cell').textContent = item.model;

        tbody.appendChild(clone);
    }

    attachOwnedTableEvents();
}

function updateOwnedTable() {
    const tbody = document.getElementById('owned-equipment-tbody');
    const template = document.getElementById('owned-equipment-row-template');
    if (!tbody || !template) return;
    const validRows = tbody.querySelectorAll('tr.owned-equipment-row:not(#owned-equipment-row-template)');
    if (validRows.length === 0) {
        const clone = template.cloneNode(true);
        clone.removeAttribute('id');
        clone.className = 'owned-equipment-row';
        clone.style.display = '';
        tbody.appendChild(clone);
        attachOwnedTableEvents();
    }
}

function attachOwnedTableEvents() {
    const tbody = document.getElementById('owned-equipment-tbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr.owned-equipment-row:not(#owned-equipment-row-template)').forEach(tr => {
        const deleteBtn = tr.querySelector('.delete-owned-btn');

        if (deleteBtn && !deleteBtn.dataset.listenerAttached) {
            deleteBtn.dataset.listenerAttached = 'true';
            deleteBtn.addEventListener('click', () => {
                const validRows = tbody.querySelectorAll('tr.owned-equipment-row:not(#owned-equipment-row-template)');

                if (validRows.length > 1) {
                    tr.remove();
                    updateOwnedRowNumbers();
                    updateAddButtonCells('owned-equipment-tbody', 'owned-add-btn-cell', addOwnedRowHandler);
                } else {
                    tr.querySelector('.owned-equipment-type').textContent = '';
                    tr.querySelector('.product-model-cell').textContent = '';
                    tr.querySelector('.owned-serial-cell').textContent = '';
                    updateOwnedRowNumbers();
                    updateAddButtonCells('owned-equipment-tbody', 'owned-add-btn-cell', addOwnedRowHandler);
                }
            });
        }
    });
    updateOwnedRowNumbers();
    updateAddButtonCells('owned-equipment-tbody', 'owned-add-btn-cell', addOwnedRowHandler);
}

function updateOwnedRowNumbers() {
    const rows = document.getElementById('owned-equipment-tbody').querySelectorAll('tr.owned-equipment-row:not(#owned-equipment-row-template)');
    rows.forEach((tr, index) => {
        const noCell = tr.querySelector('.owned-no');
        if (noCell) noCell.textContent = index + 1;
    });
}

function addOwnedRowHandler() {
    const template = document.getElementById('owned-equipment-row-template');
    if (!template) return;
    const clone = template.cloneNode(true);
    clone.removeAttribute('id');
    clone.className = 'owned-equipment-row';
    clone.style.display = '';
    
    clone.querySelector('.owned-equipment-type').textContent = '';
    clone.querySelector('.product-model-cell').textContent = '';
    clone.querySelector('.owned-serial-cell').textContent = '';

    document.getElementById('owned-equipment-tbody').appendChild(clone);
    attachOwnedTableEvents();
}

// 5. ドラッグ＆ドロップ並び替え (SortableJS)
function initSortableTables() {
    const pTbody = document.getElementById('product-tbody');
    if (pTbody) {
        Sortable.create(pTbody, {
            handle: '.row-no',
            animation: 150,
            filter: '#product-row-template',
            onEnd: function () {
                updateProductRowNumbers();
                updateAddButtonCells('product-tbody', 'add-btn-cell', addProductRowHandler);
                calculateTotals();
            }
        });
    }

    const wTbody = document.getElementById('work-rows');
    if (wTbody) {
        Sortable.create(wTbody, {
            handle: '.work-no',
            animation: 150,
            filter: '#work-row-template',
            onEnd: function () {
                updateWorkRowNumbers();
                updateAddButtonCells('work-rows', 'work-add-btn-cell', addWorkRowHandler);
                calculateTotals();
            }
        });
    }

    const oTbody = document.getElementById('owned-equipment-tbody');
    if (oTbody) {
        Sortable.create(oTbody, {
            handle: '.owned-no',
            animation: 150,
            filter: '#owned-equipment-row-template',
            onEnd: function () {
                updateOwnedRowNumbers();
                updateAddButtonCells('owned-equipment-tbody', 'owned-add-btn-cell', addOwnedRowHandler);
            }
        });
    }

    const posaTbody = document.getElementById('posa-rows');
    if (posaTbody) {
        Sortable.create(posaTbody, {
            handle: '.posa-no',
            animation: 150,
            filter: '#posa-row-template',
            onEnd: function () {
                updatePosaRowNumbers();
                updateAddButtonCells('posa-rows', 'posa-add-btn-cell', addPosaRowHandler);
                calculateTotals();
            }
        });
    }
}