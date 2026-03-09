//**********************************
//* ページロード時の処理           *
//**********************************
document.addEventListener('DOMContentLoaded', () => {
    // グローバル変数を定義
    let activeProductModelCell = null;

    // サポートメニュー関連の処理
    const listContainer = document.getElementById('service-list-body');
    const filterInput = document.getElementById('filter-input');
    
    const renderServices = (data) => {
        listContainer.innerHTML = '';
        
        data.forEach(service => {
            const [code, item, price, jancode] = service;
            const row = document.createElement('tr');
            
            const formattedPrice = Number(price).toLocaleString();

            const codeCell = document.createElement('td');
            codeCell.textContent = code;
            row.appendChild(codeCell);

            const itemCell = document.createElement('td');
            itemCell.textContent = item;
            row.appendChild(itemCell);

            const priceCell = document.createElement('td');
            priceCell.textContent = formattedPrice;
            priceCell.style.textAlign = 'right';
            row.appendChild(priceCell);
            
            const jancodeCell = document.createElement('td');
            jancodeCell.textContent = jancode;
            row.appendChild(jancodeCell);

            row.addEventListener('click', () => {
                addWorkItemToTable(service);
            });
            
            listContainer.appendChild(row);
        });
    };

    renderServices(services);
    
    // サポートメニューのフィルター処理
    filterInput.addEventListener('input', (event) => {
        const filterValues = event.target.value.toLowerCase().split(' ').filter(val => val !== '');
        
        const filteredServices = services.filter(service => {
            const [code, item] = service;
            
            if (filterValues.length === 0) {
                return true;
            }
            
            return filterValues.some(filterValue => {
                return code.toLowerCase().includes(filterValue) || item.toLowerCase().includes(filterValue);
            });
        });
        
        renderServices(filteredServices);
    });
    
　　// サポートメニュー処理-END　

    // 初期表示時に商品テーブルに空の行を追加
    if (document.getElementById('product-tbody').children.length <= 1) {
        addRow();
    }
    
    // 初期表示時に作業テーブルに空の行を追加
    if (document.getElementById('work-rows').children.length <= 1) {
        addEmptyWorkRow();
    }

    initializeWorkTable();
    updateAllTotals();

    // ★★★ 延保ボタンのクリック処理（イベント委任）★★★
    const productTbody = document.getElementById('product-tbody');

    // 初期表示されているボタンのスタイルを適用
    productTbody.querySelectorAll('.toggle-warranty-btn').forEach(button => {
        applyButtonStyle(button);
    });

    // テーブルのtbody要素でクリックを監視
    productTbody.addEventListener('click', (event) => {
        // クリックされた要素が .toggle-warranty-btn かどうかを判定
        const button = event.target.closest('.toggle-warranty-btn');
        if (button) {
            // .toggle-warranty-btn だった場合の処理
            button.classList.toggle('active');
            applyButtonStyle(button);
            if (button.classList.contains('active')) {
                addWarrantyRow(button);
            } else {
                removeWarrantyRow(button);
            }
            updateAllTotals();
        }
    });
    // ★★★ 延保ボタンの処理ここまで ★★★

    // ページ全体のクリックイベントリスナーを一つにまとめる
    document.addEventListener('click', (event) => {
        const target = event.target;

        // モーダルの背景（枠外）をクリックしたら閉じる
        if (target.classList.contains('modal')) {
            target.style.display = 'none';
        }
        // モーダルを開くボタン
        if (target.classList.contains('open-modal-btn')) {
            const modalId = target.dataset.modalId;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'block';
            }
        }
        
        // モーダルを閉じるボタン
        if (target.classList.contains('close-btn')) {
            target.closest('.modal').style.display = 'none';
        }

        // 商品選択モーダルリスト
        if (target.closest('.modal ul[data-modal-list-id]')) {
            const selectedItem = target.closest('li');
            if (selectedItem) {
                const list = target.closest('ul');
                const modalId = list.dataset.modalListId;
                const productName = selectedItem.dataset.name;
                const productPrice = selectedItem.dataset.price;
                const posaFlag = selectedItem.dataset.posaFlag || 0;
                addProductItemToTable(productName, productPrice, posaFlag, modalId);
                const modal = list.closest('.modal');
            
            }
        }

        // お客様所有製品モーダルリスト
        if (target.closest('#owned-product-list')) {
            const selectedItem = target.closest('li');
            if (selectedItem && selectedItem.dataset.modelName && activeProductModelCell) {
                activeProductModelCell.textContent = selectedItem.dataset.modelName;
                const modal = selectedItem.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        }

        // テーブル行の追加・削除
        if (target.id === 'add-product-btn') {
            addRow();
        }
        if (target.classList.contains('delete-product-btn') || target.classList.contains('delete-work-btn')) {
            removeTableRow(target);
        }
        
        // 割引メニューを閉じる
        if (!target.closest('#discount-menu')) {
            document.getElementById('discount-menu').style.display = 'none';
        }
    });

    

    // 右クリック・長押しメニューの処理
    document.addEventListener('contextmenu', function(event) {
        const targetElement = event.target;
        if (targetElement.classList.contains('price')) {
            event.preventDefault();
            const menu = document.getElementById('discount-menu');
            menu.style.display = 'block';
            menu.style.left = event.pageX + 'px';
            menu.style.top = event.pageY + 'px';
            const row = targetElement.closest('tr');
            if(row) {
                menu.dataset.targetRowId = row.dataset.rowId;
            }
        }
    });

    let touchTimer;
    document.addEventListener('touchstart', function(event) {
        const targetElement = event.target;
        if (targetElement.classList.contains('price')) {
            touchTimer = setTimeout(() => {
                event.preventDefault();
                const menu = document.getElementById('discount-menu');
                menu.style.display = 'block';
                menu.style.left = event.touches[0].pageX + 'px';
                menu.style.top = event.touches[0].pageY + 'px';
                const row = targetElement.closest('tr');
                if(row) {
                    menu.dataset.targetRowId = row.dataset.rowId;
                }
            }, 500);
        }
    });

    document.addEventListener('touchend', function(event) {
        clearTimeout(touchTimer);
    });

    document.getElementById('discount-menu').addEventListener('click', function(event) {
        const selectedItem = event.target;
        if (selectedItem.tagName !== 'LI') return;
        const discountValue = selectedItem.dataset.discount;
        const targetRowId = this.dataset.targetRowId;
        if (!targetRowId || !discountValue) {
            this.style.display = 'none';
            return;
        }
        const table = document.getElementById('product-tbl');
        const targetRow = table.querySelector(`tr[data-row-id="${targetRowId}"]`);
        if(!targetRow) {
            this.style.display = 'none';
            return;
        }
        const priceCell = targetRow.querySelector('.price');
        const typeCell = targetRow.querySelector('.product-type');
        if (!priceCell.dataset.originalPrice) {
            priceCell.dataset.originalPrice = priceCell.textContent.trim() || '0';
        }
        if (!typeCell.dataset.originalText) {
            let originalText = '';
            typeCell.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    originalText += node.textContent;
                }
            });
            typeCell.dataset.originalText = originalText.trim();
        }
        let appliedDiscounts = typeCell.dataset.appliedDiscounts ? JSON.parse(typeCell.dataset.appliedDiscounts) : [];
        let newPrice;
        if (discountValue === 'clear') {
            newPrice = parseFloat(priceCell.dataset.originalPrice.replace(/,/g, ''));
            appliedDiscounts = [];
            typeCell.innerHTML = typeCell.dataset.originalText;
            delete priceCell.dataset.originalPrice;
            delete typeCell.dataset.originalText;
            delete typeCell.dataset.appliedDiscounts;
        } else {
            let currentPrice = parseFloat(priceCell.textContent.replace(/,/g, '')) || 0;
            if (discountValue.includes('%')) {
                const discountPercentage = parseFloat(discountValue) / 100;
                newPrice = Math.floor(currentPrice * (1 - discountPercentage));
            } else  {
                const discountAmount = parseFloat(discountValue.replace(/[^0-9.-]/g, ''));
                newPrice = currentPrice - discountAmount;
            }
            const newDiscountLabel = selectedItem.dataset.label;
            if (newDiscountLabel && !appliedDiscounts.includes(newDiscountLabel)) {
                appliedDiscounts.push(newDiscountLabel);
            }
            let discountHtml = '';
            appliedDiscounts.forEach(label => {
                discountHtml += `<span style="color: red;">${label}</span>`;
            });
            typeCell.innerHTML = typeCell.dataset.originalText + discountHtml;
        }
        if(appliedDiscounts.length > 0) {
            typeCell.dataset.appliedDiscounts = JSON.stringify(appliedDiscounts);
        }
        priceCell.textContent = isNaN(newPrice) ? '' : newPrice.toLocaleString();
        calculateTotal(targetRow);
    });

    initializeProductTableListeners();

    // Dblclick for product model cell
    const ownedEquipmentTbl = document.getElementById('owned-equipment-tbl');
    if (ownedEquipmentTbl) {
        ownedEquipmentTbl.addEventListener('dblclick', function(event) {
        // 「種類」のセルがダブルクリックされた場合
        if (event.target.classList.contains('owned-equipment-type')) {
            activeProductModelCell = event.target;
            openOwnedEquipmentTypeModal(event.target); // ★新しい関数を呼び出し★
        // 既存の「製品型番」のセルがダブルクリックされた場合（変更なし）
        } else if (event.target.classList.contains('product-model-cell')) {
            activeProductModelCell = event.target;
            openProductModelModal(event.target);
        }
    });
    }

    // データの保存・読み込みボタンにイベントリスナーを追加
    const saveDataBtn = document.getElementById('save-data-btn');
    if (saveDataBtn) {
        saveDataBtn.addEventListener('click', saveData);
    }
    const loadFileBtn = document.getElementById('load-file-btn');
    const loadFileInput = document.getElementById('load-file-input');

    if (loadFileBtn && loadFileInput) {
        loadFileBtn.addEventListener('click', () => {
            loadFileInput.click();
        });
        
        // 【修正点】ファイルが選択されたら、読み込みと解析処理を行う
        loadFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        loadTables(data); // 新しい統合関数を呼び出す
                    } catch (error) {
                        console.error('JSONファイルの解析に失敗しました:', error);
                        alert('無効なJSONファイルです。');
                    }
                };
                reader.onerror = function() {
                    console.error('ファイルの読み込みに失敗しました。');
                    alert('ファイルの読み込みに失敗しました。');
                };
                reader.readAsText(file);
            }
        });
    }
});
//**********************************
//* ページロード時の処理-END
//**********************************


// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★ 以下はDOMContentLoadedの外に配置するべき関数やグローバル変数 ★
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
let activeProductModelCell = null;

function openProductModelModal(cell) {
    activeProductModelCell = cell; 
    const modal = document.getElementById('owned-product-modal');
    const list = document.getElementById('owned-product-list');
    list.innerHTML = '';
    const productModels = new Set();
    const productRows = document.querySelectorAll('#product-tbl .product-type');
    
    productRows.forEach(row => {
        let model = '';
        if (row.dataset.originalText) {
            model = row.dataset.originalText.trim();
        } else {
            row.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    model += node.textContent;
                }
            });
            model = model.trim();
        }
        if (model) {
            productModels.add(model);
        }
    });

    if (productModels.size === 0) {
        const li = document.createElement('li');
        li.textContent = '商品テーブルに型番が入力されていません。';
        li.style.cursor = 'default';
        list.appendChild(li);
    } else {
        productModels.forEach(model => {
            const li = document.createElement('li');
            li.textContent = model;
            li.dataset.modelName = model;
            list.appendChild(li);
        });
    }

    modal.style.display = 'block';
}

function updateRowNumbers(tableId) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    const rows = tableBody.querySelectorAll('tr:not([id*="-template"])');
    rows.forEach((row, index) => {
        const numberCell = row.querySelector('.row-no');
        if (numberCell) {
            numberCell.textContent = index + 1;
        }
    });
}

function calculateTotal(row) {
    const quantityElement = row.querySelector('.quantity');
    const priceElement = row.querySelector('.price');
    const totalElement = row.querySelector('.total');
    const quantityText = quantityElement.textContent.trim();
    const priceText = priceElement.textContent.trim();
    const quantity = parseFloat(quantityText.replace(/,/g, '')) || 0;
    const price = parseFloat(priceText.replace(/,/g, '')) || 0;
    const total = quantity * price;
    if (quantityText !== '' || priceText !== '') {
        totalElement.textContent = total.toLocaleString();
    } else {
        totalElement.textContent = '';
    }
    updateAllTotals();
}

function formatPriceOnBlur(event) {
    const priceElement = event.target;
    const priceText = priceElement.textContent.trim();
    if (priceText !== '') {
        const priceValue = parseFloat(priceText.replace(/,/g, ''));
        if (!isNaN(priceValue)) {
            priceElement.textContent = priceValue.toLocaleString();
        } else {
            priceElement.textContent = priceText;
        }
    }
}

function initializeProductTableListeners() {
    const tableBody = document.querySelector('#product-tbl tbody');
    tableBody.querySelectorAll('tr').forEach(row => {
        const quantityCell = row.querySelector('.quantity');
        const priceCell = row.querySelector('.price');
        const typeCell = row.querySelector('.product-type');
        const inputListener = () => {
            calculateTotal(row);
        };
        const blurListener = (event) => {
            formatPriceOnBlur(event);
        };
        const typeCellUpdatedListener = () => {
            if (typeCell.dataset.appliedDiscounts) {
                let newOriginalText = '';
                typeCell.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        newOriginalText += node.textContent;
                    }
                });
                typeCell.dataset.originalText = newOriginalText.trim();
            }
        };
        quantityCell.removeEventListener('input', inputListener);
        priceCell.removeEventListener('input', inputListener);
        priceCell.removeEventListener('blur', blurListener);
        typeCell.removeEventListener('input', typeCellUpdatedListener);
        typeCell.removeEventListener('keyup', typeCellUpdatedListener);
        
        quantityCell.addEventListener('input', inputListener);
        priceCell.addEventListener('input', inputListener);
        priceCell.addEventListener('blur', blurListener);
        typeCell.addEventListener('input', typeCellUpdatedListener);
        typeCell.addEventListener('keyup', typeCellUpdatedListener);
    });
}

function initializeWorkTable() {
    const workTableBody = document.getElementById('work-rows');
    workTableBody.querySelectorAll('tr.work-row').forEach(row => {
        const quantityCell = row.querySelector('.work-quantity');
        const priceCell = row.querySelector('.work-price');
        const inputListener = () => calculateWorkTotal(row);
        const blurListener = (event) => {
            const priceElement = event.target;
            const priceText = priceElement.textContent.trim();
            if (priceText !== '') {
                const priceValue = parseFloat(priceText.replace(/,/g, ''));
                if (!isNaN(priceValue)) {
                    priceElement.textContent = priceValue.toLocaleString();
                } else {
                    priceElement.textContent = priceText;
                }
            }
        };
        quantityCell.removeEventListener('input', inputListener);
        priceCell.removeEventListener('input', inputListener);
        priceCell.removeEventListener('blur', blurListener);
        
        quantityCell.addEventListener('input', inputListener);
        priceCell.addEventListener('input', inputListener);
        priceCell.addEventListener('blur', blurListener);
    });
}

function calculateWorkTotal(row) {
    const quantity = parseFloat(row.querySelector('.work-quantity').textContent.replace(/,/g, '')) || 0;
    const price = parseFloat(row.querySelector('.work-price').textContent.replace(/,/g, '')) || 0;
    const total = quantity * price;
    const totalCell = row.querySelector('.work-lineTotal');
    if (quantity !== 0 || price !== 0) {
        totalCell.textContent = total.toLocaleString();
    } else {
        totalCell.textContent = '';
    }
    updateAllTotals();
}

function updateWorkRowNumbers() {
    const tableBody = document.getElementById('work-rows');
    const rows = tableBody.querySelectorAll('tr.work-row:not(#work-row-template)');
    rows.forEach((row, index) => {
        row.querySelector('.work-no').textContent = index + 1;
    });
}

function addEmptyWorkRow() {
    const newRow = cloneAndAppendRow('work-rows', 'work-row-template');
    if(!newRow) return;
    initializeWorkTable();
    updateRowNumbers('work-tbl');
}

function addWorkItemToTable(service) {
    const [code, item, price, jancode] = service;
    const workTableBody = document.getElementById('work-rows');
    let lastRow = workTableBody.querySelector('tr:not(#work-row-template):last-child');
    const isLastRowEmpty = lastRow && lastRow.querySelector('.work-item').textContent.trim() === '';
    let rowToPopulate;
    if (isLastRowEmpty) {
        rowToPopulate = lastRow;
    } else {
        rowToPopulate = cloneAndAppendRow('work-rows', 'work-row-template');
        if (!rowToPopulate) return;
    }
    rowToPopulate.querySelector('.work-code').textContent = code;
    rowToPopulate.querySelector('.work-item').textContent = item;
    rowToPopulate.querySelector('.work-janCode').textContent = jancode;
    const quantityCell = rowToPopulate.querySelector('.work-quantity');
    const priceCell = rowToPopulate.querySelector('.work-price');
    quantityCell.textContent = 1;
    priceCell.textContent = Number(price).toLocaleString();
    initializeWorkTable();
    const barcodeSvg = rowToPopulate.querySelector('.work-barCode svg');
    const newRowIndex = Array.from(workTableBody.querySelectorAll('tr:not(#work-row-template)')).indexOf(rowToPopulate);
    if (barcodeSvg) {
        barcodeSvg.id = `barcode-${newRowIndex}`;
        if (jancode) {
            JsBarcode(`#barcode-${newRowIndex}`, jancode, {
                format: "EAN13",
                displayValue: true,
                width: 0.8,
                height: 15,
                margin: 5,
                fontSize: 10,
                textMargin: 0
            });
        } else {
            barcodeSvg.innerHTML = '';
        }
    }
    updateRowNumbers('work-tbl');
    calculateWorkTotal(rowToPopulate);
}

function updateAllTotals() {
    const productTable = document.getElementById('product-tbl');
    const workTable = document.getElementById('work-tbl');
    let productTotal = 0;
    let workTotal = 0;
    let posaTotal = 0;
    productTable.querySelectorAll('tbody tr:not(#product-row-template)').forEach(row => {
        const totalCell = row.querySelector('.total');
        const posaFlag = row.querySelector('.posa-flag').textContent;
        if (totalCell && totalCell.textContent) {
            const rowTotal = parseFloat(totalCell.textContent.replace(/,/g, '')) || 0;
            if (posaFlag === '1') {
                posaTotal += rowTotal;
            } else {
                productTotal += rowTotal;
            }
        }
    });
    workTable.querySelectorAll('tbody tr:not(#work-row-template)').forEach(row => {
        const totalCell = row.querySelector('.work-lineTotal');
        if (totalCell && totalCell.textContent) {
            workTotal += parseFloat(totalCell.textContent.replace(/,/g, '')) || 0;
        }
    });
    const productWorkSubtotal = productTotal + workTotal;
    document.getElementById('product-total-val').textContent = productTotal.toLocaleString() + '円';
    document.getElementById('work-total-val').textContent = workTotal.toLocaleString() + '円';
    document.getElementById('subtotal-val').textContent = productWorkSubtotal.toLocaleString() + '円';
    document.getElementById('posa-total-val').textContent = posaTotal.toLocaleString() + '円';
    document.getElementById('grand-total-val').textContent = (productWorkSubtotal + posaTotal).toLocaleString() + '円';
}

function addProductItemToTable(item, price, posaFlag, modalId) {
    const tableBody = document.getElementById('product-tbody');
    let lastRow = tableBody.querySelector('tr:not(#product-row-template):last-child');
    const isLastRowEmpty = lastRow && 
                           lastRow.querySelector('.product-type').textContent.trim() === '' &&
                           lastRow.querySelector('.quantity').textContent.trim() === '' &&
                           lastRow.querySelector('.price').textContent.trim() === '';
    let rowToPopulate;
    if (isLastRowEmpty) {
        rowToPopulate = lastRow;
    } else {
        rowToPopulate = cloneAndAppendRow('product-tbody', 'product-row-template');
        if (!rowToPopulate) return;
        rowToPopulate.setAttribute('data-row-id', `row-${Date.now()}`);
    }
    rowToPopulate.querySelector('.product-type').textContent = item;
    rowToPopulate.querySelector('.quantity').textContent = 1;
    rowToPopulate.querySelector('.price').textContent = Number(price).toLocaleString();
    calculateTotal(rowToPopulate);
    const toggleButton = rowToPopulate.querySelector('.toggle-warranty-btn');
    applyButtonStyle(toggleButton); // 新しく追加したボタンのスタイルを適用
    if (modalId && modalId !== 'product-modal-list' && toggleButton) {
        toggleButton.style.display = 'none';
    }
    if (posaFlag === '1') {
        const outboundSelect = rowToPopulate.querySelector('td:nth-child(8) select');
        if (outboundSelect) {
            outboundSelect.value = '持帰';
        }
    }
    rowToPopulate.querySelector('.posa-flag').textContent = posaFlag || 0;
    updateRowNumbers('product-tbl');
    initializeProductTableListeners();
    updateAllTotals();
}

function cloneAndAppendRow(tableBodyId, templateId) {
    const tableBody = document.getElementById(tableBodyId);
    const template = document.getElementById(templateId);
    if (!tableBody || !template) {
        console.error("テーブルのBodyまたはテンプレートが見つかりません。", { tableBodyId, templateId });
        return null;
    }
    const newRow = template.cloneNode(true);
    newRow.removeAttribute('id');
    newRow.style.display = '';
    tableBody.appendChild(newRow);
    return newRow;
}

function addRow() {
    const newRow = cloneAndAppendRow('product-tbody', 'product-row-template');
    if (!newRow) return;
    newRow.setAttribute('data-row-id', `row-${Date.now()}`);
    const toggleButton = newRow.querySelector('.toggle-warranty-btn');
    applyButtonStyle(toggleButton); // 新しく追加したボタンのスタイルを適用
    updateRowNumbers('product-tbl');
    initializeProductTableListeners();
    updateAllTotals();
}

function removeTableRow(button) {
    const row = button.closest('tr');
    if (!row) return;
    const table = row.closest('table');
    if (!table) return;
    const tableId = table.id;
    const tableBody = row.parentNode;
    row.remove();
    const remainingRows = tableBody.querySelectorAll('tr:not([id*="-template"])');
    if (remainingRows.length === 0) {
        if (tableId === 'product-tbl') {
            addRow();
        } else if (tableId === 'work-tbl') {
            addEmptyWorkRow();
        }
    }
    updateRowNumbers(tableId);
    updateAllTotals();
}

const buttonStyles = {
  base: {
    backgroundColor: '#f0f0f0',
    color: '#0e0d0d',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '1px 1px',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease-in-out, border-color 0.1s ease-in-out',
  },
  active: {
    color: '#ffffff',
    backgroundColor: '#0ae65e',
    borderColor: '#0ae65e',
  }
};

function applyButtonStyle(button) {
  if (!button) return;
  const isActive = button.classList.contains('active');
  const styleToApply = isActive ? { ...buttonStyles.base, ...buttonStyles.active } : buttonStyles.base;
  Object.assign(button.style, styleToApply);
}

function addWarrantyRow(button) {
    const originalRow = button.closest('tr');
    if (!originalRow) return;
    const originalTotalElement = originalRow.querySelector('.total');
    const originalTotalPrice = parseFloat(originalTotalElement.textContent.replace(/,/g, '')) || 0;
    if (originalTotalPrice  < 11000) {
        alert("延長保証対象外です。ご購入金額1万円（税別）以上が対象です。");
        button.classList.remove('active');
        applyButtonStyle(button);
        return;
    }
    let warrantyType = '';
    let warrantyPrice = 0;
    if (originalTotalPrice >= 55000) {
        warrantyType = 'Ksあんしん延長保証5年';
        warrantyPrice = Math.floor(originalTotalPrice * 0.05);
    } else {
        warrantyType = 'Ksあんしん延長保証3年';
        warrantyPrice = Math.floor(originalTotalPrice * 0.05);
    }
    if (!warrantyType) return;
    const newRow = cloneAndAppendRow('product-tbody', 'product-row-template');
    if(!newRow) return;
    newRow.classList.add('warranty-row');
    const typeCell = newRow.querySelector('.product-type');
    const quantityCell = newRow.querySelector('.quantity');
    const priceCell = newRow.querySelector('.price');
    const totalCell = newRow.querySelector('.total');
    const toggleButton = newRow.querySelector('.toggle-warranty-btn');
    typeCell.textContent = warrantyType;
    quantityCell.textContent = 1;
    priceCell.textContent = warrantyPrice.toLocaleString();
    totalCell.textContent = warrantyPrice.toLocaleString();
    const originalOutboundValue = originalRow.querySelector('td:nth-child(8) select').value;
    const originalStockCodeValue = originalRow.querySelector('td:nth-child(9)').textContent;
    newRow.querySelector('td:nth-child(8) select').value = originalOutboundValue;
    newRow.querySelector('td:nth-child(9)').textContent = originalStockCodeValue;
    if (toggleButton) {
        toggleButton.style.display = 'none';
    }
    originalRow.after(newRow);
    updateRowNumbers('product-tbl');
    initializeProductTableListeners();
    updateAllTotals();
}

function removeWarrantyRow(button) {
    const originalRow = button.closest('tr');
    if (!originalRow) return;
    const nextRow = originalRow.nextElementSibling;
    if (nextRow && nextRow.classList.contains('warranty-row')) {
        nextRow.remove();
        updateRowNumbers('product-tbl');
    }
    updateAllTotals();
}

// 【追加】種類の選択肢をモーダルで表示する新しい関数
function openOwnedEquipmentTypeModal(cell) {
    activeProductModelCell = cell; 
    const modal = document.getElementById('owned-product-modal'); // 既存のモーダルを使用
    const list = document.getElementById('owned-product-list');
    list.innerHTML = '';

    // 「その他」を除外した固定のリスト項目
    const equipmentTypes = [
        { name: 'パソコン', value: 'パソコン' },
        { name: 'ソフト', value: 'ソフト' },
        { name: 'USBメモリ', value: 'USBメモリ' },
        { name: 'プリンタ', value: 'プリンタ' }
    ];

    equipmentTypes.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.name;
        li.dataset.modelName = item.value; 
        list.appendChild(li);
    });

    modal.style.display = 'block';
}

//**********************************
//* データの保存・読み込み機能
//**********************************

// 全テーブルからデータを取得する関数
function getAllTableData() {
    const data = {};
    const tableIds = ['product-tbl', 'work-tbl'];

    tableIds.forEach(id => {
        const table = document.getElementById(id);
        if (!table) return;

        data[id] = [];
        const rows = table.querySelectorAll('tbody tr:not([id$="-template"])');

        rows.forEach(row => {
            const rowData = [];
            const cells = row.querySelectorAll('th, td');

            cells.forEach((cell, index) => {
                let value;
                // work-tblのバーコードセルは空で保存
                if (id === 'work-tbl' && index === 4) {
                    value = "";
                } else if (cell.querySelector('.toggle-warranty-btn, .delete-product-btn, .delete-work-btn')) {
                    value = '';
                } else {
                    const input = cell.querySelector('input, select');
                    if (input) {
                        value = input.value;
                    } else {
                        value = cell.textContent.trim();
                    }
                }
                rowData.push(value);
            });
            data[id].push(rowData);
        });
    });
    return data;
}

// データをJSONファイルとして保存
function saveData() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 月は0から始まるので+1し、2桁に整形
    const day = String(today.getDate()).padStart(2, '0');      // 日を2桁に整形
    const defaultFilename = `お見積り_${year}${month}${day}`;
    const filename = prompt('保存するファイル名を入力してください:', defaultFilename);
    if (!filename) {
        alert('保存がキャンセルされました。');
        return;
    }

    const data = getAllTableData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`「${filename}.json」としてデータをダウンロードフォルダに保存しました。`);
}

// セルの値を設定する補助関数
function setCellContent(cell, value) {
    if (!cell) return;
    if (cell.querySelector('.toggle-warranty-btn, .delete-product-btn, .delete-work-btn')) {
        return;
    }
    const input = cell.querySelector('input, select');
    if (input) {
        input.value = value;
    } else {
        cell.textContent = value;
    }
}

/**
 * 【修正版】
 * JSONデータからすべてのテーブルを復元する
 * @param {object} data - 読み込んだJSONデータ
 */
function loadTables(data) {
    if (!data) {
        console.error('読み込むデータがありません。');
        return;
    }

    // 商品テーブルの読み込み
    if (data['product-tbl'] && Array.isArray(data['product-tbl'])) {
        const productTbody = document.getElementById('product-tbody');
        const productTemplate = document.getElementById('product-row-template');
        productTbody.querySelectorAll('tr:not([id$="-template"])').forEach(row => row.remove());

        data['product-tbl'].forEach(rowDataArray => {
            const newRow = productTemplate.cloneNode(true);
            newRow.removeAttribute('id');
            newRow.style.display = '';
            newRow.setAttribute('data-row-id', `row-loaded-${Date.now()}`);
            const cells = newRow.querySelectorAll('th, td');
            
            setCellContent(cells[0], rowDataArray[0]); // No
            setCellContent(cells[1], rowDataArray[1]); // 型番
            setCellContent(cells[2], rowDataArray[2]); // 数量
            setCellContent(cells[3], rowDataArray[3]); // 単価
            setCellContent(cells[4], rowDataArray[4]); // 金額
            setCellContent(cells[6], rowDataArray[6]); // 商品状態 (select)
            setCellContent(cells[7], rowDataArray[7]); // 出庫 (select)
            setCellContent(cells[8], rowDataArray[8]); // 在庫店コード
            setCellContent(cells[9], rowDataArray[9]); // 在庫情報 (select)
            setCellContent(cells[10], rowDataArray[10]); // 発注 (select)
            setCellContent(cells[11], rowDataArray[11]); // posa-flag

            productTbody.appendChild(newRow);
        });
        
        if (data['product-tbl'].length === 0) {
            addRow();
        }
    }

    // 作業テーブルの読み込み
    if (data['work-tbl'] && Array.isArray(data['work-tbl'])) {
        const workTbody = document.getElementById('work-rows');
        const workTemplate = document.getElementById('work-row-template');
        workTbody.querySelectorAll('tr:not([id$="-template"])').forEach(row => row.remove());
        
        data['work-tbl'].forEach((rowDataArray, rowIndex) => {
            const newRow = workTemplate.cloneNode(true);
            newRow.removeAttribute('id');
            newRow.style.display = '';
            const cells = newRow.querySelectorAll('th, td');
            
            setCellContent(cells[0], rowDataArray[0]); // No
            setCellContent(cells[1], rowDataArray[1]); // コード
            setCellContent(cells[2], rowDataArray[2]); // 作業内容
            setCellContent(cells[3], rowDataArray[3]); // JAN
            setCellContent(cells[5], rowDataArray[5]); // 数量
            setCellContent(cells[6], rowDataArray[6]); // 単価
            setCellContent(cells[7], rowDataArray[7]); // 金額
            const selectInCell8 = cells[8].querySelector('select');
            if(selectInCell8) selectInCell8.value = rowDataArray[8]; // 出庫
            
            // ★★★ 修正点：ここから ★★★
            // 1. 先に行をテーブルへ追加する
            workTbody.appendChild(newRow);

            // 2. テーブルに追加された行に対してバーコードを生成する
            const jancode = rowDataArray[3];
            const barcodeSvg = newRow.querySelector('.work-barCode svg');

            if (barcodeSvg && jancode && jancode.trim() !== "") {
                barcodeSvg.id = `barcode-loaded-${Date.now()}-${rowIndex}`;
                try {
                    JsBarcode(`#${barcodeSvg.id}`, jancode, {
                        format: "EAN13",
                        displayValue: true,
                        width: 1.2,
                        height: 25,
                        margin: 5,
                        fontSize: 12,
                        textMargin: 0
                    });
                } catch (e) {
                    console.error("バーコードの生成に失敗しました:", e);
                    barcodeSvg.innerHTML = '';
                }
            }
            // ★★★ 修正点：ここまで ★★★
        });

        if (data['work-tbl'].length === 0) {
            addEmptyWorkRow();
        }
    }

    // 読み込み後の最終処理
    updateRowNumbers('product-tbl');
    updateWorkRowNumbers();
    initializeProductTableListeners();
    initializeWorkTable();
    updateAllTotals();
    
    alert('データを読み込みました。');
}