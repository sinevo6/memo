// ==========================================
// モーダル・CSVインポート・検索処理
// ==========================================

// 1. 商品モーダル関連
let allProductData = [];

const modal = document.getElementById('product-modal');
const btnOpen = document.getElementById('product-list');
const btnClose = document.getElementById('close-modal');
const modalTbody = document.getElementById('modal-tbody');
const nameRadiosContainer = document.getElementById('name-radios');
const searchKeywordInput = document.getElementById('search-keyword');

// 選択状態管理用（JANコードまたは商品・施策名等を保持）
let selectedProductKeys = new Set();

if (btnOpen) {
    btnOpen.addEventListener('click', () => {
        if (modal) modal.style.display = 'block';
        if (allProductData.length === 0) {
            Papa.parse('product_list.csv', {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    parseCSVData(results.data);
                    buildNameRadios();
                    renderModalTable(allProductData);
                },
                error: function(error) {
                    console.error('データ取得失敗:', error);
                    alert('商品データ(product_list.csv)の取得に失敗しました。');
                }
            });
        } else {
            renderModalTable(allProductData);
        }
    });
}

function closeProductModal() {
    if (modal) modal.style.display = 'none';
    clearModalState('product');
}
if (btnClose) btnClose.addEventListener('click', closeProductModal);

function parseCSVData(rows) {
    allProductData = [];
    rows.forEach(item => {
        const cleanItem = {};
        Object.keys(item).forEach(key => {
            cleanItem[key.trim()] = item[key] !== undefined ? String(item[key]).trim() : '';
        });

        const nameVal = cleanItem['名称'] || cleanItem['商品名'] || '';
        if (nameVal === 'END') return;
        const modelVal = cleanItem['型番'] || '';
        if (!nameVal && !modelVal) return;

        let janVal = cleanItem['JANｺｰﾄﾞ'] || cleanItem['JANコード'] || cleanItem['JAN'] || '';
        if (!janVal) janVal = 'POSA';

        allProductData.push({
            name: nameVal,
            maker: cleanItem['メーカー'] || cleanItem['ﾒｰｶｰ'] || '',
            model: modelVal,
            storeCode: cleanItem['ｲﾝｽﾄｱｺｰﾄﾞ'] || cleanItem['インストアコード'] || '',
            price: cleanItem['ｹｰｽﾞ売価'] || cleanItem['ケーズ売価'] || cleanItem['売価'] || cleanItem['金額'] || '',
            jan: janVal,
            memo: cleanItem['備考'] || ''
        });
    });
}

function buildNameRadios() {
    if (!nameRadiosContainer) return;
    const names = [...new Set(allProductData.map(item => item.name))].filter(Boolean);
    let html = '<label><input type="radio" name="name-filter" value="" checked> 全て</label>';
    names.forEach(name => {
        html += `<label><input type="radio" name="name-filter" value="${name}"> ${name}</label>`;
    });
    nameRadiosContainer.innerHTML = html;
    document.querySelectorAll('input[name="name-filter"]').forEach(radio => {
        radio.addEventListener('change', filterAndRender);
    });
}

if (searchKeywordInput) searchKeywordInput.addEventListener('input', filterAndRender);

function normalizeStr(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}

function filterAndRender() {
    const selectedName = document.querySelector('input[name="name-filter"]:checked')?.value || '';
    const rawKeyword = searchKeywordInput ? searchKeywordInput.value.trim() : '';
    const keyword = normalizeStr(rawKeyword);

    const filtered = allProductData.filter(item => {
        const matchesName = !selectedName || item.name === selectedName;
        const targetText = normalizeStr(item.name + ' ' + item.maker + ' ' + item.model + ' ' + item.storeCode + ' ' + item.price + ' ' + item.jan + ' ' + item.memo);
        const matchesKeyword = !keyword || targetText.includes(keyword);
        return matchesName && matchesKeyword;
    });
    renderModalTable(filtered);
}

function renderModalTable(data) {
    if (!modalTbody) return;
    modalTbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        const itemKey = item.jan + '_' + item.model;
        if (selectedProductKeys.has(itemKey)) {
            tr.classList.add('selected');
        }

        let formattedPrice = item.price;
        if (item.price && !isNaN(item.price)) {
            formattedPrice = Number(item.price).toLocaleString();
        }

        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.maker}</td>
            <td>${item.model}</td>
            <td>${item.storeCode}</td>
            <td>${formattedPrice}</td>
            <td>${item.jan}</td>
            <td>${item.memo}</td>
        `;

        tr.addEventListener('click', () => {
            selectedProductKeys.add(itemKey);
            tr.classList.add('selected');

            if (item.jan === 'POSA') {
                addPosaToTable(item);
                addOwnedToTable(item);
            } else {
                addProductToTable(item);
                addOwnedToTable(item);
            }
        });
        modalTbody.appendChild(tr);
    });
}


// 2. 施策モーダル関連
let allMeasureData = [];
let selectedMeasureKeys = new Set();
const measureModal = document.getElementById('measure-modal');
const btnOpenMeasure = document.getElementById('measure-btn');
const btnCloseMeasure = document.getElementById('close-measure-modal');
const measureModalTbody = document.getElementById('measure-modal-tbody');
const measureSearchKeywordInput = document.getElementById('measure-search-keyword');

if (btnOpenMeasure) {
    btnOpenMeasure.addEventListener('click', () => {
        if (measureModal) measureModal.style.display = 'block';
        if (allMeasureData.length === 0) {
            Papa.parse('Discount List.csv', {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    parseMeasureCSVData(results.data);
                    renderMeasureModalTable(allMeasureData);
                },
                error: function(error) {
                    console.error('施策データ取得失敗:', error);
                    alert('施策データ(Discount List.csv)の取得に失敗しました。');
                }
            });
        } else {
            renderMeasureModalTable(allMeasureData);
        }
    });
}

function closeMeasureModal() {
    if (measureModal) measureModal.style.display = 'none';
    clearModalState('measure');
}
if (btnCloseMeasure) btnCloseMeasure.addEventListener('click', closeMeasureModal);

function parseMeasureCSVData(rows) {
    allMeasureData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let item of rows) {
        const cleanItem = {};
        Object.keys(item).forEach(key => {
            cleanItem[key.trim()] = item[key] !== undefined ? String(item[key]).trim() : '';
        });

        const measureName = cleanItem['施策'] || '';
        if (measureName === 'END') break;
        if (!measureName || measureName === 'nan' || measureName === '') continue;

        const storeCode = cleanItem['ｲﾝｽﾄｱｺｰﾄﾞ'] || cleanItem['インストアコード'] || '';
        let janVal = cleanItem['JANｺｰﾄﾞ'] || cleanItem['JANコード'] || cleanItem['JAN'] || '';
        if (!janVal || janVal === 'nan') janVal = '';

        let startDateStr = cleanItem['開始日'] || '';
        let endDateStr = cleanItem['終了日'] || '';

        if (startDateStr === 'nan' || startDateStr === 'NaN') startDateStr = '';
        if (endDateStr === 'nan' || endDateStr === 'NaN') endDateStr = '';

        let isValidPeriod = true;
        if (startDateStr || endDateStr) {
            const startDate = startDateStr ? new Date(startDateStr.replace(/\//g, '-')) : null;
            const endDate = endDateStr ? new Date(endDateStr.replace(/\//g, '-')) : null;
            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            if (startDate && today < startDate) isValidPeriod = false;
            if (endDate && today > endDate) isValidPeriod = false;
        }

        if (isValidPeriod) {
            allMeasureData.push({
                name: measureName,
                storeCode: storeCode,
                jan: janVal,
                price: cleanItem['単価'] || '',
                startDate: startDateStr,
                endDate: endDateStr
            });
        }
    }
}

if (measureSearchKeywordInput) measureSearchKeywordInput.addEventListener('input', filterAndRenderMeasure);

function filterAndRenderMeasure() {
    const rawKeyword = measureSearchKeywordInput ? measureSearchKeywordInput.value.trim() : '';
    const keyword = normalizeStr(rawKeyword);

    const filtered = allMeasureData.filter(item => {
        const targetText = normalizeStr(item.name + ' ' + item.storeCode + ' ' + item.jan + ' ' + item.price + ' ' + item.startDate + ' ' + item.endDate);
        return !keyword || targetText.includes(keyword);
    });
    renderMeasureModalTable(filtered);
}

function renderMeasureModalTable(data) {
    if (!measureModalTbody) return;
    measureModalTbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        const itemKey = item.storeCode + '_' + item.name;
        if (selectedMeasureKeys.has(itemKey)) {
            tr.classList.add('selected');
        }

        let formattedPrice = item.price;
        if (item.price && !isNaN(item.price)) {
            formattedPrice = Number(item.price).toLocaleString();
        }

        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.storeCode}</td>
            <td>${item.jan}</td>
            <td style="text-align: right;">${formattedPrice}</td>
            <td style="text-align: center;">${item.startDate}</td>
            <td style="text-align: center;">${item.endDate}</td>
        `;

        tr.addEventListener('click', () => {
            selectedMeasureKeys.add(itemKey);
            tr.classList.add('selected');

            const displayModel = item.storeCode ? `${item.storeCode}\n${item.name}` : item.name;
            addProductToTable({
                name: item.name,
                maker: '',
                model: displayModel,
                storeCode: '',
                price: item.price,
                jan: item.jan,
                memo: ''
            });
        });
        measureModalTbody.appendChild(tr);
    });
}


// 3. サポートメニューモーダル関連
let menuData = [];
let tableHeaders = [];
let currentKeywords = [];
let selectedSupportKeys = new Set();

const hideColumns = ['janコード', 'jan', '作業手順', '作業手順書'];
const detailColumns = ['作業内容詳細', '補足事項', '関連メニュー'];

const supportModal = document.getElementById('support-modal');
const btnOpenSupport = document.getElementById('support-menu-btn');
const btnCloseSupport = document.getElementById('close-support-modal');

if (btnOpenSupport) {
    btnOpenSupport.addEventListener('click', () => {
        if (supportModal) supportModal.style.display = 'block';
        if (menuData.length === 0) {
            Papa.parse('menu_list.csv', {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    tableHeaders = results.meta.fields || [];
                    menuData = results.data.map(item => {
                        let cleaned = {};
                        tableHeaders.forEach(key => {
                            let trimmedKey = key.trim();
                            cleaned[trimmedKey] = item[key] !== undefined ? String(item[key]).trim() : '';
                        });
                        return cleaned;
                    });
                    tableHeaders = tableHeaders.map(h => h.trim());
                    const statusMsg = document.getElementById('support-statusMessage');
                    if (statusMsg) statusMsg.textContent = `全 ${menuData.length} 件のデータを読み込みました。`;
                    filterAndRenderSupport();
                },
                error: function(error) {
                    console.warn('Papa Parse 読み込み失敗:', error);
                }
            });
        } else {
            filterAndRenderSupport();
        }
    });
}

function closeSupportModal() {
    if (supportModal) supportModal.style.display = 'none';
    clearModalState('support');
}
if (btnCloseSupport) btnCloseSupport.addEventListener('click', closeSupportModal);

const supportSearchInput = document.getElementById('support-searchInput');
const supportIncludeDetailsCheckbox = document.getElementById('support-includeDetailsCheckbox');

if (supportSearchInput) supportSearchInput.addEventListener('input', filterAndRenderSupport);
if (supportIncludeDetailsCheckbox) supportIncludeDetailsCheckbox.addEventListener('change', filterAndRenderSupport);

function filterAndRenderSupport() {
    const query = supportSearchInput ? supportSearchInput.value.trim().replace(/ /g, ' ') : '';
    currentKeywords = query ? query.split(/\s+/) : [];
    const includeDetails = supportIncludeDetailsCheckbox ? supportIncludeDetailsCheckbox.checked : false;

    const visibleHeaders = tableHeaders.filter(h => {
        const lower = h.toLowerCase();
        return !hideColumns.includes(lower) && !detailColumns.includes(h);
    });
    const primaryHeaders = visibleHeaders.filter(h => !h.includes('単価') && !h.includes('価格'));

    const filtered = menuData.filter(item => {
        if (currentKeywords.length === 0) return true;
        let targetValues = includeDetails ? Object.values(item).map(val => String(val).toLowerCase()) : primaryHeaders.map(h => String(item[h] || '').toLowerCase());
        return currentKeywords.some(keyword => targetValues.some(val => val.includes(keyword.toLowerCase())));
    });

    renderSupportTable(filtered);
    const statusMsg = document.getElementById('support-statusMessage');
    if (statusMsg) statusMsg.textContent = `全 ${menuData.length} 件中 ${filtered.length} 件を表示中`;
}

function renderSupportTable(data) {
    const thead = document.getElementById('support-table-header');
    const tbody = document.getElementById('support-modal-tbody');
    if (!thead || !tbody) return;
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (tableHeaders.length === 0) return;

    const visibleHeaders = tableHeaders.filter(h => {
        const lower = h.toLowerCase();
        return !hideColumns.includes(lower) && !detailColumns.includes(h);
    });

    let headerTr = document.createElement('tr');
    let thIcon = document.createElement('th');
    thIcon.className = 'w-10 px-3 py-2';
    headerTr.appendChild(thIcon);

    visibleHeaders.forEach((header) => {
        let th = document.createElement('th');
        let isPrice = header.includes('単価') || header.includes('価格');
        th.className = `px-4 py-2 text-left ${isPrice ? 'text-right' : ''}`;
        th.textContent = header;
        headerTr.appendChild(th);
    });
    thead.appendChild(headerTr);

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${visibleHeaders.length + 1}" class="px-4 py-3 text-center text-slate-500">データがありません</td></tr>`;
        return;
    }

    data.forEach((item, rowIndex) => {
        const getVal = (candidates) => {
            for (let c of candidates) {
                const foundKey = tableHeaders.find(h => h.toLowerCase() === c.toLowerCase());
                if (foundKey && item[foundKey] !== undefined) return item[foundKey];
            }
            return '';
        };

        const codeVal = getVal(['社内コード', '社内ｺｰﾄﾞ', 'コード']);
        const itemVal = getVal(['作業内容', 'メニュー名', '名称']);
        const janVal = getVal(['JANコード', 'JANｺｰﾄﾞ', 'JAN']);
        const priceVal = getVal(['単価', '価格', '料金']);

        const itemKey = codeVal + '_' + itemVal;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-blue-50 transition border-b border-slate-100 bg-white';
        if (selectedSupportKeys.has(itemKey)) {
            tr.classList.add('selected');
        }

        let rowMainHtml = `<td class="w-10 px-2 py-2 text-center text-slate-400 hover:text-blue-600 font-bold transition-transform cursor-pointer select-none" id="support-icon-cell-${rowIndex}" title="詳細を開閉"><span id="support-icon-${rowIndex}">▶</span></td>`;

        visibleHeaders.forEach((header, index) => {
            let val = item[header] || '';
            let isPrice = header.includes('単価') || header.includes('価格');
            let displayVal = isPrice ? formatPrice(val) : escapeHtml(val);
            if (!isPrice && currentKeywords.length > 0) {
                displayVal = highlightText(val, currentKeywords);
            }
            let alignClass = isPrice ? 'text-right font-semibold text-slate-700' : (index === 0 ? 'font-mono text-slate-600' : 'text-slate-900');
            rowMainHtml += `<td class="px-4 py-2 ${alignClass}">${displayVal}</td>`;
        });
        tr.innerHTML = rowMainHtml;

        const detailTr = document.createElement('tr');
        detailTr.id = `support-detail-row-${rowIndex}`;
        detailTr.className = 'hidden bg-slate-50/80 border-b border-slate-200';
        
        let detailTd = document.createElement('td');
        detailTd.colSpan = visibleHeaders.length + 1;
        detailTd.className = 'px-4 py-3 space-y-2';

        detailColumns.forEach(colName => {
            if (tableHeaders.includes(colName)) {
                let val = item[colName];
                let displayVal = (val && val !== 'nan') ? val : '（記載なし）';
                let escapedVal = escapeHtml(displayVal);
                if (val && val !== 'nan' && currentKeywords.length > 0) {
                    escapedVal = highlightText(displayVal, currentKeywords);
                }

                let subDiv = document.createElement('div');
                subDiv.className = 'bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm space-y-1';
                subDiv.innerHTML = `
                    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">${escapeHtml(colName)}</div>
                    <div class="text-xs text-slate-700 whitespace-pre-wrap text-left">${escapedVal}</div>
                `;
                detailTd.appendChild(subDiv);
            }
        });
        detailTr.appendChild(detailTd);
        tbody.appendChild(tr);
        tbody.appendChild(detailTr);

        const iconCell = document.getElementById(`support-icon-cell-${rowIndex}`);
        if (iconCell) {
            iconCell.onclick = (e) => {
                e.stopPropagation();
                toggleSupportRow(rowIndex);
            };
        }

        tr.querySelectorAll('td:not(:first-child)').forEach(td => {
            td.style.cursor = 'pointer';
            td.addEventListener('click', () => {
                selectedSupportKeys.add(itemKey);
                tr.classList.add('selected');
                addWorkToTable({ code: codeVal, item: itemVal, jan: janVal, price: priceVal });
            });
        });
    });
}

function toggleSupportRow(rowIndex) {
    const detailRow = document.getElementById(`support-detail-row-${rowIndex}`);
    const icon = document.getElementById(`support-icon-${rowIndex}`);
    if (!detailRow || !icon) return;

    if (detailRow.classList.contains('hidden')) {
        detailRow.classList.remove('hidden');
        icon.textContent = '▼';
        icon.style.color = '#2563eb';
    } else {
        detailRow.classList.add('hidden');
        icon.textContent = '▶';
        icon.style.color = '';
    }
}

function formatPrice(val) {
    if (!val) return '-';
    const num = Number(val);
    return isNaN(num) ? val : num.toLocaleString() + '円';
}

function highlightText(text, keywords) {
    if (!text || keywords.length === 0) return escapeHtml(text);
    const safeText = escapeHtml(text);
    const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
    return safeText.replace(regex, '<mark class="bg-yellow-200 text-slate-900 rounded px-0.5">$1</mark>');
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 共通：モーダルを閉じる際にフィルターやハイライト状態をクリアする関数
function clearModalState(type) {
    if (type === 'product') {
        selectedProductKeys.clear();
        if (searchKeywordInput) searchKeywordInput.value = '';
        const allRadio = document.querySelector('input[name="name-filter"][value=""]');
        if (allRadio) allRadio.checked = true;
        renderModalTable(allProductData);
    } else if (type === 'measure') {
        selectedMeasureKeys.clear();
        if (measureSearchKeywordInput) measureSearchKeywordInput.value = '';
        renderMeasureModalTable(allMeasureData);
    } else if (type === 'support') {
        selectedSupportKeys.clear();
        if (supportSearchInput) supportSearchInput.value = '';
        if (supportIncludeDetailsCheckbox) supportIncludeDetailsCheckbox.checked = false;
        filterAndRenderSupport();
    }
}

window.addEventListener('click', (event) => { 
    if (supportModal && event.target === supportModal) {
        closeSupportModal();
    }
    if (measureModal && event.target === measureModal) {
        closeMeasureModal();
    }
    if (modal && event.target === modal) {
        closeProductModal();
    }
});