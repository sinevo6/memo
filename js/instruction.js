/**
 * 作業指示書（Instruction Sheet）専用モジュール
 */
(function () {
  'use strict';

  const TOTAL_INSTRUCTION_ROWS = 17;

  // 1. ページ読み込み時にテンプレートから17行を生成する初期化関数
  window.initInstructionTable = function() {
    const tbody = document.getElementById('instruction-work-tbody');
    const template = document.getElementById('instruction-row-template');
    if (!tbody || !template) return;

    // テンプレート以外の既存行をすべてクリア
    tbody.querySelectorAll('tr:not(#instruction-row-template)').forEach(tr => tr.remove());

    // 17行分生成して追加（生成時は確実に中身を空にする）
    for (let i = 0; i < TOTAL_INSTRUCTION_ROWS; i++) {
      const clone = template.cloneNode(true);
      clone.removeAttribute('id');
      clone.className = 'instruction-row';
      clone.style.display = '';

      const contentCell = clone.querySelector('.work-content-cell');
      const doneCell = clone.querySelector('.work-done-cell');
      if (contentCell) contentCell.textContent = '';
      if (doneCell) doneCell.textContent = '▢';

      tbody.appendChild(clone);
    }
  };

  // 2. 作業テーブルの内容から作業指示書へ一括反映する関数（リセット ＋ 1行ずつ反映 ＋ 17行調整）
  window.syncInstructionFromWorkTable = function() {
    window.initInstructionTable();

    const workRows = document.querySelectorAll('#work-rows tr.work-row:not(#work-row-template)');
    const instructionTbody = document.getElementById('instruction-work-tbody');
    if (!instructionTbody) return;

    let allLines = [];

    workRows.forEach(tr => {
      const codeCell = tr.querySelector('.work-code');
      const itemCell = tr.querySelector('.work-item');
      const code = codeCell ? codeCell.textContent.trim() : '';
      const itemText = itemCell ? itemCell.textContent.trim() : '';

      if (!code && !itemText) return;

      let instructionText = '';
      if (typeof menuData !== 'undefined' && Array.isArray(menuData)) {
        const found = menuData.find(m => {
          const c = m['社内コード'] || m['社内ｺｰﾄﾞ'] || m['コード'] || '';
          return c === code;
        });
        if (found) {
          instructionText = found['作業指示書'] || found['作業手順'] || found['指示書'] || found['作業内容詳細'] || itemText;
        }
      }
      if (!instructionText) {
        instructionText = itemText;
      }

      if (instructionText) {
        const lines = instructionText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        allLines.push(...lines);
      }
    });

    // 作業内容の最後に固定の確認項目を追加
    allLines.push("画面： 　　分、スリープ： 　　分、ゴミ箱、ダウンロード、Wi-Fi設定削除");

    const instructionRows = instructionTbody.querySelectorAll('tr:not(#instruction-row-template)');
    let lineIndex = 0;
    for (const row of instructionRows) {
      if (lineIndex >= allLines.length) break;
      const contentCell = row.querySelector('.work-content-cell');
      if (contentCell) {
        contentCell.textContent = allLines[lineIndex];
        lineIndex++;
      }
    }
  };

  // 初期化とイベント設定
  function setupInstructionModule() {
    window.initInstructionTable();

    const tbody = document.getElementById('instruction-work-tbody');
    if (tbody && !tbody.dataset.listenerAttached) {
      tbody.dataset.listenerAttached = 'true';
      tbody.addEventListener('click', (e) => {
        const clearBtn = e.target.closest('.instruction-row-clear-btn');
        if (!clearBtn) return;

        const currentRow = e.target.closest('tr');
        if (!currentRow || currentRow.id === 'instruction-row-template') return;

        // 1. クリックされた行を削除
        currentRow.remove();

        // 2. テンプレートから新しい空行を末尾に1行追加して、常に17行をキープする
        const template = document.getElementById('instruction-row-template');
        if (template) {
          const clone = template.cloneNode(true);
          clone.removeAttribute('id');
          clone.className = 'instruction-row';
          clone.style.display = '';

          const contentCell = clone.querySelector('.work-content-cell');
          const doneCell = clone.querySelector('.work-done-cell');
          if (contentCell) contentCell.textContent = '';
          if (doneCell) doneCell.textContent = '▢';

          tbody.appendChild(clone);
        }
      });
    }

    if (typeof window.updateInstructionHeaderInfo === 'function') {
      window.updateInstructionHeaderInfo();
    }
  }

  // DOMContentLoadedのタイミング、または既に読み込み済みの場合は即座に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupInstructionModule);
  } else {
    setupInstructionModule();
  }

  // 基本情報（受付日・お渡し日・フリガナ・案件番号）の自動転記
  window.updateInstructionHeaderInfo = function() {
    // 受付日
    const receptionDate = document.getElementById('reception-date-cell')?.innerText.trim() || '';
    
    // お渡し日（訪問日セル内の表示テキストを取得）
    const deliveryDate = document.querySelector('#visit-date-cell .date-text')?.innerText.trim() 
      || document.getElementById('visit-date-cell')?.innerText.trim() 
      || '';

    // お客様名欄には、個人情報保護のため氏名ではなく「フリガナ」を取得して使用
    let customerFurigana = document.querySelector('.furigana-input')?.innerText.trim() || '';

    // 案件番号
    const caseNumber = document.querySelector('#meta-case-tbl td')?.innerText.trim() || '';

    // 作業指示書側の各要素にセット
    const elRec = document.getElementById('instruction-reception-date');
    const elDeliv = document.getElementById('instruction-delivery-date');
    const elCust = document.getElementById('instruction-customer-name');
    const elCase = document.getElementById('instruction-case-number');

    if (elRec) elRec.textContent = receptionDate;
    if (elDeliv) elDeliv.textContent = deliveryDate;
    
    // フリガナを表示し、右端に「様」を配置
    if (elCust) {
      if (customerFurigana) {
        elCust.innerHTML = `<span style="float: left;">${customerFurigana}</span><span style="float: right;">様</span>`;
      } else {
        elCust.innerHTML = `<span style="float: right;">様</span>`;
      }
    }
    
    if (elCase) elCase.textContent = caseNumber;
  };

  window.InstructionSheet = {
    render: (data) => {
      const tbody = document.getElementById('instruction-work-tbody');
      const template = document.getElementById('instruction-row-template');
      if (!tbody || !template) return;
      
      tbody.querySelectorAll('tr:not(#instruction-row-template)').forEach(tr => tr.remove());

      if (Array.isArray(data)) {
        for (let i = 0; i < TOTAL_INSTRUCTION_ROWS; i++) {
          const clone = template.cloneNode(true);
          clone.removeAttribute('id');
          clone.className = 'instruction-row';
          clone.style.display = '';
          const contentCell = clone.querySelector('.work-content-cell');
          const doneCell = clone.querySelector('.work-done-cell');
          if (contentCell) contentCell.textContent = data[i] || '';
          if (doneCell) doneCell.textContent = '▢';
          tbody.appendChild(clone);
        }
      }
    }
  };
})();