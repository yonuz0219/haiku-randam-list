// ===== テンプレートExcel生成（人数・作品数可変）=====

function generateTemplate(numAuthors, worksPerAuthor) {
  const workHeaders = Array.from({ length: worksPerAuthor }, (_, i) => `作品${i + 1}`);
  const headers = ['作者番号', '作者名', 'ペンネーム', ...workHeaders];

  const ws = XLSX.utils.aoa_to_sheet([headers]);
  ws['!cols'] = [
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    ...workHeaders.map(() => ({ wch: 30 })),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '俳句データ');
  XLSX.writeFile(wb, '俳句データ入力テンプレート.xlsx');
}


// ===== アップロードExcel読み込み（人数・作品数可変）=====

/**
 * @param {File} file
 * @param {number} numAuthors 設定した人数
 * @param {number} worksPerAuthor 設定した1人あたりの作品数
 * @returns {Array<{authorNumber, name, penName, works:[], isImportant}>}
 *   最終行の要素は isImportant=true（重要人物）
 */
function readExcelFile(file, numAuthors, worksPerAuthor) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const dataRows = rows.slice(1).filter(r => r[0] !== '' && r[0] !== undefined);

        if (dataRows.length === 0) {
          return reject(new Error('データが見つかりません。テンプレートの2行目以降に入力してください。'));
        }
        if (dataRows.length !== numAuthors) {
          return reject(new Error(`作者数が${dataRows.length}名です。${numAuthors}名分のデータを入力してください。`));
        }

        const authors = dataRows.map((row, i) => {
          const authorNumber = Number(row[0]);
          if (!Number.isInteger(authorNumber) || authorNumber < 1 || authorNumber > numAuthors) {
            throw new Error(`${i + 2}行目の作者番号が不正です（値: ${row[0]}）。1〜${numAuthors}の整数を入力してください。`);
          }
          const works = [];
          for (let w = 0; w < worksPerAuthor; w++) {
            works.push(String(row[3 + w] || '').trim());
          }
          return {
            authorNumber,
            name:        String(row[1] || '').trim(),
            penName:     String(row[2] || '').trim(),
            works,
            isImportant: false,
          };
        });

        // 最終行が重要人物
        authors[authors.length - 1].isImportant = true;

        resolve(authors);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
    reader.readAsArrayBuffer(file);
  });
}


// ===== 出力Excelファイル生成 =====

/**
 * @param {Array<{workNumber, groupNumber, authorNumber, name, penName, work}>} shuffledWorks
 */
function generateOutputExcel(shuffledWorks) {
  const headers = ['作者番号', '作品グループ番号', '作品番号', '作者名', 'ペンネーム', '作品'];
  const rows = shuffledWorks.map(w => [
    w.authorNumber,
    w.groupNumber,
    w.workNumber,
    w.name,
    w.penName,
    w.work,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'シャッフル結果');
  XLSX.writeFile(wb, '俳句シャッフル結果.xlsx');
}
