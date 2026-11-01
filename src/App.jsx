import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import PrintBeritaAcara from './PrintBeritaAcara';
import DashboardView from './DashboardView';
import { 
  LogIn, LogOut, PlusCircle, Eye, Trash2, ExternalLink, 
  Edit3, Save, Printer, Trash, UserCheck, KeyRound, Bell, X,
  BookOpen, ArrowRight
} from 'lucide-react';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [activeTab, setActiveTab] = useState('buletin');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState('kepsek');
  const [identifier, setIdentifier] = useState('20512345');
  const [password, setPassword] = useState('123456');

  // Modal Profil & Kata Sandi
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileNama, setProfileNama] = useState('');
  const [profileNip, setProfileNip] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Pengaturan Kop Surat & Identitas Pengawas
  const [systemSettings, setSystemSettings] = useState({
    instansi: 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan',
    judul: 'SISTEM INFORMASI SUPERVISI & PENDAMPINGAN (SI PANDAI)',
    wilayah: 'Sekolah Binaan Wilayah Kerja Kabupaten Pacitan',
    pengawas_nama: 'Drs. H. Mulyono, M.Pd.',
    pengawas_nip: '197005121998021001'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // State Buletin
  const [bulletins, setBulletins] = useState([]);
  const [allBulletinsForSupervisor, setAllBulletinsForSupervisor] = useState([]);
  const [myArticles, setMyArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Form CRUD Buletin (Create & Edit)
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Praktik Baik');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);

  // Supervisi & Sekolah
  const [schools, setSchools] = useState([]);
  const [supervisions, setSupervisions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [selectedSupervision, setSelectedSupervision] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Notifikasi
  const [notifications, setNotifications] = useState([]);

  // Form Baru Sekolah & Agenda
  const [newSchoolForm, setNewSchoolForm] = useState({ npsn: '', nama: '', akreditasi: 'A', alamat: '', kepsek: '', nip: '' });
  const [showAddSupervisionModal, setShowAddSupervisionModal] = useState(false);
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formJenis, setFormJenis] = useState('akademik');
  const [formFokus, setFormFokus] = useState('');

  // Edit Observasi Pengawas
  const [editKondisi, setEditKondisi] = useState('');
  const [editTemuan, setEditTemuan] = useState('');
  const [editRekomendasi, setEditRekomendasi] = useState('');
  const [editStatus, setEditStatus] = useState('terjadwal');
  const [validasiText, setValidasiText] = useState('');
  const [activeFollowUpId, setActiveFollowUpId] = useState(null);

  // Kepsek Profil & Aksi
  const [currentSchool, setCurrentSchool] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nama_sekolah: '', akreditasi: '', alamat: '', nama_kepsek: '', nip_kepsek: '', total_guru: 0, total_siswa: 0, sarpras: ''
  });
  const [teachers, setTeachers] = useState([]);
  const [teacherForm, setTeacherForm] = useState({ nama: '', nip: '', email: '', mapel: '' });
  const [newAksi, setNewAksi] = useState('');
  const [newPJ, setNewPJ] = useState('');
  const [newDayaDukung, setNewDayaDukung] = useState('');
  const [newBuktiUrl, setNewBuktiUrl] = useState('');

  // 1. Fetch System Settings
  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').eq('id', 'sistem_config').single();
      if (data) setSystemSettings(data);
    } catch (e) { console.error('Load settings:', e); }
  };

  useEffect(() => { fetchSettings(); }, []);

  // 2. Fetch Data Buletin
  const fetchBulletins = async () => {
    try {
      const { data: pub } = await supabase.from('bulletins').select('*').eq('is_published', true).order('created_at', { ascending: false });
      if (pub) setBulletins(pub);
      const { data: all } = await supabase.from('bulletins').select('*').order('created_at', { ascending: false });
      if (all) {
        setAllBulletinsForSupervisor(all);
        if (sessionUser) {
          setMyArticles(sessionUser.role === 'pengawas' ? all : all.filter(a => a.author_name === sessionUser.nama));
        }
      }
    } catch (e) { console.error(e); }
  };

  // 3. Fetch Supervisi, Sekolah & Notifikasi
  const fetchSupervisionData = async (user = sessionUser) => {
    try {
      const { data: schData } = await supabase.from('schools').select('*').order('nama_sekolah', { ascending: true });
      let matched = null;

      if (schData && schData.length > 0) {
        setSchools(schData);
        if (!formSchoolId) setFormSchoolId(schData[0].id);

        if (user && user.role === 'kepsek') {
          matched = schData.find(s => String(s.npsn).trim() === String(user.npsn).trim()) || schData[0];
          setCurrentSchool(matched);
          setProfileForm({
            nama_sekolah: matched.nama_sekolah || '', akreditasi: matched.akreditasi || '', alamat: matched.alamat || '',
            nama_kepsek: matched.nama_kepsek || '', nip_kepsek: matched.nip_kepsek || '', total_guru: matched.total_guru || 0,
            total_siswa: matched.total_siswa || 0, sarpras: matched.sarpras || ''
          });
          fetchTeachers(matched.npsn);
        }
      }

      let supQuery = supabase.from('supervisions').select(`*, schools ( id, npsn, nama_sekolah, alamat, nama_kepsek, nip_kepsek )`).order('tanggal_supervisi', { ascending: false });
      if (user && user.role === 'kepsek' && matched) supQuery = supQuery.eq('school_id', matched.id);
      
      const { data: supData } = await supQuery;
      if (supData) {
        setSupervisions(supData);
        if (supData.length > 0) {
          loadSupervisionDetail(supData[0]);
        } else {
          setSelectedSupervision(null);
          setFollowUps([]);
        }

        const generatedNotifs = [];
        if (user?.role === 'pengawas') {
          const { data: fuAll } = await supabase.from('follow_ups').select('*').eq('status_aksi', 'proses').limit(4);
          if (fuAll && fuAll.length > 0) {
            fuAll.forEach(f => {
              generatedNotifs.push({
                tipe: 'aksi_baru',
                judul: 'Rencana Aksi Menunggu Validasi',
                pesan: f.rencana_aksi,
                waktu: 'Baru saja'
              });
            });
          }
        } else if (user?.role === 'kepsek') {
          if (supData.length > 0) {
            generatedNotifs.push({
              tipe: 'supervisi_baru',
              judul: 'Agenda Kunjungan Supervisi',
              pesan: `Fokus: ${supData[0].fokus_pendampingan}`,
              waktu: new Date(supData[0].tanggal_supervisi).toLocaleDateString('id-ID')
            });
          }
        }
        setNotifications(generatedNotifs);
      }
    } catch (e) { console.error(e); }
  };

  const loadSupervisionDetail = async (sup) => {
    setSelectedSupervision(sup);
    setEditKondisi(sup.kondisi_situasi || '');
    setEditTemuan(sup.temuan || '');
    setEditRekomendasi(sup.rekomendasi || '');
    setEditStatus(sup.status || 'terjadwal');
    const { data: fu } = await supabase.from('follow_ups').select('*').eq('supervision_id', sup.id).order('created_at', { ascending: true });
    setFollowUps(fu || []);
  };

  const fetchTeachers = async (npsn) => {
    const { data } = await supabase.from('teachers').select('*').eq('npsn', npsn).order('created_at', { ascending: false });
    setTeachers(data || []);
  };

  useEffect(() => {
    fetchBulletins();
    if (sessionUser) fetchSupervisionData(sessionUser);
  }, [sessionUser]);

  // Simpan Pengaturan Kop & Profil Pengawas
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const { error } = await supabase.from('settings').upsert({
        id: 'sistem_config',
        instansi: systemSettings.instansi,
        judul: systemSettings.judul,
        wilayah: systemSettings.wilayah,
        pengawas_nama: systemSettings.pengawas_nama,
        pengawas_nip: systemSettings.pengawas_nip
      });
      if (error) throw error;
      alert('Pengaturan sistem berhasil disimpan!');
      if (sessionUser?.role === 'pengawas') {
        setSessionUser({ ...sessionUser, nama: systemSettings.pengawas_nama });
      }
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Simpan Profil Pengguna & Kata Sandi
  const handleSaveUserProfile = async (e) => {
    e.preventDefault();
    if (!profileNama.trim()) return alert('Nama tidak boleh kosong!');

    try {
      if (sessionUser.role === 'pengawas') {
        await supabase.from('settings').upsert({
          id: 'sistem_config',
          ...systemSettings,
          pengawas_nama: profileNama.trim(),
          pengawas_nip: profileNip.trim()
        });
        setSystemSettings(prev => ({ ...prev, pengawas_nama: profileNama.trim(), pengawas_nip: profileNip.trim() }));
      } else if (sessionUser.role === 'kepsek' && currentSchool) {
        await supabase.from('schools').update({
          nama_kepsek: profileNama.trim(),
          nip_kepsek: profileNip.trim()
        }).eq('id', currentSchool.id);
      }

      setSessionUser(prev => ({ ...prev, nama: profileNama.trim() }));
      setShowProfileModal(false);
      setNewPassword('');
      alert('Profil pengguna dan kata sandi berhasil diperbarui!');
    } catch (err) {
      alert('Gagal memperbarui profil: ' + err.message);
    }
  };

  // CRUD Buletin (Create & Update)
  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return alert('Judul dan isi artikel wajib diisi!');
    setIsSubmittingArticle(true);
    try {
      let publicCoverUrl = coverPreview || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80';
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: upErr } = await supabase.storage.from('sipandai-storage').upload(cleanFileName, coverFile);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('sipandai-storage').getPublicUrl(cleanFileName);
          if (urlData?.publicUrl) publicCoverUrl = urlData.publicUrl;
        }
      }

      if (editingArticleId) {
        // Mode Update
        await supabase.from('bulletins').update({
          judul: newTitle.trim(),
          ringkasan: newSummary.trim(),
          konten: newContent.trim(),
          kategori: newCategory,
          cover_url: publicCoverUrl
        }).eq('id', editingArticleId);
        alert('Artikel berhasil diperbarui!');
      } else {
        // Mode Create
        await supabase.from('bulletins').insert([{
          judul: newTitle.trim(),
          ringkasan: newSummary.trim(),
          konten: newContent.trim(),
          kategori: newCategory,
          cover_url: publicCoverUrl,
          author_name: sessionUser?.nama || 'Kontributor',
          author_role: sessionUser?.role || 'guru',
          author_school: sessionUser?.namaSekolah || 'Sekolah Binaan',
          is_published: true
        }]);
        alert('Artikel langsung diterbitkan!');
      }

      // Reset form
      setEditingArticleId(null);
      setNewTitle('');
      setNewSummary('');
      setNewContent('');
      setCoverFile(null);
      setCoverPreview('');
      fetchBulletins();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan artikel: ' + err.message);
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  const handleEditArticle = (art) => {
    setEditingArticleId(art.id);
    setNewTitle(art.judul || '');
    setNewSummary(art.ringkasan || '');
    setNewContent(art.konten || '');
    setNewCategory(art.kategori || 'Praktik Baik');
    setCoverPreview(art.cover_url || '');
    setCoverFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Yakin ingin menghapus artikel ini secara permanen?')) return;
    await supabase.from('bulletins').delete().eq('id', id);
    fetchBulletins();
    alert('Artikel telah dihapus.');
  };

  const handleCancelEditArticle = () => {
    setEditingArticleId(null);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setCoverFile(null);
    setCoverPreview('');
  };

  // CRUD Supervisi & Rencana Aksi
  const handleDeleteSupervision = async (id) => {
    if (!window.confirm('Hapus sesi agenda supervisi ini beserta seluruh datanya?')) return;
    await supabase.from('supervisions').delete().eq('id', id);
    fetchSupervisionData(sessionUser);
  };

  const handleDeleteFollowUp = async (id) => {
    if (!window.confirm('Hapus komitmen rencana aksi ini?')) return;
    await supabase.from('follow_ups').delete().eq('id', id);
    if (selectedSupervision) loadSupervisionDetail(selectedSupervision);
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Hapus guru ini dari daftar?')) return;
    await supabase.from('teachers').delete().eq('id', id);
    fetchTeachers(currentSchool?.npsn || sessionUser.npsn);
  };

  const handleDeleteSchool = async (id) => {
    if (!window.confirm('PERINGATAN: Menghapus sekolah akan menghapus seluruh data supervisi. Lanjutkan?')) return;
    await supabase.from('schools').delete().eq('id', id);
    fetchSupervisionData(sessionUser);
  };

  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (!newSchoolForm.npsn || !newSchoolForm.nama) return alert('NPSN dan Nama wajib diisi!');
    await supabase.from('schools').insert([{
      npsn: newSchoolForm.npsn.trim(), nama_sekolah: newSchoolForm.nama.trim(), akreditasi: newSchoolForm.akreditasi,
      alamat: newSchoolForm.alamat, nama_kepsek: newSchoolForm.kepsek, nip_kepsek: newSchoolForm.nip
    }]);
    setNewSchoolForm({ npsn: '', nama: '', akreditasi: 'A', alamat: '', kepsek: '', nip: '' });
    fetchSupervisionData(sessionUser);
    alert('Sekolah binaan baru ditambahkan!');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentSchool) return;
    await supabase.from('schools').update({
      nama_sekolah: profileForm.nama_sekolah, akreditasi: profileForm.akreditasi, alamat: profileForm.alamat,
      nama_kepsek: profileForm.nama_kepsek, nip_kepsek: profileForm.nip_kepsek, total_guru: parseInt(profileForm.total_guru) || 0,
      total_siswa: parseInt(profileForm.total_siswa) || 0, sarpras: profileForm.sarpras
    }).eq('id', currentSchool.id);
    alert('Profil sekolah diperbarui!');
    setIsEditingProfile(false);
    fetchSupervisionData(sessionUser);
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!teacherForm.nama.trim()) return;
    await supabase.from('teachers').insert([{ npsn: currentSchool?.npsn || sessionUser.npsn, nama_guru: teacherForm.nama.trim(), nip: teacherForm.nip.trim(), email: teacherForm.email.trim(), mata_pelajaran: teacherForm.mapel.trim() }]);
    setTeacherForm({ nama: '', nip: '', email: '', mapel: '' });
    fetchTeachers(currentSchool?.npsn || sessionUser.npsn);
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedSupervision || !newAksi.trim()) return;
    await supabase.from('follow_ups').insert([{ supervision_id: selectedSupervision.id, rencana_aksi: newAksi.trim(), penanggung_jawab: newPJ.trim(), daya_dukung: newDayaDukung.trim(), bukti_dukung_url: newBuktiUrl.trim(), status_aksi: 'proses' }]);
    setNewAksi(''); setNewPJ(''); setNewDayaDukung(''); setNewBuktiUrl('');
    loadSupervisionDetail(selectedSupervision);
    alert('Rencana aksi berhasil disimpan!');
  };

  const handleCreateSupervision = async (e) => {
    e.preventDefault();
    if (!formSchoolId || !formTanggal) return;
    await supabase.from('supervisions').insert([{ school_id: formSchoolId, tanggal_supervisi: formTanggal, jenis_supervisi: formJenis, fokus_pendampingan: formFokus.trim(), status: 'terjadwal', kondisi_situasi: 'Menunggu visitasi.', temuan: 'Belum dilakukan visitasi.', rekomendasi: 'Siapkan instrumen.' }]);
    setShowAddSupervisionModal(false);
    fetchSupervisionData(sessionUser);
    alert('Jadwal supervisi berhasil dibuat!');
  };

  const handleUpdateObservation = async (e) => {
    e.preventDefault();
    if (!selectedSupervision) return;
    await supabase.from('supervisions').update({ kondisi_situasi: editKondisi, temuan: editTemuan, rekomendasi: editRekomendasi, status: editStatus }).eq('id', selectedSupervision.id);
    alert('Catatan observasi diperbarui!');
    fetchSupervisionData(sessionUser);
  };

  const handleSaveValidation = async (fuId) => {
    try {
      await supabase.from('follow_ups').update({ validasi_pengawas: validasiText }).eq('id', fuId);
      setActiveFollowUpId(null);
      setValidasiText('');
      if (selectedSupervision) loadSupervisionDetail(selectedSupervision);
    } catch (err) { alert(err.message); }
  };

  // Auth Quick Login
  const handleLogin = (e) => {
    e.preventDefault();
    const found = schools.find(s => String(s.npsn).trim() === String(identifier).trim());
    
    let defaultName = 'Bapak/Ibu Guru';
    let defaultNip = '';
    if (loginRole === 'pengawas') {
      defaultName = systemSettings?.pengawas_nama || 'Pengawas Sekolah';
      defaultNip = systemSettings?.pengawas_nip || '197005121998021001';
    } else if (loginRole === 'kepsek') {
      defaultName = found ? found.nama_kepsek : 'Kepala Sekolah';
      defaultNip = found ? found.nip_kepsek : '';
    } else {
      defaultName = identifier.includes('@') ? identifier.split('@')[0] : identifier;
    }

    const userObj = {
      nama: defaultName,
      nip: defaultNip,
      role: loginRole,
      npsn: identifier.trim(),
      namaSekolah: loginRole === 'pengawas' ? (systemSettings?.wilayah || 'Pengawas') : (found ? found.nama_sekolah : `Sekolah (${identifier})`)
    };

    setSessionUser(userObj);
    setShowLoginModal(false);
    setActiveTab('dashboard');
    fetchSupervisionData(userObj);
  };

  const openProfileModal = () => {
    setProfileNama(sessionUser?.nama || '');
    setProfileNip(sessionUser?.nip || currentSchool?.nip_kepsek || systemSettings?.pengawas_nip || '');
    setNewPassword('');
    setShowProfileModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* HEADER NAVIGASI */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab(sessionUser ? 'dashboard' : 'buletin')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">P</div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">SI PANDAI</span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Supervisi & Majalah Sekolah</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={() => setActiveTab('buletin')} 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'buletin' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Buletin Publik
            </button>

            {sessionUser ? (
              <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
                <button 
                  onClick={openProfileModal}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                  title="Profil & Ganti Sandi"
                >
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-bold block max-w-[120px] truncate leading-tight">{sessionUser.nama}</span>
                    <span className="text-[10px] text-blue-600 uppercase font-semibold">{sessionUser.role}</span>
                  </div>
                </button>

                <button 
                  onClick={() => { setSessionUser(null); setActiveTab('buletin'); }} 
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition" 
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                Masuk Sistem
              </button>
            )}
          </div>
        </div>
      </header>

      {/* NAVBAR ROLE DENGAN TAB DASHBOARD & MANAJEMEN BULETIN */}
      {sessionUser && (
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-4 text-xs font-medium overflow-x-auto">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`py-3 whitespace-nowrap border-b-2 font-semibold transition ${activeTab === 'dashboard' ? 'border-blue-500 text-white' : 'border-transparent hover:text-white'}`}
            >
              Dashboard
            </button>

            {sessionUser.role === 'pengawas' && (
              <>
                <button onClick={() => setActiveTab('supervisi')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'supervisi' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>Agenda Supervisi</button>
                <button onClick={() => setActiveTab('sekolah-binaan')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'sekolah-binaan' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>Sekolah Binaan</button>
                <button onClick={() => setActiveTab('pengaturan')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'pengaturan' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>Pengaturan Sistem</button>
              </>
            )}

            {sessionUser.role === 'kepsek' && (
              <>
                <button onClick={() => setActiveTab('profil-sekolah')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'profil-sekolah' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>Profil Sekolah</button>
                <button onClick={() => setActiveTab('catatan-supervisi')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'catatan-supervisi' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>Catatan Supervisi</button>
                <button onClick={() => setActiveTab('rencana-aksi')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'rencana-aksi' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>Rencana Aksi</button>
              </>
            )}

            {/* MANAJEMEN BULETIN UNTUK SEMUA ROLE */}
            <button 
              onClick={() => { setActiveTab('kelola-buletin'); handleCancelEditArticle(); }} 
              className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'kelola-buletin' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}
            >
              Manajemen Buletin
            </button>
          </div>
        </div>
      )}

      {/* KONTEN UTAMA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && sessionUser && (
          <DashboardView
            sessionUser={sessionUser}
            currentSchool={currentSchool}
            supervisions={supervisions}
            schools={schools}
            notifications={notifications}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* HALAMAN DEPAN: BULETIN PUBLIK */}
        {activeTab === 'buletin' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-lg">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
                Portal Literasi & Inspirasi
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold mt-3">Kabar Inovasi & Praktik Baik Sekolah Binaan</h1>
              <p className="mt-2 text-blue-100 text-sm sm:text-base max-w-2xl">
                Publikasi karya pembelajaran guru, inovasi tata kelola kepala sekolah, serta refleksi supervisi pengawas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bulletins.map(b => (
                <div 
                  key={b.id} 
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="cursor-pointer" onClick={() => setSelectedArticle(b)}>
                    <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
                      <img src={b.cover_url} alt="" className="h-full w-full object-cover hover:scale-105 transition duration-300" />
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-blue-700 shadow-sm">
                        {b.kategori}
                      </span>
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="text-base font-bold text-slate-900 hover:text-blue-600 transition line-clamp-2 leading-snug">
                        {b.judul}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {b.ringkasan}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 mt-2">
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 truncate max-w-[150px]">{b.author_name}</span>
                      <button 
                        onClick={() => setSelectedArticle(b)}
                        className="inline-flex items-center space-x-1 text-blue-600 font-bold hover:underline"
                      >
                        <span>Selengkapnya</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MANAJEMEN BULETIN (CRUD UNTUK SEMUA ROLE) */}
        {activeTab === 'kelola-buletin' && sessionUser && (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* FORM TULIS / EDIT ARTIKEL */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingArticleId ? 'Edit Artikel Buletin' : 'Tulis Artikel Praktik Baik Baru'}
                  </h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {editingArticleId ? 'Perbarui konten artikel Anda di bawah ini.' : 'Artikel langsung otomatis terbit di portal publik.'}
                  </p>
                </div>
                {editingArticleId && (
                  <button 
                    onClick={handleCancelEditArticle}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveArticle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">Kategori Tulisan</label>
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white">
                      <option value="Praktik Baik">Praktik Baik Pembelajaran</option>
                      <option value="Inovasi Pembelajaran">Inovasi Kurikulum & Media</option>
                      <option value="Kabar Sekolah">Kabar Sekolah</option>
                      <option value="Manajerial">Manajerial & Tata Kelola</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">Judul Artikel</label>
                    <input 
                      placeholder="Contoh: Penerapan PJBL Berbantuan Media Interaktif" 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg" 
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Ringkasan Singkat (1-2 Kalimat)</label>
                  <textarea 
                    placeholder="Ringkasan singkat yang muncul pada kartu artikel..." 
                    rows={2} 
                    value={newSummary} 
                    onChange={e => setNewSummary(e.target.value)} 
                    className="w-full p-2.5 border rounded-lg" 
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Foto Sampul</label>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
                      }} 
                      className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-blue-50 file:text-blue-700" 
                    />
                    {coverPreview && <img src={coverPreview} alt="" className="w-16 h-12 rounded-lg object-cover border" />}
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Isi Lengkap Artikel</label>
                  <textarea 
                    placeholder="Uraikan latar belakang, langkah pembelajaran/tata kelola, dan hasil praktiknya di sini..." 
                    rows={8} 
                    value={newContent} 
                    onChange={e => setNewContent(e.target.value)} 
                    className="w-full p-2.5 border rounded-lg leading-relaxed" 
                  />
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSubmittingArticle} 
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm"
                  >
                    {isSubmittingArticle ? 'Menyimpan...' : (editingArticleId ? 'Simpan Perubahan' : 'Terbitkan Sekarang')}
                  </button>
                </div>
              </form>
            </div>

            {/* TABEL DAFTAR ARTIKEL (CRUD: VIEW, EDIT, DELETE) */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {sessionUser.role === 'pengawas' ? 'Daftar Seluruh Artikel Buletin' : 'Riwayat Artikel Saya'} ({myArticles.length})
                </h3>
              </div>

              {myArticles.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Belum ada artikel yang dicatat.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 uppercase text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="p-3">Artikel</th>
                        <th className="p-3">Penulis</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myArticles.map(art => (
                        <tr key={art.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">{art.judul}</td>
                          <td className="p-3 text-slate-600">{art.author_name}</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold">{art.kategori}</span></td>
                          <td className="p-3 text-slate-500">{new Date(art.created_at).toLocaleDateString('id-ID')}</td>
                          <td className="p-3 text-center space-x-1">
                            <button onClick={() => setSelectedArticle(art)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Baca"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => handleEditArticle(art)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Edit"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteArticle(art.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PENGATURAN KOP & PROFIL PENGAWAS */}
        {activeTab === 'pengaturan' && sessionUser?.role === 'pengawas' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="text-xl font-bold">Pengaturan Dokumen Cetak & Profil</h2>
              <p className="text-xs text-slate-500 mt-1">Ubah teks KOP dan identitas Pengawas Pembina untuk dokumen Berita Acara PDF.</p>
            </div>
            
            <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl border shadow-sm space-y-6 text-xs">
              <div className="space-y-4">
                <h3 className="font-bold border-b pb-2 uppercase text-slate-600">Konfigurasi Kop Dokumen</h3>
                <div><label className="font-semibold block mb-1">Nama Instansi Induk</label><input value={systemSettings.instansi} onChange={e => setSystemSettings({...systemSettings, instansi: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
                <div><label className="font-semibold block mb-1">Judul Dokumen</label><input value={systemSettings.judul} onChange={e => setSystemSettings({...systemSettings, judul: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
                <div><label className="font-semibold block mb-1">Wilayah / Cabang Dinas</label><input value={systemSettings.wilayah} onChange={e => setSystemSettings({...systemSettings, wilayah: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
              </div>
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-bold border-b pb-2 uppercase text-slate-600">Identitas Pengawas Pembina</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="font-semibold block mb-1">Nama Lengkap Pengawas</label><input value={systemSettings.pengawas_nama} onChange={e => setSystemSettings({...systemSettings, pengawas_nama: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
                  <div><label className="font-semibold block mb-1">NIP Pengawas</label><input value={systemSettings.pengawas_nip} onChange={e => setSystemSettings({...systemSettings, pengawas_nip: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={isSavingSettings} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl transition">
                  {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PROFIL SEKOLAH (KEPSEK) */}
        {activeTab === 'profil-sekolah' && sessionUser?.role === 'kepsek' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">NPSN: {currentSchool?.npsn || sessionUser?.npsn}</span>
                <h2 className="text-xl font-bold mt-1">{profileForm.nama_sekolah || currentSchool?.nama_sekolah}</h2>
              </div>
              <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl">
                {isEditingProfile ? 'Batal' : 'Edit Profil'}
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="font-semibold block mb-1">Nama Sekolah</label><input disabled={!isEditingProfile} value={profileForm.nama_sekolah} onChange={e => setProfileForm({...profileForm, nama_sekolah: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
                <div><label className="font-semibold block mb-1">Akreditasi</label><input disabled={!isEditingProfile} value={profileForm.akreditasi} onChange={e => setProfileForm({...profileForm, akreditasi: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
              </div>
              <div><label className="font-semibold block mb-1">Alamat</label><textarea disabled={!isEditingProfile} rows={2} value={profileForm.alamat} onChange={e => setProfileForm({...profileForm, alamat: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="font-semibold block mb-1">Nama Kepala Sekolah</label><input disabled={!isEditingProfile} value={profileForm.nama_kepsek} onChange={e => setProfileForm({...profileForm, nama_kepsek: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
                <div><label className="font-semibold block mb-1">NIP</label><input disabled={!isEditingProfile} value={profileForm.nip_kepsek} onChange={e => setProfileForm({...profileForm, nip_kepsek: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
              </div>
              {isEditingProfile && <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-xl">Simpan</button>}
            </form>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-sm">Kelola Data Guru ({teachers.length})</h3>
              <form onSubmit={handleAddTeacher} className="flex flex-wrap gap-2">
                <input placeholder="Nama Guru" value={teacherForm.nama} onChange={e => setTeacherForm({...teacherForm, nama: e.target.value})} className="p-2 border rounded-lg text-xs flex-1 min-w-[120px]" />
                <input placeholder="NIP/NUPTK" value={teacherForm.nip} onChange={e => setTeacherForm({...teacherForm, nip: e.target.value})} className="p-2 border rounded-lg text-xs w-28" />
                <input placeholder="Mapel" value={teacherForm.mapel} onChange={e => setTeacherForm({...teacherForm, mapel: e.target.value})} className="p-2 border rounded-lg text-xs flex-1 min-w-[120px]" />
                <button type="submit" className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold">+ Tambah</button>
              </form>
              <div className="divide-y text-xs mt-4 border-t">
                {teachers.map(t => (
                  <div key={t.id} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold block">{t.nama_guru}</span>
                      <span className="text-slate-500">NIP: {t.nip || '-'} • Mapel: {t.mata_pelajaran || '-'}</span>
                    </div>
                    <button onClick={() => handleDeleteTeacher(t.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CATATAN SUPERVISI (KEPSEK) */}
        {activeTab === 'catatan-supervisi' && sessionUser?.role === 'kepsek' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
              <h2 className="text-xl font-bold">Catatan Supervisi Sekolah Anda</h2>
              {selectedSupervision && (
                <button onClick={() => setShowPdfModal(true)} className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-sm">
                  <Printer className="w-4 h-4" /><span>Cetak Berita Acara (PDF)</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-2">
                {supervisions.map(s => (
                  <div key={s.id} onClick={() => loadSupervisionDetail(s)} className={`p-4 rounded-xl border cursor-pointer ${selectedSupervision?.id === s.id ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}>
                    <span className="text-[10px] text-slate-500 block">{new Date(s.tanggal_supervisi).toLocaleDateString('id-ID')}</span>
                    <h4 className="text-xs font-bold line-clamp-1">{s.fokus_pendampingan}</h4>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-8">
                {selectedSupervision ? (
                  <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 text-xs">
                    <div><span className="font-bold uppercase text-slate-600 block mb-1">Fokus Pendampingan</span><div className="p-3 bg-slate-50 border rounded-lg font-semibold">{selectedSupervision.fokus_pendampingan}</div></div>
                    <div><span className="font-bold uppercase text-slate-600 block mb-1">Kondisi Lapangan</span><div className="p-3 bg-slate-50 border rounded-lg">{selectedSupervision.kondisi_situasi}</div></div>
                    <div><span className="font-bold uppercase text-slate-600 block mb-1">Temuan Nyata</span><div className="p-3 bg-slate-50 border rounded-lg">{selectedSupervision.temuan}</div></div>
                    <div><span className="font-bold uppercase text-slate-600 block mb-1">Rekomendasi Pengawas</span><div className="p-3 bg-blue-50/70 border border-blue-200 text-blue-900 rounded-lg font-medium">{selectedSupervision.rekomendasi}</div></div>
                  </div>
                ) : <div className="p-8 text-center text-xs text-slate-400">Pilih sesi kunjungan.</div>}
              </div>
            </div>
          </div>
        )}

        {/* RENCANA AKSI (KEPSEK) */}
        {activeTab === 'rencana-aksi' && sessionUser?.role === 'kepsek' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm"><h2 className="text-xl font-bold">Rencana Aksi Tindak Lanjut</h2></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-2">
                {supervisions.map(s => (
                  <div key={s.id} onClick={() => loadSupervisionDetail(s)} className={`p-4 rounded-xl border cursor-pointer ${selectedSupervision?.id === s.id ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}>
                    <h4 className="text-xs font-bold line-clamp-1">{s.fokus_pendampingan}</h4>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-8 space-y-4">
                <form onSubmit={handleAddFollowUp} className="bg-white p-6 rounded-2xl border shadow-sm space-y-3 text-xs">
                  <h4 className="font-bold uppercase">+ Tambah Rencana Aksi</h4>
                  <input placeholder="Deskripsi Rencana Aksi" value={newAksi} onChange={e => setNewAksi(e.target.value)} className="w-full p-2.5 border rounded-lg" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Penanggung Jawab" value={newPJ} onChange={e => setNewPJ(e.target.value)} className="p-2.5 border rounded-lg" />
                    <input placeholder="Daya Dukung" value={newDayaDukung} onChange={e => setNewDayaDukung(e.target.value)} className="p-2.5 border rounded-lg" />
                  </div>
                  <input placeholder="Tautan Dokumen Bukti Dukung (Google Drive)" value={newBuktiUrl} onChange={e => setNewBuktiUrl(e.target.value)} className="w-full p-2.5 border rounded-lg" />
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">Simpan Aksi</button>
                </form>
                
                <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
                  <h4 className="font-bold text-xs uppercase border-b pb-2">Daftar Komitmen Tindak Lanjut</h4>
                  {followUps.map((fu, idx) => (
                    <div key={fu.id} className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1 relative">
                      <div className="flex justify-between font-bold pr-8">
                        <span>Aksi #{idx + 1}: {fu.rencana_aksi}</span>
                        <span className="uppercase text-[10px] px-2 py-0.5 bg-slate-200 rounded">{fu.status_aksi}</span>
                      </div>
                      <div className="text-slate-600">PJ: <strong>{fu.penanggung_jawab}</strong> | Dukungan: {fu.daya_dukung || '-'}</div>
                      {fu.bukti_dukung_url && <a href={fu.bukti_dukung_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block pt-1 font-semibold">Buka Bukti</a>}
                      <button onClick={() => handleDeleteFollowUp(fu.id)} className="absolute top-3 right-3 p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg"><Trash className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AGENDA SUPERVISI (PENGAWAS) */}
        {activeTab === 'supervisi' && sessionUser?.role === 'pengawas' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
              <h2 className="text-xl font-bold">Agenda & Hasil Supervisi Seluruh Sekolah</h2>
              <div className="flex space-x-2">
                {selectedSupervision && (
                  <button onClick={() => setShowPdfModal(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5">
                    <Printer className="w-4 h-4" /><span>Cetak Berita Acara (PDF)</span>
                  </button>
                )}
                <button onClick={() => setShowAddSupervisionModal(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5">
                  <PlusCircle className="w-4 h-4" /><span>Jadwalkan Baru</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-2">
                {supervisions.map(s => (
                  <div key={s.id} onClick={() => loadSupervisionDetail(s)} className={`p-4 rounded-xl border relative cursor-pointer ${selectedSupervision?.id === s.id ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}>
                    <span className="text-[10px] text-slate-500">{new Date(s.tanggal_supervisi).toLocaleDateString('id-ID')}</span>
                    <h4 className="text-xs font-bold pr-6">{s.schools?.nama_sekolah}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{s.fokus_pendampingan}</p>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSupervision(s.id); }} className="absolute top-4 right-3 p-1 text-slate-400 hover:text-rose-600"><Trash className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-8">
                {selectedSupervision ? (
                  <form onSubmit={handleUpdateObservation} className="bg-white p-6 rounded-2xl border shadow-sm space-y-3 text-xs">
                    <h3 className="font-bold text-sm border-b pb-2">{selectedSupervision.schools?.nama_sekolah}</h3>
                    <div><label className="font-bold block mb-1">Kondisi Lapangan</label><textarea rows={3} value={editKondisi} onChange={e => setEditKondisi(e.target.value)} className="w-full p-2.5 border rounded-lg" /></div>
                    <div><label className="font-bold block mb-1">Temuan Lapangan</label><textarea rows={3} value={editTemuan} onChange={e => setEditTemuan(e.target.value)} className="w-full p-2.5 border rounded-lg" /></div>
                    <div><label className="font-bold block mb-1">Rekomendasi Solutif</label><textarea rows={3} value={editRekomendasi} onChange={e => setEditRekomendasi(e.target.value)} className="w-full p-2.5 border rounded-lg" /></div>
                    <div className="flex justify-between items-center pt-2">
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="p-2 border rounded-lg">
                        <option value="terjadwal">Terjadwal</option>
                        <option value="tindak_lanjut">Tindak Lanjut</option>
                        <option value="selesai">Selesai</option>
                      </select>
                      <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl">Simpan Catatan</button>
                    </div>

                    <div className="pt-4 border-t mt-4 space-y-3">
                      <h4 className="font-bold text-sm">Validasi Matriks Tindak Lanjut</h4>
                      {followUps.map((fu, idx) => (
                        <div key={fu.id} className="p-3 bg-slate-50 border rounded-xl space-y-2">
                          <div className="font-bold">Aksi #{idx + 1}: {fu.rencana_aksi}</div>
                          {fu.bukti_dukung_url && <a href={fu.bukti_dukung_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block pt-1 font-semibold">Cek Bukti Terlampir</a>}
                          <div className="flex items-center justify-between pt-1">
                            <span>Catatan Pengawas:</span>
                            <button type="button" onClick={() => { setActiveFollowUpId(fu.id); setValidasiText(fu.validasi_pengawas || ''); }} className="text-blue-600 font-semibold hover:underline">Beri Catatan</button>
                          </div>
                          {activeFollowUpId === fu.id ? (
                            <div className="space-y-2">
                              <textarea rows={2} value={validasiText} onChange={(e) => setValidasiText(e.target.value)} className="w-full p-2 border rounded-lg" />
                              <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setActiveFollowUpId(null)} className="px-2 py-1 text-slate-500">Batal</button>
                                <button type="button" onClick={() => handleSaveValidation(fu.id)} className="px-3 py-1 bg-blue-600 text-white rounded-lg font-semibold">Simpan Validasi</button>
                              </div>
                            </div>
                          ) : (
                            <div className="italic text-slate-600 p-2 bg-white rounded-lg border">{fu.validasi_pengawas || 'Belum ada catatan.'}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </form>
                ) : <div className="p-8 text-center text-xs text-slate-400">Pilih sesi supervisi.</div>}
              </div>
            </div>
          </div>
        )}

        {/* SEKOLAH BINAAN (PENGAWAS) */}
        {activeTab === 'sekolah-binaan' && sessionUser?.role === 'pengawas' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="text-xl font-bold">Kelola Data Sekolah Binaan</h2>
              <p className="text-xs text-slate-500 mt-1">Daftar sekolah yang diampu dan form penambahan sekolah sasaran baru.</p>
            </div>
            
            <form onSubmit={handleAddSchool} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 text-xs">
              <h3 className="font-bold uppercase text-slate-600">+ Tambah Sekolah Sasaran</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input placeholder="NPSN" value={newSchoolForm.npsn} onChange={e => setNewSchoolForm({...newSchoolForm, npsn: e.target.value})} className="p-2.5 border rounded-lg" />
                <input placeholder="Nama Sekolah Lengkap" value={newSchoolForm.nama} onChange={e => setNewSchoolForm({...newSchoolForm, nama: e.target.value})} className="col-span-2 p-2.5 border rounded-lg" />
                <select value={newSchoolForm.akreditasi} onChange={e => setNewSchoolForm({...newSchoolForm, akreditasi: e.target.value})} className="p-2.5 border rounded-lg">
                  <option value="A">Akreditasi A</option><option value="B">Akreditasi B</option><option value="C">Akreditasi C</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input placeholder="Nama Kepala Sekolah" value={newSchoolForm.kepsek} onChange={e => setNewSchoolForm({...newSchoolForm, kepsek: e.target.value})} className="p-2.5 border rounded-lg" />
                <input placeholder="NIP Kepala Sekolah" value={newSchoolForm.nip} onChange={e => setNewSchoolForm({...newSchoolForm, nip: e.target.value})} className="p-2.5 border rounded-lg" />
                <input placeholder="Alamat Sekolah" value={newSchoolForm.alamat} onChange={e => setNewSchoolForm({...newSchoolForm, alamat: e.target.value})} className="p-2.5 border rounded-lg" />
              </div>
              <div className="flex justify-end pt-1">
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">Simpan Sekolah</button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {schools.map(sch => (
                <div key={sch.id} className="bg-white rounded-2xl p-5 border shadow-sm relative">
                  <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded uppercase">NPSN: {sch.npsn}</span>
                  <h3 className="font-bold text-sm mt-2 pr-6">{sch.nama_sekolah}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{sch.nama_kepsek || 'Kepala Sekolah -'}</p>
                  <button onClick={() => handleDeleteSchool(sch.id)} className="absolute top-4 right-4 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CETAK BERITA ACARA (PDF) */}
      {showPdfModal && (
        <PrintBeritaAcara
          supervision={selectedSupervision}
          followUps={followUps}
          onClose={() => setShowPdfModal(false)}
          systemSettings={systemSettings}
        />
      )}

      {/* MODAL BACA ARTIKEL LENGKAP */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative">
            <button onClick={() => setSelectedArticle(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
            <div className="h-64 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 overflow-hidden">
              <img src={selectedArticle.cover_url} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{selectedArticle.kategori}</span>
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

      {/* MODAL PROFIL & GANTI KATA SANDI */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Ubah Profil & Kata Sandi</h3>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserProfile} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Nama Lengkap</label>
                <input value={profileNama} onChange={e => setProfileNama(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="font-semibold block mb-1">NIP / NUPTK</label>
                <input value={profileNip} onChange={e => setProfileNip(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Ganti Kata Sandi Baru</label>
                <input type="password" placeholder="Kosongkan jika tidak diubah" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowProfileModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL JADWAL SUPERVISI BARU */}
      {showAddSupervisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-3 text-xs">
            <h3 className="font-bold text-sm">Jadwalkan Supervisi Baru</h3>
            <form onSubmit={handleCreateSupervision} className="space-y-3">
              <select value={formSchoolId} onChange={e => setFormSchoolId(e.target.value)} className="w-full p-2.5 border rounded-lg">
                {schools.map(s => <option key={s.id} value={s.id}>{s.nama_sekolah}</option>)}
              </select>
              <input type="date" value={formTanggal} onChange={e => setFormTanggal(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              <textarea placeholder="Fokus Pendampingan" value={formFokus} onChange={e => setFormFokus(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddSupervisionModal(false)} className="px-3.5 py-1.5 bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4 text-xs">
            <h3 className="text-base font-bold text-center">Masuk ke SI PANDAI</h3>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              <button type="button" onClick={() => { setLoginRole('kepsek'); setIdentifier('20512345'); }} className={`py-1.5 rounded-lg transition ${loginRole === 'kepsek' ? 'bg-white font-bold text-blue-600 shadow-sm' : ''}`}>Kepsek</button>
              <button type="button" onClick={() => { setLoginRole('pengawas'); setIdentifier('19700101'); }} className={`py-1.5 rounded-lg transition ${loginRole === 'pengawas' ? 'bg-white font-bold text-blue-600 shadow-sm' : ''}`}>Pengawas</button>
              <button type="button" onClick={() => { setLoginRole('guru'); setIdentifier('Usnan Rofik, S.Kom.'); }} className={`py-1.5 rounded-lg transition ${loginRole === 'guru' ? 'bg-white font-bold text-blue-600 shadow-sm' : ''}`}>Guru</button>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="NPSN / Identitas" className="w-full p-2.5 border rounded-lg" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Kata Sandi" className="w-full p-2.5 border rounded-lg" />
              <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-sm">Masuk</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}