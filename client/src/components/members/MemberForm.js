import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const MemberForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    rank: 1
  });
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMember = async () => {
      if (!isEditMode) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/members/${id}`);
        setFormData({
          name: res.data.name,
          rank: res.data.rank
        });
        setLoading(false);
      } catch (err) {
        console.error('メンバー情報の取得に失敗しました', err);
        setError('メンバー情報の読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchMember();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 入力値の検証
    if (!formData.name.trim()) {
      setError('名前を入力してください');
      return;
    }

    try {
      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/members/${id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/members', formData);
      }
      
      // 完了したらメンバー一覧ページに戻る
      navigate('/members');
    } catch (err) {
      console.error('メンバー保存に失敗しました', err);
      setError('メンバーの保存に失敗しました');
    }
  };

  const handleCancel = () => {
    navigate('/members');
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  return (
    <div>
      <h2>{isEditMode ? 'メンバー編集' : '新規メンバー登録'}</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        <div className="mb-3">
          <label htmlFor="name" className="form-label">名前</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="名前を入力"
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="rank" className="form-label">ランク</label>
          <select
            className="form-select"
            id="rank"
            name="rank"
            value={formData.rank}
            onChange={handleChange}
            required
          >
            <option value="1">ランク 1</option>
            <option value="2">ランク 2</option>
            <option value="3">ランク 3</option>
            <option value="4">ランク 4</option>
            <option value="5">ランク 5</option>
          </select>
          <div className="form-text">ランクによって飲み会時の支払い割合が異なります</div>
        </div>
        
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>
            キャンセル
          </button>
          <button type="submit" className="btn btn-primary">
            {isEditMode ? '更新' : '登録'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;