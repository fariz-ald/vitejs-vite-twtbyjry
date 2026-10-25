import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query } from "firebase/firestore";
import { Home, GitBranch, DollarSign, Settings, Trash2, Plus, Activity, Baby } from 'lucide-react';

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

  // States Database
  const [owners, setOwners] = useState<any[]>([]);
  const [goats, setGoats] = useState<any[]>([]);
  const [offsprings, setOffsprings] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);

  // Form Master Data
  const [newOwner, setNewOwner] = useState('');
  
  // Form Indukan
  const [goatTag, setGoatTag] = useState('');
  const [goatOwner, setGoatOwner] = useState('');
  const [goatStatus, setGoatStatus] = useState('Sehat');
  const [goatCondition, setGoatCondition] = useState('Siap Kawin');

  // Form Cempe
  const [motherId, setMotherId] = useState('');
  const [offGender, setOffGender] = useState('Betina');
  const [offDate, setOffDate] = useState('');

  // Form Keuangan
  const [finDesc, setFinDesc] = useState('');
  const [finCategory, setFinCategory] = useState('Pakan Tambahan');
  const [finAmount, setFinAmount] = useState('');
  const [finPayer, setFinPayer] = useState('');

  useEffect(() => {
    signInAnonymously(auth).then(() => setIsAuth(true)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    const unsubOwners = onSnapshot(query(collection(db, "owners")), snap => setOwners(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubGoats = onSnapshot(query(collection(db, "goats")), snap => setGoats(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubOffsprings = onSnapshot(query(collection(db, "offsprings")), snap => setOffsprings(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubFinances = onSnapshot(query(collection(db, "finances")), snap => setFinances(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubOwners(); unsubGoats(); unsubOffsprings(); unsubFinances(); }
  }, [isAuth]);

  // Handlers
  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newOwner) return;
    await addDoc(collection(db, "owners"), { name: newOwner });
    setNewOwner('');
  };

  const handleAddGoat = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!goatTag || !goatOwner) return alert("Isi Nomor Tag dan Pilih Pemilik");
    await addDoc(collection(db, "goats"), { 
      tag: goatTag, owner: goatOwner, status: goatStatus, condition: goatCondition, date: new Date().toLocaleDateString() 
    });
    setGoatTag(''); setGoatOwner('');
  };

  const handleAddOffspring = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!motherId || !offDate) return alert("Pilih Indukan dan Tanggal Lahir");
    const mother = goats.find(g => g.id === motherId);
    await addDoc(collection(db, "offsprings"), { 
      motherTag: mother?.tag, motherOwner: mother?.owner, gender: offGender, birthDate: offDate, profitShare: "50:50 (Pemilik Induk & Pengelola)" 
    });
    setMotherId(''); setOffDate('');
  };

  const handleAddFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!finDesc || !finAmount || !finPayer) return;
    await addDoc(collection(db, "finances"), { 
      desc: finDesc, category: finCategory, amount: Number(finAmount), payer: finPayer, date: new Date().toLocaleDateString() 
    });
    setFinDesc(''); setFinAmount(''); setFinPayer('');
  };

  const deleteDocHandler = async (col: string, id: string) => {
    if(confirm("Yakin ingin menghapus data ini?")) await deleteDoc(doc(db, col, id));
  };

  if (!isAuth) return <div className="p-10 text-center text-gray-500">Memuat koneksi aman...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 text-white p-4 shadow-md flex gap-4 overflow-x-auto whitespace-nowrap">
        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-3 py-2 rounded ${activeTab === 'dashboard' ? 'bg-green-800' : 'hover:bg-green-600'}`}><Home size={18} /> Dashboard</button>
        <button onClick={() => setActiveTab('indukan')} className={`flex items-center gap-2 px-3 py-2 rounded ${activeTab === 'indukan' ? 'bg-green-800' : 'hover:bg-green-600'}`}><Activity size={18} /> Data Indukan</button>
        <button onClick={() => setActiveTab('cempe')} className={`flex items-center gap-2 px-3 py-2 rounded ${activeTab === 'cempe' ? 'bg-green-800' : 'hover:bg-green-600'}`}><Baby size={18} /> Catatan Cempe</button>
        <button onClick={() => setActiveTab('keuangan')} className={`flex items-center gap-2 px-3 py-2 rounded ${activeTab === 'keuangan' ? 'bg-green-800' : 'hover:bg-green-600'}`}><DollarSign size={18} /> Keuangan</button>
        <button onClick={() => setActiveTab('pengaturan')} className={`flex items-center gap-2 px-3 py-2 rounded ${activeTab === 'pengaturan' ? 'bg-green-800' : 'hover:bg-green-600'}`}><Settings size={18} /> Master Data</button>
      </nav>

      <div className="p-6 max-w-5xl mx-auto">
        
        {/* PENGATURAN (MASTER DATA) */}
        {activeTab === 'pengaturan' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Master Data Pemilik & Pengelola</h2>
            <form onSubmit={handleAddOwner} className="flex gap-2 mb-6">
              <input type="text" placeholder="Ketik nama (misal: Fariz, Budi, Pengelola)" value={newOwner} onChange={e => setNewOwner(e.target.value)} className="border p-2 rounded flex-1" />
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1"><Plus size={18}/> Tambah</button>
            </form>
            <ul className="space-y-2">
              {owners.map(o => (
                <li key={o.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                  <span className="font-medium">{o.name}</span>
                  <button onClick={() => deleteDocHandler("owners", o.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* INDUKAN */}
        {activeTab === 'indukan' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Manajemen Indukan Betina</h2>
            <form onSubmit={handleAddGoat} className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded border">
              <input type="text" placeholder="Nomor Tag/Anting" value={goatTag} onChange={e => setGoatTag(e.target.value)} className="border p-2 rounded flex-1 min-w-[150px]" />
              <select value={goatOwner} onChange={e => setGoatOwner(e.target.value)} className="border p-2 rounded flex-1 min-w-[150px]">
                <option value="">-- Pemodal --</option>
                {owners.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
              </select>
              <select value={goatStatus} onChange={e => setGoatStatus(e.target.value)} className="border p-2 rounded w-32">
                <option value="Sehat">Sehat</option>
                <option value="Sakit">Sakit</option>
              </select>
              <select value={goatCondition} onChange={e => setGoatCondition(e.target.value)} className="border p-2 rounded w-32">
                <option value="Siap Kawin">Siap Kawin</option>
                <option value="Bunting">Bunting</option>
                <option value="Menyusui">Menyusui</option>
              </select>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Simpan Indukan</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goats.map(g => (
                <div key={g.id} className="border p-4 rounded shadow-sm relative bg-white">
                  <h3 className="font-bold text-lg text-green-700">Tag: {g.tag}</h3>
                  <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                    <p>Pemilik: <span className="font-semibold">{g.owner}</span></p>
                    <p>Status: <span className={`font-bold ${g.status === 'Sakit' ? 'text-red-500' : 'text-green-500'}`}>{g.status}</span></p>
                    <p>Kondisi: <span className="font-semibold text-blue-600">{g.condition}</span></p>
                    <p>Tgl Masuk: <span className="text-gray-500">{g.date}</span></p>
                  </div>
                  <button onClick={() => deleteDocHandler("goats", g.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CEMPE */}
        {activeTab === 'cempe' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Pencatatan Kelahiran Cempe (Bagi Hasil)</h2>
            <form onSubmit={handleAddOffspring} className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded border">
              <select value={motherId} onChange={e => setMotherId(e.target.value)} className="border p-2 rounded flex-1 min-w-[200px]">
                <option value="">-- Pilih Indukan (Ibu) --</option>
                {goats.map(g => <option key={g.id} value={g.id}>Tag: {g.tag} (Milik {g.owner})</option>)}
              </select>
              <select value={offGender} onChange={e => setOffGender(e.target.value)} className="border p-2 rounded w-32">
                <option value="Betina">Betina</option>
                <option value="Jantan">Jantan</option>
              </select>
              <input type="date" value={offDate} onChange={e => setOffDate(e.target.value)} className="border p-2 rounded w-40" />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Catat Kelahiran</button>
            </form>

            <div className="space-y-3">
              {offsprings.map(o => (
                <div key={o.id} className="border p-4 rounded shadow-sm flex justify-between items-center bg-white">
                  <div>
                    <h3 className="font-bold text-lg text-blue-700">Cempe {o.gender}</h3>
                    <p className="text-sm text-gray-600">Lahir: {o.birthDate} • Dari Indukan Tag: <span className="font-bold">{o.motherTag}</span></p>
                    <div className="mt-2 inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-300">
                      Bagi Hasil: {o.profitShare}
                    </div>
                  </div>
                  <button onClick={() => deleteDocHandler("offsprings", o.id)} className="text-red-400 hover:text-red-600"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KEUANGAN */}
        {activeTab === 'keuangan' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Buku Kas Patungan</h2>
            <form onSubmit={handleAddFinance} className="flex flex-wrap gap-2 mb-6 bg-gray-50 p-4 rounded border">
              <input type="text" placeholder="Catatan Beli/Bayar" value={finDesc} onChange={e => setFinDesc(e.target.value)} className="border p-2 rounded flex-1 min-w-[150px]" />
              <select value={finCategory} onChange={e => setFinCategory(e.target.value)} className="border p-2 rounded w-40">
                <option value="Pakan Tambahan">Pakan Tambahan</option>
                <option value="Obat/Dokter">Obat/Dokter</option>
                <option value="Perawatan Kandang">Perawatan Kandang</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
              <input type="number" placeholder="Nominal Rp" value={finAmount} onChange={e => setFinAmount(e.target.value)} className="border p-2 rounded w-32" />
              <select value={finPayer} onChange={e => setFinPayer(e.target.value)} className="border p-2 rounded w-40">
                <option value="">-- Dibayar Oleh --</option>
                {owners.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
              </select>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Catat</button