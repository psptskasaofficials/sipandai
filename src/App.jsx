import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  BookOpen, 
  School, 
  Calendar, 
  CheckCircle2, 
  LogIn, 
  LogOut, 
  User, 
  Search, 
  PlusCircle, 
  FileText,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [activeTab, setActiveTab] = useState('buletin');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState('kepsek'); // 'pengawas' | 'kepsek' | 'guru'
  const [identifier, setIdentifier] = useState(''); // NPSN atau Email
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data Demo Buletin Awal (Jika DB Supabase masih kosong)
  const [bulletins, setBulletins] = useState([
    {
      id: 1,
      judul: "Transformasi Pembelajaran Berbasis Proyek di SMKN 1",
      ringkasan: "Implementasi metode teaching factory dan kolaborasi aktif antarjurusan untuk menghasilkan karya siswa yang relevan dengan industri.",
      kategori: "Inovasi Pembelajaran",
      author_name: "Ahmad Fauzi, S.Pd.",
      author_role: "Guru",
      author_school: "SMKN 1 Pacitan",
      cover_url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80",
      created_at: "2026-10-28"
    },
    {
      id: 2,
      judul: "Optimalisasi Supervisi Klinis Berdiferensiasi",
      ringkasan: "Bagaimana supervisi akademik rutin membantu guru menemukan solusi atas hambatan manajemen kelas secara dialogis.",
      kategori: "Praktik Baik",
      author_name: "Dra. Siti Aminah, M.Pd.",
      author_role: "Pengawas",
      author_school: "Pengawas SMK Kab. Pacitan",
      cover_url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80",
      created_at: "2026-10-25"
    }
  ]);

  // Handle Login Sederhana
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!identifier || !password) {
      setLoginError('Harap isi identitas dan kata sandi.');
      return;
    }

    // Simulasi session role sesuai pilihan tab login
    let userProfile = {
      nama: loginRole === 'pengawas' ? 'Drs. Pengawas Sekolah, M.Pd.' : (loginRole === 'kepsek' ? `Kepala Sekolah (${identifier})` : 'Guru Pengajar'),
      role: loginRole,
      npsn: loginRole === 'kepsek' ? identifier : '20512345',
      namaSekolah: loginRole === 'pengawas' ? 'Wilayah Binaan Kab. Pacitan' : 'SMK Negeri 1 Pacitan'
    };

    setSessionUser(userProfile);
    setShowLoginModal(false);
    setActiveTab(loginRole === 'pengawas' ? 'supervisi' : (loginRole === 'kepsek' ? 'profil-sekolah' : 'tulis-buletin'));
  };

  const handleLogout = () => {
    setSessionUser(null);
    setActiveTab('buletin');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* HEADER UTAMA */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('buletin')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
              P
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">SI PANDAI</span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Supervisi & Majalah Sekolah</span>
            </div>
          </div>

          <nav className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={() => setActiveTab('buletin')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'buletin' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Buletin & Praktik Baik
            </button>

            {sessionUser ? (
              <div className="flex items-center space-x-3 border-l pl-3 border-slate-200">
                <div className="text-right hidden sm:block">
                  <span className="text-sm font-semibold text-slate-900 block leading-tight">{sessionUser.nama}</span>
                  <span className="text-xs text-blue-600 font-medium capitalize">{sessionUser.role.replace('_', ' ')}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 rounded-lg transition"
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Sistem</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* SUB-NAVBAR JIKA SUDAH LOGIN */}
      {sessionUser && (
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-4 text-sm font-medium">
            {sessionUser.role === 'pengawas' && (
              <>
                <button 
                  onClick={() => setActiveTab('supervisi')} 
                  className={`py-3 border-b-2 transition ${activeTab === 'supervisi' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`} > Agenda & Hasil Supervisi </button> <button onClick={() => setActiveTab('sekolah-binaan')} className={`py-3 border-b-2 transition ${activeTab === 'sekolah-binaan' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`}
                >
                  Data Sekolah Binaan
                </button>
              </>
            )}

            {sessionUser.role === 'kepala_sekolah' && (
              <>
                <button 
                  onClick={() => setActiveTab('profil-sekolah')} 
                  className={`py-3 border-b-2 transition ${activeTab === 'profil-sekolah' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`} > Profil Satuan Pendidikan </button> <button onClick={() => setActiveTab('kelola-guru')} className={`py-3 border-b-2 transition ${activeTab === 'kelola-guru' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`}
                >
                  Kelola Akun Guru
                </button>
                <button 
                  onClick={() => setActiveTab('tindak-lanjut')} 
                  className={`py-3 border-b-2 transition ${activeTab === 'tindak-lanjut' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`} > Tindak Lanjut Supervisi </button> </> )}  {(sessionUser.role === 'guru' \vert{}\vert{} sessionUser.role === 'kepala_sekolah') && ( <button onClick={() => setActiveTab('tulis-buletin')} className={`py-3 border-b-2 transition ${activeTab === 'tulis-buletin' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`}
              >
                Kirim Artikel Buletin
              </button>
            )}
          </div>
        </div>
      )}

      {/* KONTEN UTAMA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAMPILAN 1: HALAMAN DEPAN BULETIN / BLOG */}
        {activeTab === 'buletin' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
              <span className="inline-block px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                Portal Literasi & Inspirasi
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl leading-tight">
                Kabar Inovasi & Praktik Baik Sekolah Binaan
              </h1>
              <p className="mt-4 text-blue-100 max-w-2xl text-base sm:text-lg">
                Wadah publikasi karya pembelajaran, terobosan manajerial kepala sekolah, serta catatan refleksi supervisi pengawas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {bulletins.map((item) => (
                <article key={item.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col">
                  <div className="h-56 w-full overflow-hidden relative">
                    <img src={item.cover_url} alt={item.judul} className="w-full h-full object-cover" />
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-700 shadow-sm">
                      {item.kategori}
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 line-clamp-2 leading-snug">
                        {item.judul}
                      </h2>
                      <p className="mt-3 text-slate-600 text-sm leading-relaxed line-clamp-3">
                        {item.ringkasan}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-800 block">{item.author_name}</span>
                        <span>{item.author_school}</span>
                      </div>
                      <span>{item.created_at}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* TAMPILAN SEMENTARA ROLE WORKSPACE */}
        {activeTab !== 'buletin' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 capitalize mb-2">
              Modul: {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-slate-600 text-sm">
              Halaman ini sedang aktif untuk peran <strong>{sessionUser?.role}</strong> ({sessionUser?.namaSekolah}).
            </p>
          </div>
        )}
      </main>

      {/* MODAL LOGIN MULTI-ROLE */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Masuk ke SI PANDAI</h3>
            <p className="text-xs text-slate-500 mb-6">Pilih jenis akun Anda untuk melanjutkan akses.</p>

            {/* TAB SELECTOR ROLE */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold text-slate-600">
              <button 
                type="button" 
                onClick={() => { setLoginRole('kepsek'); setIdentifier(''); }}
                className={`py-2 rounded-lg transition ${loginRole === 'kepsek' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
              >
                Kepala Sekolah
              </button>
              <button 
                type="button" 
                onClick={() => { setLoginRole('pengawas'); setIdentifier(''); }}
                className={`py-2 rounded-lg transition ${loginRole === 'pengawas' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
              >
                Pengawas
              </button>
              <button 
                type="button" 
                onClick={() => { setLoginRole('guru'); setIdentifier(''); }}
                className={`py-2 rounded-lg transition ${loginRole === 'guru' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
              >
                Guru
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {loginRole === 'kepsek' ? 'NPSN Sekolah' : 'Alamat Email'}
                </label>
                <input 
                  type={loginRole === 'kepsek' ? 'text' : 'email'}
                  placeholder={loginRole === 'kepsek' ? 'Contoh: 20512345' : 'nama@sekolah.sch.id'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kata Sandi
                </label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {loginError && (
                <div className="flex items-center space-x-2 text-rose-600 text-xs bg-rose-50 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                >
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
