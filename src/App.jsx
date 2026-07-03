import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [view, setView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Fetch workers from Cloud Database
  const fetchWorkers = async () => {
    const { data, error } = await supabase.from('workers').select('*');
    if (!error) setWorkers(data);
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // --- AUTHENTICATION LOGIC ---
  const handleRegister = async (data) => {
    // Security: Only allow Admin if the secret code is entered
    const isAdmin = data.adminCode === 'SECRET_ADMIN_2024'; 
    const role = isAdmin ? 'Admin' : 'Worker';

    const { data: existing } = await supabase.from('workers').select('*').eq('email', data.email);
    if (existing && existing.length > 0) {
      showToast('Email already registered. Please login.');
      return setView('login');
    }

    const { data: newWorker, error } = await supabase.from('workers').insert([{
      name: data.name, email: data.email, phone: data.phone, role: role,
      profession: data.profession, city: data.city, language: data.language,
      salary: data.salary, score: 50, verified: false, active: true, certificates: []
    }]).single();

    if (error) return showToast('Error registering: ' + error.message);
    
    setCurrentUser(newWorker);
    setView(role === 'Admin' ? 'adminDashboard' : 'workerDashboard');
    showToast('Account created successfully in the cloud!');
    fetchWorkers();
  };

  const handleLogin = async (email) => {
    const { data, error } = await supabase.from('workers').select('*').eq('email', email).single();
    if (error || !data) return showToast('User not found. Please register.');
    
    setCurrentUser(data);
    setView(data.role === 'Admin' ? 'adminDashboard' : 'workerDashboard');
    showToast('Logged in successfully.');
  };

  const logout = () => { setCurrentUser(null); setView('landing'); };

  // --- WORKER LOGIC (Salary, Certificates, Location) ---
  const updateWorkerProfile = async (updatedData) => {
    const { data, error } = await supabase.from('workers').update(updatedData).eq('id', currentUser.id).select().single();
    if (error) return showToast('Update failed: ' + error.message);
    
    setCurrentUser(data);
    showToast('Profile updated successfully in cloud!');
    fetchWorkers();
  };

  // --- ADMIN LOGIC ---
  const toggleVerification = async (id, currentStatus) => {
    await supabase.from('workers').update({ verified: !currentStatus }).eq('id', id);
    showToast('Worker verification status updated.');
    fetchWorkers();
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {toast && <div className="fixed top-5 right-5 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}
      
      {view !== 'landing' && view !== 'login' && view !== 'register' && (
        <Navbar currentUser={currentUser} setView={setView} logout={logout} />
      )}

      {view === 'landing' && <Landing setView={setView} />}
      {view === 'login' && <Login handleLogin={handleLogin} setView={setView} />}
      {view === 'register' && <Register handleRegister={handleRegister} setView={setView} />}
      
      {view === 'browse' && <Browse workers={workers} showToast={showToast} />}
      {view === 'workerDashboard' && currentUser && (
        <WorkerDashboard user={currentUser} updateWorkerProfile={updateWorkerProfile} showToast={showToast} />
      )}
      {view === 'adminDashboard' && currentUser && (
        <AdminDashboard workers={workers} toggleVerification={toggleVerification} />
      )}
    </div>
  );
}

// --- COMPONENTS ---

const Navbar = ({ currentUser, setView, logout }) => (
  <nav className="bg-white shadow-sm border-b border-slate-200">
    <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('browse')}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">G</div>
        <h1 className="text-xl font-bold text-slate-900">Get Your Employee</h1>
      </div>
      <div className="flex items-center space-x-4">
        {currentUser?.role === 'Admin' ? (
          <button onClick={() => setView('adminDashboard')} className="text-sm font-medium hover:text-blue-600">Admin Panel</button>
        ) : (
          <button onClick={() => setView('browse')} className="text-sm font-medium hover:text-blue-600">Browse Workers</button>
        )}
        {currentUser?.role !== 'Admin' && <button onClick={() => setView('workerDashboard')} className="text-sm font-medium hover:text-blue-600">My Profile</button>}
        <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
      </div>
    </div>
  </nav>
);

const Landing = ({ setView }) => (
  <div className="bg-gradient-to-b from-blue-50 to-white py-20 text-center px-4">
    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Find Trusted Local Workers, <span className="text-blue-600">Fast.</span></h1>
    <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">Cloud-based platform. Live location tracking, Certificate verification, and Language-aware matching.</p>
    <div className="mt-10 flex justify-center space-x-4">
      <button onClick={() => setView('register')} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Get Started</button>
      <button onClick={() => setView('login')} className="px-8 py-3 bg-white border text-slate-700 font-semibold rounded-lg hover:bg-slate-50">Login</button>
    </div>
  </div>
);

const AuthShell = ({ children, title }) => (
  <div className="flex items-center justify-center py-12 px-4">
    <div className="max-w-md w-full bg-white p-8 border border-slate-200 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">{title}</h2>
      {children}
    </div>
  </div>
);

const Login = ({ handleLogin, setView }) => {
  const [email, setEmail] = useState('');
  return (
    <AuthShell title="Welcome Back">
      <form onSubmit={(e) => { e.preventDefault(); handleLogin(email); }} className="space-y-4">
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="Email Address" />
        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md">Sign In</button>
        <p className="text-center text-sm text-slate-500">No account? <button type="button" onClick={() => setView('register')} className="text-blue-600">Register</button></p>
      </form>
    </AuthShell>
  );
};

const Register = ({ handleRegister, setView }) => {
  const [data, setData] = useState({ name: '', email: '', phone: '', profession: '', city: 'Mumbai', language: 'Both', salary: 20, adminCode: '' });
  return (
    <AuthShell title="Create an Account">
      <form onSubmit={(e) => { e.preventDefault(); handleRegister(data); }} className="space-y-4">
        <input required type="text" placeholder="Full Name" onChange={e => setData({...data, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
        <input required type="email" placeholder="Email Address" onChange={e => setData({...data, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
        <input required type="tel" placeholder="Phone Number (+91...)" onChange={e => setData({...data, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
        <input required type="text" placeholder="Profession (e.g., Plumber)" onChange={e => setData({...data, profession: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
        <select value={data.city} onChange={e => setData({...data, city: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-white">
          <option>Mumbai</option><option>Delhi</option><option>Pune</option>
        </select>
        <select value={data.language} onChange={e => setData({...data, language: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-white">
          <option>Native</option><option>English</option><option>Both</option>
        </select>
        <input required type="number" placeholder="Expected Salary ($/hr)" value={data.salary} onChange={e => setData({...data, salary: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-md" />
        
        {/* Hidden Admin Access */}
        <input type="text" placeholder="Admin Access Code (Leave blank if Worker)" value={data.adminCode} onChange={e => setData({...data, adminCode: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-slate-50 text-slate-500 italic" />
        
        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md">Register to Cloud</button>
        <p className="text-center text-sm text-slate-500">Have an account? <button type="button" onClick={() => setView('login')} className="text-blue-600">Login</button></p>
      </form>
    </AuthShell>
  );
};

const Browse = ({ workers, showToast }) => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold text-slate-900 mb-6">Browse Verified Workers</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {workers.map(worker => (
        <div key={worker.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-lg">{worker.name}</h3>
            {worker.verified ? <span className="bg-green-100 text-green-700 px-2 py-1 text-xs font-bold rounded-full">Verified</span> : <span className="bg-slate-100 text-slate-500 px-2 py-1 text-xs font-bold rounded-full">Unverified</span>}
          </div>
          <p className="text-slate-600 text-sm mb-4">{worker.profession} in {worker.city}</p>
          
          {worker.lat && worker.lng && (
            <a href={`https://maps.google.com/?q=${worker.lat},${worker.lng}`} target="_blank" rel="noreferrer" className="text-blue-600 text-sm mb-4 flex items-center gap-2">
              📍 Live Location Shared (Click to track)
            </a>
          )}

          <div className="border-t pt-4 mt-auto flex justify-between items-center">
            <span className="text-sm font-bold text-blue-600">{worker.certificates?.length || 0} Certificates</span>
            <span className="font-bold text-slate-900">${worker.salary}/hr</span>
          </div>
          <button onClick={() => showToast('Contact request sent!')} className="mt-4 py-2 bg-blue-600 text-white text-sm rounded-md">Request Contact</button>
        </div>
      ))}
    </div>
  </div>
);

const WorkerDashboard = ({ user, updateWorkerProfile, showToast }) => {
  const [certName, setCertName] = useState('');
  const [editData, setEditData] = useState({ salary: user.salary, bio: user.bio || '' });

  const handleAddCertificate = async (e) => {
    e.preventDefault();
    if (!certName) return;
    const updatedCerts = [...(user.certificates || []), certName];
    const newScore = Math.min(100, user.score + 10); // Increase score by 10 per cert, max 100
    await updateWorkerProfile({ certificates: updatedCerts, score: newScore });
    setCertName('');
    showToast(`Certificate added! Rating increased to ${newScore}.`);
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) return showToast('Geolocation not supported.');
    showToast('Fetching live location...');
    navigator.geolocation.getCurrentPosition(async (position) => {
      await updateWorkerProfile({ lat: position.coords.latitude, lng: position.coords.longitude });
      showToast('Uber-like Live Location shared with employers!');
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-slate-500">{user.profession} • {user.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Profile Score</p>
            <p className="text-3xl font-bold text-blue-600">{user.score}/100</p>
          </div>
        </div>
      </div>

      {/* Uber-like Location Tracking */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h4 className="text-xl font-bold mb-2">Live Location Sharing</h4>
        <p className="text-slate-500 text-sm mb-4">Allow employers to track your live location (Uber-style) when en route.</p>
        <button onClick={handleShareLocation} className="py-2 px-6 bg-black text-white rounded-md font-medium flex items-center gap-2">
          📍 Share Live Location
        </button>
        {user.lat && <p className="mt-4 text-sm text-green-600 font-medium">Location Active: Lat {user.lat.toFixed(2)}, Lng {user.lng.toFixed(2)}</p>}
      </div>

      {/* Certificate Upload */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h4 className="text-xl font-bold mb-2">Certificates & Merits</h4>
        <p className="text-slate-500 text-sm mb-4">Add certificates to increase your trust score (+10 points each).</p>
        
        <form onSubmit={handleAddCertificate} className="flex gap-2 mb-4">
          <input type="text" placeholder="e.g., Diploma in Electrical Engineering" value={certName} onChange={e => setCertName(e.target.value)} className="flex-1 px-3 py-2 border rounded-md" />
          <button type="submit" className="py-2 px-4 bg-green-600 text-white rounded-md">Add & Boost Rating</button>
        </form>

        <ul className="space-y-2">
          {user.certificates?.map((cert, i) => (
            <li key={i} className="bg-slate-50 p-3 rounded-md flex items-center gap-2 text-sm">
              📜 <span className="font-medium">{cert}</span>
            </li>
          ))}
          {(!user.certificates || user.certificates.length === 0) && <p className="text-sm text-slate-400">No certificates added yet.</p>}
        </ul>
      </div>

      {/* Salary Adjustment */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h4 className="text-xl font-bold mb-4">Salary & Bio Adjustment</h4>
        <form onSubmit={(e) => { e.preventDefault(); updateWorkerProfile(editData); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Salary Expectation ($/hr)</label>
            <input type="number" value={editData.salary} onChange={e => setEditData({...editData, salary: parseInt(e.target.value)})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Bio</label>
            <textarea rows="3" value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
          </div>
          <button type="submit" className="py-2 px-6 bg-blue-600 text-white rounded-md">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = ({ workers, toggleVerification }) => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold text-slate-900 mb-6">Admin Moderation Queue</h2>
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Worker</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Score / Certs</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {workers.map(w => (
            <tr key={w.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{w.name}<br/>{w.profession}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{w.phone}</td>
              <td className="px-6 py-4 text-sm">{w.score} ({w.certificates?.length || 0} certs)</td>
              <td className="px-6 py-4">
                {w.verified ? <span className="px-2 text-xs font-semibold rounded-full bg-green-100 text-green-800">Verified</span> : <span className="px-2 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Pending</span>}
              </td>
              <td className="px-6 py-4 text-sm">
                <button onClick={() => toggleVerification(w.id, w.verified)} className={`px-3 py-1 rounded-md ${w.verified ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {w.verified ? 'Revoke' : 'Verify'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);