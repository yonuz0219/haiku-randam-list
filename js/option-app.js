// ===== オプション版アプリ制御 =====

let configNumAuthors     = null;
let configWorksPerAuthor = null;
let uploadedAuthors      = null;
let shuffledResult       = null;

// DOM
const uploadArea      = document.getElementById('upload-area');
const fileInput       = document.getElementById('file-input');
const fileInfo        = document.getElementById('file-info');
const fileNameEl      = document.getElementById('file-name');
const fileRowsEl      = document.getElementById('file-rows');
const uploadError     = document.getElementById('upload-error');
const btnShuffle      = document.getElementById('btn-shuffle');
const progress        = document.getElementById('progress');
const sectionDownload = document.getElementById('section-download');
const sectionTemplate = document.getElementById('section-template');
const sectionUpload   = document.getElementById('section-upload');
const sectionShuffle  = document.getElementById('section-shuffle');
const subtitle        = document.getElementById('subtitle');
const configError     = document.getElementById('config-error');
const configConfirmed = document.getElementById('config-confirmed');
const colSpecContent  = document.getElementById('col-spec-content');
const shuffleDesc     = document.getElementById('shuffle-desc');
const importantNote   = document.getElementById('important-note');

// ----- STEP 0: 設定確定 -----
document.getElementById('btn-confirm-config').addEventListener('click', () => {
  const n = parseInt(document.getElementById('input-num-authors').value, 10);
  const w = parseInt(document.getElementById('input-works-per-author').value, 10);

  if (!Number.isInteger(n) || n < 5 || n > 50) {
    showConfigError('人数は5〜50の整数で入力してください。');
    return;
  }
  if (!Number.isInteger(w) || w < 1 || w > 20) {
    showConfigError('1人あたりの作品数は1〜20の整数で入力してください。');
    return;
  }

  configNumAuthors     = n;
  configWorksPerAuthor = w;

  hideConfigError();
  applyConfig(n, w);
});

function applyConfig(n, w) {
  document.getElementById('input-num-authors').disabled = true;
  document.getElementById('input-works-per-author').disabled = true;
  document.getElementById('btn-confirm-config').disabled = true;

  configConfirmed.textContent = `設定済み：${n}名 × 1人${w}作品（合計${n * w}作品）`;
  configConfirmed.classList.remove('hidden');

  subtitle.textContent = `${n}名・1人${w}作品の合計${n * w}作品をシャッフルし、ExcelのデータリストとWordによる作品一覧（番号つき・縦書き）で出力します`;

  const workCols = Array.from({ length: w }, (_, i) => `作品${i + 1}`).join(' ｜ ');
  colSpecContent.textContent = `作者番号 ｜ 作者名 ｜ ペンネーム ｜ ${workCols}`;

  importantNote.textContent = `※ 最終行（${n}行目）が重要人物として扱われます。シャッフル後、各グループの中央付近に配置されます。`;

  shuffleDesc.textContent = `ファイルを確認後、ボタンを押して${n * w}作品をランダムに並び替えます。`;

  sectionTemplate.classList.remove('locked');
  sectionUpload.classList.remove('locked');
  sectionShuffle.classList.remove('locked');
}

// ----- テンプレートダウンロード -----
document.getElementById('btn-download-template').addEventListener('click', () => {
  generateTemplate(configNumAuthors, configWorksPerAuthor);
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
    const authors = await readExcelFile(file, configNumAuthors, configWorksPerAuthor);
    uploadedAuthors = authors;
    fileNameEl.textContent = file.name;
    fileRowsEl.textContent = `（${authors.length}名 / 計${authors.length * configWorksPerAuthor}作品）`;
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

  await new Promise(r => setTimeout(r, 50));

  try {
    shuffledResult = shuffleWorks(uploadedAuthors, configWorksPerAuthor);
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
function showConfigError(msg) {
  configError.textContent = msg;
  configError.classList.remove('hidden');
}
function hideConfigError() {
  configError.classList.add('hidden');
}
