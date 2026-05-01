// ===== GAS: 認証付きWebアプリ =====
// デプロイ設定:
//   「ウェブアプリとしてデプロイ」
//   「次のユーザーとして実行」: 自分
//   「アクセスできるユーザー」: 自分と同じドメインのユーザー（または特定のユーザー）
//
// ALLOWED_EMAILS に許可するGoogleアカウントのメールアドレスを列挙してください。
// 空にすると同じGoogleドメイン内の全員がアクセスできます。

const ALLOWED_EMAILS = [
  // 例: 'tantousha@example.com',
];

// index.htmlが置かれているGoogleドライブのフォルダID
// DriveにアップロードしたHTMLをここで配信する場合に使用します。
// ローカルで開発する場合はこのGASは不要です。
const INDEX_HTML_FILE_ID = ''; // ← Google DriveのファイルIDを入力

function doGet(e) {
  const user = Session.getActiveUser().getEmail();

  // アクセス制限チェック
  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(user)) {
    return HtmlService.createHtmlOutput(
      '<h2 style="font-family:sans-serif;color:#c0392b;">アクセスが許可されていません</h2>' +
      '<p style="font-family:sans-serif;">担当者にお問い合わせください。（' + user + '）</p>'
    );
  }

  // index.html をGASスクリプト内テンプレートから配信する場合
  // ※ GASプロジェクトにindex.htmlを追加し、下記のように返す
  // return HtmlService.createHtmlOutputFromFile('index')
  //   .setTitle('俳句ランダム並び替えアプリ')
  //   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  // Google DriveのHTMLファイルを配信する場合
  if (INDEX_HTML_FILE_ID) {
    const file = DriveApp.getFileById(INDEX_HTML_FILE_ID);
    const content = file.getBlob().getDataAsString();
    return HtmlService.createHtmlOutput(content)
      .setTitle('俳句ランダム並び替えアプリ');
  }

  return HtmlService.createHtmlOutput('<p>INDEX_HTML_FILE_IDを設定してください。</p>');
}
