const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// データベース接続のセットアップ
const db = require('./models/db');

// ルーター読み込み
const membersRouter = require('./routes/members');
const partiesRouter = require('./routes/parties');

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェアの設定
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// APIルート
app.use('/api/members', membersRouter);
app.use('/api/parties', partiesRouter);

// 本番環境用の静的ファイル配信設定
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました - ポート: ${PORT}`);
});

// 未処理のエラーハンドリング
process.on('unhandledRejection', (err) => {
  console.log('未処理のエラー:', err);
});