// ===== テンプレートExcel生成 =====

function generateTemplate() {
  const headers = ['作者番号', '作者名', 'ペンネーム', '作品1', '作品2', '作品3', '作品4', '作品5'];
  const ws = XLSX.utils.aoa_to_sheet([headers]);

  // 列幅設定
  ws['!cols'] = [
    { wch: 10 }, // 作者番号
    { wch: 16 }, // 作者名
    { wch: 16 }, // ペンネーム
    { wch: 30 }, // 作品1
    { wch: 30 }, // 作品2
    { wch: 30 }, // 作品3
    { wch: 30 }, // 作品4
    { wch: 30 }, // 作品5
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '俳句データ');
  XLSX.writeFile(wb, '俳句データ入力テンプレート.xlsx');
}


// ===== アップロードExcel読み込み =====

/**
 * @returns {Array<{authorNumber, name, penName, works:[5]}>}
 */
function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // 1行目はヘッダーとしてスキップ
        const dataRows = rows.slice(1).filter(r => r[0] !== '' && r[0] !== undefined);

        if (dataRows.length === 0) {
          return reject(new Error('データが見つかりません。テンプレートの2行目以降に入力してください。'));
        }
        if (dataRows.length !== 20) {
          return reject(new Error(`作者数が${dataRows.length}名です。20名分のデータを入力してください。`));
        }

        const authors = dataRows.map((row, i) => {
          const authorNumber = Number(row[0]);
          if (!Number.isInteger(authorNumber) || authorNumber < 1 || authorNumber > 20) {
            throw new Error(`${i + 2}行目の作者番号が不正です（値: ${row[0]}）。1〜20の整数を入力してください。`);
          }
          return {
            authorNumber,
            name:      String(row[1] || '').trim(),
            penName:   String(row[2] || '').trim(),
            works: [
              String(row[3] || '').trim(),
              String(row[4] || '').trim(),
              String(row[5] || '').trim(),
              String(row[6] || '').trim(),
              String(row[7] || '').trim(),
            ],
          };
        });

        // 作者番号5（重要人物）の存在確認
        const hasImportant = authors.some(a => a.authorNumber === 5);
        if (!hasImportant) {
          return reject(new Error('作者番号「5」（重要人物）が見つかりません。重要人物に5を割り当ててください。'));
        }

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
    { wch: 12 }, // 作者番号
    { wch: 16 }, // 作品グループ番号
    { wch: 12 }, // 作品番号
    { wch: 16 }, // 作者名
    { wch: 16 }, // ペンネーム
    { wch: 40 }, // 作品
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'シャッフル結果');
  XLSX.writeFile(wb, '俳句シャッフル結果.xlsx');
}
