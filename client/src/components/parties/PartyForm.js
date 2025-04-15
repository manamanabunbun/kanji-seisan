import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PartyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParty = async () => {
      if (!isEditMode) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/parties/${id}`);
        setFormData({
          name: res.data.name,
          date: new Date(res.data.date).toISOString().split('T')[0]
        });
        setLoading(false);
      } catch (err) {
        console.error('飲み会情報の取得に失敗しました', err);
        setError('飲み会情報の読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchParty();
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
      setError('飲み会名を入力してください');
      return;
    }

    try {
      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/parties/${id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/parties', formData);
      }
      
      // 完了したら飲み会一覧ページに戻る
      navigate('/parties');
    } catch (err) {
      console.error('飲み会保存に失敗しました', err);
      setError('飲み会の保存に失敗しました');
    }
  };

  const handleCancel = () => {
    navigate('/parties');
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  return (
    <div>
      <h2>{isEditMode ? '飲み会編集' : '新規飲み会登録'}</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        <div className="mb-3">
          <label htmlFor="name" className="form-label">飲み会名</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="例：2025年4月飲み会"
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="date" className="form-label">開催日</label>
          <input
            type="date"
            className="form-control"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="alert alert-info mb-3">
          <i className="fas fa-info-circle"></i> 飲み会を作成した後、参加者・費用・ランク別割合を設定できます。
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

export default PartyForm;