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
  AlertCircle,
  Upload,
  Clock,
  Check,
  X,
  Eye,
  Trash2,
  Send
} from 'lucide-react';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [activeTab, setActiveTab] = useState('buletin');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState('guru');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // State Buletin Publik & Riwayat Penulis
  const [bulletins, setBulletins] = useState([]);
  const [myArticles, setMyArticles] = useState([]);
  const [loadingBulletins, setLoadingBulletins] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Form Buletin Baru
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Praktik Baik');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState({ type: '', text: '' });

  // 1. Ambil Data Buletin
  const fetchBulletins = async () => {
    setLoadingBulletins(true);
    try {
      // Ambil seluruh artikel yang disetujui untuk publik
      const { data: publicData, error: pubErr } = await supabase
        .from('bulletins')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (!pubErr && publicData) {
        setBulletins(publicData);
      }

      // Jika user sedang login (Guru / Kepsek / Pengawas), ambil juga riwayat artikel miliknya
      if (sessionUser) {
        let authorQuery = supabase.from('bulletins').select('*').order('created_at', { ascending: false });
        
        if (sessionUser.role !== 'pengawas') {
          authorQuery = authorQuery.eq('author_name', sessionUser.nama);
        }

        const { data: authorData, error: authErr } = await authorQuery;
        if (!authErr && authorData) {
          setMyArticles(authorData);
        }
      }
    } catch (err) {
      console.error('Error saat fetch buletin:', err);
    } finally {
      setLoadingBulletins(false);
    }
  };

  useEffect(() => {
    fetchBulletins();
  }, [sessionUser]);

  // Preview foto cover sebelum diunggah
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // 2. Fungsi Mengirim / Mengunggah Artikel
  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim() || !newContent.trim()) {
      setSubmitFeedback({ type: 'error', text: 'Judul, ringkasan, dan isi artikel wajib diisi!' });
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback({ type: '', text: '' });

    try {
      let publicCoverUrl = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80';

      // Proses upload berkas foto jika pengguna memilih file
      if (coverFile) {
        try {
          const fileExt = coverFile.name.split('.').pop();
          const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = cleanFileName;

          const { error: uploadError } = await supabase.storage
            .from('sipandai-storage')
            .upload(filePath, coverFile, { cacheControl: '3600', upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('sipandai-storage')
              .getPublicUrl(filePath);
            if (urlData?.publicUrl) {
              publicCoverUrl = urlData.publicUrl;
            }
          } else {
            console.warn('Storage upload note:', uploadError.message);
          }
        } catch (uploadEx) {
          console.warn('Lewati upload storage, memakai fallback cover:', uploadEx);
        }
      }

      // Buat entri artikel di tabel bulletins
      // Pengawas otomatis tayang, Guru & Kepala Sekolah menunggu kurasi
      const isAutoPublish = sessionUser?.role === 'pengawas';

      const payload = {
        judul: newTitle.trim(),
        ringkasan: newSummary.trim(),
        konten: newContent.trim(),
        kategori: newCategory,
        cover_url: publicCoverUrl,
        author_name: sessionUser?.nama || 'Kontributor Sekolah',
        author_role: sessionUser?.role || 'guru',
        author_school: sessionUser?.namaSekolah || 'Sekolah Binaan',
        is_published: isAutoPublish
      };

      const { data, error: insertError } = await supabase
        .from('bulletins')
        .insert([payload])
        .select();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Berhasil
      setSubmitFeedback({
        type: 'success',
        text: isAutoPublish 
          ? 'Artikel berhasil diterbitkan ke halaman depan!' 
          : 'Artikel berhasil disimpan dan menunggu kurasi pengawas sebelum tayang publik.'
      });

      // Bersihkan formulir
      setNewTitle('');
      setNewSummary('');
      setNewContent('');
      setCoverFile(null);
      setCoverPreview('');

      // Perbarui tampilan artikel saya dan buletin
      fetchBulletins();
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitFeedback({
        type: 'error',
        text: `Gagal mengirim artikel: ${err.message || 'Terjadi kesalahan sistem'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Hapus Artikel Sendiri
  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Yakin ingin menghapus draf artikel ini?')) return;
    try {
      const { error } = await supabase.from('bulletins').delete().eq('id', id);
      if (error) throw error;
      fetchBulletins();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  // 4. Pengawas Mengubah Status Terbit
  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('bulletins')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchBulletins();
    } catch (err) {
      alert(`Gagal memoderasi artikel: ${err.message}`);
    }
  };

  // Sistem Login Cepat
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!identifier.trim()) {
      setLoginError('Harap masukkan identitas akun Anda.');
      return;
    }

    let defaultName = 'Bapak/Ibu Guru';
    let defaultSchool = 'SMK Negeri 1 Pacitan';

    if (loginRole === 'pengawas') {
      defaultName = 'Drs. H. Pengawas Pembina, M.Pd.';
      defaultSchool = 'Cabang Dinas Wilayah Binaan';
    } else if (loginRole === 'kepsek') {
      defaultName = `Kepala Sekolah (NPSN: ${identifier})`;
    } else {
      defaultName = identifier.includes('@') ? identifier.split('@')[0] : identifier;
    }

    const userObj = {
      nama: defaultName,
      role: loginRole,
      npsn: loginRole === 'kepsek' ? identifier : '20512345',
      namaSekolah: defaultSchool
    };

    setSessionUser(userObj);
    setShowLoginModal(false);
    setActiveTab(loginRole === 'pengawas' ? 'moderasi-buletin' : 'tulis-buletin');
  };

  const handleLogout = () => {
    setSessionUser(null);
    setActiveTab('buletin');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* HEADER NAVIGASI */}
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

      {/* SUB-NAVBAR WORKSPACE KETIKA LOGIN */}
      {sessionUser && (
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-4 text-sm font-medium overflow-x-auto">
            {sessionUser.role === 'pengawas' && (
              <>
                <button 
                  onClick={() => setActiveTab('supervisi')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'supervisi' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`}
                >
                  Agenda & Hasil Supervisi
                </button>
                <button 
                  onClick={() => setActiveTab('sekolah-binaan')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'sekolah-binaan' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`}
                >
                  Data Sekolah Binaan
                </button>
                <button 
                  onClick={() => setActiveTab('moderasi-buletin')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'moderasi-buletin' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`}
                >
                  Moderasi Buletin
                </button>
              </>
            )}

            {sessionUser.role === 'kepala_sekolah' && (
              <>
                <button 
                  onClick={() => setActiveTab('profil-sekolah')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'profil-sekolah' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`}
                >
                  Profil Satuan Pendidikan
                </button>
                <button 
                  onClick={() => setActiveTab('kelola-guru')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'kelola-guru' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`}
                >
                  Kelola Akun Guru
                </button>
                <button 
                  onClick={() => setActiveTab('tindak-lanjut')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'tindak-lanjut' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`}
                >
                  Tindak Lanjut Supervisi
                </button>
              </>
            )}

            <button 
              onClick={() => setActiveTab('tulis-buletin')} 
              className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'tulis-buletin' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`}
            >
              Ruang Tulis Artikel
            </button>
          </div>
        </div>
      )}

      {/* KONTEN UTAMA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAMPILAN 1: MAJALAH PUBLIK / BULETIN */}
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
                Publikasi karya pembelajaran guru, inovasi manajerial kepala sekolah, serta catatan refleksi supervisi sekolah.
              </p>
            </div>

            {loadingBulletins ? (
              <div className="text-center py-16 text-slate-500 font-medium">Memuat artikel buletin...</div>
            ) : bulletins.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
                Belum ada artikel yang disetujui terbit. Silakan masuk sistem dan kirimkan artikel pertama Anda!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bulletins.map((item) => (
                  <article 
                    key={item.id} 
                    onClick={() => setSelectedArticle(item)}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col cursor-pointer group"
                  >
                    <div className="h-48 w-full overflow-hidden relative bg-slate-100">
                      <img 
                        src={item.cover_url} 
                        alt={item.judul} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                      />
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-blue-700 shadow-sm">
                        {item.kategori}
                      </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 leading-snug">
                          {item.judul}
                        </h2>
                        <p className="mt-2.5 text-slate-600 text-xs leading-relaxed line-clamp-3">
                          {item.ringkasan}
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div>
                          <span className="font-semibold text-slate-800 block truncate max-w-[150px]">{item.author_name}</span>
                          <span className="truncate max-w-[150px] block">{item.author_school}</span>
                        </div>
                        <span className="shrink-0">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAMPILAN 2: RUANG TULIS & DAFTAR ARTIKEL PENULIS */}
        {activeTab === 'tulis-buletin' && sessionUser && (
          <div className="space-y-10">
            {/* FORMULIR TULIS ARTIKEL */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Buat & Unggah Artikel Baru</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Bagikan karya inovasi, modul ajar kreatif, atau praktik baik dari satuan pendidikan Anda.
                </p>
              </div>

              <form onSubmit={handleCreateArticle} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Kategori
                    </label>
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="Praktik Baik">Praktik Baik Pembelajaran</option>
                      <option value="Inovasi Pembelajaran">Inovasi Kurikulum & Media</option>
                      <option value="Kabar Sekolah">Kabar & Prestasi Sekolah</option>
                      <option value="Manajerial">Kepemimpinan & Tata Kelola</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Judul Artikel
                    </label>
                    <input 
                      type="text"
                      placeholder="Contoh: Penerapan Model PJBL Berbantuan Media Interaktif"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ringkasan Singkat (Muncul di kartu beranda)
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Tulis 1-2 kalimat ringkasan tentang isi tulisan ini..."
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* PILIH FOTO SAMPUL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Foto Sampul Dokumentasi
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full sm:w-auto text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {coverPreview && (
                      <div className="w-20 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                        <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Isi Lengkap Artikel
                  </label>
                  <textarea 
                    rows={8}
                    placeholder="Uraikan latar belakang masalah, tindakan/langkah pembelajaran yang dilakukan, hasil yang dicapai, serta refleksi perbaikan..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {submitFeedback.text && (
                  <div className={`p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${submitFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitFeedback.text}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sedang Mengunggah & Menyimpan...' : 'Kirim Artikel Sekarang'}</span>
                </button>
              </form>
            </div>

            {/* DAFTAR ARTIKEL YANG DITULIS OLEH PENGGUNA */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {sessionUser.role === 'pengawas' ? 'Semua Artikel di Sistem' : 'Riwayat Artikel Saya'}
                  </h3>
                  <p className="text-xs text-slate-500">Daftar tulisan yang telah Anda simpan dan status publikasinya.</p>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                  Total: {myArticles.length} Tulisan
                </span>
              </div>

              {myArticles.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Anda belum pernah membuat tulisan. Gunakan form di atas untuk mulai menulis.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myArticles.map((art) => (
                    <div key={art.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={art.cover_url} 
                          alt="" 
                          className="w-16 h-12 rounded-lg object-cover bg-slate-100 shrink-0" 
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{art.judul}</h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                            <span className="font-medium text-blue-600">{art.kategori}</span>
                            <span>•</span>
                            <span>{new Date(art.created_at).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${art.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {art.is_published ? 'Sudah Terbit' : 'Menunggu Kurasi'}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => setSelectedArticle(art)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition"
                            title="Pratinjau"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteArticle(art.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAMPILAN 3: MODERASI PENGAWAS */}
        {activeTab === 'moderasi-buletin' && sessionUser?.role === 'pengawas' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Kurasi & Moderasi Buletin</h2>
            <p className="text-xs text-slate-500 mb-6">Setujui tulisan guru dan kepala sekolah binaan sebelum tampil di majalah utama.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Judul Artikel</th>
                    <th className="py-3 px-4">Penulis & Asal Sekolah</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Moderasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myArticles.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">{b.judul}</td>
                      <td className="py-3 px-4 text-xs">
                        <span className="font-semibold block">{b.author_name}</span>
                        <span className="text-slate-500">{b.author_school}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">{b.kategori}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${b.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {b.is_published ? 'Tayang Publik' : 'Tertahan'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => handleTogglePublish(b.id, b.is_published)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${b.is_published ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                          {b.is_published ? 'Tarik dari Beranda' : 'Setujui & Terbitkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WORKSPACE SEMENTARA LAINNYA */}
        {['supervisi', 'sekolah-binaan', 'profil-sekolah', 'kelola-guru', 'tindak-lanjut'].includes(activeTab) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center py-16">
            <h2 className="text-2xl font-bold text-slate-900 capitalize mb-2">
              Modul: {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Modul ini siap dikerjakan di tahap berikutnya setelah modul penulisan dan buletin berjalan lancar.
            </p>
          </div>
        )}
      </main>

      {/* MODAL BACA ARTIKEL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative">
            <button 
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-64 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 overflow-hidden">
              <img src={selectedArticle.cover_url} alt={selectedArticle.judul} className="w-full h-full object-cover" />
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
              {selectedArticle.kategori}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-3 leading-tight">
              {selectedArticle.judul}
            </h2>
            <div className="mt-3 flex items-center space-x-2 text-xs text-slate-500 pb-4 border-b">
              <span className="font-semibold text-slate-800">{selectedArticle.author_name}</span>
              <span>•</span>
              <span>{selectedArticle.author_school}</span>
              <span>•</span>
              <span>{new Date(selectedArticle.created_at).toLocaleDateString('id-ID')}</span>
            </div>
            <div className="mt-6 text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              {selectedArticle.konten}
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN MULTI-ROLE */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Masuk ke SI PANDAI</h3>
            <p className="text-xs text-slate-500 mb-6">Pilih peran akun Anda untuk mengelola konten dan supervisi.</p>

            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold text-slate-600">
              <button 
                type="button" 
                onClick={() => { setLoginRole('guru'); setIdentifier(''); }}
                className={`py-2 rounded-lg transition ${loginRole === 'guru' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
              >
                Guru
              </button>
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
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {loginRole === 'kepsek' ? 'NPSN Sekolah' : 'Nama Lengkap / Akun'}
                </label>
                <input 
                  type="text"
                  placeholder={loginRole === 'kepsek' ? 'Contoh: 20512345' : 'Contoh: Budi Santoso, S.Pd.'}
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