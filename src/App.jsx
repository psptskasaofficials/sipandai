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
  Send,
  Building2,
  ChevronRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [activeTab, setActiveTab] = useState('buletin');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState('pengawas');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // State Buletin
  const [bulletins, setBulletins] = useState([]);
  const [myArticles, setMyArticles] = useState([]);
  const [loadingBulletins, setLoadingBulletins] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Form Buletin
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Praktik Baik');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);
  const [articleFeedback, setArticleFeedback] = useState({ type: '', text: '' });

  // State Supervisi & Sekolah
  const [schools, setSchools] = useState([]);
  const [supervisions, setSupervisions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loadingSupervision, setLoadingSupervision] = useState(false);
  const [selectedSupervision, setSelectedSupervision] = useState(null);

  // Form Agenda Supervisi Baru
  const [showAddSupervisionModal, setShowAddSupervisionModal] = useState(false);
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formJenis, setFormJenis] = useState('akademik');
  const [formFokus, setFormFokus] = useState('');
  const [isSavingSupervision, setIsSavingSupervision] = useState(false);

  // Form Edit Hasil Observasi Supervisi
  const [editKondisi, setEditKondisi] = useState('');
  const [editTemuan, setEditTemuan] = useState('');
  const [editRekomendasi, setEditRekomendasi] = useState('');
  const [editStatus, setEditStatus] = useState('terjadwal');
  const [isUpdatingSupervision, setIsUpdatingSupervision] = useState(false);

  // Form Validasi Tindak Lanjut oleh Pengawas
  const [validasiText, setValidasiText] = useState('');
  const [activeFollowUpId, setActiveFollowUpId] = useState(null);

  // 1. Ambil Data Buletin
  const fetchBulletins = async () => {
    setLoadingBulletins(true);
    try {
      const { data: publicData } = await supabase
        .from('bulletins')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (publicData) setBulletins(publicData);

      if (sessionUser) {
        let authorQuery = supabase.from('bulletins').select('*').order('created_at', { ascending: false });
        if (sessionUser.role !== 'pengawas') {
          authorQuery = authorQuery.eq('author_name', sessionUser.nama);
        }
        const { data: authorData } = await authorQuery;
        if (authorData) setMyArticles(authorData);
      }
    } catch (err) {
      console.error('Gagal mengambil buletin:', err);
    } finally {
      setLoadingBulletins(false);
    }
  };

  // 2. Ambil Data Sekolah & Supervisi
  const fetchSupervisionData = async () => {
    setLoadingSupervision(true);
    try {
      // Ambil daftar sekolah
      const { data: schoolsData } = await supabase.from('schools').select('*').order('nama_sekolah', { ascending: true });
      if (schoolsData) {
        setSchools(schoolsData);
        if (schoolsData.length > 0 && !formSchoolId) {
          setFormSchoolId(schoolsData[0].id);
        }
      }

      // Ambil supervisi
      let supQuery = supabase
        .from('supervisions')
        .select(`
          *,
          schools ( id, npsn, nama_sekolah, alamat, nama_kepsek )
        `)
        .order('tanggal_supervisi', { ascending: false });

      // Jika role kepsek, filter hanya untuk sekolahnya
      if (sessionUser?.role === 'kepala_sekolah') {
        const matchingSchool = schoolsData?.find(s => s.npsn === sessionUser.npsn);
        if (matchingSchool) {
          supQuery = supQuery.eq('school_id', matchingSchool.id);
        }
      }

      const { data: supData, error: supErr } = await supQuery;
      if (!supErr && supData) {
        setSupervisions(supData);
        if (supData.length > 0 && !selectedSupervision) {
          loadSupervisionDetail(supData[0]);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data supervisi:', err);
    } finally {
      setLoadingSupervision(false);
    }
  };

  // 3. Ambil Detail Supervisi & Tindak Lanjutnya
  const loadSupervisionDetail = async (sup) => {
    setSelectedSupervision(sup);
    setEditKondisi(sup.kondisi_situasi || '');
    setEditTemuan(sup.temuan || '');
    setEditRekomendasi(sup.rekomendasi || '');
    setEditStatus(sup.status || 'terjadwal');

    // Ambil matriks tindak lanjut terkait
    const { data: fuData } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('supervision_id', sup.id)
      .order('created_at', { ascending: true });

    setFollowUps(fuData || []);
  };

  useEffect(() => {
    fetchBulletins();
    if (sessionUser) {
      fetchSupervisionData();
    }
  }, [sessionUser]);

  // Handle Simpan Agenda Baru
  const handleCreateSupervision = async (e) => {
    e.preventDefault();
    if (!formSchoolId || !formTanggal || !formFokus.trim()) {
      alert('Harap lengkapi sekolah, tanggal, dan fokus pendampingan!');
      return;
    }

    setIsSavingSupervision(true);
    try {
      const payload = {
        school_id: formSchoolId,
        tanggal_supervisi: formTanggal,
        jenis_supervisi: formJenis,
        fokus_pendampingan: formFokus.trim(),
        status: 'terjadwal',
        kondisi_situasi: 'Menunggu pelaksanaan visitasi.',
        temuan: 'Belum dilakukan visitasi.',
        rekomendasi: 'Siapkan instrumen dan berkas pendukung supervisi.'
      };

      const { data, error } = await supabase.from('supervisions').insert([payload]).select(`
        *,
        schools ( id, npsn, nama_sekolah, alamat, nama_kepsek )
      `);

      if (error) throw error;

      setShowAddSupervisionModal(false);
      setFormFokus('');
      setFormTanggal('');
      fetchSupervisionData();
      if (data && data[0]) {
        loadSupervisionDetail(data[0]);
      }
    } catch (err) {
      alert(`Gagal membuat agenda: ${err.message}`);
    } finally {
      setIsSavingSupervision(false);
    }
  };

  // Handle Update Hasil Catatan Observasi Lapangan
  const handleUpdateObservation = async (e) => {
    e.preventDefault();
    if (!selectedSupervision) return;

    setIsUpdatingSupervision(true);
    try {
      const { error } = await supabase
        .from('supervisions')
        .update({
          kondisi_situasi: editKondisi,
          temuan: editTemuan,
          rekomendasi: editRekomendasi,
          status: editStatus
        })
        .eq('id', selectedSupervision.id);

      if (error) throw error;

      alert('Hasil observasi supervisi berhasil diperbarui!');
      fetchSupervisionData();
      setSelectedSupervision(prev => ({
        ...prev,
        kondisi_situasi: editKondisi,
        temuan: editTemuan,
        rekomendasi: editRekomendasi,
        status: editStatus
      }));
    } catch (err) {
      alert(`Gagal menyimpan perubahan: ${err.message}`);
    } finally {
      setIsUpdatingSupervision(false);
    }
  };

  // Handle Validasi Tindak Lanjut oleh Pengawas
  const handleSaveValidation = async (fuId) => {
    try {
      const { error } = await supabase
        .from('follow_ups')
        .update({ validasi_pengawas: validasiText })
        .eq('id', fuId);

      if (error) throw error;

      setActiveFollowUpId(null);
      setValidasiText('');
      if (selectedSupervision) {
        loadSupervisionDetail(selectedSupervision);
      }
    } catch (err) {
      alert(`Gagal memvalidasi: ${err.message}`);
    }
  };

  // Buletin Actions
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim() || !newContent.trim()) {
      setArticleFeedback({ type: 'error', text: 'Semua kolom wajib diisi!' });
      return;
    }

    setIsSubmittingArticle(true);
    setArticleFeedback({ type: '', text: '' });

    try {
      let publicCoverUrl = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80';
      if (coverFile) {
        try {
          const fileExt = coverFile.name.split('.').pop();
          const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('sipandai-storage').upload(cleanFileName, coverFile);
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('sipandai-storage').getPublicUrl(cleanFileName);
            if (urlData?.publicUrl) publicCoverUrl = urlData.publicUrl;
          }
        } catch (ex) {
          console.warn('Storage fallback:', ex);
        }
      }

      const isAutoPublish = sessionUser?.role === 'pengawas';
      const payload = {
        judul: newTitle.trim(),
        ringkasan: newSummary.trim(),
        konten: newContent.trim(),
        kategori: newCategory,
        cover_url: publicCoverUrl,
        author_name: sessionUser?.nama || 'Kontributor',
        author_role: sessionUser?.role || 'guru',
        author_school: sessionUser?.namaSekolah || 'Sekolah Binaan',
        is_published: isAutoPublish
      };

      const { error } = await supabase.from('bulletins').insert([payload]);
      if (error) throw error;

      setArticleFeedback({
        type: 'success',
        text: isAutoPublish ? 'Artikel berhasil terbit!' : 'Artikel disimpan dan menunggu persetujuan pengawas.'
      });
      setNewTitle('');
      setNewSummary('');
      setNewContent('');
      setCoverFile(null);
      setCoverPreview('');
      fetchBulletins();
    } catch (err) {
      setArticleFeedback({ type: 'error', text: `Gagal: ${err.message}` });
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      await supabase.from('bulletins').update({ is_published: !currentStatus }).eq('id', id);
      fetchBulletins();
    } catch (err) {
      alert(`Gagal moderasi: ${err.message}`);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Hapus artikel ini?')) return;
    try {
      await supabase.from('bulletins').delete().eq('id', id);
      fetchBulletins();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  // Auth Quick Login
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!identifier.trim()) {
      setLoginError('Harap isi identitas.');
      return;
    }

    let defaultName = 'Bapak/Ibu Guru';
    let defaultSchool = 'SMK Negeri 1 Pacitan';

    if (loginRole === 'pengawas') {
      defaultName = 'Drs. H. Mulyono, M.Pd.';
      defaultSchool = 'Pengawas Wilayah Binaan';
    } else if (loginRole === 'kepsek') {
      defaultName = `Drs. Bambang Wijanarko, M.T. (NPSN: ${identifier})`;
      defaultSchool = 'SMK Negeri 1 Pacitan';
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
    setActiveTab(loginRole === 'pengawas' ? 'supervisi' : (loginRole === 'kepsek' ? 'tindak-lanjut' : 'tulis-buletin'));
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

      {/* WORKSPACE SUB-NAVBAR JIKA SUDAH LOGIN */}
      {sessionUser && (
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-4 text-sm font-medium overflow-x-auto">
            {sessionUser.role === 'pengawas' && (
              <>
                <button 
                  onClick={() => setActiveTab('supervisi')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'supervisi' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}
                >
                  Agenda & Hasil Supervisi
                </button>
                <button 
                  onClick={() => setActiveTab('sekolah-binaan')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'sekolah-binaan' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}
                >
                  Profil Sekolah Binaan
                </button>
                <button 
                  onClick={() => setActiveTab('moderasi-buletin')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'moderasi-buletin' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}
                >
                  Kurasi Buletin
                </button>
              </>
            )}

            {sessionUser.role === 'kepala_sekolah' && (
              <>
                <button 
                  onClick={() => setActiveTab('tindak-lanjut')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'tindak-lanjut' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}
                >
                  Catatan Supervisi & Rencana Aksi
                </button>
                <button 
                  onClick={() => setActiveTab('profil-sekolah')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'profil-sekolah' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}
                >
                  Profil Satuan Pendidikan
                </button>
                <button 
                  onClick={() => setActiveTab('kelola-guru')} 
                  className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'kelola-guru' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}
                >
                  Kelola Akun Guru
                </button>
              </>
            )}

            <button 
              onClick={() => setActiveTab('tulis-buletin')} 
              className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'tulis-buletin' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}
            >
              Ruang Tulis Artikel
            </button>
          </div>
        </div>
      )}

      {/* KONTEN UTAMA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ======================================================== */}
        {/* TAMPILAN 1: BULETIN PUBLIK */}
        {/* ======================================================== */}
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
                Publikasi karya pembelajaran guru, inovasi tata kelola kepala sekolah, serta catatan refleksi supervisi pengawas.
              </p>
            </div>

            {loadingBulletins ? (
              <div className="text-center py-16 text-slate-500">Memuat artikel buletin...</div>
            ) : bulletins.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
                Belum ada artikel yang disetujui terbit.
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

        {/* ======================================================== */}
        {/* TAMPILAN 2: MODUL SUPERVISI & PENDAMPINGAN (PENGAWAS & KEPSEK) */}
        {/* ======================================================== */}
        {(activeTab === 'supervisi' || activeTab === 'tindak-lanjut') && sessionUser && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {sessionUser.role === 'pengawas' ? 'Agenda & Instrumen Supervisi Rutin' : 'Hasil Supervisi Satuan Pendidikan'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {sessionUser.role === 'pengawas' 
                    ? 'Kelola fokus pendampingan, catat temuan riil, dan rekomendasikan tindak lanjut.'
                    : 'Tinjau rekomendasi pembinaan pengawas dan kelola matriks aksi sekolah.'}
                </p>
              </div>

              {sessionUser.role === 'pengawas' && (
                <button
                  onClick={() => setShowAddSupervisionModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Jadwalkan Supervisi Baru</span>
                </button>
              )}
            </div>

            {/* AREA KERJA DUA KOLOM: DAFTAR KUNJUNGAN & DETAIL INSTRUMEN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* KOLOM KIRI: DAFTAR KUNJUNGAN */}
              <div className="lg:col-span-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  Riwayat & Jadwal Kunjungan ({supervisions.length})
                </h3>

                {loadingSupervision ? (
                  <div className="p-8 bg-white rounded-xl text-center text-xs text-slate-400">Memuat data supervisi...</div>
                ) : supervisions.length === 0 ? (
                  <div className="p-8 bg-white rounded-xl text-center text-xs text-slate-400 border border-slate-200">
                    Belum ada agenda supervisi tercatat.
                  </div>
                ) : (
                  supervisions.map((sup) => {
                    const isSelected = selectedSupervision?.id === sup.id;
                    return (
                      <div
                        key={sup.id}
                        onClick={() => loadSupervisionDetail(sup)}
                        className={`p-4 rounded-xl border transition cursor-pointer ${isSelected ? 'bg-blue-50/80 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sup.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' :
                            sup.status === 'tindak_lanjut' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {sup.status.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {new Date(sup.tanggal_supervisi).toLocaleDateString('id-ID')}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {sup.schools?.nama_sekolah || 'Satuan Pendidikan'}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          <span className="font-semibold text-slate-700 capitalize">[{sup.jenis_supervisi}]</span> {sup.fokus_pendampingan}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* KOLOM KANAN: DETAIL LEMBAR SUPERVISI & TINDAK LANJUT */}
              <div className="lg:col-span-8 space-y-6">
                {selectedSupervision ? (
                  <div className="space-y-6">
                    {/* KARTU IDENTITAS SUPERVISI */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <div className="flex items-start justify-between border-b pb-4 mb-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-md uppercase">
                              Supervisi {selectedSupervision.jenis_supervisi}
                            </span>
                            <span className="text-xs text-slate-500">
                              NPSN: {selectedSupervision.schools?.npsn}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mt-1">
                            {selectedSupervision.schools?.nama_sekolah}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Kepala Sekolah: <strong>{selectedSupervision.schools?.nama_kepsek || '-'}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-400 block uppercase">Tanggal Visitasi</span>
                          <span className="text-sm font-bold text-slate-800">
                            {new Date(selectedSupervision.tanggal_supervisi).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                          </span>
                        </div>
                      </div>

                      {/* BLOK FORM OBSERVASI PENGAWAS */}
                      <form onSubmit={handleUpdateObservation} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            1. Fokus Pendampingan Utama
                          </label>
                          <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-800 font-medium border border-slate-200">
                            {selectedSupervision.fokus_pendampingan}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              2. Kondisi & Situasi Nyata di Lapangan
                            </label>
                            {sessionUser.role === 'pengawas' ? (
                              <textarea
                                rows={4}
                                value={editKondisi}
                                onChange={(e) => setEditKondisi(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Uraikan iklim belajar, sarana yang diamati, atau dinamika saat visitasi..."
                              />
                            ) : (
                              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 leading-relaxed min-h-[90px] border border-slate-200 whitespace-pre-line">
                                {editKondisi || 'Belum ada catatan.'}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              3. Temuan Lapangan (Fakta / Data)
                            </label>
                            {sessionUser.role === 'pengawas' ? (
                              <textarea
                                rows={4}
                                value={editTemuan}
                                onChange={(e) => setEditTemuan(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Tuliskan temuan positif maupun kendala yang ditemukan..."
                              />
                            ) : (
                              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 leading-relaxed min-h-[90px] border border-slate-200 whitespace-pre-line">
                                {editTemuan || 'Belum ada catatan temuan.'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            4. Rekomendasi Solutif Pengawas Sekolah
                          </label>
                          {sessionUser.role === 'pengawas' ? (
                            <textarea
                              rows={3}
                              value={editRekomendasi}
                              onChange={(e) => setEditRekomendasi(e.target.value)}
                              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Arahan tindak lanjut, pelatihan, atau perbaikan tata kelola..."
                            />
                          ) : (
                            <div className="p-3 bg-blue-50/60 rounded-lg text-xs text-blue-900 leading-relaxed border border-blue-200 whitespace-pre-line font-medium">
                              {editRekomendasi || 'Belum ada rekomendasi.'}
                            </div>
                          )}
                        </div>

                        {sessionUser.role === 'pengawas' && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-semibold text-slate-600">Status Supervisi:</span>
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                              >
                                <option value="terjadwal">Terjadwal</option>
                                <option value="tindak_lanjut">Proses Tindak Lanjut</option>
                                <option value="selesai">Selesai / Tuntas</option>
                              </select>
                            </div>

                            <button
                              type="submit"
                              disabled={isUpdatingSupervision}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition shadow-sm"
                            >
                              {isUpdatingSupervision ? 'Menyimpan...' : 'Perbarui Catatan Observasi'}
                            </button>
                          </div>
                        )}
                      </form>
                    </div>

                    {/* BLOK MATRIKS TINDAK LANJUT & BUKTI DUKUNG */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4 border-b pb-3">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            Matriks Komitmen Tindak Lanjut Sekolah
                          </h4>
                          <p className="text-xs text-slate-500">
                            Rencana aksi nyata perbaikan, penanggung jawab, daya dukung, dan validasi pengawas.
                          </p>
                        </div>
                      </div>

                      {followUps.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                          Belum ada poin rencana aksi yang didaftarkan untuk supervisi ini.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {followUps.map((fu, idx) => (
                            <div key={fu.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                              <div className="flex items-start justify-between">
                                <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                  Aksi #{idx + 1}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  fu.status_aksi === 'selesai' ? 'bg-emerald-100 text-emerald-800' :
                                  fu.status_aksi === 'proses' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  Status: {fu.status_aksi}
                                </span>
                              </div>

                              <p className="text-xs font-semibold text-slate-800">
                                {fu.rencana_aksi}
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                                <div>
                                  <span className="text-slate-400 block font-medium">Penanggung Jawab:</span>
                                  <span className="font-semibold text-slate-800">{fu.penanggung_jawab}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-medium">Daya Dukung:</span>
                                  <span>{fu.daya_dukung || '-'}</span>
                                </div>
                              </div>

                              {/* Tautan Bukti Dukung */}
                              {fu.bukti_dukung_url && (
                                <div className="text-[11px]">
                                  <a 
                                    href={fu.bukti_dukung_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center space-x-1.5 text-blue-600 hover:underline font-semibold"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Buka Dokumen / Foto Bukti Dukung</span>
                                  </a>
                                </div>
                              )}

                              {/* Catatan Validasi Pengawas */}
                              <div className="pt-2 border-t border-slate-200 text-[11px]">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-700">Catatan Validasi Pengawas:</span>
                                  {sessionUser.role === 'pengawas' && (
                                    <button
                                      onClick={() => {
                                        setActiveFollowUpId(fu.id);
                                        setValidasiText(fu.validasi_pengawas || '');
                                      }}
                                      className="text-blue-600 hover:underline font-semibold"
                                    >
                                      {fu.validasi_pengawas ? 'Ubah Catatan' : '+ Beri Validasi'}
                                    </button>
                                  )}
                                </div>

                                {activeFollowUpId === fu.id ? (
                                  <div className="mt-2 space-y-2">
                                    <textarea
                                      rows={2}
                                      value={validasiText}
                                      onChange={(e) => setValidasiText(e.target.value)}
                                      className="w-full p-2 border border-blue-400 rounded-lg text-xs outline-none bg-white"
                                      placeholder="Tuliskan evaluasi pengawas terkait ketercapaian bukti aksi..."
                                    />
                                    <div className="flex justify-end space-x-2">
                                      <button
                                        onClick={() => setActiveFollowUpId(null)}
                                        className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded text-xs"
                                      >
                                        Batal
                                      </button>
                                      <button
                                        onClick={() => handleSaveValidation(fu.id)}
                                        className="px-3 py-1 bg-blue-600 text-white font-semibold rounded text-xs shadow-sm"
                                      >
                                        Simpan Validasi
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                                    {fu.validasi_pengawas || 'Belum ada catatan validasi dari pengawas.'}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
                    Pilih agenda di sebelah kiri untuk melihat rincian instrumen supervisi.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAMPILAN 3: DAFTAR PROFIL SEKOLAH BINAAN (PENGAWAS VIEW) */}
        {/* ======================================================== */}
        {activeTab === 'sekolah-binaan' && sessionUser?.role === 'pengawas' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Daftar Satuan Pendidikan Binaan</h2>
              <p className="text-xs text-slate-500 mt-1">
                Data induk sarana prasarana dan profil kepemimpinan sekolah di bawah pendampingan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((sch) => (
                <div key={sch.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                        Akreditasi {sch.akreditasi}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">NPSN: {sch.npsn}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {sch.nama_sekolah}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {sch.alamat}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Kepala Sekolah:</span>
                        <span className="font-semibold text-slate-800">{sch.nama_kepsek || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                        <div>Guru: <strong>{sch.total_guru} Org</strong></div>
                        <div>Siswa: <strong>{sch.total_siswa} Org</strong></div>
                      </div>
                      <div className="pt-1">
                        <span className="text-slate-400 block font-medium">Sarana Utama:</span>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{sch.sarpras || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAMPILAN 4: RUANG PENULISAN ARTIKEL BULETIN */}
        {/* ======================================================== */}
        {activeTab === 'tulis-buletin' && sessionUser && (
          <div className="space-y-10">
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
                    Ringkasan Singkat (1-2 Kalimat)
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Tulis 1-2 kalimat ringkasan tentang isi tulisan ini..."
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

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
                    placeholder="Uraikan latar belakang masalah, tindakan/langkah inovasi yang dilakukan, serta refleksi perbaikan..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {articleFeedback.text && (
                  <div className={`p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${articleFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{articleFeedback.text}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isSubmittingArticle}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingArticle ? 'Menyimpan...' : 'Kirim Artikel Sekarang'}</span>
                </button>
              </form>
            </div>

            {/* DAFTAR ARTIKEL PENULIS */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {sessionUser.role === 'pengawas' ? 'Daftar Seluruh Artikel' : 'Riwayat Artikel Saya'}
                  </h3>
                  <p className="text-xs text-slate-500">Pantau status publikasi artikel Anda.</p>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                  Total: {myArticles.length} Tulisan
                </span>
              </div>

              {myArticles.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Belum ada tulisan tersimpan.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myArticles.map((art) => (
                    <div key={art.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <img src={art.cover_url} alt="" className="w-16 h-12 rounded-lg object-cover bg-slate-100 shrink-0" />
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
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50"
                            title="Pratinjau"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteArticle(art.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
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

        {/* ======================================================== */}
        {/* TAMPILAN 5: MODERASI BULETIN (PENGAWAS ONLY) */}
        {/* ======================================================== */}
        {activeTab === 'moderasi-buletin' && sessionUser?.role === 'pengawas' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Kurasi & Moderasi Buletin</h2>
            <p className="text-xs text-slate-500 mb-6">Persetujuan artikel sebelum tayang di halaman depan publik.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Judul Artikel</th>
                    <th className="py-3 px-4">Penulis & Sekolah</th>
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
                          {b.is_published ? 'Tarik Publikasi' : 'Setujui & Terbitkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL TAMBAH JADWAL SUPERVISI (PENGAWAS) */}
      {showAddSupervisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Jadwalkan Kunjungan Supervisi</h3>
            <p className="text-xs text-slate-500 mb-6">Pilih sekolah sasaran, tanggal visitasi, dan tetapkan fokus utama pendampingan.</p>

            <form onSubmit={handleCreateSupervision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Sekolah Binaan
                </label>
                <select
                  value={formSchoolId}
                  onChange={(e) => setFormSchoolId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama_sekolah} ({s.npsn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Kunjungan
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Jenis Supervisi
                  </label>
                  <select
                    value={formJenis}
                    onChange={(e) => setFormJenis(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="akademik">Akademik / Pembelajaran</option>
                    <option value="manajerial">Manajerial / Tata Kelola</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Fokus Pendampingan
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Evaluasi Modul Ajar Berdiferensiasi & Kesiapan Uji Kompetensi Kejuruan (UKK)"
                  value={formFokus}
                  onChange={(e) => setFormFokus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSupervisionModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSupervision}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {isSavingSupervision ? 'Menyimpan...' : 'Simpan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BACA ARTIKEL DETAIL */}
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
            <p className="text-xs text-slate-500 mb-6">Pilih jenis akun Anda untuk melanjutkan akses.</p>

            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold text-slate-600">
              <button 
                type="button" 
                onClick={() => { setLoginRole('pengawas'); setIdentifier('19700101'); }}
                className={`py-2 rounded-lg transition ${loginRole === 'pengawas' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
              >
                Pengawas
              </button>
              <button 
                type="button" 
                onClick={() => { setLoginRole('kepsek'); setIdentifier('20512345'); }}
                className={`py-2 rounded-lg transition ${loginRole === 'kepsek' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
              >
                Kepala Sekolah
              </button>
              <button 
                type="button" 
                onClick={() => { setLoginRole('guru'); setIdentifier('Usnan Rofik, S.Kom.'); }}
                className={`py-2 rounded-lg transition ${loginRole === 'guru' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
              >
                Guru
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {loginRole === 'kepsek' ? 'NPSN Sekolah' : 'Nama Lengkap / NIP'}
                </label>
                <input 
                  type="text"
                  placeholder={loginRole === 'kepsek' ? 'Contoh: 20512345' : 'Masukkan nama/NIP'}
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