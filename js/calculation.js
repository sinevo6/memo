// ==========================================
// 計算・バーコード・イベント値引き関連
// ==========================================
let couponList = [];
let currentActiveRow = null; 
let selectedTempCoupon = null;
let selectedTempPercent = null;

// event-discount.csv の読み込み
function loadEventDiscounts() {
    if (couponList.length === 0) {
        Papa.parse('event-discount.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                couponList = results.data.map(item => {
                    const clean = {};
                    Object.keys(item).forEach(k => {
                        clean[k.trim()] = item[k] !== undefined ? String(item[k]).trim() : '';
                    });
                    return clean;
                }).filter(c => c['イベント値引'] || c['単価'] || c['クーポン名'] || c['名称']);
                buildCouponMenuItems();
            },
            error: function(err) {
                console.error('event-discount.csvの読み込みに失敗しました:', err);
            }
        });
    }
}

function buildCouponMenuItems() {
    const container = document.getElementById('coupon-menu-items');
    if (!container) return;
    container.innerHTML = '';
    if (couponList.length === 0) {
        container.innerHTML = '<div style="padding: 4px 12px; color: #666;">クーポンなし</div>';
        return;
    }
    couponList.forEach(c => {
        const name = c['イベント値引'] || c['クーポン名'] || c['名称'] || 'クーポン';
        const rawVal = c['単価'] || c['割引額'] || c['値引き額'] || c['金額'] || '0';
        const val = Math.abs(parseInt(rawVal.replace(/[^0-9-]/g, ''), 10) || 0);
        const memo = c['備考'] || '';

        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item';
        itemDiv.dataset.discountType = 'coupon';
        itemDiv.dataset.couponName = name;
        itemDiv.dataset.couponValue = val;
        
        let innerHtml = `<div>${name} (${val.toLocaleString()}円引き)</div>`;
        if (memo && memo !== '-') {
            innerHtml += `<div class="coupon-memo">※${memo}</div>`;
        }
        itemDiv.innerHTML = innerHtml;
        container.appendChild(itemDiv);
    });
}

const contextMenu = document.getElementById('event-discount-menu');

function bindEventDiscountMenu(cell) {
    cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const tr = cell.closest('tr');
        if (tr.id.includes('template')) return;

        currentActiveRow = tr;
        if (!tr.dataset.originalPrice) {
            const currentPriceVal = parseInt(cell.textContent.replace(/,/g, ''), 10) || 0;
            tr.dataset.originalPrice = currentPriceVal;
            tr.dataset.appliedCouponName = '';
            tr.dataset.appliedCouponVal = '0';
            tr.dataset.appliedPercent = '0';
        }

        selectedTempCoupon = tr.dataset.appliedCouponName ? { name: tr.dataset.appliedCouponName, val: tr.dataset.appliedCouponVal } : null;
        selectedTempPercent = tr.dataset.appliedPercent && tr.dataset.appliedPercent !== '0' ? tr.dataset.appliedPercent : null;

        updateMenuSelectionState();

        if (contextMenu) {
            contextMenu.style.display = 'block';
            let left = e.pageX;
            let top = e.pageY;
            if (left + 200 > window.innerWidth) left = window.innerWidth - 210;
            if (top + 300 > window.innerHeight) top = window.innerHeight - 310;
            contextMenu.style.left = `${left}px`;
            contextMenu.style.top = `${top}px`;
        }
    });
}

function updateMenuSelectionState() {
    if (!contextMenu) return;
    contextMenu.querySelectorAll('.menu-item').forEach(item => {
        const type = item.dataset.discountType;
        item.classList.remove('selected-item');
        if (type === 'percent' && selectedTempPercent === item.dataset.value) {
            item.classList.add('selected-item');
        } else if (type === 'coupon' && selectedTempCoupon && selectedTempCoupon.name === item.dataset.couponName) {
            item.classList.add('selected-item');
        }
    });
}

if (contextMenu) {
    contextMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.menu-item');
        if (!item || !currentActiveRow) return;

        const type = item.dataset.discountType;
        if (type === 'coupon') {
            if (selectedTempCoupon && selectedTempCoupon.name === item.dataset.couponName) {
                selectedTempCoupon = null;
            } else {
                selectedTempCoupon = { name: item.dataset.couponName, val: item.dataset.couponValue };
            }
        } else if (type === 'percent') {
            if (selectedTempPercent === item.dataset.value) {
                selectedTempPercent = null;
            } else {
                selectedTempPercent = item.dataset.value;
            }
        }
        updateMenuSelectionState();
    });
}

const applyDiscountBtn = document.getElementById('apply-discount-btn');
if (applyDiscountBtn) {
    applyDiscountBtn.addEventListener('click', () => {
        if (!currentActiveRow) return;
        
        currentActiveRow.dataset.appliedCouponName = selectedTempCoupon ? selectedTempCoupon.name : '';
        currentActiveRow.dataset.appliedCouponVal = selectedTempCoupon ? selectedTempCoupon.val : '0';
        currentActiveRow.dataset.appliedPercent = selectedTempPercent ? selectedTempPercent : '0';

        applyCalculatedDiscount(currentActiveRow);
        if (contextMenu) contextMenu.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (contextMenu && !contextMenu.contains(e.target)) {
        contextMenu.style.display = 'none';
    }
});

function applyCalculatedDiscount(tr) {
    const origPrice = parseInt(tr.dataset.originalPrice, 10) || 0;
    const couponVal = parseInt(tr.dataset.appliedCouponVal, 10) || 0;
    const percentVal = parseInt(tr.dataset.appliedPercent, 10) || 0;

    let calculated = origPrice - couponVal;
    if (calculated < 0) calculated = 0;

    if (percentVal > 0) {
        calculated = Math.floor(calculated * (1 - percentVal / 100));
    }

    const priceCell = tr.querySelector('.price, .posa-price');
    if (priceCell) {
        priceCell.textContent = calculated > 0 ? calculated.toLocaleString() : '0';
        priceCell.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const typeCell = tr.querySelector('.product-type, .posa-type');
    if (typeCell) {
        let baseText = tr.dataset.baseModelText;
        if (!baseText) {
            baseText = typeCell.textContent.replace(/【.*?】/g, '').trim();
            tr.dataset.baseModelText = baseText;
        }

        let suffix = '';
        const cName = tr.dataset.appliedCouponName;
        const pVal = tr.dataset.appliedPercent;

        if (cName) suffix += `【${cName}】`;
        if (pVal && pVal !== '0') suffix += `【${pVal}%値引】`;

        typeCell.textContent = baseText + (suffix ? '\n' + suffix : '');
    }
}

function generateBarcodesForContainer(containerSelector) {
    document.querySelectorAll(`${containerSelector} tr`).forEach(tr => {
        const janCell = tr.querySelector('.jan-cell, .work-janCode');
        const svgElem = tr.querySelector('.barcode-svg');
        if (janCell && svgElem) {
            const janText = janCell.textContent.trim();
            if (janText && janText !== 'POSA' && /^\d+$/.test(janText)) {
                try {
                    JsBarcode(svgElem, janText, {
                        format: janText.length === 8 ? "EAN8" : "EAN13",
                        displayValue: true,
                        fontSize: 12,
                        height: 20,
                        width: 2,
                        margin: 2
                    });
                } catch (e) {
                    svgElem.innerHTML = '';
                }
            } else {
                svgElem.innerHTML = '';
            }
        }
    });
}

function calculateTotals() {
    let productSubtotal = 0;
    document.querySelectorAll('#product-tbody tr.product-row:not(#product-row-template)').forEach(tr => {
        const totalCell = tr.querySelector('.total');
        if (totalCell) {
            productSubtotal += parseInt(totalCell.textContent.replace(/,/g, ''), 10) || 0;
        }
    });
    const prodSubElem = document.getElementById('product-subtotal');
    if (prodSubElem) prodSubElem.textContent = productSubtotal.toLocaleString();

    let workSubtotal = 0;
    document.querySelectorAll('#work-rows tr.work-row:not(#work-row-template)').forEach(tr => {
        const totalCell = tr.querySelector('.work-lineTotal');
        if (totalCell) {
            workSubtotal += parseInt(totalCell.textContent.replace(/,/g, ''), 10) || 0;
        }
    });
    const workSubElem = document.getElementById('work-subtotal');
    if (workSubElem) workSubElem.textContent = workSubtotal.toLocaleString();

    let posaSubtotal = 0;
    document.querySelectorAll('#posa-rows tr.posa-row:not(#posa-row-template)').forEach(tr => {
        const totalCell = tr.querySelector('.posa-lineTotal');
        if (totalCell) {
            posaSubtotal += parseInt(totalCell.textContent.replace(/,/g, ''), 10) || 0;
        }
    });
    const posaSubtotalElem = document.getElementById('posa-subtotal');
    if (posaSubtotalElem) posaSubtotalElem.textContent = posaSubtotal.toLocaleString();

    const normalGroupTotal = productSubtotal + workSubtotal;
    const normalSubDisp = document.getElementById('normal-subtotal-display');
    if (normalSubDisp) normalSubDisp.textContent = normalGroupTotal.toLocaleString();
    
    const normalGroupTitle = document.getElementById('normal-group-title');
    const normalDisplayLine = document.getElementById('normal-total-display-line');
    const posaDisplayLine = document.getElementById('posa-total-display-line');
    const totalDividerLine = document.getElementById('total-divider-line');

    // POSAテーブルに行が入力されているかどうかを判定
    let hasValidPosa = false;
    document.querySelectorAll('#posa-rows tr.posa-row:not(#posa-row-template)').forEach(tr => {
        const typeText = tr.querySelector('.posa-type')?.textContent.trim() || '';
        const priceText = tr.querySelector('.posa-price')?.textContent.trim() || '';
        if (typeText || priceText) {
            hasValidPosa = true;
        }
    });

    if (hasValidPosa) {
        if (normalGroupTitle) normalGroupTitle.style.display = 'block';
        if (normalDisplayLine) normalDisplayLine.style.display = 'grid';
        if (posaDisplayLine) posaDisplayLine.style.display = 'grid';
        if (totalDividerLine) totalDividerLine.style.display = 'block';
        const posaSubDisp = document.getElementById('posa-subtotal-display');
        if (posaSubDisp) posaSubDisp.textContent = posaSubtotal.toLocaleString();
    } else {
        if (normalGroupTitle) normalGroupTitle.style.display = 'none';
        if (normalDisplayLine) normalDisplayLine.style.display = 'none';
        if (posaDisplayLine) posaDisplayLine.style.display = 'none';
        if (totalDividerLine) totalDividerLine.style.display = 'none';
    }

    const grandTotal = normalGroupTotal + posaSubtotal;
    const grandTotalElem = document.getElementById('grand-total');
    if (grandTotalElem) grandTotalElem.textContent = grandTotal.toLocaleString();
}