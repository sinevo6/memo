// ==========================================
// メイン初期化・UI共通イベント
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // 印刷処理
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // 受付日に本日の日付（M/D形式）を自動挿入
    const receptionDateCell = document.getElementById('reception-date-cell');
    if (receptionDateCell) {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        receptionDateCell.innerText = `${month}/${day}`;
    }

    // イベント値引リストのロード開始
    if (typeof loadEventDiscounts === 'function') {
        loadEventDiscounts();
    }

    // 配信情報テーブルの訪問日・お時間のクリック操作設定
    const visitDateCell = document.getElementById('visit-date-cell');
    const visitTimeCell = document.getElementById('visit-time-cell');
    const timeModal = document.getElementById('time-modal');
    const closeTimeModal = document.getElementById('close-time-modal');
    const timeSelect = document.getElementById('time-select');
    const timeSubmitBtn = document.getElementById('time-submit-btn');

    if (visitDateCell) {
        visitDateCell.style.position = 'relative';
        visitDateCell.style.cursor = 'pointer';

        // 日付表示用のspanがない場合は作成
        let textSpan = visitDateCell.querySelector('.date-text');
        if (!textSpan) {
            textSpan = document.createElement('span');
            textSpan.className = 'date-text';
            textSpan.textContent = visitDateCell.textContent.trim();
            visitDateCell.textContent = '';
            visitDateCell.appendChild(textSpan);
        }

        // セル内に透明なinput[type="date"]を動的作成して重ねる
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.style.position = 'absolute';
        dateInput.style.top = '0';
        dateInput.style.left = '0';
        dateInput.style.width = '100%';
        dateInput.style.height = '100%';
        dateInput.style.opacity = '0';
        dateInput.style.cursor = 'pointer';
        
        visitDateCell.appendChild(dateInput);

        visitDateCell.addEventListener('click', () => {
            if (typeof dateInput.showPicker === 'function') {
                dateInput.showPicker();
            } else {
                dateInput.click();
            }
        });

        dateInput.addEventListener('change', (e) => {
            const val = e.target.value; // 例: "2026-09-23"
            if (val) {
                const dateObj = new Date(val);
                const month = dateObj.getMonth() + 1;
                const day = dateObj.getDate();
                textSpan.textContent = `${month}/${day}`;
            }
        });
    }

    if (visitTimeCell && timeModal) {
        visitTimeCell.addEventListener('click', (e) => {
            e.stopPropagation();
            timeModal.style.display = 'block';
        });
    }

    if (closeTimeModal && timeModal) {
        closeTimeModal.addEventListener('click', () => {
            timeModal.style.display = 'none';
        });
    }

    if (timeSubmitBtn && timeSelect && visitTimeCell && timeModal) {
        timeSubmitBtn.addEventListener('click', () => {
            if (timeSelect.value) {
                visitTimeCell.innerText = timeSelect.value;
                timeModal.style.display = 'none';
            }
        });
    }

    // 郵便番号自動検索
    const zipInput = document.getElementById('zip-input');
    const addressInput = document.getElementById('address-input');

    if (zipInput && addressInput) {
        zipInput.addEventListener('input', () => {
            const text = zipInput.innerText;
            const zipCode = text.replace(/[^0-9]/g, '');

            if (zipCode.length === 7) {
                fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipCode}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.results) {
                            const res = data.results[0];
                            zipInput.innerText = zipCode.slice(0, 3) + '-' + zipCode.slice(3);
                            addressInput.innerText = `${res.address1}${res.address2}${res.address3}`;
                            
                            const range = document.createRange();
                            const sel = window.getSelection();
                            range.selectNodeContents(addressInput);
                            range.collapse(false);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }
                    })
                    .catch(err => {
                        console.error('住所の取得に失敗しました', err);
                    });
            }
        });
    }

    // 電話番号フォーマット
    const telInputs = document.querySelectorAll('.tel-input');
    telInputs.forEach(cell => {
        cell.addEventListener('blur', () => {
            let text = cell.innerText.replace(/[^0-9]/g, '');

            if (text.length === 11) {
                cell.innerText = text.slice(0, 3) + '-' + text.slice(3, 7) + '-' + text.slice(7);
            } else if (text.length === 10) {
                if (text.startsWith('03') || text.startsWith('06')) {
                    cell.innerText = text.slice(0, 2) + '-' + text.slice(2, 6) + '-' + text.slice(6);
                } else {
                    cell.innerText = text.slice(0, 3) + '-' + text.slice(3, 6) + '-' + text.slice(6);
                }
            }
        });
    });

    // 各テーブルの初期化呼び出し
    if (typeof updateMainTable === 'function') updateMainTable();
    if (typeof updatePosaTable === 'function') updatePosaTable();
    if (typeof initWorkTable === 'function') initWorkTable();
    if (typeof initOwnedTable === 'function') initOwnedTable();
    if (typeof initSortableTables === 'function') initSortableTables();

    // モーダルのドラッグ移動有効化
    makeModalDraggable('#product-modal');
    makeModalDraggable('#measure-modal');
    makeModalDraggable('#support-modal');
});

// モーダルをドラッグして移動できるようにする関数
function makeModalDraggable(modalSelector) {
    const modal = document.querySelector(modalSelector);
    if (!modal) return;
    const content = modal.querySelector('.modal-content');
    const header = modal.querySelector('.modal-header');
    if (!content || !header) return;

    header.style.cursor = 'move';

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return; // 閉じるボタン等のクリック時は除外
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = content.getBoundingClientRect();
        content.style.margin = '0';
        content.style.position = 'absolute';
        content.style.left = rect.left + 'px';
        content.style.top = rect.top + 'px';

        initialLeft = rect.left;
        initialTop = rect.top;

        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        content.style.left = (initialLeft + dx) + 'px';
        content.style.top = (initialTop + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}