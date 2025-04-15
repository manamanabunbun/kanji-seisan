const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 全メンバーの取得
router.get('/', (req, res) => {
  db.all('SELECT * FROM members ORDER BY name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 特定のメンバーの取得
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM members WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'メンバーが見つかりません' });
    }
    res.json(row);
  });
});

// 新規メンバーの追加
router.post('/', (req, res) => {
  const { name, rank } = req.body;
  
  // 入力バリデーション
  if (!name || rank === undefined) {
    return res.status(400).json({ error: '名前とランクは必須項目です' });
  }
  
  db.run(
    'INSERT INTO members (name, rank) VALUES (?, ?)',
    [name, rank],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 追加されたメンバー情報を返す
      db.get('SELECT * FROM members WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(row);
      });
    }
  );
});

// メンバー情報の更新
router.put('/:id', (req, res) => {
  const { name, rank } = req.body;
  
  // 入力バリデーション
  if (!name || rank === undefined) {
    return res.status(400).json({ error: '名前とランクは必須項目です' });
  }
  
  db.run(
    'UPDATE members SET name = ?, rank = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, rank, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'メンバーが見つかりません' });
      }
      
      // 更新されたメンバー情報を返す
      db.get('SELECT * FROM members WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(row);
      });
    }
  );
});

// メンバーの削除
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM members WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'メンバーが見つかりません' });
    }
    
    res.json({ message: 'メンバーが削除されました', id: req.params.id });
  });
});

module.exports = router;