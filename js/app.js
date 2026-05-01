// ===== アプリ制御 =====

let uploadedAuthors = null; // 読み込み済み作者データ
let shuffledResult  = null; // シャッフル済み作品データ

// DOM要素
const uploadArea      = document.getElementById('upload-area');
const fileInput       = document.getElementById('file-input');
const fileInfo        = document.getElementById('file-info');
const fileNameEl      = document.getElementById('file-name');
const fileRowsEl      = document.getElementById('file-rows');
const uploadError     = document.getElementById('upload-error');
const btnShuffle      = document.getElementById('btn-shuffle');
const progress        = document.getElementById('progress');
const sectionDownload = document.getElementById('section-download');

// ----- テンプレートダウンロード -----
document.getElementById('btn-download-template').addEventListener('click', () => {
  generateTemplate();
});

// ----- ファイル選択（ボタン） -----
document.getElementById('btn-select-file').addEventListener('click', () => {
  fileInput.click();
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

// ----- ドラッグ＆ドロップ -----
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// ----- ファイル読み込み処理 -----
async function handleFile(file) {
  hideError();
  fileInfo.classList.add('hidden');
  btnShuffle.disabled = true;
  uploadedAuthors = null;

  try {
    const authors = await readExcelFile(file);
    uploadedAuthors = authors;

    fileNameEl.textContent = file.name;
    fileRowsEl.textContent = `（${authors.length}名 / 計${authors.length * 5}作品）`;
    fileInfo.classList.remove('hidden');
    btnShuffle.disabled = false;
  } catch (err) {
    showError(err.message);
  }
}

// ----- シャッフル実行 -----
document.getElementById('btn-shuffle').addEventListener('click', async () => {
  if (!uploadedAuthors) return;

  btnShuffle.disabled = true;
  progress.classList.remove('hidden');
  sectionDownload.classList.add('hidden');

  // UIの更新を確実に描画させてからシャッフル処理を行う
  await new Promise(r => setTimeout(r, 50));

  try {
    shuffledResult = shuffleWorks(uploadedAuthors);
    sectionDownload.classList.remove('hidden');
    sectionDownload.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    showError('シャッフル処理に失敗しました: ' + err.message);
    btnShuffle.disabled = false;
  } finally {
    progress.classList.add('hidden');
  }
});

// ----- Excelダウンロード -----
document.getElementById('btn-download-excel').addEventListener('click', () => {
  if (!shuffledResult) return;
  generateOutputExcel(shuffledResult);
});

// ----- Wordダウンロード -----
document.getElementById('btn-download-word').addEventListener('click', async () => {
  if (!shuffledResult) return;
  const btn = document.getElementById('btn-download-word');
  btn.disabled = true;
  btn.textContent = '生成中...';
  try {
    await generateWordDocument(shuffledResult);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Wordファイルをダウンロード（縦書き）';
  }
});

// ----- リセット -----
document.getElementById('btn-reset').addEventListener('click', () => {
  uploadedAuthors = null;
  shuffledResult  = null;
  fileInput.value = '';
  fileInfo.classList.add('hidden');
  sectionDownload.classList.add('hidden');
  hideError();
  btnShuffle.disabled = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ----- ユーティリティ -----
function showError(msg) {
  uploadError.textContent = msg;
  uploadError.classList.remove('hidden');
}
function hideError() {
  uploadError.classList.add('hidden');
}
