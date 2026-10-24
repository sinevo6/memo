// ==========================================
// セットメニュー判定・確認モーダル制御ロジック（双方向対応）
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // 既存の addWorkToTable 関数を退避
    const originalAddWorkToTable = window.addWorkToTable;
    if (!originalAddWorkToTable) return;

    // 1. セットメニュー適用の条件となるSETコード一覧
    const TARGET_SET_CODES = [
        'SET73', 'SET74',
        'SET111', 'SET112', 'SET113', 'SET114', 'SET115',
        'SET121', 'SET122', 'SET123', 'SET124', 'SET125', 'SET126'
    ];

    // 2. 追加するコードと、対応するセットメニュー（SOP）の紐付け
    const SET_MENU_MAPPING = {
        'S28': 'SOP1',
        'S100': 'SOP3'
    };

    // 作業テーブルに指定のSETコードが含まれているかチェック
    function hasTargetSetCodeInWorkTable() {
        const rows = document.querySelectorAll('#work-rows tr.work-row:not(#work-row-template)');
        for (const tr of rows) {
            const codeCell = tr.querySelector('.work-code');
            if (codeCell && TARGET_SET_CODES.includes(codeCell.textContent.trim())) {
                return true;
            }
        }
        return false;
    }

    // 作業テーブルにマッピング対象（S28やS100など）がすでに含まれているかチェックし、該当コードを返す
    function findMappingCodeInWorkTable() {
        const rows = document.querySelectorAll('#work-rows tr.work-row:not(#work-row-template)');
        for (const tr of rows) {
            const codeCell = tr.querySelector('.work-code');
            if (codeCell) {
                const codeText = codeCell.textContent.trim();
                if (SET_MENU_MAPPING[codeText]) {
                    return { tr, code: codeText };
                }
            }
        }
        return null;
    }

    // サポートメニュー（menuData）から該当データを取得
    function getSopItemInfo(targetSopCode) {
        let found = null;
        if (typeof menuData !== 'undefined' && Array.isArray(menuData)) {
            found = menuData.find(m => {
                const c = m['社内コード'] || m['社内ｺｰﾄﾞ'] || m['コード'] || '';
                return c === targetSopCode;
            });
        }
        return {
            code: targetSopCode,
            item: found ? (found['作業内容'] || found['メニュー名'] || found['名称'] || `${targetSopCode} 作業内容`) : `${targetSopCode} 作業内容`,
            jan: found ? (found['JANコード'] || found['JANｺｰﾄﾞ'] || found['JAN'] || '') : '',
            price: found ? (found['単価'] || found['価格'] || found['料金'] || '0') : '0'
        };
    }

    // 確認用モーダルを表示する関数
    function showSetMenuConfirmModal(originalItem, mappedInfo, onYes, onNo) {
        const existingModal = document.getElementById('set-menu-confirm-modal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div id="set-menu-confirm-modal" class="modal" style="display: block; z-index: 2000;">
                <div class="modal-content" style="max-width: 420px; padding: 15px 20px;">
                    <div class="modal-header" style="margin-bottom: 8px;">
                        <h3 style="font-size: 14px; font-weight: bold; margin: 0;">確認</h3>
                    </div>
                    <div class="modal-body" style="border: none; padding: 0 0 15px 0; font-size: 12px; line-height: 1.5; overflow: visible;">
                        <p style="font-weight: bold; margin-bottom: 8px; color: #007bff; font-size: 13px;">「セットメニューが使用できます。」</p>
                        <p style="background: #f8f9fa; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">
                            ${originalItem.code} ${originalItem.item} <br>
                            <span style="color: #666;">↓ 変更案</span><br>
                            <strong>${mappedInfo.code} ${mappedInfo.item}</strong>
                        </p>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button id="set-menu-no-btn" style="padding: 4px 14px; background: #f0f0f0; border: 1px solid #767676; border-radius: 3px; cursor: pointer; font-size: 11px;">いいえ</button>
                        <button id="set-menu-yes-btn" style="padding: 4px 14px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">はい</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('set-menu-yes-btn').addEventListener('click', () => {
            document.getElementById('set-menu-confirm-modal').remove();
            onYes();
        });

        document.getElementById('set-menu-no-btn').addEventListener('click', () => {
            document.getElementById('set-menu-confirm-modal').remove();
            onNo();
        });
    }

    // 作業追加関数（addWorkToTable）をフックして拡張
    window.addWorkToTable = function(item) {
        const code = item.code ? item.code.trim() : '';

        // パターン1：【SETコードが先に入っていて、あとから S28/S100 を追加する場合】
        if (SET_MENU_MAPPING[code] && hasTargetSetCodeInWorkTable()) {
            const targetSopCode = SET_MENU_MAPPING[code];
            const mappedItem = getSopItemInfo(targetSopCode);

            showSetMenuConfirmModal(
                item,
                mappedItem,
                () => { originalAddWorkToTable(mappedItem); }, // 「はい」：SOPを追加
                () => { originalAddWorkToTable(item); }       // 「いいえ」：元の作業を追加
            );
            return;
        }

        // パターン2：【S28/S100が先に入っていて、あとから SETコードを追加する場合】
        if (TARGET_SET_CODES.includes(code)) {
            const existing = findMappingCodeInWorkTable();
            if (existing) {
                const targetSopCode = SET_MENU_MAPPING[existing.code];
                const mappedItem = getSopItemInfo(targetSopCode);
                const originalItemInfo = { 
                    code: existing.code, 
                    item: existing.tr.querySelector('.work-item')?.textContent.trim() || '' 
                };

                showSetMenuConfirmModal(
                    originalItemInfo,
                    mappedItem,
                    () => {
                        // 「はい」：既存のS28等の行をSOPに書き換え、今回のSETコードも追加
                        existing.tr.querySelector('.work-code').textContent = mappedItem.code;
                        existing.tr.querySelector('.work-item').textContent = mappedItem.item;
                        existing.tr.querySelector('.work-janCode').textContent = mappedItem.jan;
                        existing.tr.querySelector('.work-price').textContent = Number(mappedItem.price).toLocaleString();
                        existing.tr.querySelector('.work-price').dispatchEvent(new Event('input', { bubbles: true }));
                        
                        originalAddWorkToTable(item); // SETコードを追加
                    },
                    () => {
                        // 「いいえ」：既存のS28等はそのままにして、SETコードのみ追加
                        originalAddWorkToTeamIfPossible();
                        originalAddWorkToTable(item);
                    }
                );
                return;
            }
        }

        // どちらの条件にも合致しない場合は通常通り追加
        originalAddWorkToTable(item);
    };
});