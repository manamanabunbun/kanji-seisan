const express = require('express');
const router = express.Router();
const db = require('../models/db');

// すべての飲み会を取得
router.get('/', (req, res) => {
  db.all('SELECT * FROM parties ORDER BY date DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 特定の飲み会の詳細を取得（費用、参加者、ランク割合も含む）
router.get('/:id', (req, res) => {
  const partyId = req.params.id;
  
  // 飲み会の基本情報を取得
  db.get('SELECT * FROM parties WHERE id = ?', [partyId], (err, party) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!party) {
      return res.status(404).json({ error: '飲み会情報が見つかりません' });
    }
    
    const result = { ...party, expenses: [], participants: [], rankRates: [] };
    
    // 費用情報を取得
    db.all(`
      SELECT e.*, m.name as payer_name
      FROM expenses e
      JOIN members m ON e.payer_id = m.id
      WHERE e.party_id = ?
    `, [partyId], (err, expenses) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      result.expenses = expenses;
      
      // 参加者情報を取得
      db.all(`
        SELECT m.* 
        FROM participants p
        JOIN members m ON p.member_id = m.id
        WHERE p.party_id = ?
      `, [partyId], (err, participants) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        result.participants = participants;
        
        // ランク別割合を取得
        db.all('SELECT * FROM rank_rates WHERE party_id = ?', [partyId], (err, rankRates) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          result.rankRates = rankRates;
          
          // 計算結果も含める
          calculatePayments(result, (err, paymentResults) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            result.paymentResults = paymentResults;
            res.json(result);
          });
        });
      });
    });
  });
});

// 新しい飲み会を作成
router.post('/', (req, res) => {
  const { name, date, participants, expenses, rankRates } = req.body;
  
  // バリデーション
  if (!name || !date) {
    return res.status(400).json({ error: '飲み会名と日付は必須です' });
  }
  
  // トランザクション開始
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 飲み会の基本情報を保存
    db.run(
      'INSERT INTO parties (name, date) VALUES (?, ?)',
      [name, date],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        const partyId = this.lastID;
        
        // 参加者の登録
        if (participants && participants.length > 0) {
          const stmt = db.prepare('INSERT INTO participants (party_id, member_id) VALUES (?, ?)');
          
          for (const memberId of participants) {
            stmt.run(partyId, memberId, (err) => {
              if (err) {
                console.error('参加者登録エラー:', err.message);
              }
            });
          }
          
          stmt.finalize();
        }
        
        // 費用の登録
        if (expenses && expenses.length > 0) {
          const stmt = db.prepare('INSERT INTO expenses (party_id, name, amount, payer_id) VALUES (?, ?, ?, ?)');
          
          for (const expense of expenses) {
            stmt.run(partyId, expense.name, expense.amount, expense.payer_id, (err) => {
              if (err) {
                console.error('費用登録エラー:', err.message);
              }
            });
          }
          
          stmt.finalize();
        }
        
        // ランク別割合の登録
        if (rankRates && Object.keys(rankRates).length > 0) {
          const stmt = db.prepare('INSERT INTO rank_rates (party_id, rank, rate) VALUES (?, ?, ?)');
          
          for (const [rank, rate] of Object.entries(rankRates)) {
            stmt.run(partyId, rank, rate, (err) => {
              if (err) {
                console.error('ランク割合登録エラー:', err.message);
              }
            });
          }
          
          stmt.finalize();
        }
        
        // トランザクション完了
        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          
          // 作成された飲み会の詳細を返す
          db.get('SELECT * FROM parties WHERE id = ?', [partyId], (err, party) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            res.status(201).json(party);
          });
        });
      }
    );
  });
});

// 飲み会情報の更新
router.put('/:id', (req, res) => {
  const { name, date } = req.body;
  const partyId = req.params.id;
  
  // バリデーション
  if (!name || !date) {
    return res.status(400).json({ error: '飲み会名と日付は必須です' });
  }
  
  db.run(
    'UPDATE parties SET name = ?, date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, date, partyId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '飲み会が見つかりません' });
      }
      
      db.get('SELECT * FROM parties WHERE id = ?', [partyId], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json(row);
      });
    }
  );
});

// 飲み会の削除
router.delete('/:id', (req, res) => {
  const partyId = req.params.id;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 関連データの削除（外部キー制約があるため自動的に削除されるが、念のため）
    db.run('DELETE FROM participants WHERE party_id = ?', [partyId]);
    db.run('DELETE FROM expenses WHERE party_id = ?', [partyId]);
    db.run('DELETE FROM rank_rates WHERE party_id = ?', [partyId]);
    
    // 飲み会本体の削除
    db.run('DELETE FROM parties WHERE id = ?', [partyId], function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: '飲み会が見つかりません' });
      }
      
      db.run('COMMIT', (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ message: '飲み会が削除されました', id: partyId });
      });
    });
  });
});

// 参加者の追加
router.post('/:id/participants', (req, res) => {
  const { memberIds } = req.body;
  const partyId = req.params.id;
  
  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ error: '参加者IDのリストが必要です' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare('INSERT OR IGNORE INTO participants (party_id, member_id) VALUES (?, ?)');
    let success = true;
    
    for (const memberId of memberIds) {
      stmt.run(partyId, memberId, (err) => {
        if (err) {
          console.error('参加者追加エラー:', err.message);
          success = false;
        }
      });
    }
    
    stmt.finalize();
    
    if (!success) {
      db.run('ROLLBACK');
      return res.status(500).json({ error: '参加者の追加中にエラーが発生しました' });
    }
    
    db.run('COMMIT', (err) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      
      // 更新後の参加者一覧を返す
      db.all(`
        SELECT m.* 
        FROM participants p
        JOIN members m ON p.member_id = m.id
        WHERE p.party_id = ?
      `, [partyId], (err, participants) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json(participants);
      });
    });
  });
});

// 参加者の削除
router.delete('/:id/participants/:memberId', (req, res) => {
  const partyId = req.params.id;
  const memberId = req.params.memberId;
  
  db.run(
    'DELETE FROM participants WHERE party_id = ? AND member_id = ?',
    [partyId, memberId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '該当する参加者が見つかりません' });
      }
      
      res.json({ 
        message: '参加者が削除されました', 
        partyId, 
        memberId 
      });
    }
  );
});

// 費用の追加
router.post('/:id/expenses', (req, res) => {
  const { name, amount, payer_id } = req.body;
  const partyId = req.params.id;
  
  // バリデーション
  if (!name || amount === undefined || payer_id === undefined) {
    return res.status(400).json({ error: '費用名、金額、支払者IDは必須です' });
  }
  
  db.run(
    'INSERT INTO expenses (party_id, name, amount, payer_id) VALUES (?, ?, ?, ?)',
    [partyId, name, amount, payer_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const expenseId = this.lastID;
      
      db.get(`
        SELECT e.*, m.name as payer_name
        FROM expenses e
        JOIN members m ON e.payer_id = m.id
        WHERE e.id = ?
      `, [expenseId], (err, expense) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(201).json(expense);
      });
    }
  );
});

// 費用の更新
router.put('/:id/expenses/:expenseId', (req, res) => {
  const { name, amount, payer_id } = req.body;
  const partyId = req.params.id;
  const expenseId = req.params.expenseId;
  
  // バリデーション
  if (!name || amount === undefined || payer_id === undefined) {
    return res.status(400).json({ error: '費用名、金額、支払者IDは必須です' });
  }
  
  db.run(
    'UPDATE expenses SET name = ?, amount = ?, payer_id = ? WHERE id = ? AND party_id = ?',
    [name, amount, payer_id, expenseId, partyId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '該当する費用が見つかりません' });
      }
      
      db.get(`
        SELECT e.*, m.name as payer_name
        FROM expenses e
        JOIN members m ON e.payer_id = m.id
        WHERE e.id = ?
      `, [expenseId], (err, expense) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json(expense);
      });
    }
  );
});

// 費用の削除
router.delete('/:id/expenses/:expenseId', (req, res) => {
  const partyId = req.params.id;
  const expenseId = req.params.expenseId;
  
  db.run(
    'DELETE FROM expenses WHERE id = ? AND party_id = ?',
    [expenseId, partyId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '該当する費用が見つかりません' });
      }
      
      res.json({ 
        message: '費用が削除されました', 
        partyId, 
        expenseId 
      });
    }
  );
});

// ランク別割合の設定
router.post('/:id/rankRates', (req, res) => {
  const rankRates = req.body;
  const partyId = req.params.id;
  
  if (!rankRates || typeof rankRates !== 'object' || Object.keys(rankRates).length === 0) {
    return res.status(400).json({ error: 'ランク別割合が必要です' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 一旦既存のデータを削除
    db.run('DELETE FROM rank_rates WHERE party_id = ?', [partyId]);
    
    const stmt = db.prepare('INSERT INTO rank_rates (party_id, rank, rate) VALUES (?, ?, ?)');
    let success = true;
    
    for (const [rank, rate] of Object.entries(rankRates)) {
      stmt.run(partyId, rank, rate, (err) => {
        if (err) {
          console.error('ランク割合設定エラー:', err.message);
          success = false;
        }
      });
    }
    
    stmt.finalize();
    
    if (!success) {
      db.run('ROLLBACK');
      return res.status(500).json({ error: 'ランク割合の設定中にエラーが発生しました' });
    }
    
    db.run('COMMIT', (err) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      
      // 更新後のランク割合を返す
      db.all('SELECT * FROM rank_rates WHERE party_id = ?', [partyId], (err, rates) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json(rates);
      });
    });
  });
});

// 支払額計算ユーティリティ関数
function calculatePayments(partyData, callback) {
  try {
    const { expenses, participants, rankRates } = partyData;
    
    // 全体の費用を計算
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // ランク別参加者数を集計
    const rankCounts = {};
    participants.forEach(participant => {
      rankCounts[participant.rank] = (rankCounts[participant.rank] || 0) + 1;
    });
    
    // ランク別の割合の合計を確認（100%になっているか）
    const totalRate = rankRates.reduce((sum, rate) => sum + rate.rate, 0);
    
    // 各ランクの支払総額を計算
    const rankTotals = {};
    rankRates.forEach(rate => {
      rankTotals[rate.rank] = totalAmount * (rate.rate / totalRate);
    });
    
    // 各参加者の支払額を計算
    const paymentResults = participants.map(participant => {
      const rank = participant.rank;
      const amountPerPerson = rankCounts[rank] ? rankTotals[rank] / rankCounts[rank] : 0;
      
      // この参加者が支払った総額を計算
      const paidAmount = expenses
        .filter(expense => expense.payer_id === participant.id)
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        member_id: participant.id,
        name: participant.name,
        rank: participant.rank,
        amount_to_pay: Math.round(amountPerPerson),
        paid_amount: paidAmount,
        balance: Math.round(paidAmount - amountPerPerson)
      };
    });
    
    callback(null, paymentResults);
  } catch (err) {
    callback(err);
  }
}

module.exports = router;