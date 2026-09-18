# My Sites v1.4

v0.3をベースに、Safariなどの共有メニューからURLを受け取って登録画面へ渡す仕組み（Web Share Target）を追加しました。

## 使い方
1. GitHub Pages等で公開
2. iPhoneのSafariでMy Sitesを開く
3. 「ホーム画面に追加」してPWAとしてインストール
4. Safariで登録したいサイトを開く
5. 共有 → My Sites
6. My Sitesが開き、URLと共有されたタイトルを登録フォームに入れます
7. カテゴリ・タグ等を設定して保存

※ iOS/SafariのバージョンやPWAの状態によって、共有先として表示されない場合があります。その場合はMy Sitesを通常どおり開いて「＋登録」を使ってください。

## ChatGPT共有
「ChatGPTに変更分を共有」は前回同期以降に変更されたサイトだけをJSONにします。「全データを共有」は登録済みサイト全件をJSONにします。対応環境では共有シートを利用し、それ以外ではJSONファイルを保存します。

## 保存
サイトデータはIndexedDBに端末内保存します。クラウドDBや課金APIは使用していません。


## v0.7 ChatGPT連携
ChatGPT側で作成したサイト情報を `?add=` URLでMy Sitesへ渡せます。
My Sitesは起動時に登録内容を確認し、承認するとIndexedDBへ保存します。
同じURLが登録済みなら、既存データを更新できます。

PayloadはUTF-8 JSONをURL-safe Base64化しています。


## v0.7 追加
- Safari等の共有から `url/title/text` を受け取って登録フォームを開く処理を追加
- ChatGPT登録リンクとの併用に対応


## v0.7
- ChatGPTに全データを共有するファイル共有に加え、ChatGPTへ貼り付けるJSONをクリップボードへコピーできます。
- iPad/iPhoneでは「📋 ChatGPT用データをコピー」を押し、ChatGPTのチャットに貼り付けてください。
- データは引き続きブラウザ内のIndexedDBに保存されます。


## v0.8
- 「ChatGPT検索用プロンプトをコピー」を追加しました。
- My Sitesの全登録データと、質問を書き込むためのテンプレートを一度にコピーできます。
- ChatGPT側では貼り付けた登録データだけを使って、カテゴリ・タグ・説明・メモなどから検索できます。
- v0.7までのSafari共有、ChatGPTからの `?add=` 登録、JSON共有、IndexedDB保存は維持しています。


## ChatGPTからMy Sitesへの登録（v1.0）
My Sitesは `?add=` パラメータで登録データを受け取り、登録画面へ渡せます。
ChatGPT側でURL・サイト名・説明などを含む登録データを生成し、その登録リンクを開くことで、My Sites側で確認して保存できます。


## v1.1
ChatGPTから渡された登録データを、先にlocalStorageへ保留保存してから登録画面へ渡す処理を追加しました。
ホーム画面に追加したPWAとして同じオリジンで開いた場合も、受信データを再表示時に復元しやすくしています。


## v1.2
ChatGPTからの登録依頼を「受信箱」として保持し、My Sites側で確認して登録画面へ渡す仕組みを追加しました。
また、PWAのService Workerキャッシュ名をv1.2へ更新し、古いv0.xキャッシュを削除する処理を追加しています。
iOSではSafariとホーム画面PWAのストレージが分離される場合があるため、ChatGPTから受信した情報はMy Sites側で開いたコンテキストに引き渡して確認・保存する設計です。


## v1.4
ChatGPTから「登録コード」をコピーし、ホーム画面のMy Sites自身でコードを貼り付けてIndexedDBへ保存する方式を追加しました。Safariとホーム画面PWAのストレージ分離の影響を受けにくい設計です。


## v1.4
ChatGPTからMy Sitesへの登録コードを平文JSONで受け取れるようにしました。iOSでのBase64/UTF-8コピー問題を避けるため、今後はMYSITES1:の後ろにJSONをそのまま貼り付ける形式を推奨します。旧Base64URL形式と従来の登録リンクも引き続き読み込めます。


## v1.4 追加・変更
- 「ChatGPTから登録」で、URL-safe Base64だけでなく平文JSONをそのまま貼り付けて登録できます。
- `MYSITES1:` + JSON 形式にも対応しています。
- 旧バージョンのBase64形式も引き続き読み込めます。
- ChatGPTから登録する際の処理は、インストール済みPWA側でIndexedDBへ保存します。
- Service Workerのキャッシュ名をv1.4へ更新し、古いキャッシュを削除して新しいファイルを有効化します。
