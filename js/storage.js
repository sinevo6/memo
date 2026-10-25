// ==========================================
// ファイル保存・読込ロジック (OS標準UI対応)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');

    // 受付日の文字列（例: "10/25" や "2026/10/25" 等）からファイル名用の YYYYMMDD を生成する関数
    function getFormattedDateString() {
        const receptionDateText = document.getElementById('reception-date-cell')?.innerText.trim() || '';
        const now = new Date();
        let yyyy = now.getFullYear();
        let mm = String(now.getMonth() + 1).padStart(2, '0');
        let dd = String(now.getDate()).padStart(2, '0');

        if (receptionDateText.includes('/')) {
            const parts = receptionDateText.split('/');
            if (parts.length >= 2) {
                const m = parts[parts.length - 2].trim();
                const d = parts[parts.length - 1].trim();
                if (!isNaN(m) && !isNaN(d)) {
                    mm = String(m).padStart(2, '0');
                    dd = String(d).padStart(2, '0');
                }
            }
        }

        return `${yyyy}${mm}${dd}`;
    }

    // アプリケーションの状態をJSONオブジェクトにまとめる関数
    function captureAppState() {
        return {
            meta: {
                receptionDate: document.getElementById('reception-date-cell')?.innerText || '',
                salesStaff: document.querySelector('#meta-group-tbl select:nth-of-type(1)')?.value || '',
                acStaff: document.querySelector('#meta-group-tbl select:nth-of-type(2)')?.value || '',
                caseNumber: document.querySelector('#meta-case-tbl td')?.innerText || ''
            },
            customer: {
                furigana: document.querySelector('.furigana-input')?.innerText || '',
                name: document.querySelector('.name-cell')?.innerText || '',
                tel1: document.querySelectorAll('.tel-input')[0]?.innerText || '',
                tel2: document.querySelectorAll('.tel-input')[1]?.innerText || '',
                zip: document.getElementById('zip-input')?.innerText || '',
                address: document.getElementById('address-input')?.innerText || ''
            },
            delivery: {
                outboundType: document.querySelector('#delivery-info-tbl select:nth-of-type(1)')?.value || '',
                workType: document.querySelector('#delivery-info-tbl select:nth-of-type(2)')?.value || '',
                visitDate: document.querySelector('#visit-date-cell .date-text')?.innerText || '',
                visitTime: document.getElementById('visit-time-cell')?.innerText || '',
                deliveryItem: document.querySelector('#delivery-info-tbl select:nth-of-type(3)')?.value || '',
                accountPaper: document.querySelector('#delivery-info-tbl select:nth-of-type(4)')?.value || ''
            },
            products: Array.from(document.querySelectorAll('#product-tbody tr.product-row:not(#product-row-template)')).map(tr => ({
                type: tr.querySelector('.product-type')?.innerText || '',
                jan: tr.querySelector('.jan-cell')?.innerText || '',
                quantity: tr.querySelector('.quantity')?.innerText || '1',
                price: tr.querySelector('.price')?.innerText || '',
                warranty: tr.querySelector('.warranty-select')?.value || '',
                productStatus: tr.querySelector('select[name="product-status"]')?.value || '00',
                outboundType: tr.querySelector('select[name="outbound-type"]')?.value || '後来',
                stockCode: tr.querySelector('.stock-code')?.innerText || '',
                stockInfoType: tr.querySelector('select[name="stock-info-type"]')?.value || '3',
                orderType: tr.querySelector('select[name="order-type"]')?.value || '',
                originalPrice: tr.dataset.originalPrice || '',
                appliedCouponName: tr.dataset.appliedCouponName || '',
                appliedCouponVal: tr.dataset.appliedCouponVal || '0',
                appliedPercent: tr.dataset.appliedPercent || '0'
            })),
            works: Array.from(document.querySelectorAll('#work-rows tr.work-row:not(#work-row-template)')).map(tr => ({
                code: tr.querySelector('.work-code')?.innerText || '',
                item: tr.querySelector('.work-item')?.innerText || '',
                jan: tr.querySelector('.work-janCode')?.innerText || '',
                quantity: tr.querySelector('.work-quantity')?.innerText || '1',
                price: tr.querySelector('.work-price')?.innerText || ''
            })),
            posa: Array.from(document.querySelectorAll('#posa-rows tr.posa-row:not(#posa-row-template)')).map(tr => ({
                type: tr.querySelector('.posa-type')?.innerText || '',
                quantity: tr.querySelector('.posa-quantity')?.innerText || '1',
                price: tr.querySelector('.posa-price')?.innerText || '',
                originalPrice: tr.dataset.originalPrice || '',
                appliedCouponName: tr.dataset.appliedCouponName || '',
                appliedCouponVal: tr.dataset.appliedCouponVal || '0',
                appliedPercent: tr.dataset.appliedPercent || '0'
            })),
            ownedEquipment: Array.from(document.querySelectorAll('#owned-equipment-tbody tr.owned-equipment-row:not(#owned-equipment-row-template)')).map(tr => ({
                type: tr.querySelector('.owned-equipment-type')?.innerText || '',
                model: tr.querySelector('.product-model-cell')?.innerText || '',
                serial: tr.querySelector('.owned-serial-cell')?.innerText || ''
            })),
            notes: {
                promise: document.querySelectorAll('.besshi-tbl td')[0]?.innerText || '',
                internal: document.querySelectorAll('.besshi-tbl td')[1]?.innerText || ''
            }
        };
    }

    // アプリケーションの状態を復元する関数
    function restoreAppState(data) {
        if (!data) return;

        // メタ情報
        if (data.meta) {
            const recDate = document.getElementById('reception-date-cell');
            if (recDate) recDate.innerText = data.meta.receptionDate || '';
            const salesSel = document.querySelector('#meta-group-tbl select:nth-of-type(1)');
            if (salesSel) salesSel.value = data.meta.salesStaff || '';
            const acSel = document.querySelector('#meta-group-tbl select:nth-of-type(2)');
            if (acSel) acSel.value = data.meta.acStaff || '';
            const caseCell = document.querySelector('#meta-case-tbl td');
            if (caseCell) caseCell.innerText = data.meta.caseNumber || '';
        }

        // 顧客情報
        if (data.customer) {
            const furigana = document.querySelector('.furigana-input');
            if (furigana) furigana.innerText = data.customer.furigana || '';
            const name = document.querySelector('.name-cell');
            if (name) name.innerText = data.customer.name || '';
            const tels = document.querySelectorAll('.tel-input');
            if (tels[0]) tels[0].innerText = data.customer.tel1 || '';
            if (tels[1]) tels[1].innerText = data.customer.tel2 || '';
            const zip = document.getElementById('zip-input');
            if (zip) zip.innerText = data.customer.zip || '';
            const address = document.getElementById('address-input');
            if (address) address.innerText = data.customer.address || '';
        }

        // 配信・配送情報
        if (data.delivery) {
            const sels = document.querySelectorAll('#delivery-info-tbl select');
            if (sels[0]) sels[0].value = data.delivery.outboundType || '後来';
            if (sels[1]) sels[1].value = data.delivery.workType || '店頭';
            const visitDateText = document.querySelector('#visit-date-cell .date-text');
            if (visitDateText) visitDateText.innerText = data.delivery.visitDate || '';
            const visitTime = document.getElementById('visit-time-cell');
            if (visitTime) visitTime.innerText = data.delivery.visitTime || '';
            if (sels[2]) sels[2].value = data.delivery.deliveryItem || '';
            if (sels[3]) sels[3].value = data.delivery.accountPaper || '';
        }

        // 商品テーブル
        if (data.products && Array.isArray(data.products)) {
            const tbody = document.getElementById('product-tbody');
            const template = document.getElementById('product-row-template');
            if (tbody && template) {
                tbody.querySelectorAll('tr.product-row:not(#product-row-template)').forEach(tr => tr.remove());
                
                data.products.forEach(p => {
                    const clone = template.cloneNode(true);
                    clone.removeAttribute('id');
                    clone.className = 'product-row';
                    clone.style.display = '';

                    clone.querySelector('.product-type').innerText = p.type;
                    clone.querySelector('.jan-cell').innerText = p.jan;
                    clone.querySelector('.quantity').innerText = p.quantity;
                    clone.querySelector('.price').innerText = p.price;
                    clone.querySelector('.warranty-select').value = p.warranty || '';
                    clone.querySelector('select[name="product-status"]').value = p.productStatus || '00';
                    clone.querySelector('select[name="outbound-type"]').value = p.outboundType || '後来';
                    clone.querySelector('.stock-code').innerText = p.stockCode || '1284';
                    clone.querySelector('select[name="stock-info-type"]').value = p.stockInfoType || '3';
                    clone.querySelector('select[name="order-type"]').value = p.orderType || '';

                    if (p.originalPrice) clone.dataset.originalPrice = p.originalPrice;
                    if (p.appliedCouponName) clone.dataset.appliedCouponName = p.appliedCouponName;
                    if (p.appliedCouponVal) clone.dataset.appliedCouponVal = p.appliedCouponVal;
                    if (p.appliedPercent) clone.dataset.appliedPercent = p.appliedPercent;

                    tbody.appendChild(clone);
                });
                if (typeof attachTableEvents === 'function') attachTableEvents();
            }
        }

        // 作業テーブル
        if (data.works && Array.isArray(data.works)) {
            const tbody = document.getElementById('work-rows');
            const template = document.getElementById('work-row-template');
            if (tbody && template) {
                tbody.querySelectorAll('tr.work-row:not(#work-row-template)').forEach(tr => tr.remove());

                data.works.forEach(w => {
                    const clone = template.cloneNode(true);
                    clone.removeAttribute('id');
                    clone.className = 'work-row';
                    clone.style.display = '';

                    clone.querySelector('.work-code').innerText = w.code;
                    clone.querySelector('.work-item').innerText = w.item;
                    clone.querySelector('.work-janCode').innerText = w.jan;
                    clone.querySelector('.work-quantity').innerText = w.quantity;
                    clone.querySelector('.work-price').innerText = w.price;

                    tbody.appendChild(clone);
                });
                if (typeof attachWorkTableEvents === 'function') attachWorkTableEvents();
            }
        }

        // POSAテーブル
        if (data.posa && Array.isArray(data.posa) && data.posa.length > 0) {
            const posaSec = document.getElementById('posa-section');
            if (posaSec) posaSec.style.display = 'block';
            const tbody = document.getElementById('posa-rows');
            const template = document.getElementById('posa-row-template');
            if (tbody && template) {
                tbody.querySelectorAll('tr.posa-row:not(#posa-row-template)').forEach(tr => tr.remove());

                data.posa.forEach(po => {
                    const clone = template.cloneNode(true);
                    clone.removeAttribute('id');
                    clone.className = 'posa-row';
                    clone.style.display = '';

                    clone.querySelector('.posa-type').innerText = po.type;
                    clone.querySelector('.posa-quantity').innerText = po.quantity;
                    clone.querySelector('.posa-price').innerText = po.price;

                    if (po.originalPrice) clone.dataset.originalPrice = po.originalPrice;
                    if (po.appliedCouponName) clone.dataset.appliedCouponName = po.appliedCouponName;
                    if (po.appliedCouponVal) clone.dataset.appliedCouponVal = po.appliedCouponVal;
                    if (po.appliedPercent) clone.dataset.appliedPercent = po.appliedPercent;

                    tbody.appendChild(clone);
                });
                if (typeof attachPosaTableEvents === 'function') attachPosaTableEvents();
            }
        } else {
            const posaSec = document.getElementById('posa-section');
            if (posaSec) posaSec.style.display = 'none';
        }

        // 所有機器テーブル
        if (data.ownedEquipment && Array.isArray(data.ownedEquipment)) {
            const tbody = document.getElementById('owned-equipment-tbody');
            const template = document.getElementById('owned-equipment-row-template');
            if (tbody && template) {
                tbody.querySelectorAll('tr.owned-equipment-row:not(#owned-equipment-row-template)').forEach(tr => tr.remove());

                data.ownedEquipment.forEach(oe => {
                    const clone = template.cloneNode(true);
                    clone.removeAttribute('id');
                    clone.className = 'owned-equipment-row';
                    clone.style.display = '';

                    clone.querySelector('.owned-equipment-type').innerText = oe.type;
                    clone.querySelector('.product-model-cell').innerText = oe.model;
                    clone.querySelector('.owned-serial-cell').innerText = oe.serial;

                    tbody.appendChild(clone);
                });
                if (typeof attachOwnedTableEvents === 'function') attachOwnedTableEvents();
            }
        }

        // 備考・お約束事項
        if (data.notes) {
            const besshi = document.querySelectorAll('.besshi-tbl td');
            if (besshi[0]) besshi[0].innerHTML = data.notes.promise || '';
            if (besshi[1]) besshi[1].innerHTML = data.notes.internal || '';
        }

        if (typeof calculateTotals === 'function') calculateTotals();
    }

    // 保存ボタンクリック時の処理 (OS標準UI)
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const appData = captureAppState();
            const jsonString = JSON.stringify(appData, null, 2);
            const dateStr = getFormattedDateString();
            const defaultFileName = `商談メモ${dateStr}.json`;

            if (window.showSaveFilePicker) {
                try {
                    const options = {
                        suggestedName: defaultFileName,
                        types: [{
                            description: 'JSON ファイル',
                            accept: { 'application/json': ['.json'] }
                        }]
                    };
                    const handle = await window.showSaveFilePicker(options);
                    const writable = await handle.createWritable();
                    await writable.write(new Blob([jsonString], { type: 'application/json' }));
                    await writable.close();
                    alert('ファイルを保存しました。');
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                }
            }

            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = defaultFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // 読込ボタンクリック時の処理 (OS標準UI & フォールバック)
    if (loadBtn) {
        loadBtn.addEventListener('click', async () => {
            if (window.showOpenFilePicker) {
                try {
                    const options = {
                        multiple: false,
                        types: [{
                            description: 'JSON ファイル',
                            accept: { 'application/json': ['.json'] }
                        }]
                    };
                    const [handle] = await window.showOpenFilePicker(options);
                    const file = await handle.getFile();
                    const text = await file.text();
                    
                    try {
                        const data = JSON.parse(text);
                        restoreAppState(data);
                        alert('ファイルを読み込みました。');
                        return;
                    } catch (parseErr) {
                        alert('ファイルの読み込みに失敗しました（JSONパースエラー）。有効なJSONファイルではありません。');
                        console.error('JSON Parse Error:', parseErr);
                        return;
                    }
                } catch (err) {
                    if (err.name === 'AbortError') return;
                }
            }

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        restoreAppState(data);
                        alert('ファイルを読み込みました。');
                    } catch (err) {
                        alert('ファイルの読み込みに失敗しました（JSONパースエラー）。有効なJSONファイルではありません。');
                        console.error('JSON Parse Error:', err);
                    }
                };
                reader.readAsText(file);
            };
            fileInput.click();
        });
    }
});