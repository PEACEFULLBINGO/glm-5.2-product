import React, { useState, useEffect } from 'react';

// --- MOCK DATABASE & INITIAL STATE ---
const initialWorkers = [
  { id: 'w1', name: 'Ravi Kumar', role: 'Electrician', city: 'Mumbai', language: 'Native', salary: 25, verified: true, active: true, joined: new Date('2023-01-15'), score: 95, bio: 'Expert in home wiring and circuit breaker repair.' },
  { id: 'w2', name: 'Sarah Johnson', role: 'Plumber', city: 'Delhi', language: 'English', salary: 30, verified: true, active: true, joined: new Date('2023-03-10'), score: 90, bio: '5 years experience in commercial and residential plumbing.' },
  { id: 'w3', name: 'Amit Singh', role: 'Tutor', city: 'Mumbai', language: 'Both', salary: 15, verified: false, active: true, joined: new Date('2023-08-01'), score: 70, bio: 'Math and Physics tutor for high school students.' },
  { id: 'w4', name: 'John Doe', role: 'Driver', city: 'Pune', language: 'English', salary: 20, verified: false, active: false, joined: new Date('2023-09-05'), score: 40, bio: 'Commercial driver with own vehicle.' },
];

export default function App() {
  const [view, setView] = useState('landing'); // landing, login, register, otp, browse, workerDashboard, adminDashboard
  const [currentUser, setCurrentUser] = useState(null);
  const [workers, setWorkers] = useState(initialWorkers);
  const [tempUser, setTempUser] = useState(null);
  const [toast, setToast] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Verified');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // --- AUTHENTICATION LOGIC ---
  const handleRegister = (data) => {
    setTempUser(data);
    setView('otp');
    showToast('OTP Sent: 123456 (Mock Verification)');
  };

  const verifyOtp = (otp) => {
    if (otp === '123456') {
      const newUser = { ...tempUser, id: Date.now().toString(), score: 50, verified: false, active: true, joined: new Date() };
      if (newUser.role === 'Admin') {
        setCurrentUser(newUser);
        setView('adminDashboard');
      } else {
        const newWorkersList = [...workers, newUser];
        setWorkers(newWorkersList);
        setCurrentUser(newUser);
        setView('workerDashboard');
      }
      showToast('Account Verified! Welcome aboard.');
    } else {
      showToast('Invalid OTP. Try 123456.');
    }
  };

  const handleLogin = (email) => {
    // Mock Login: Find by email or default to Admin/Worker for demo
    if (email.includes('admin')) {
      setCurrentUser({ name: 'Admin User', role: 'Admin', email });
      setView('adminDashboard');
    } else {
      const worker = workers.find(w => w.name.toLowerCase().includes(email.split('@')[0])) || workers[0];
      setCurrentUser(worker);
      setView(worker.role === 'Worker' ? 'workerDashboard' : 'browse');
    }
    showToast('Logged in successfully.');
  };

  const logout = () => {
    setCurrentUser(null);
    setView('landing');
    showToast('Logged out.');
  };

  // --- WORKER LOGIC (Salary Adjustment, etc.) ---
  const updateWorkerProfile = (updatedData) => {
    const updatedWorkers = workers.map(w => w.id === currentUser.id ? { ...w, ...updatedData } : w);
    setWorkers(updatedWorkers);
    setCurrentUser({ ...currentUser, ...updatedData });
    showToast('Profile updated successfully!');
  };

  // --- ADMIN LOGIC (Moderation) ---
  const toggleVerification = (id) => {
    const updatedWorkers = workers.map(w => w.id === id ? { ...w, verified: !w.verified } : w);
    setWorkers(updatedWorkers);
    showToast('Worker verification status updated.');
  };

  // --- FILTERING & SORTING LOGIC ---
  const filteredWorkers = workers
    .filter(w => w.role !== 'Seeker' && w.role !== 'Admin')
    .filter(w => (langFilter === 'All' || w.language === langFilter))
    .filter(w => (cityFilter === 'All' || w.city === cityFilter))
    .filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.role.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'Verified') return b.verified - a.verified;
      if (sortBy === 'Newest') return new Date(b.joined) - new Date(a.joined);
      if (sortBy === 'Active') return b.active - a.active;
      if (sortBy === 'Name') return a.name.localeCompare(b.name);
      if (sortBy === 'City') return a.city.localeCompare(b.city);
      return 0;
    });

  // --- RENDER ROUTING ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {toast && (
        <div className="fixed top-5 right-5 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
          {toast}
        </div>
      )}
      
      {view !== 'landing' && view !== 'login' && view !== 'register' && view !== 'otp' && (
        <Navbar currentUser={currentUser} setView={setView} logout={logout} />
      )}

      {/* LANDING PAGE */}
      {view === 'landing' && <Landing setView={setView} />}

      {/* AUTH PAGES */}
      {view === 'login' && <Login handleLogin={handleLogin} setView={setView} />}
      {view === 'register' && <Register handleRegister={handleRegister} setView={setView} />}
      {view === 'otp' && <OTP verifyOtp={verifyOtp} tempUser={tempUser} />}

      {/* SEEKER DASHBOARD (BROWSE) */}
      {view === 'browse' && (
        <Browse 
          workers={filteredWorkers} 
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          langFilter={langFilter} setLangFilter={setLangFilter}
          cityFilter={cityFilter} setCityFilter={setCityFilter}
          sortBy={sortBy} setSortBy={setSortBy}
          showToast={showToast}
        />
      )}

      {/* WORKER DASHBOARD (Profile & Salary Adjustment) */}
      {view === 'workerDashboard' && currentUser && (
        <WorkerDashboard user={currentUser} updateWorkerProfile={updateWorkerProfile} />
      )}

      {/* ADMIN DASHBOARD (Moderation) */}
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
          <button onClick={() => setView('adminDashboard')} className="text-sm font-medium text-slate-600 hover:text-blue-600">Admin Panel</button>
        ) : (
          <button onClick={() => setView('browse')} className="text-sm font-medium text-slate-600 hover:text-blue-600">Browse Workers</button>
        )}
        
        {currentUser?.role !== 'Admin' && (
           <button onClick={() => setView('workerDashboard')} className="text-sm font-medium text-slate-600 hover:text-blue-600">My Profile</button>
        )}
        
        <div className="flex items-center space-x-2">
          <img src={`https://ui-avatars.com/api/?name=${currentUser?.name}&background=0D8ABC&color=fff`} alt="avatar" className="w-8 h-8 rounded-full" />
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
        </div>
      </div>
    </div>
  </nav>
);

const Landing = ({ setView }) => (
  <div className="bg-gradient-to-b from-blue-50 to-white">
    <div className="max-w-6xl mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
        Find Trusted Local Workers, <span className="text-blue-600">Fast.</span>
      </h1>
      <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
        Language-aware discovery platform. Filter workers by Native, English, or Both. Built for households, businesses, and travelers.
      </p>
      <div className="mt-10 flex justify-center space-x-4">
        <button onClick={() => setView('register')} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">Get Started</button>
        <button onClick={() => setView('login')} className="px-8 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition">Login</button>
      </div>
      
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-2 text-blue-600">1. Register & Verify</h3>
          <p className="text-slate-600 text-sm">Short profile form with OTP verification to confirm identity and reduce fake accounts.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-2 text-blue-600">2. Language Filter</h3>
          <p className="text-slate-600 text-sm">Filter workers by Native, English, or Both — plus city and trust status.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-2 text-blue-600">3. Trust Layer</h3>
          <p className="text-slate-600 text-sm">Verification, admin review, profile score, and reporting built into every listing.</p>
        </div>
      </div>
    </div>
  </div>
);

const AuthShell = ({ children, title }) => (
  <div className="flex items-center justify-center py-12 px-4 bg-slate-50">
    <div className="max-w-md w-full bg-white p-8 border border-slate-200 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">{title}</h2>
      {children}
    </div>
  </div>
);

const Login = ({ handleLogin, setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <AuthShell title="Welcome Back">
      <form onSubmit={(e) => { e.preventDefault(); handleLogin(email); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Use 'admin' in email for Admin panel" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <button type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">Sign In</button>
        <p className="text-center text-sm text-slate-500">Don't have an account? <button type="button" onClick={() => setView('register')} className="text-blue-600 font-medium">Register</button></p>
      </form>
    </AuthShell>
  );
};

const Register = ({ handleRegister, setView }) => {
  const [data, setData] = useState({ name: '', email: '', role: 'Worker', city: 'Mumbai', language: 'Both', salary: 20 });
  return (
    <AuthShell title="Create an Account">
      <form onSubmit={(e) => { e.preventDefault(); handleRegister(data); }} className="space-y-4">
        <input required type="text" placeholder="Full Name" onChange={e => setData({...data, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
        <input required type="email" placeholder="Email Address" onChange={e => setData({...data, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
        <select value={data.role} onChange={e => setData({...data, role: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
          <option>Worker</option>
          <option>Seeker</option>
          <option>Admin</option>
        </select>
        {data.role === 'Worker' && (
          <>
            <input required type="text" placeholder="Profession (e.g., Plumber)" onChange={e => setData({...data, profession: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
            <select value={data.city} onChange={e => setData({...data, city: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
              <option>Mumbai</option><option>Delhi</option><option>Pune</option><option>Bangalore</option>
            </select>
            <select value={data.language} onChange={e => setData({...data, language: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
              <option>Native</option><option>English</option><option>Both</option>
            </select>
            <input required type="number" placeholder="Expected Salary ($/hr)" value={data.salary} onChange={e => setData({...data, salary: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
          </>
        )}
        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Send OTP</button>
        <p className="text-center text-sm text-slate-500">Already have an account? <button type="button" onClick={() => setView('login')} className="text-blue-600 font-medium">Login</button></p>
      </form>
    </AuthShell>
  );
};

const OTP = ({ verifyOtp, tempUser }) => {
  const [otp, setOtp] = useState('');
  return (
    <AuthShell title="Verify Contact">
      <p className="text-slate-600 mb-4">An OTP has been sent to {tempUser?.email}. <br/><span className="font-bold text-blue-600">(Mock OTP: 123456)</span></p>
      <form onSubmit={(e) => { e.preventDefault(); verifyOtp(otp); }} className="space-y-4">
        <input required type="text" placeholder="Enter 6-digit OTP" onChange={e => setOtp(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md tracking-widest text-center text-xl" />
        <button type="submit" className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">Verify & Continue</button>
      </form>
    </AuthShell>
  );
};

const Browse = ({ workers, searchQuery, setSearchQuery, langFilter, setLangFilter, cityFilter, setCityFilter, sortBy, setSortBy, showToast }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-6">Browse Verified Workers</h2>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input type="text" placeholder="Search name or role..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-md" />
        <select value={langFilter} onChange={e => setLangFilter(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-md bg-white">
          <option>All</option><option>Native</option><option>English</option><option>Both</option>
        </select>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-md bg-white">
          <option>All</option><option>Mumbai</option><option>Delhi</option><option>Pune</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-md bg-white">
          <option value="Verified">Sort: Verified First</option>
          <option value="Newest">Sort: Newest</option>
          <option value="Active">Sort: Active</option>
          <option value="Name">Sort: Name A-Z</option>
          <option value="City">Sort: City A-Z</option>
        </select>
      </div>

      {/* Worker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {workers.map(worker => (
          <div key={worker.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <img src={`https://ui-avatars.com/api/?name=${worker.name}&background=random`} alt="avatar" className="w-12 h-12 rounded-full" />
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{worker.name}</h3>
                  <p className="text-sm text-slate-500">{worker.role} in {worker.city}</p>
                </div>
              </div>
              {worker.verified ? (
                <span className="bg-green-100 text-green-700 px-2 py-1 text-xs font-bold rounded-full flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>Verified</span>
              ) : (
                <span className="bg-slate-100 text-slate-500 px-2 py-1 text-xs font-bold rounded-full">Unverified</span>
              )}
            </div>
            
            <p className="text-slate-600 text-sm mb-4 flex-grow">{worker.bio || 'No biography provided.'}</p>
            
            <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-4">
              <div className="flex space-x-2">
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">Lang: {worker.language}</span>
                <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs font-medium">Score: {worker.score}</span>
              </div>
              <span className="font-bold text-slate-900">${worker.salary}/hr</span>
            </div>

            <div className="mt-4 flex space-x-2">
              <button onClick={() => showToast(`Contact request sent to ${worker.name}!`)} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Request Contact</button>
              <button onClick={() => showToast('Profile reported to Admin.')} className="py-2 px-3 bg-red-50 text-red-600 text-sm rounded-md hover:bg-red-100">Report</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkerDashboard = ({ user, updateWorkerProfile }) => {
  const [editData, setEditData] = useState({ salary: user.salary, bio: user.bio || '', active: user.active });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-6">My Profile & Dashboard</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <img src={`https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`} alt="avatar" className="w-20 h-20 rounded-full" />
          <div>
            <h3 className="text-2xl font-bold">{user.name}</h3>
            <p className="text-slate-500">{user.role} • {user.city}</p>
            <div className="mt-2 flex space-x-2">
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">Lang: {user.language}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${user.verified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {user.verified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h4 className="text-xl font-bold mb-4">Settings & Salary Adjustment</h4>
        <form onSubmit={(e) => { e.preventDefault(); updateWorkerProfile(editData); }} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-700">Salary Expectation ($/hr)</label>
            <input type="number" value={editData.salary} onChange={e => setEditData({...editData, salary: parseInt(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" />
            <p className="text-xs text-slate-500 mt-1">Adjust your rate to stay competitive in the market.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Bio / Description</label>
            <textarea rows="3" value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="Tell employers about your experience..." />
          </div>

          <div className="flex items-center">
            <input type="checkbox" id="activeStatus" checked={editData.active} onChange={e => setEditData({...editData, active: e.target.checked})} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
            <label htmlFor="activeStatus" className="ml-2 block text-sm text-slate-900">Active & Available for work</label>
          </div>

          <button type="submit" className="py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = ({ workers, toggleVerification }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-6">Admin Moderation Queue</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Worker</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role / City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Profile Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trust Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {workers.map(w => (
              <tr key={w.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-slate-900">{w.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{w.role} in {w.city}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{w.score}/100</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {w.verified ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Verified</span> : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Pending</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => toggleVerification(w.id)} className={`px-3 py-1 rounded-md ${w.verified ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {w.verified ? 'Revoke Verification' : 'Approve & Verify'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};