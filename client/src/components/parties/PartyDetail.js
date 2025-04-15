import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PartyDetail = () => {
  const { id } = useParams();
  
  const [partyData, setPartyData] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 編集モード用の状態
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);
  
  // フォーム用の状態
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    payer_id: ''
  });
  const [rankRates, setRankRates] = useState({});
  const [availableRanks, setAvailableRanks] = useState([]);
  const [remainingPercentage, setRemainingPercentage] = useState(100);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // パーティ詳細データを取得
        const partyRes = await axios.get(`http://localhost:5000/api/parties/${id}`);
        setPartyData(partyRes.data);
        
        // 全メンバーのリストを取得
        const membersRes = await axios.get('http://localhost:5000/api/members');
        setAllMembers(membersRes.data);
        
        // ランク別割合の初期値設定
        const rates = {};
        partyRes.data.rankRates.forEach(rate => {
          rates[rate.rank] = rate.rate;
        });
        setRankRates(rates);
        
        // 参加者のランクを取得してソート
        const ranks = Array.from(new Set(partyRes.data.participants.map(p => p.rank))).sort((a, b) => a - b);
        setAvailableRanks(ranks);
        
        // 残りの割合を計算
        if (Object.keys(rates).length > 0) {
          const usedPercentage = Object.values(rates).reduce((sum, rate) => sum + parseFloat(rate), 0);
          setRemainingPercentage(100 - usedPercentage);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('データの取得に失敗しました', err);
        setError('データの読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 日付のフォーマット
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString('ja-JP', options);
  };

  // メンバー追加処理
  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/parties/${id}/participants`, {
        memberIds: selectedMembers
      });
      
      // データを再取得
      const res = await axios.get(`http://localhost:5000/api/parties/${id}`);
      setPartyData(res.data);
      setShowMemberSelector(false);
      setSelectedMembers([]);
    } catch (err) {
      console.error('参加者の追加に失敗しました', err);
      setError('参加者の追加に失敗しました');
    }
  };

  // メンバー削除処理
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('このメンバーを参加者から削除しますか？')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/parties/${id}/participants/${memberId}`);
      
      // データを再取得
      const res = await axios.get(`http://localhost:5000/api/parties/${id}`);
      setPartyData(res.data);
    } catch (err) {
      console.error('参加者の削除に失敗しました', err);
      setError('参加者の削除に失敗しました');
    }
  };

  // 費用追加処理
  const handleAddExpense = async (e) => {
    e.preventDefault();
    
    if (!newExpense.name || !newExpense.amount || !newExpense.payer_id) {
      setError('全ての項目を入力してください');
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/parties/${id}/expenses`, {
        name: newExpense.name,
        amount: parseInt(newExpense.amount, 10),
        payer_id: parseInt(newExpense.payer_id, 10)
      });
      
      // データを再取得
      const res = await axios.get(`http://localhost:5000/api/parties/${id}`);
      setPartyData(res.data);
      setShowExpenseForm(false);
      setNewExpense({ name: '', amount: '', payer_id: '' });
    } catch (err) {
      console.error('費用の追加に失敗しました', err);
      setError('費用の追加に失敗しました');
    }
  };

  // 費用削除処理
  const handleRemoveExpense = async (expenseId) => {
    if (!window.confirm('この費用を削除しますか？')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/parties/${id}/expenses/${expenseId}`);
      
      // データを再取得
      const res = await axios.get(`http://localhost:5000/api/parties/${id}`);
      setPartyData(res.data);
    } catch (err) {
      console.error('費用の削除に失敗しました', err);
      setError('費用の削除に失敗しました');
    }
  };

  // ランク別割合の保存
  const handleSaveRates = async () => {
    try {
      await axios.post(`http://localhost:5000/api/parties/${id}/rankRates`, rankRates);
      
      // データを再取得
      const res = await axios.get(`http://localhost:5000/api/parties/${id}`);
      setPartyData(res.data);
      setShowRateForm(false);
    } catch (err) {
      console.error('ランク別割合の保存に失敗しました', err);
      setError('ランク別割合の保存に失敗しました');
    }
  };

  // スライダーでのランク割合変更処理
  const handleRankSliderChange = (rank, value) => {
    // パーセント値に変換
    const newPercentage = parseFloat(value);
    
    // 現在の全ランクの配列と値を取得
    const currentRanks = [...availableRanks];
    const currentRankIndex = currentRanks.indexOf(rank);
    const updatedRates = { ...rankRates };
    
    // 変更対象のランクの割合を設定
    updatedRates[rank] = newPercentage;
    
    // 変更されたランクより大きいランクに残りの割合を均等に分配
    if (currentRankIndex < currentRanks.length - 1) {
      // このランクと前のランクの合計割合
      const usedPercentage = currentRanks
        .filter(r => r <= rank)
        .reduce((sum, r) => sum + parseFloat(updatedRates[r] || 0), 0);
      
      // 残りの割合
      const remaining = 100 - usedPercentage;
      setRemainingPercentage(remaining);
      
      // 残りのランク数
      const remainingRanks = currentRanks.filter(r => r > rank);
      const countRemainingRanks = remainingRanks.length;
      
      if (countRemainingRanks > 0) {
        // 残りを均等に分配
        const equalShare = remaining / countRemainingRanks;
        
        remainingRanks.forEach(r => {
          updatedRates[r] = equalShare;
        });
      }
    } else {
      // 最後のランクの場合、調整して合計が100%になるようにする
      const otherRanksTotal = currentRanks
        .filter(r => r !== rank)
        .reduce((sum, r) => sum + parseFloat(updatedRates[r] || 0), 0);
      
      if (newPercentage + otherRanksTotal > 100) {
        updatedRates[rank] = 100 - otherRanksTotal;
      }
    }
    
    setRankRates(updatedRates);
  };

  // 入力フォームの変更ハンドラー
  const handleExpenseChange = (e) => {
    setNewExpense({
      ...newExpense,
      [e.target.name]: e.target.value
    });
  };

  const handleRateChange = (rank, value) => {
    setRankRates({
      ...rankRates,
      [rank]: parseFloat(value)
    });
  };

  const handleMemberSelectionChange = (e) => {
    const memberId = parseInt(e.target.value, 10);
    
    if (e.target.checked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!partyData) {
    return <div className="alert alert-warning">飲み会データが見つかりません</div>;
  }

  // 総額計算
  const totalAmount = partyData.expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // 未選択のメンバーのみを表示するフィルタ
  const availableMembers = allMembers.filter(
    member => !partyData.participants.some(p => p.id === member.id)
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{partyData.name}</h2>
        <Link to="/parties" className="btn btn-outline-secondary">
          ← 一覧に戻る
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          飲み会情報
        </div>
        <div className="card-body">
          <p><strong>開催日:</strong> {formatDate(partyData.date)}</p>
          <p><strong>総額:</strong> {totalAmount.toLocaleString()}円</p>
        </div>
      </div>

      {/* 参加者セクション */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">参加者一覧</h5>
          <button 
            className="btn btn-sm btn-outline-primary" 
            onClick={() => setShowMemberSelector(!showMemberSelector)}
          >
            {showMemberSelector ? 'キャンセル' : '参加者を追加'}
          </button>
        </div>
        
        {showMemberSelector && (
          <div className="card-body border-bottom">
            <h6>追加するメンバーを選択</h6>
            
            {availableMembers.length === 0 ? (
              <p className="text-muted">追加できるメンバーがいません</p>
            ) : (
              <div>
                <div className="row mb-3">
                  {availableMembers.map(member => (
                    <div key={member.id} className="col-md-4 mb-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`member-${member.id}`}
                          value={member.id}
                          onChange={handleMemberSelectionChange}
                          checked={selectedMembers.includes(member.id)}
                        />
                        <label className="form-check-label" htmlFor={`member-${member.id}`}>
                          {member.name} (ランク{member.rank})
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleAddMembers}
                  disabled={selectedMembers.length === 0}
                >
                  選択したメンバーを追加
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="card-body">
          {partyData.participants.length === 0 ? (
            <p className="text-muted">参加者がまだ登録されていません</p>
          ) : (
            <div className="row">
              {partyData.participants.map(member => (
                <div key={member.id} className="col-md-4 mb-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{member.name} (ランク{member.rank})</span>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 費用セクション */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">費用一覧</h5>
          <button 
            className="btn btn-sm btn-outline-primary" 
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            disabled={partyData.participants.length === 0}
          >
            {showExpenseForm ? 'キャンセル' : '費用を追加'}
          </button>
        </div>
        
        {showExpenseForm && (
          <div className="card-body border-bottom">
            <h6>新規費用を追加</h6>
            <form onSubmit={handleAddExpense}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="expense-name" className="form-label">項目名</label>
                  <input
                    type="text"
                    className="form-control"
                    id="expense-name"
                    name="name"
                    value={newExpense.name}
                    onChange={handleExpenseChange}
                    placeholder="例：1次会"
                    required
                  />
                </div>
                
                <div className="col-md-4">
                  <label htmlFor="expense-amount" className="form-label">金額（円）</label>
                  <input
                    type="number"
                    className="form-control"
                    id="expense-amount"
                    name="amount"
                    value={newExpense.amount}
                    onChange={handleExpenseChange}
                    placeholder="例：10000"
                    required
                  />
                </div>
                
                <div className="col-md-4">
                  <label htmlFor="expense-payer" className="form-label">支払者</label>
                  <select
                    className="form-select"
                    id="expense-payer"
                    name="payer_id"
                    value={newExpense.payer_id}
                    onChange={handleExpenseChange}
                    required
                  >
                    <option value="">支払者を選択</option>
                    {partyData.participants.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-3">
                <button type="submit" className="btn btn-primary btn-sm">
                  費用を追加
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="card-body">
          {partyData.expenses.length === 0 ? (
            <p className="text-muted">費用がまだ登録されていません</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>項目</th>
                    <th>金額</th>
                    <th>支払者</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {partyData.expenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{expense.name}</td>
                      <td>{expense.amount.toLocaleString()}円</td>
                      <td>{expense.payer_name}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveExpense(expense.id)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="table-light fw-bold">
                    <td>合計</td>
                    <td colSpan="3">{totalAmount.toLocaleString()}円</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ランク別割合セクション */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">ランク別負担割合</h5>
          <button 
            className="btn btn-sm btn-outline-primary" 
            onClick={() => setShowRateForm(!showRateForm)}
          >
            {showRateForm ? 'キャンセル' : '割合を編集'}
          </button>
        </div>
        
        <div className="card-body">
          {showRateForm ? (
            <div>
              <div className="row mb-3">
                {/* 参加しているランクだけ表示（低いランクから順に） */}
                {availableRanks.map((rank, index) => (
                  <div key={rank} className="col-12 mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label htmlFor={`rate-slider-${rank}`} className="form-label mb-0">
                        ランク {rank} の負担割合
                      </label>
                      <span className="badge bg-primary">{(rankRates[rank] || 0).toFixed(1)}%</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <input
                        type="range"
                        className="form-range flex-grow-1 me-2"
                        id={`rate-slider-${rank}`}
                        min="0"
                        max="100"
                        step="0.1"
                        value={rankRates[rank] || 0}
                        onChange={(e) => handleRankSliderChange(rank, e.target.value)}
                      />
                    </div>
                    
                    {index < availableRanks.length - 1 && (
                      <div className="mt-1 text-muted small">
                        残り: {index === availableRanks.length - 2 ? 
                          (100 - (availableRanks.slice(0, index + 1).reduce((sum, r) => sum + parseFloat(rankRates[r] || 0), 0))).toFixed(1) : 
                          '自動分配'
                        }%
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="alert alert-info">
                <small>
                  スライダーを動かして各ランクの負担割合を設定してください。ランクが低い順に設定すると、
                  残りの割合は高いランクに自動的に分配されます。すべての合計は100%になります。
                </small>
              </div>
              
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleSaveRates}
              >
                割合を保存
              </button>
            </div>
          ) : (
            <div>
              {partyData.rankRates.length === 0 ? (
                <p className="text-muted">ランク別割合がまだ設定されていません</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>ランク</th>
                        <th>負担割合</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partyData.rankRates.sort((a, b) => a.rank - b.rank).map(rate => (
                        <tr key={rate.id}>
                          <td>ランク {rate.rank}</td>
                          <td>{rate.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 計算結果セクション */}
      {partyData.participants.length > 0 && partyData.expenses.length > 0 && partyData.rankRates.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">精算結果</h5>
          </div>
          
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>メンバー</th>
                    <th>ランク</th>
                    <th>支払金額</th>
                    <th>支払済</th>
                    <th>差額</th>
                  </tr>
                </thead>
                <tbody>
                  {partyData.paymentResults.map(result => (
                    <tr key={result.member_id} className={result.balance < 0 ? 'table-danger' : (result.balance > 0 ? 'table-success' : '')}>
                      <td>{result.name}</td>
                      <td>{result.rank}</td>
                      <td>{result.amount_to_pay.toLocaleString()}円</td>
                      <td>{result.paid_amount.toLocaleString()}円</td>
                      <td className="fw-bold">{result.balance.toLocaleString()}円</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="alert alert-info mt-3">
              <p className="mb-0">
                <strong>精算方法：</strong> 差額がマイナスの人は、その金額を支払う必要があります。
                差額がプラスの人は、その金額を受け取る必要があります。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartyDetail;