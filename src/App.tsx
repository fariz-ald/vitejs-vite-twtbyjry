import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { 
  LayoutDashboard, Tag, Baby, Wallet, Plus, Trash2, Edit2, AlertCircle, X, CheckCircle, Activity, HeartPulse
} from 'lucide-react';

// --- Firebase Initialization ---
//const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const firebaseConfig = {
  apiKey: "AIzaSyBmiVHj-lSuISSor59etSmiJL98ePwpgMg",
  authDomain: "ngs-farms.firebaseapp.com",
  projectId: "ngs-farms",
  storageBucket: "ngs-farms.firebasestorage.app",
  messagingSenderId: "743357710753",
  appId: "1:743357710753:web:6a6857c3cc671104030be0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
//const appId = typeof __app_id !== 'undefined' ? __app_id : 'goat-farm-app';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [goats, setGoats] = useState([]);
  const [offsprings, setOffsprings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'goat', 'offspring', 'expense'

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
        setErrorMsg("Gagal masuk ke sistem.");
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Using public path so all stakeholders (owners & caretaker) can share the same dashboard
    const goatsRef = collection(db, 'artifacts', appId, 'public', 'data', 'goats');
    const offspringsRef = collection(db, 'artifacts', appId, 'public', 'data', 'offsprings');
    const expensesRef = collection(db, 'artifacts', appId, 'public', 'data', 'expenses');

    const unsubGoats = onSnapshot(goatsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGoats(data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    }, (error) => setErrorMsg("Gagal memuat data indukan."));

    const unsubOffsprings = onSnapshot(offspringsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOffsprings(data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    }, (error) => setErrorMsg("Gagal memuat data cempe."));

    const unsubExpenses = onSnapshot(expensesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
      setLoading(false);
    }, (error) => setErrorMsg("Gagal memuat data keuangan."));

    return () => {
      unsubGoats();
      unsubOffsprings();
      unsubExpenses();
    };
  }, [user]);

  // --- Handlers ---
  const handleAddGoat = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      tagId: formData.get('tagId'),
      owner: formData.get('owner'),
      healthStatus: formData.get('healthStatus'),
      pregnancyStatus: formData.get('pregnancyStatus'),
      notes: formData.get('notes'),
      createdAt: serverTimestamp()
    };
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'goats'), data);
      setIsModalOpen(false);
    } catch (err) {
      setErrorMsg("Gagal menyimpan data indukan.");
    }
  };

  const handleAddOffspring = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      tagId: formData.get('tagId'),
      motherId: formData.get('motherId'), // ID of the mother goat
      gender: formData.get('gender'),
      birthDate: formData.get('birthDate'),
      status: formData.get('status'),
      profitShare: '50:50 (Pemilik Indukan & Pengelola)',
      createdAt: serverTimestamp()
    };
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offsprings'), data);
      setIsModalOpen(false);
    } catch (err) {
      setErrorMsg("Gagal menyimpan data cempe.");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      payer: formData.get('payer'),
      category: formData.get('category'),
      date: formData.get('date'),
      createdAt: serverTimestamp()
    };
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'), data);
      setIsModalOpen(false);
    } catch (err) {
      setErrorMsg("Gagal menyimpan data pengeluaran.");
    }
  };

  const handleDelete = async (collectionName, id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id));
    } catch (err) {
      setErrorMsg("Gagal menghapus data.");
    }
  };

  const updateGoatStatus = async (id, field, value) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'goats', id), { [field]: value });
    } catch (err) {
      setErrorMsg("Gagal memperbarui status.");
    }
  };

  // --- Modal Form Renderers ---
  const renderModal = () => {
    if (!isModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b bg-green-50">
            <h3 className="font-semibold text-lg text-green-800">
              {modalType === 'goat' && 'Tambah Indukan Baru'}
              {modalType === 'offspring' && 'Catat Kelahiran Cempe'}
              {modalType === 'expense' && 'Catat Pengeluaran'}
            </h3>
            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800">
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            {modalType === 'goat' && (
              <form onSubmit={handleAddGoat} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ID/Tag/Nama Kambing</label>
                  <input name="tagId" required className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" placeholder="Misal: A-01" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pemilik</label>
                  <select name="owner" className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500">
                    <option value="Pemilik A">Pemilik A</option>
                    <option value="Pemilik B">Pemilik B</option>
                    <option value="Pemilik C">Pemilik C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status Kesehatan</label>
                  <select name="healthStatus" className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500">
                    <option value="Sehat">Sehat</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Pemulihan">Pemulihan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status Kebuntingan</label>
                  <select name="pregnancyStatus" className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500">
                    <option value="Kosong (Belum Kawin)">Kosong (Belum Kawin)</option>
                    <option value="Bunting">Bunting</option>
                    <option value="Menyusui">Menyusui</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Catatan Tambahan</label>
                  <textarea name="notes" className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" rows="2"></textarea>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white rounded p-2 font-medium hover:bg-green-700">Simpan Indukan</button>
              </form>
            )}

            {modalType === 'offspring' && (
              <form onSubmit={handleAddOffspring} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ID/Tag Cempe</label>
                  <input name="tagId" required className="w-full border rounded p-2" placeholder="Misal: C-01" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Induk</label>
                  <select name="motherId" required className="w-full border rounded p-2">
                    <option value="">-- Pilih Induk --</option>
                    {goats.map(g => (
                      <option key={g.id} value={g.tagId}>{g.tagId} (Milik: {g.owner})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
                    <select name="gender" className="w-full border rounded p-2">
                      <option value="Jantan">Jantan</option>
                      <option value="Betina">Betina</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
                    <input type="date" name="birthDate" required className="w-full border rounded p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select name="status" className="w-full border rounded p-2">
                    <option value="Hidup">Hidup</option>
                    <option value="Mati">Mati</option>
                    <option value="Terjual">Terjual</option>
                  </select>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>Penting:</strong> Kepemilikan cempe ini akan dicatat menggunakan sistem bagi hasil 50:50 antara Pemilik Induk dan Pengelola (Teman Anda).
                  </p>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white rounded p-2 font-medium hover:bg-green-700">Simpan Kelahiran</button>
              </form>
            )}

            {modalType === 'expense' && (
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal</label>
                  <input type="date" name="date" required className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Keterangan Biaya</label>
                  <input name="description" required className="w-full border rounded p-2" placeholder="Misal: Beli Konsentrat, Obat Cacing" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nominal (Rp)</label>
                  <input type="number" name="amount" required className="w-full border rounded p-2" placeholder="50000" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Kategori</label>
                    <select name="category" className="w-full border rounded p-2">
                      <option value="Pakan">Pakan/Vitamin</option>
                      <option value="Kesehatan">Kesehatan (Obat/Dokter)</option>
                      <option value="Perawatan">Perawatan/Kawin</option>
                      <option value="Kandang">Infrastruktur Kandang</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Dibayar Oleh</label>
                    <select name="payer" className="w-full border rounded p-2">
                      <option value="Kas Bersama">Kas Bersama (Patungan)</option>
                      <option value="Pengelola">Pengelola (Talangan)</option>
                      <option value="Pemilik A">Pemilik A</option>
                      <option value="Pemilik B">Pemilik B</option>
                      <option value="Pemilik C">Pemilik C</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white rounded p-2 font-medium hover:bg-green-700">Catat Pengeluaran</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Views ---
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total Indukan</p>
              <h3 className="text-3xl font-bold text-gray-800">{goats.length}</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg"><Tag className="text-green-600" size={24} /></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total Cempe Lahir</p>
              <h3 className="text-3xl font-bold text-gray-800">{offsprings.length}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg"><Baby className="text-blue-600" size={24} /></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Indukan Bunting</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {goats.filter(g => g.pregnancyStatus === 'Bunting').length}
              </h3>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg"><Activity className="text-yellow-600" size={24} /></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total Pengeluaran</p>
              <h3 className="text-xl font-bold text-gray-800">
                Rp {expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="p-2 bg-red-100 rounded-lg"><Wallet className="text-red-600" size={24} /></div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">Kesepakatan Bisnis Aktif</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Indukan 100% milik pemodal asal (A, B, C).</li>
          <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Anak (Cempe) dibagi hasil 50% untuk pemilik induk, 50% untuk pengelola.</li>
          <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Risiko indukan mandul/mati ditanggung masing-masing pemilik spesifik.</li>
        </ul>
      </div>
    </div>
  );

  const renderGoats = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Manajemen Indukan</h2>
        <button onClick={() => { setModalType('goat'); setIsModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition">
          <Plus size={18} /> Tambah Indukan
        </button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Tag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemilik Modal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kesehatan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kebuntingan</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {goats.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Belum ada data indukan.</td></tr>
              )}
              {goats.map((goat) => (
                <tr key={goat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">{goat.tagId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{goat.owner}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select 
                      value={goat.healthStatus}
                      onChange={(e) => updateGoatStatus(goat.id, 'healthStatus', e.target.value)}
                      className={`text-xs rounded-full px-2 py-1 font-semibold outline-none
                        ${goat.healthStatus === 'Sehat' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      <option value="Sehat">Sehat</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Pemulihan">Pemulihan</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select 
                      value={goat.pregnancyStatus}
                      onChange={(e) => updateGoatStatus(goat.id, 'pregnancyStatus', e.target.value)}
                      className="text-xs border-b border-gray-300 focus:border-green-500 outline-none pb-1"
                    >
                      <option value="Kosong (Belum Kawin)">Kosong</option>
                      <option value="Bunting">Bunting</option>
                      <option value="Menyusui">Menyusui</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => handleDelete('goats', goat.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOffsprings = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Catatan Cempe (Anak)</h2>
        <button onClick={() => { setModalType('offspring'); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={18} /> Catat Kelahiran
        </button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
         <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Tag Cempe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Induk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lahir / Kelamin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hak Bagi Hasil</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {offsprings.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Belum ada data kelahiran cempe.</td></tr>
              )}
              {offsprings.map((cempe) => {
                const mother = goats.find(g => g.tagId === cempe.motherId);
                return (
                  <tr key={cempe.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">{cempe.tagId} <br/><span className={`text-xs font-normal px-2 py-1 rounded-full ${cempe.status === 'Hidup' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{cempe.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      Induk: {cempe.motherId}
                      {mother && <div className="text-xs text-gray-400">Milik {mother.owner}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cempe.birthDate} <br/><span className="text-gray-500 text-xs">{cempe.gender}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-blue-700 bg-blue-50/50">
                      {cempe.profitShare}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleDelete('offsprings', cempe.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Catatan Keuangan</h2>
        <button onClick={() => { setModalType('expense'); setIsModalOpen(true); }} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition">
          <Plus size={18} /> Tambah Biaya
        </button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
         <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sumber Dana</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {expenses.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Belum ada catatan pengeluaran.</td></tr>
              )}
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{exp.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                    {exp.description}
                    <div className="text-xs text-gray-400">{exp.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-600 font-bold">
                    Rp {exp.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 bg-gray-50/50">
                    {exp.payer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => handleDelete('expenses', exp.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-green-900 text-white flex flex-col">
        <div className="p-6 border-b border-green-800">
          <h1 className="text-2xl font-extrabold tracking-tight">Kambing<span className="text-green-400">Hub</span></h1>
          <p className="text-green-200 text-xs mt-1">Sistem Kemitraan Peternakan</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/50'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('goats')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'goats' ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/50'}`}
          >
            <Tag size={20} /> Manajemen Indukan
          </button>
          <button 
            onClick={() => setActiveTab('offsprings')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'offsprings' ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/50'}`}
          >
            <Baby size={20} /> Catatan Cempe
          </button>
          <button 
            onClick={() => setActiveTab('expenses')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'expenses' ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/50'}`}
          >
            <Wallet size={20} /> Keuangan Kandang
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 flex justify-between items-center rounded">
            <div className="flex items-center gap-2"><AlertCircle size={18}/> {errorMsg}</div>
            <button onClick={() => setErrorMsg('')}><X size={18}/></button>
          </div>
        )}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'goats' && renderGoats()}
        {activeTab === 'offsprings' && renderOffsprings()}
        {activeTab === 'expenses' && renderExpenses()}
      </main>

      {/* Floating Modals */}
      {renderModal()}
    </div>
  );
}