import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// コンポーネントのインポート
import Navbar from './components/layout/Navbar';
import Home from './components/pages/Home';
import MemberList from './components/members/MemberList';
import MemberForm from './components/members/MemberForm';
import PartyList from './components/parties/PartyList';
import PartyForm from './components/parties/PartyForm';
import PartyDetail from './components/parties/PartyDetail';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container py-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/members" element={<MemberList />} />
            <Route path="/members/add" element={<MemberForm />} />
            <Route path="/members/edit/:id" element={<MemberForm />} />
            <Route path="/parties" element={<PartyList />} />
            <Route path="/parties/add" element={<PartyForm />} />
            <Route path="/parties/edit/:id" element={<PartyForm />} />
            <Route path="/parties/:id" element={<PartyDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
