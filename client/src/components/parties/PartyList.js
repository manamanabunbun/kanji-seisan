import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PartyList = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/parties');
        setParties(res.data);
        setLoading(false);
      } catch (err) {
        console.error('飲み会データの取得に失敗しました', err);
        setError('飲み会リストの読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchParties();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('この飲み会データを削除してもよろしいですか？')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/parties/${id}`);
      setParties(parties.filter(party => party.id !== id));
    } catch (err) {
      console.error('飲み会の削除に失敗しました', err);
      setError('飲み会の削除に失敗しました');
    }
  };

  // 日付のフォーマット
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ja-JP', options);
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>飲み会一覧</h2>
        <Link to="/parties/add" className="btn btn-success">
          <i className="fas fa-plus"></i> 新規飲み会登録
        </Link>
      </div>

      {parties.length === 0 ? (
        <div className="alert alert-info">
          飲み会がまだ登録されていません。「新規飲み会登録」から登録してください。
        </div>
      ) : (
        <div className="row">
          {parties.map(party => (
            <div key={party.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{party.name}</h5>
                  <p className="card-text">
                    <strong>開催日:</strong> {formatDate(party.date)}
                  </p>
                </div>
                <div className="card-footer bg-transparent d-flex justify-content-between">
                  <Link to={`/parties/${party.id}`} className="btn btn-sm btn-primary">
                    詳細・計算
                  </Link>
                  <div>
                    <Link to={`/parties/edit/${party.id}`} className="btn btn-sm btn-outline-secondary me-2">
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(party.id)}
                      className="btn btn-sm btn-outline-danger"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartyList;