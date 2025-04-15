import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MemberList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/members');
        setMembers(res.data);
        setLoading(false);
      } catch (err) {
        console.error('メンバーデータの取得に失敗しました', err);
        setError('メンバーリストの読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('このメンバーを削除してもよろしいですか？')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/members/${id}`);
      setMembers(members.filter(member => member.id !== id));
    } catch (err) {
      console.error('メンバーの削除に失敗しました', err);
      setError('メンバーの削除に失敗しました');
    }
  };

  const getRankLabel = (rank) => {
    return `ランク ${rank}`;
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
        <h2>メンバー一覧</h2>
        <Link to="/members/add" className="btn btn-success">
          <i className="fas fa-plus"></i> 新規メンバー追加
        </Link>
      </div>

      {members.length === 0 ? (
        <div className="alert alert-info">
          メンバーがまだ登録されていません。「新規メンバー追加」から登録してください。
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>名前</th>
                <th>ランク</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{getRankLabel(member.rank)}</td>
                  <td>
                    <Link to={`/members/edit/${member.id}`} className="btn btn-sm btn-outline-primary me-2">
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="btn btn-sm btn-outline-danger"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MemberList;