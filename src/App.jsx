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
  MessageSquare,
  Users,
  Edit3,
  Save,
  Link as LinkIcon
} from 'lucide-react';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [activeTab, setActiveTab] = useState('buletin');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState('kepsek');
  const [identifier, setIdentifier] = useState('20512345');
  const [password, setPassword] = useState('123456');
  const [loginError, setLoginError] = useState('');

  // Buletin
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

  // Supervisi & Sekolah
  const [schools, setSchools] = useState([]);
  const [supervisions, setSupervisions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loadingSupervision, setLoadingSupervision] = useState(false);
  const [selectedSupervision, setSelectedSupervision] = useState(null);

  // Agenda Baru (Pengawas)
  const [showAddSupervisionModal, setShowAddSupervisionModal] = useState(false);
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formJenis, setFormJenis] = useState('akademik');
  const [formFokus, setFormFokus] = useState('');
  const [isSavingSupervision, setIsSavingSupervision] = useState(false);

  // Catatan Observasi (Pengawas)
  const [editKondisi, setEditKondisi] = useState('');
  const [editTemuan, setEditTemuan] = useState('');
  const [editRekomendasi, setEditRekomendasi] = useState('');
  const [editStatus, setEditStatus] = useState('terjadwal');
  const [isUpdatingSupervision, setIsUpdatingSupervision] = useState(false);

  // Validasi Pengawas
  const [validasiText, setValidasiText] = useState('');
  const [activeFollowUpId, setActiveFollowUpId] = useState(null);

  // MODUL KEPSEK: Profil Sekolah & Guru
  const [currentSchool, setCurrentSchool] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nama_sekolah: '',
    akreditasi: '',
    alamat: '',
    nama_kepsek: '',
    nip_kepsek: '',
    total_guru: 0,
    total_siswa: 0,
    sarpras: ''
  });
  const [teachers, setTeachers] = useState([]);
  const [teacherForm, setTeacherForm] = useState({ nama: '', nip: '', email: '', mapel: '' });

  // MODUL KEPSEK: Input Rencana Aksi Baru
  const [newAksi, setNewAksi] = useState('');
  const [newPJ, setNewPJ] = useState('');
  const [newDayaDukung, setNewDayaDukung] = useState('');
  const [newBuktiUrl, setNewBuktiUrl] = useState('');
  const [isSubmittingAksi, setIsSubmittingAksi] = useState(false);

  // 1. Fetch Buletin
  const fetchBulletins = async () => {
    setLoadingBulletins(true);
    try {
      const { data } = await supabase.from('bulletins').select('*').order('created_at', { ascending: false });
      if (data) {
        setBulletins(data);
        setMyArticles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBulletins(false);
    }
  };

  // 2. Fetch Data Supervisi & Sekolah
  const fetchSupervisionData = async () => {
    setLoadingSupervision(true);
    try {
      const { data: schoolsData } = await supabase.from('schools').select('*').order('nama_sekolah', { ascending: true });
      if (schoolsData) {
        setSchools(schoolsData);
        if (schoolsData.length > 0 && !formSchoolId) {
          setFormSchoolId(schoolsData[0].id);
        }

        // Jika user adalah Kepsek, set profil sekolah yang sesuai NPSN-nya
        if (sessionUser?.role === 'kepala_sekolah') {
          const mySch = schoolsData.find(s => s.npsn === sessionUser.npsn) || schoolsData[0];
          if (mySch) {
            setCurrentSchool(mySch);
            setProfileForm({
              nama_sekolah: mySch.nama_sekolah || '',
              akreditasi: mySch.akreditasi || '',
              alamat: mySch.alamat || '',
              nama_kepsek: mySch.nama_kepsek || '',
              nip_kepsek: mySch.nip_kepsek || '',
              total_guru: mySch.total_guru || 0,
              total_siswa: mySch.total_siswa || 0,
              sarpras: mySch.sarpras || ''
            });
            fetchTeachers(mySch.npsn);
          }
        }
      }

      let supQuery = supabase
        .from('supervisions')
        .select(`*, schools ( id, npsn, nama_sekolah, alamat, nama_kepsek )`)
        .order('tanggal_supervisi', { ascending: false });

      if (sessionUser?.role === 'kepala_sekolah') {
        const mySch = schoolsData?.find(s => s.npsn === sessionUser.npsn);
        if (mySch) supQuery = supQuery.eq('school_id', mySch.id);
      }

      const { data: supData } = await supQuery;
      if (supData) {
        setSupervisions(supData);
        if (supData.length > 0) loadSupervisionDetail(supData[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSupervision(false);
    }
  };

  // 3. Ambil Detail Supervisi & Tindak Lanjut
  const loadSupervisionDetail = async (sup) => {
    setSelectedSupervision(sup);
    setEditKondisi(sup.kondisi_situasi || '');
    setEditTemuan(sup.temuan || '');
    setEditRekomendasi(sup.rekomendasi || '');
    setEditStatus(sup.status || 'terjadwal');

    const { data: fuData } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('supervision_id', sup.id)
      .order('created_at', { ascending: true });

    setFollowUps(fuData || []);
  };

  // 4. Fetch Data Guru Berdasarkan NPSN
  const fetchTeachers = async (npsnTarget) => {
    try {
      const { data } = await supabase
        .from('teachers')
        .select('*')
        .eq('npsn', npsnTarget)
        .order('created_at', { ascending: false });
      setTeachers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBulletins();
    if (sessionUser) fetchSupervisionData();
  }, [sessionUser]);

  // Aksi Simpan Profil Sekolah (Kepsek)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentSchool) return;

    try {
      const { error } = await supabase
        .from('schools')
        .update({
          nama_sekolah: profileForm.nama_sekolah,
          akreditasi: profileForm.akreditasi,
          alamat: profileForm.alamat,
          nama_kepsek: profileForm.nama_kepsek,
          nip_kepsek: profileForm.nip_kepsek,
          total_guru: parseInt(profileForm.total_guru) || 0,
          total_siswa: parseInt(profileForm.total_siswa) || 0,
          sarpras: profileForm.sarpras
        })
        .eq('id', currentSchool.id);

      if (error) throw error;
      alert('Profil sekolah berhasil diperbarui!');
      setIsEditingProfile(false);
      fetchSupervisionData();
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  // Aksi Tambah Guru Baru (Kepsek)
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!teacherForm.nama.trim()) {
      alert('Nama guru wajib diisi!');
      return;
    }

    try {
      const { error } = await supabase.from('teachers').insert([
        {
          npsn: sessionUser.npsn,
          nama_guru: teacherForm.nama.trim(),
          nip: teacherForm.nip.trim(),
          email: teacherForm.email.trim(),
          mata_pelajaran: teacherForm.mapel.trim()
        }
      ]);

      if (error) throw error;
      alert('Guru berhasil ditambahkan!');
      setTeacherForm({ nama: '', nip: '', email: '', mapel: '' });
      fetchTeachers(sessionUser.npsn);
    } catch (err) {
      alert(`Gagal menambah guru: ${err.message}`);
    }
  };

  // Aksi Tambah Tindak Lanjut Baru (Kepsek)
  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedSupervision || !newAksi.trim() || !newPJ.trim()) {
      alert('Rencana aksi dan Penanggung Jawab wajib diisi!');
      return;
    }

    setIsSubmittingAksi(true);
    try {
      const { error } = await supabase.from('follow_ups').insert([
        {
          supervision_id: selectedSupervision.id,
          rencana_aksi: newAksi.trim(),
          penanggung_jawab: newPJ.trim(),
          daya_dukung: newDayaDukung.trim(),
          bukti_dukung_url: newBuktiUrl.trim(),
          status_aksi: 'proses',
          validasi_pengawas: 'Menunggu peninjauan bukti oleh pengawas.'
        }
      ]);

      if (error) throw error;

      // Update status supervisi jadi tindak_lanjut jika masih terjadwal
      if (selectedSupervision.status === 'terjadwal') {
        await supabase.from('supervisions').update({ status: 'tindak_lanjut' }).eq('id', selectedSupervision.id);
      }

      setNewAksi('');
      setNewPJ('');
      setNewDayaDukung('');
      setNewBuktiUrl('');
      loadSupervisionDetail(selectedSupervision);
      fetchSupervisionData();
    } catch (err) {
      alert(`Gagal menyimpan aksi: ${err.message}`);
    } finally {
      setIsSubmittingAksi(false);
    }
  };

  // Aksi Update Observasi Pengawas
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
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsUpdatingSupervision(false);
    }
  };

  // Validasi Pengawas
  const handleSaveValidation = async (fuId) => {
    try {
      await supabase.from('follow_ups').update({ validasi_pengawas: validasiText }).eq('id', fuId);
      setActiveFollowUpId(null);
      setValidasiText('');
      if (selectedSupervision) loadSupervisionDetail(selectedSupervision);
    } catch (err) {
      alert(err.message);
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
          const { error: upErr } = await supabase.storage.from('sipandai-storage').upload(cleanFileName, coverFile);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('sipandai-storage').getPublicUrl(cleanFileName);
            if (urlData?.publicUrl) publicCoverUrl = urlData.publicUrl;
          }
        } catch (ex) {
          console.warn(ex);
        }
      }

      const payload = {
        judul: newTitle.trim(),
        ringkasan: newSummary.trim(),
        konten: newContent.trim(),
        kategori: newCategory,
        cover_url: publicCoverUrl,
        author_name: sessionUser?.nama || 'Kontributor',
        author_role: sessionUser?.role || 'guru',
        author_school: sessionUser?.namaSekolah || 'Sekolah Binaan',
        is_published: sessionUser?.role === 'pengawas'
      };

      const { error } = await supabase.from('bulletins').insert([payload]);
      if (error) throw error;

      setArticleFeedback({
        type: 'success',
        text: sessionUser?.role === 'pengawas' ? 'Artikel langsung terbit!' : 'Artikel disimpan dan menunggu tinjauan pengawas.'
      });
      setNewTitle('');
      setNewSummary('');
      setNewContent('');
      setCoverFile(null);
      setCoverPreview('');
      fetchBulletins();
    } catch (err) {
      setArticleFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSubmittingArticle(false);
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
      defaultName = `Drs. Bambang Wijanarko, M.T.`;
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
    setActiveTab(loginRole === 'pengawas' ? 'supervisi' : (loginRole === 'kepsek' ? 'profil-sekolah' : 'tulis-buletin'));
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
                <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-rose-600 rounded-lg transition" title="Keluar">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition">
                <LogIn className="w-4 h-4" />
                <span>Masuk Sistem</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* SUB-NAVBAR KETIKA LOGIN */}
      {sessionUser && (
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-4 text-sm font-medium overflow-x-auto">
            {sessionUser.role === 'pengawas' && (
              <>
                <button onClick={() => setActiveTab('supervisi')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'supervisi' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>
                  Agenda & Hasil Supervisi
                </button>
                <button onClick={() => setActiveTab('sekolah-binaan')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'sekolah-binaan' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>
                  Profil Sekolah Binaan
                </button>
              </>
            )}

            {sessionUser.role === 'kepala_sekolah' && (
              <>
                <button onClick={() => setActiveTab('profil-sekolah')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'profil-sekolah' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>
                  Profil Satuan Pendidikan
                </button>
                <button onClick={() => setActiveTab('kelola-guru')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'kelola-guru' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>
                  Kelola Guru Penulis
                </button>
                <button onClick={() => setActiveTab('tindak-lanjut')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'tindak-lanjut' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>
                  Tindak Lanjut & Bukti Supervisi
                </button>
              </>
            )}

            <button onClick={() => setActiveTab('tulis-buletin')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'tulis-buletin' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>
              Ruang Tulis Artikel
            </button>
          </div>
        </div>
      )}

      {/* KONTEN UTAMA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================== */}
        {/* TAB 1: BULETIN PUBLIK */}
        {/* ========================================== */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bulletins.map((item) => (
                <article 
                  key={item.id} 
                  onClick={() => setSelectedArticle(item)}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col cursor-pointer group"
                >
                  <div className="h-48 w-full overflow-hidden relative bg-slate-100">
                    <img src={item.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
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
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: PROFIL SATUAN PENDIDIKAN (KEPSEK) */}
        {/* ========================================== */}
        {activeTab === 'profil-sekolah' && sessionUser?.role === 'kepala_sekolah' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-md uppercase">
                  NPSN: {currentSchool?.npsn}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">{profileForm.nama_sekolah}</h2>
                <p className="text-xs text-slate-500">Perbarui data profil untuk sinkronisasi instrumen supervisi pengawas.</p>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${isEditingProfile ? 'bg-slate-100 text-slate-700' : 'bg-blue-600 text-white'}`}
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditingProfile ? 'Batal Edit' : 'Edit Profil'}</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nama Satuan Pendidikan</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.nama_sekolah}
                    onChange={(e) => setProfileForm({ ...profileForm, nama_sekolah: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Peringkat Akreditasi</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.akreditasi}
                    onChange={(e) => setProfileForm({ ...profileForm, akreditasi: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  disabled={!isEditingProfile}
                  value={profileForm.alamat}
                  onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nama Kepala Sekolah</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.nama_kepsek}
                    onChange={(e) => setProfileForm({ ...profileForm, nama_kepsek: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">NIP Kepala Sekolah</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.nip_kepsek}
                    onChange={(e) => setProfileForm({ ...profileForm, nip_kepsek: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Jumlah Pendidik (Guru)</label>
                  <input
                    type="number"
                    disabled={!isEditingProfile}
                    value={profileForm.total_guru}
                    onChange={(e) => setProfileForm({ ...profileForm, total_guru: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Jumlah Peserta Didik</label>
                  <input
                    type="number"
                    disabled={!isEditingProfile}
                    value={profileForm.total_siswa}
                    onChange={(e) => setProfileForm({ ...profileForm, total_siswa: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Sarana & Prasarana Utama</label>
                <textarea
                  rows={3}
                  disabled={!isEditingProfile}
                  value={profileForm.sarpras}
                  onChange={(e) => setProfileForm({ ...profileForm, sarpras: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-50"
                />
              </div>

              {isEditingProfile && (
                <div className="flex justify-end pt-3">
                  <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition inline-flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Profil</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: KELOLA GURU PENULIS (KEPSEK) */}
        {/* ========================================== */}
        {activeTab === 'kelola-guru' && sessionUser?.role === 'kepala_sekolah' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Kelola Akun Guru & Penulis</h2>
              <p className="text-xs text-slate-500 mt-1">Daftarkan dewan guru untuk berkontribusi menulis di majalah SI PANDAI.</p>
            </div>

            {/* FORM TAMBAH GURU */}
            <form onSubmit={handleAddTeacher} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">+ Tambah Data Guru Baru</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nama Guru Lengkap</label>
                  <input
                    type="text"
                    placeholder="Contoh: Rina Melati, S.Pd."
                    value={teacherForm.nama}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nama: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mata Pelajaran / Tugas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Guru Matematika & Pembina OSIS"
                    value={teacherForm.mapel}
                    onChange={(e) => setTeacherForm({ ...teacherForm, mapel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">NIP / NUPTK</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1985..."
                    value={teacherForm.nip}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nip: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Alamat Email Guru</label>
                  <input
                    type="email"
                    placeholder="guru@sekolah.sch.id"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition">
                  Simpan Guru Penulis
                </button>
              </div>
            </form>

            {/* TABEL GURU */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Daftar Dewan Guru Terdaftar ({teachers.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b">
                    <tr>
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4">Mata Pelajaran</th>
                      <th className="py-3 px-4">NIP</th>
                      <th className="py-3 px-4">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-800">{t.nama_guru}</td>
                        <td className="py-3 px-4 text-slate-600">{t.mata_pelajaran || '-'}</td>
                        <td className="py-3 px-4 text-slate-500">{t.nip || '-'}</td>
                        <td className="py-3 px-4 text-slate-500">{t.email || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: SUPERVISI & TINDAK LANJUT (PENGAWAS & KEPSEK) */}
        {/* ========================================== */}
        {(activeTab === 'supervisi' || activeTab === 'tindak-lanjut') && sessionUser && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {sessionUser.role === 'pengawas' ? 'Agenda & Instrumen Supervisi Rutin' : 'Catatan Supervisi & Rencana Aksi Sekolah'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {sessionUser.role === 'pengawas' 
                    ? 'Catat temuan konkret lapangan dan pantau komitmen tindak lanjut sekolah binaan.' 
                    : 'Pelajari rekomendasi pengawas, susun rencana aksi, tetapkan PJ, dan lampirkan bukti dukung.'}
                </p>
              </div>

              {sessionUser.role === 'pengawas' && (
                <button
                  onClick={() => setShowAddSupervisionModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Jadwalkan Supervisi Baru</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* DAFTAR AGENDA */}
              <div className="lg:col-span-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  Sesi Supervisi ({supervisions.length})
                </h3>

                {supervisions.map((sup) => {
                  const isSelected = selectedSupervision?.id === sup.id;
                  return (
                    <div
                      key={sup.id}
                      onClick={() => loadSupervisionDetail(sup)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${isSelected ? 'bg-blue-50/80 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          sup.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' :
                          sup.status === 'tindak_lanjut' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {sup.status.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(sup.tanggal_supervisi).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{sup.schools?.nama_sekolah}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                        <strong className="capitalize">[{sup.jenis_supervisi}]</strong> {sup.fokus_pendampingan}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* DETAIL LEMBAR SUPERVISI */}
              <div className="lg:col-span-8 space-y-6">
                {selectedSupervision && (
                  <div className="space-y-6">
                    {/* KARTU CATATAN SUPERVISI */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <div className="border-b pb-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-md uppercase">
                            Supervisi {selectedSupervision.jenis_supervisi}
                          </span>
                          <span className="text-xs text-slate-500">NPSN: {selectedSupervision.schools?.npsn}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedSupervision.schools?.nama_sekolah}</h3>
                      </div>

                      <form onSubmit={handleUpdateObservation} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">1. Fokus Pendampingan</label>
                          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-800 font-medium border border-slate-200">
                            {selectedSupervision.fokus_pendampingan}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">2. Kondisi & Situasi Lapangan</label>
                            {sessionUser.role === 'pengawas' ? (
                              <textarea
                                rows={4}
                                value={editKondisi}
                                onChange={(e) => setEditKondisi(e.target.value)}
                                className="w-full p-2.5 border rounded-lg text-xs outline-none"
                              />
                            ) : (
                              <div className="p-3 bg-slate-50 rounded-lg text-xs border min-h-[90px] whitespace-pre-line text-slate-700">
                                {editKondisi || 'Belum ada catatan.'}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">3. Temuan Nyata</label>
                            {sessionUser.role === 'pengawas' ? (
                              <textarea
                                rows={4}
                                value={editTemuan}
                                onChange={(e) => setEditTemuan(e.target.value)}
                                className="w-full p-2.5 border rounded-lg text-xs outline-none"
                              />
                            ) : (
                              <div className="p-3 bg-slate-50 rounded-lg text-xs border min-h-[90px] whitespace-pre-line text-slate-700">
                                {editTemuan || 'Belum ada catatan temuan.'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">4. Rekomendasi Solutif Pengawas</label>
                          {sessionUser.role === 'pengawas' ? (
                            <textarea
                              rows={3}
                              value={editRekomendasi}
                              onChange={(e) => setEditRekomendasi(e.target.value)}
                              className="w-full p-2.5 border rounded-lg text-xs outline-none"
                            />
                          ) : (
                            <div className="p-3 bg-blue-50/60 rounded-lg text-xs text-blue-900 border border-blue-200 whitespace-pre-line font-medium">
                              {editRekomendasi || 'Belum ada rekomendasi.'}
                            </div>
                          )}
                        </div>

                        {sessionUser.role === 'pengawas' && (
                          <div className="flex justify-between items-center pt-2 border-t">
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="text-xs font-semibold px-2 py-1.5 border rounded-lg bg-white"
                            >
                              <option value="terjadwal">Terjadwal</option>
                              <option value="tindak_lanjut">Proses Tindak Lanjut</option>
                              <option value="selesai">Selesai</option>
                            </select>
                            <button type="submit" disabled={isUpdatingSupervision} className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-lg">
                              {isUpdatingSupervision ? 'Menyimpan...' : 'Perbarui Catatan'}
                            </button>
                          </div>
                        )}
                      </form>
                    </div>

                    {/* MATRIKS TINDAK LANJUT */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                      <div className="border-b pb-3">
                        <h4 className="text-base font-bold text-slate-900">Matriks Rencana Aksi & Bukti Dukung</h4>
                        <p className="text-xs text-slate-500">Komitmen penanganan temuan dan rekomendasi pembinaan.</p>
                      </div>

                      {/* FORM TAMBAH RENCANA AKSI (KHUSUS KEPSEK) */}
                      {sessionUser.role === 'kepala_sekolah' && (
                        <form onSubmit={handleAddFollowUp} className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                          <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider">+ Tambah Rencana Aksi Sekolah</h5>
                          <div>
                            <input
                              type="text"
                              placeholder="Deskripsi Rencana Aksi (contoh: Workshop Validasi Rubrik Portofolio Bersama DUDI)"
                              value={newAksi}
                              onChange={(e) => setNewAksi(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Penanggung Jawab (contoh: Wakasek Kurikulum / Guru X)"
                              value={newPJ}
                              onChange={(e) => setNewPJ(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Daya Dukung (contoh: Ruang Studio TV & BOSDA)"
                              value={newDayaDukung}
                              onChange={(e) => setNewDayaDukung(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                            />
                          </div>
                          <div>
                            <input
                              type="url"
                              placeholder="Tautan Bukti Dukung (Google Drive / Link Berkas)"
                              value={newBuktiUrl}
                              onChange={(e) => setNewBuktiUrl(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                            />
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              type="submit"
                              disabled={isSubmittingAksi}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                            >
                              {isSubmittingAksi ? 'Menyimpan...' : 'Kirim Komitmen Aksi'}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* DAFTAR AKSI */}
                      <div className="space-y-4">
                        {followUps.map((fu, idx) => (
                          <div key={fu.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                                Aksi #{idx + 1}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                fu.status_aksi === 'selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {fu.status_aksi}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-slate-800">{fu.rencana_aksi}</p>

                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border">
                              <div>
                                <span className="text-slate-400 block">PJ:</span>
                                <span className="font-semibold text-slate-700">{fu.penanggung_jawab}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Daya Dukung:</span>
                                <span className="text-slate-700">{fu.daya_dukung || '-'}</span>
                              </div>
                            </div>

                            {fu.bukti_dukung_url && (
                              <div className="text-[11px]">
                                <a href={fu.bukti_dukung_url} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 text-blue-600 hover:underline font-semibold">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Buka Link Dokumen / Foto Bukti</span>
                                </a>
                              </div>
                            )}

                            {/* VALIDASI PENGAWAS */}
                            <div className="pt-2 border-t text-[11px]">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-700">Validasi Pengawas:</span>
                                {sessionUser.role === 'pengawas' && (
                                  <button onClick={() => { setActiveFollowUpId(fu.id); setValidasiText(fu.validasi_pengawas || ''); }} className="text-blue-600 font-semibold hover:underline">
                                    Beri Catatan
                                  </button>
                                )}
                              </div>
                              {activeFollowUpId === fu.id ? (
                                <div className="space-y-2 mt-1">
                                  <textarea
                                    rows={2}
                                    value={validasiText}
                                    onChange={(e) => setValidasiText(e.target.value)}
                                    className="w-full p-2 border border-blue-400 rounded-lg text-xs"
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <button onClick={() => setActiveFollowUpId(null)} className="px-2 py-1 text-xs text-slate-500">Batal</button>
                                    <button onClick={() => handleSaveValidation(fu.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold">Simpan</button>
                                  </div>
                                </div>
                              ) : (
                                <p className="italic text-slate-600 bg-white p-2 rounded border">{fu.validasi_pengawas || 'Belum divalidasi.'}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: RUANG PENULISAN BULETIN */}
        {/* ========================================== */}
        {activeTab === 'tulis-buletin' && sessionUser && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h2 className="text-2xl font-bold text-slate-900">Buat & Kirim Artikel Baru</h2>
              <form onSubmit={handleCreateArticle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Kategori</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    >
                      <option value="Praktik Baik">Praktik Baik Pembelajaran</option>
                      <option value="Inovasi Pembelajaran">Inovasi Kurikulum & Media</option>
                      <option value="Kabar Sekolah">Kabar Sekolah</option>
                      <option value="Manajerial">Manajerial & Tata Kelola</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Judul Artikel</label>
                    <input
                      type="text"
                      placeholder="Judul tulisan..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ringkasan Singkat</label>
                  <textarea
                    rows={2}
                    placeholder="Deskripsi singkat artikel..."
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Foto Sampul</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Isi Lengkap Artikel</label>
                  <textarea
                    rows={7}
                    placeholder="Uraikan praktik baik atau inovasi Anda di sini..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                {articleFeedback.text && (
                  <div className={`p-3 rounded-lg text-xs font-medium ${articleFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {articleFeedback.text}
                  </div>
                )}

                <button type="submit" disabled={isSubmittingArticle} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition">
                  {isSubmittingArticle ? 'Menyimpan...' : 'Kirim Artikel Sekarang'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL BACA ARTIKEL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative">
            <button onClick={() => setSelectedArticle(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
            <div className="h-64 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 overflow-hidden">
              <img src={selectedArticle.cover_url} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
              {selectedArticle.kategori}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-3 leading-tight">{selectedArticle.judul}</h2>
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

      {/* MODAL LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Masuk ke SI PANDAI</h3>
            <p className="text-xs text-slate-500 mb-6">Pilih jenis akun Anda untuk masuk.</p>

            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => { setLoginRole('kepsek'); setIdentifier('20512345'); }}
                className={`py-2 rounded-lg transition ${loginRole === 'kepsek' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
              >
                Kepala Sekolah
              </button>
              <button
                type="button"
                onClick={() => { setLoginRole('pengawas'); setIdentifier('19700101'); }}
                className={`py-2 rounded-lg transition ${loginRole === 'pengawas' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
              >
                Pengawas
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
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {loginRole === 'kepsek' ? 'NPSN Sekolah' : 'Nama Lengkap / NIP'}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Kata Sandi</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {loginError && <p className="text-rose-600 text-xs">{loginError}</p>}

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg">
                  Batal
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm">
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