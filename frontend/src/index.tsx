import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RequestDetail from './pages/RequestDetail';
import HRDashboard from './pages/HRDashboard';
import { AuthForm } from './components/AuthForm';
import './index.css';

function App(){
  const [user, setUser] = React.useState<any>(null);
  React.useEffect(()=>{
    const raw = localStorage.getItem('user');
    if(raw) setUser(JSON.parse(raw));
  },[]);
  if(!user) return <AuthForm onLogin={(u:any)=>{ setUser(u); localStorage.setItem('user', JSON.stringify(u)); }} />;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/hr" element={<HRDashboard/>} />
        <Route path="/requests/:id" element={<RequestDetail/>} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<App />);