import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query } from "firebase/firestore";
import { Home, GitBranch, DollarSign, Settings, Trash2, Plus } from 'lucide-react';

// =====================================================================
// HAPUS KODE DI BAWAH INI DAN PASTE FIREBASE CONFIG ANDA DI SINI
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBmiVHj-lSuISSor59etSmiJL98ePwpgMg",
  authDomain: "ngs-farms.firebaseapp.com",
  projectId: "ngs-farms",
  storageBucket: "ngs-farms.firebasestorage.app",
  messagingSenderId: "743357710753",
  appId: "1:743357710753:web:6a6857c3cc671104030be0"
};
// =====================================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuth, setIsAuth] = useState(false);

  // States untuk data dari database
  const [owners, setOwners] = useState<any[]>([]);
  const [goats, setGoats] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);

  // States untuk form input
  const [newOwner, setNewOwner] = useState('');
  
  // Form Kambing
  const [goatTag, setGoatTag] = useState('');
  const [goatOwner, setGoatOwner] = useState('');
  
  // Form Keuangan
  const [finDesc, setFinDesc] = useState('');
  const [finAmount, setFinAmount] = useState('');
  const [finPayer, setFinPayer] = useState('');

  useEffect(() => {
    signInAnonymously(auth).then(() => setIsAuth(true)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    
    const unsubOwners = onSnapshot(query(collection(db, "owners")), (snap) => {
      setOwners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubGoats = onSnapshot(query(collection(db, "goats")), (snap) => {
      setGoats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubFinances = onSnapshot(query(collection(db, "finances")), (snap) => {
      setFinances(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubOwners(); unsubGoats(); unsubFinances(); }
  }, [isAuth]);

  // Fungsi Tambah/Hapus Master Data Pemilik
  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newOwner) return;
    await addDoc(collection(db, "owners"), { name: newOwner });
    setNewOwner('');
  };
  const handleDeleteOwner = async (id: string) => {
    if(confirm("Hapus nama ini?")) await deleteDoc(doc(db, "owners", id));
  };

  // Fungsi Tambah/Hapus Kambing
  const handleAddGoat = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!goatTag || !goatOwner) return alert("Isi Tag dan Pilih Pemilik");
    await addDoc(collection(db, "goats"), { tag: goatTag, owner: goatOwner, date: new Date().toLocaleDateString() });
    setGoatTag(''); setGoatOwner('');
  };
  const handleDeleteGoat = async (id: string) => {
    if(confirm("Hapus kambing ini?")) await deleteDoc(doc(db, "goats", id));
  };

  // Fungsi Tambah/Hapus Keuangan
  const handleAddFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!finDesc || !finAmount || !finPayer) return;
    await addDoc(collection(db, "finances"), { desc: finDesc, amount: Number(finAmount), payer: finPayer, date: new Date().toLocaleDateString() });
    setFinDesc(''); setFinAmount(''); setFinPayer('');
  };
  const handleDeleteFinance = async (id: string) => {
    if(confirm("Hapus catatan ini?")) await deleteDoc(doc(db, "finances", id));
  };

  if (!isAuth) return <div className="p-10 text-center text-gray-500">Memuat koneksi aman...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Atas */}
      <nav className="bg-green-700 text-white p-4 shadow-md flex gap-4 overflow-x-auto whitespace-nowrap">
        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-3 py-2 rounded ${activeTab === 'dashboard' ? 'bg-green-800' : 'hover:bg-green-600'}`}><Home size={18} /> Dashboard</button>
        <button onClick={() => setActiveTab('indukan')} className={`flex items-center gap-2 px-3 py-2 rounded ${activeTab === 'indukan' ? 'bg-green-800' : 'hover:bg-green-600'}`}><GitBranch size={18} /> Indukan & Cempe</button>
        <button onClick={() => setActiveTab('keuangan')} className={`flex items-center gap-2 px-3 py-2 rounded ${activeTab === 'keuangan' ? 'bg-green-800' : 'hover:bg-green-600'}`}><DollarSign size={18} /> Keuangan</button>
        <button onClick={() => setActiveTab('pengaturan')} className={`flex items-center gap-2 px-3 py-2 rounded ${activeTab === 'pengaturan' ? 'bg-green-800' : 'hover:bg-green-600'}`}><Settings size={18} /> Master Data</button>
      </nav>

      <div className="p-6 max-w-4xl mx-auto">
        
        {/* TABS: PENGATURAN (MASTER DATA) */}
        {activeTab === 'pengaturan' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Master Data Pemilik / Pengelola</h2>
            <p className="text-sm text-gray-600 mb-4">Tambahkan nama-nama orang yang terlibat (Pemodal dan Pengelola) di sini agar bisa dipilih di menu lainnya.</p>
            
            <form onSubmit={handleAddOwner} className="flex gap-2 mb-6">
              <input type="text" placeholder="Ketik nama (misal: Fariz, Budi, Kang Urus)" value={newOwner} onChange={e => setNewOwner(e.target.value)} className="border p-2 rounded flex-1" />
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1"><Plus size={18}/> Tambah</button>
            </form>

            <ul className="space-y-2">
              {owners.map(o => (
                <li key={o.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                  <span className="font-medium">{o.name}</span>
                  <button onClick={() => handleDeleteOwner(o.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                </li>
              ))}
              {owners.length === 0 && <li className="text-gray-400 italic">Belum ada data. Silakan tambah nama.</li>}
            </ul>
          </div>
        )}

        {/* TABS: INDUKAN */}
        {activeTab === 'indukan' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Manajemen Kambing</h2>
            
            <form onSubmit={handleAddGoat} className="flex flex-wrap gap-2 mb-6 bg-gray-50 p-4 rounded border">
              <input type="text" placeholder="ID / Nomor Tag Kambing" value={goatTag} onChange={e => setGoatTag(e.target.value)} className="border p-2 rounded flex-1 min-w-[200px]" />
              <select value={goatOwner} onChange={e => setGoatOwner(e.target.value)} className="border p-2 rounded flex-1 min-w-[200px]">
                <option value="">-- Pilih Pemilik --</option>
                {owners.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
              </select>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Simpan Kambing</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goats.map(g => (
                <div key={g.id} className="border p-4 rounded shadow-sm relative">
                  <h3 className="font-bold text-lg">Tag: {g.tag}</h3>
                  <p className="text-sm text-gray-600">Pemilik Indukan: <span className="font-semibold text-blue-600">{g.owner}</span></p>
                  <p className="text-xs text-gray-400 mt-1">Masuk sejak: {g.date}</p>
                  <button onClick={() => handleDeleteGoat(g.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABS: KEUANGAN */}
        {activeTab === 'keuangan' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Catatan Keuangan & Operasional</h2>
            
            <form onSubmit={handleAddFinance} className="flex flex-wrap gap-2 mb-6 bg-gray-50 p-4 rounded border">
              <input type="text" placeholder="Keterangan (Makan, Obat, dll)" value={finDesc} onChange={e => setFinDesc(e.target.value)} className="border p-2 rounded flex-1 min-w-[200px]" />
              <input type="number" placeholder="Nominal (Rp)" value={finAmount} onChange={e => setFinAmount(e.target.value)} className="border p-2 rounded w-32" />
              <select value={finPayer} onChange={e => setFinPayer(e.target.value)} className="border p-2 rounded w-40">
                <option value="">-- Dibayar Oleh --</option>
                {owners.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
              </select>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Catat</button>
            </form>

            <div className="space-y-2">
              {finances.map(f => (
                <div key={f.id} className="flex justify-between items-center bg-white p-3 border rounded shadow-sm">
                  <div>
                    <p className="font-bold">{f.desc}</p>
                    <p className="text-xs text-gray-500">{f.date} • Dibayar oleh: <span className="font-medium text-blue-600">{f.payer}</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-red-600 font-bold">- Rp {f.amount.toLocaleString('id-ID')}</p>
                    <button onClick={() => handleDeleteFinance(f.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABS: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500 shadow-sm">
              <h3 className="text-gray-500 text-sm font-bold">TOTAL INDUKAN</h3>
              <p className="text-3xl font-bold mt-2">{goats.length} <span className="text-sm font-normal">Ekor</span></p>
            </div>
            <div className="bg-white p-6 rounded-lg border-l-4 border-green-500 shadow-sm">
              <h3 className="text-gray-500 text-sm font-bold">DATA PEMILIK TERDAFTAR</h3>
              <p className="text-3xl font-bold mt-2">{owners.length} <span className="text-sm font-normal">Orang</span></p>
            </div>
            <div className="bg-white p-6 rounded-lg border-l-4 border-red-500 shadow-sm">
              <h3 className="text-gray-500 text-sm font-bold">TOTAL PENGELUARAN</h3>
              <p className="text-3xl font-bold mt-2 text-red-600">
                Rp {finances.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}