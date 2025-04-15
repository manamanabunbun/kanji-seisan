import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="text-center">
      <div className="py-5">
        <h1 className="display-4">飲み会精算アプリ</h1>
        <p className="lead">メンバーのランクに応じた傾斜をつけて飲み会の精算を簡単に</p>
        <hr className="my-4" />
        <p>メンバー管理、飲み会の登録、費用計算など幹事業務をサポートします</p>
      </div>
      
      <div className="row mt-4">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">メンバー管理</h5>
              <p className="card-text">飲み会に参加するメンバーの登録・編集ができます。各メンバーにランクを設定して精算時の傾斜配分を調整できます。</p>
              <Link to="/members" className="btn btn-primary">メンバー一覧へ</Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">飲み会管理</h5>
              <p className="card-text">飲み会の登録・費用入力・精算結果の計算ができます。ランクごとの負担割合を自由に設定可能です。</p>
              <Link to="/parties" className="btn btn-primary">飲み会一覧へ</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;