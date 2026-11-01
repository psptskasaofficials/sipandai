import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import PrintBeritaAcara from './PrintBeritaAcara';
import { 
  LogIn, LogOut, PlusCircle, Eye, Trash2, ExternalLink, 
  Edit3, Save, Printer, Settings, Trash
} from 'lucide-react';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [activeTab, setActiveTab] = useState('buletin');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState('kepsek');
  const [identifier, setIdentifier] = useState('20512345');
  const [password, setPassword] = useState('123456');

  // State Pengaturan Sistem (Kop & Profil Pengawas)
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
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Praktik Baik');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);

  // State Supervisi & Sekolah
  const [schools, setSchools] = useState([]);
  const [supervisions, setSupervisions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [selectedSupervision, setSelectedSupervision] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const [newSchoolForm, setNewSchoolForm] = useState({ npsn: '', nama: '', akreditasi: 'A', alamat: '', kepsek: '', nip: '' });

  // State CRUD Pengawas
  const [showAddSupervisionModal, setShowAddSupervisionModal] = useState(false);
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formJenis, setFormJenis] = useState('akademik');
  const [formFokus, setFormFokus] = useState('');
  const [editKondisi, setEditKondisi] = useState('');
  const [editTemuan, setEditTemuan] = useState('');
  const [editRekomendasi, setEditRekomendasi] = useState('');
  const [editStatus, setEditStatus] = useState('terjadwal');
  const [validasiText, setValidasiText] = useState('');
  const [activeFollowUpId, setActiveFollowUpId] = useState(null);

  // State Modul Kepsek
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

  // Fetch System Settings
  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').eq('id', 'sistem_config').single();
      if (data) setSystemSettings(data);
    } catch (e) { console.error('Load settings:', e); }
  };

  useEffect(() => { fetchSettings(); }, []);

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
      alert('Pengaturan sistem berhasil disimpan permanen!');
      if (sessionUser?.role === 'pengawas') {
        setSessionUser({ ...sessionUser, nama: systemSettings.pengawas_nama });
      }
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Fetch Data Induk (Buletin, Sekolah, Supervisi)
  const fetchBulletins = async () => {
    try {
      const { data: pub } = await supabase.from('bulletins').select('*').eq('is_published', true).order('created_at', { ascending: false });
      if (pub) setBulletins(pub);
      const { data: all } = await supabase.from('bulletins').select('*').order('created_at', { ascending: false });
      if (all) {
        setAllBulletinsForSupervisor(all);
        if (sessionUser) setMyArticles(sessionUser.role === 'pengawas' ? all : all.filter(a => a.author_name === sessionUser.nama));
      }
    } catch (e) { console.error(e); }
  };

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
        if (supData.length > 0) { loadSupervisionDetail(supData[0]); } else { setSelectedSupervision(null); setFollowUps([]); }
      }
    } catch (e) { console.error(e); }
  };

  const loadSupervisionDetail = async (sup) => {
    setSelectedSupervision(sup);
    setEditKondisi(sup.kondisi_situasi || ''); setEditTemuan(sup.temuan || ''); setEditRekomendasi(sup.rekomendasi || ''); setEditStatus(sup.status || 'terjadwal');
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

  // Hapus Data
  const handleDeleteSupervision = async (id) => {
    if (!window.confirm('Hapus sesi agenda supervisi ini beserta seluruh catatan dan rencana aksinya?')) return;
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
    if (!window.confirm('PERINGATAN: Menghapus sekolah akan menghapus riwayat supervisinya. Lanjutkan?')) return;
    await supabase.from('schools').delete().eq('id', id);
    fetchSupervisionData(sessionUser);
  };

  // Create Data Induk
  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (!newSchoolForm.npsn || !newSchoolForm.nama) return alert('NPSN dan Nama wajib diisi!');
    await supabase.from('schools').insert([{
      npsn: newSchoolForm.npsn.trim(), nama_sekolah: newSchoolForm.nama.trim(), akreditasi: newSchoolForm.akreditasi,
      alamat: newSchoolForm.alamat, nama_kepsek: newSchoolForm.kepsek, nip_kepsek: newSchoolForm.nip
    }]);
    setNewSchoolForm({ npsn: '', nama: '', akreditasi: 'A', alamat: '', kepsek: '', nip: '' });
    fetchSupervisionData(sessionUser);
    alert('Sekolah Binaan Baru Berhasil Ditambahkan!');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentSchool) return;
    await supabase.from('schools').update({
      nama_sekolah: profileForm.nama_sekolah, akreditasi: profileForm.akreditasi, alamat: profileForm.alamat,
      nama_kepsek: profileForm.nama_kepsek, nip_kepsek: profileForm.nip_kepsek, total_guru: parseInt(profileForm.total_guru) || 0,
      total_siswa: parseInt(profileForm.total_siswa) || 0, sarpras: profileForm.sarpras
    }).eq('id', currentSchool.id);
    alert('Profil berhasil diperbarui!');
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
  };

  const handleCreateSupervision = async (e) => {
    e.preventDefault();
    if (!formSchoolId || !formTanggal) return;
    await supabase.from('supervisions').insert([{ school_id: formSchoolId, tanggal_supervisi: formTanggal, jenis_supervisi: formJenis, fokus_pendampingan: formFokus.trim(), status: 'terjadwal', kondisi_situasi: 'Menunggu visitasi.', temuan: 'Belum dilakukan visitasi.', rekomendasi: 'Siapkan instrumen.' }]);
    setShowAddSupervisionModal(false);
    fetchSupervisionData(sessionUser);
    alert('Jadwal Supervisi Berhasil Ditambahkan!');
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
    } catch (err) {
      alert(err.message);
    }
  };

  // Moderasi Buletin
  const handleTogglePublish = async (id, currentStatus) => {
    try {
      await supabase.from('bulletins').update({ is_published: !currentStatus }).eq('id', id);
      fetchBulletins();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return alert('Judul wajib diisi!');
    setIsSubmittingArticle(true);
    try {
      let publicCoverUrl = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80';
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: upErr } = await supabase.storage.from('sipandai-storage').upload(cleanFileName, coverFile);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('sipandai-storage').getPublicUrl(cleanFileName);
          if (urlData?.publicUrl) publicCoverUrl = urlData.publicUrl;
        }
      }
      await supabase.from('bulletins').insert([{ judul: newTitle.trim(), ringkasan: newSummary.trim(), konten: newContent.trim(), kategori: newCategory, cover_url: publicCoverUrl, author_name: sessionUser?.nama || 'Kontributor', author_role: sessionUser?.role || 'guru', author_school: sessionUser?.namaSekolah || 'Sekolah', is_published: true }]);
      setNewTitle(''); setNewSummary(''); setNewContent(''); setCoverFile(null); setCoverPreview('');
      fetchBulletins();
      alert('Artikel langsung diterbitkan!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Auth Quick Login
  const handleLogin = (e) => {
    e.preventDefault();
    const found = schools.find(s => String(s.npsn).trim() === String(identifier).trim());
    
    let defaultName = 'Bapak/Ibu Guru';
    if (loginRole === 'pengawas') {
      defaultName = systemSettings?.pengawas_nama || 'Pengawas Sekolah';
    } else if (loginRole === 'kepsek') {
      defaultName = found ? found.nama_kepsek : 'Kepala Sekolah';
    } else {
      defaultName = identifier.includes('@') ? identifier.split('@')[0] : identifier;
    }

    const userObj = {
      nama: defaultName,
      role: loginRole,
      npsn: identifier.trim(),
      namaSekolah: loginRole === 'pengawas' ? (systemSettings?.wilayah || 'Pengawas') : (found ? found.nama_sekolah : `Sekolah (${identifier})`)
    };

    setSessionUser(userObj);
    setShowLoginModal(false);
    setActiveTab(loginRole === 'pengawas' ? 'supervisi' : (loginRole === 'kepsek' ? 'profil-sekolah' : 'tulis-buletin'));
    fetchSupervisionData(userObj);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('buletin')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">P</div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">SI PANDAI</span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Supervisi & Majalah Sekolah</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setActiveTab('buletin')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'buletin' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>Buletin</button>
            {sessionUser ? (
              <div className="flex items-center space-x-2 pl-3 border-l">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold block">{sessionUser.nama}</span>
                  <span className="text-[10px] text-blue-600 uppercase font-semibold">{sessionUser.role}</span>
                </div>
                <button onClick={() => { setSessionUser(null); setActiveTab('buletin'); }} className="p-1.5 text-slate-400 hover:text-rose-600"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm">Masuk Sistem</button>
            )}
          </div>
        </div>
      </header>

      {/* NAVBAR ROLE */}
      {sessionUser && (
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800 print:hidden">
          <div className="max-w-7xl mx-auto px-4 flex space-x-4 text-xs font-medium overflow-x-auto">
            {sessionUser.role === 'pengawas' && (
              <>
                <button onClick={() => setActiveTab('supervisi')} className={`py-3 whitespace-nowrap border-b-2 ${activeTab === 'supervisi' ? 'border-blue-500 text-white font-semibold' : 'border-transparent'}`}>Agenda Supervisi</button>
                <button onClick={() => setActiveTab('sekolah-binaan')} className={`py-3 whitespace-nowrap border-b-2 ${activeTab === 'sekolah-binaan' ? 'border-blue-500 text-white font-semibold' : 'border-transparent'}`}>Sekolah Binaan</button>
                <button onClick={() => setActiveTab('moderasi-buletin')} className={`py-3 whitespace-nowrap border-b-2 ${activeTab === 'moderasi-buletin' ? 'border-blue-500 text-white font-semibold' : 'border-transparent'}`}>Pantau Buletin</button>
                <button onClick={() => setActiveTab('pengaturan')} className={`py-3 whitespace-nowrap border-b-2 ${activeTab === 'pengaturan' ? 'border-blue-500 text-white font-semibold' : 'border-transparent'}`}>Pengaturan Sistem</button>
              </>
            )}
            {sessionUser.role === 'kepsek' && (
              <>
                <button onClick={() => setActiveTab('profil-sekolah')} className={`py-3 whitespace-nowrap border-b-2 ${activeTab === 'profil-sekolah' ? 'border-blue-500 text-white font-semibold' : 'border-transparent'}`}>1. Profil Sekolah</button>
                <button onClick={() => setActiveTab('catatan-supervisi')} className={`py-3 whitespace-nowrap border-b-2 ${activeTab === 'catatan-supervisi' ? 'border-blue-500 text-white font-semibold' : 'border-transparent'}`}>2. Catatan Supervisi</button>
                <button onClick={() => setActiveTab('rencana-aksi')} className={`py-3 whitespace-nowrap border-b-2 ${activeTab === 'rencana-aksi' ? 'border-blue-500 text-white font-semibold' : 'border-transparent'}`}>3. Rencana Aksi</button>
              </>
            )}
            <button onClick={() => setActiveTab('tulis-buletin')} className={`py-3 whitespace-nowrap border-b-2 ${activeTab === 'tulis-buletin' ? 'border-blue-500 text-white font-semibold' : 'border-transparent'}`}>
              {sessionUser.role === 'kepsek' ? '4. Ruang Artikel' : 'Tulis Artikel'}
            </button>
          </div>
        </div>
      )}

      {/* KONTEN */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 print:p-0">
        
        {/* BULETIN PUBLIK */}
        {activeTab === 'buletin' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-900 rounded-2xl p-8 text-white shadow-lg">
              <h1 className="text-3xl font-extrabold">Inspirasi & Praktik Baik Sekolah Binaan</h1>
              <p className="mt-2 text-blue-100 text-sm">Publikasi karya inovasi guru dan tata kelola kepala sekolah.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bulletins.map(b => (
                <div key={b.id} onClick={() => setSelectedArticle(b)} className="bg-white rounded-xl overflow-hidden border shadow-sm cursor-pointer hover:shadow-md transition">
                  <img src={b.cover_url} alt="" className="h-44 w-full object-cover" />
                  <div className="p-4">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{b.kategori}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2">{b.judul}</h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{b.ringkasan}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PENGATURAN KOP & PROFIL PENGAWAS */}
        {activeTab === 'pengaturan' && sessionUser?.role === 'pengawas' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="text-xl font-bold">Pengaturan Dokumen Cetak & Profil</h2>
              <p className="text-xs text-slate-500 mt-1">Ubah teks KOP dan identitas Pengawas Pembina untuk sinkronisasi dokumen PDF.</p>
            </div>
            
            <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl border shadow-sm space-y-6 text-xs">
              <div className="space-y-4">
                <h3 className="font-bold border-b pb-2 uppercase text-slate-600">Konfigurasi Kop Surat Dinas</h3>
                <div><label className="font-semibold block mb-1">Baris 1: Nama Instansi Induk</label><input value={systemSettings.instansi} onChange={e => setSystemSettings({...systemSettings, instansi: e.target.value})} className="w-full p-2 border rounded" /></div>
                <div><label className="font-semibold block mb-1">Baris 2: Judul Dokumen Utama</label><input value={systemSettings.judul} onChange={e => setSystemSettings({...systemSettings, judul: e.target.value})} className="w-full p-2 border rounded" /></div>
                <div><label className="font-semibold block mb-1">Baris 3: Wilayah / Cabang Dinas</label><input value={systemSettings.wilayah} onChange={e => setSystemSettings({...systemSettings, wilayah: e.target.value})} className="w-full p-2 border rounded" /></div>
              </div>
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-bold border-b pb-2 uppercase text-slate-600">Identitas Pengawas Pembina</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="font-semibold block mb-1">Nama Lengkap Pengawas</label><input value={systemSettings.pengawas_nama} onChange={e => setSystemSettings({...systemSettings, pengawas_nama: e.target.value})} className="w-full p-2 border rounded" /></div>
                  <div><label className="font-semibold block mb-1">NIP Pengawas</label><input value={systemSettings.pengawas_nip} onChange={e => setSystemSettings({...systemSettings, pengawas_nip: e.target.value})} className="w-full p-2 border rounded" /></div>
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
              <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                {isEditingProfile ? 'Batal' : 'Edit Profil'}
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="font-semibold block mb-1">Nama Sekolah</label><input disabled={!isEditingProfile} value={profileForm.nama_sekolah} onChange={e => setProfileForm({...profileForm, nama_sekolah: e.target.value})} className="w-full p-2 border rounded" /></div>
                <div><label className="font-semibold block mb-1">Akreditasi</label><input disabled={!isEditingProfile} value={profileForm.akreditasi} onChange={e => setProfileForm({...profileForm, akreditasi: e.target.value})} className="w-full p-2 border rounded" /></div>
              </div>
              <div><label className="font-semibold block mb-1">Alamat</label><textarea disabled={!isEditingProfile} rows={2} value={profileForm.alamat} onChange={e => setProfileForm({...profileForm, alamat: e.target.value})} className="w-full p-2 border rounded" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="font-semibold block mb-1">Nama Kepala Sekolah</label><input disabled={!isEditingProfile} value={profileForm.nama_kepsek} onChange={e => setProfileForm({...profileForm, nama_kepsek: e.target.value})} className="w-full p-2 border rounded" /></div>
                <div><label className="font-semibold block mb-1">NIP</label><input disabled={!isEditingProfile} value={profileForm.nip_kepsek} onChange={e => setProfileForm({...profileForm, nip_kepsek: e.target.value})} className="w-full p-2 border rounded" /></div>
              </div>
              {isEditingProfile && <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg">Simpan</button>}
            </form>
            
            {/* KELOLA GURU */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-sm">Kelola Data Guru ({teachers.length})</h3>
              <form onSubmit={handleAddTeacher} className="flex flex-wrap gap-2">
                <input placeholder="Nama Guru" value={teacherForm.nama} onChange={e => setTeacherForm({...teacherForm, nama: e.target.value})} className="p-2 border rounded text-xs flex-1 min-w-[120px]" />
                <input placeholder="NIP/NUPTK" value={teacherForm.nip} onChange={e => setTeacherForm({...teacherForm, nip: e.target.value})} className="p-2 border rounded text-xs w-28" />
                <input placeholder="Mapel" value={teacherForm.mapel} onChange={e => setTeacherForm({...teacherForm, mapel: e.target.value})} className="p-2 border rounded text-xs flex-1 min-w-[120px]" />
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold">+ Tambah</button>
              </form>
              <div className="divide-y text-xs mt-4 border-t">
                {teachers.map(t => (
                  <div key={t.id} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold block">{t.nama_guru}</span>
                      <span className="text-slate-500">NIP: {t.nip || '-'} • Mapel: {t.mata_pelajaran || '-'}</span>
                    </div>
                    <button onClick={() => handleDeleteTeacher(t.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"><Trash className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KEPSEK 2: CATATAN SUPERVISI (READ & PRINT) */}
        {activeTab === 'catatan-supervisi' && sessionUser?.role === 'kepsek' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
              <h2 className="text-xl font-bold">Catatan Supervisi Sekolah Anda</h2>
              {selectedSupervision && (
                <button onClick={() => setShowPdfModal(true)} className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm">
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
                    <div><span className="font-bold uppercase text-slate-600 block mb-1">Fokus Pendampingan</span><div className="p-3 bg-slate-50 border rounded font-semibold">{selectedSupervision.fokus_pendampingan}</div></div>
                    <div><span className="font-bold uppercase text-slate-600 block mb-1">Kondisi Lapangan</span><div className="p-3 bg-slate-50 border rounded">{selectedSupervision.kondisi_situasi}</div></div>
                    <div><span className="font-bold uppercase text-slate-600 block mb-1">Temuan Nyata</span><div className="p-3 bg-slate-50 border rounded">{selectedSupervision.temuan}</div></div>
                    <div><span className="font-bold uppercase text-slate-600 block mb-1">Rekomendasi Pengawas</span><div className="p-3 bg-blue-50/70 border border-blue-200 text-blue-900 rounded font-medium">{selectedSupervision.rekomendasi}</div></div>
                  </div>
                ) : <div className="p-8 text-center text-xs text-slate-400">Pilih sesi kunjungan.</div>}
              </div>
            </div>
          </div>
        )}

        {/* KEPSEK 3: RENCANA AKSI */}
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
                  <input placeholder="Deskripsi Rencana Aksi" value={newAksi} onChange={e => setNewAksi(e.target.value)} className="w-full p-2 border rounded" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Penanggung Jawab" value={newPJ} onChange={e => setNewPJ(e.target.value)} className="p-2 border rounded" />
                    <input placeholder="Daya Dukung" value={newDayaDukung} onChange={e => setNewDayaDukung(e.target.value)} className="p-2 border rounded" />
                  </div>
                  <input placeholder="Tautan Dokumen Bukti Dukung (Google Drive)" value={newBuktiUrl} onChange={e => setNewBuktiUrl(e.target.value)} className="w-full p-2 border rounded" />
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">Simpan Aksi</button>
                </form>
                
                <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
                  <h4 className="font-bold text-xs uppercase border-b pb-2">Daftar Komitmen Tindak Lanjut</h4>
                  {followUps.map((fu, idx) => (
                    <div key={fu.id} className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1 relative">
                      <div className="flex justify-between font-bold pr-8">
                        <span>Aksi #{idx + 1}: {fu.rencana_aksi}</span>
                        <span className="uppercase text-[10px] px-2 py-0.5 bg-slate-200 rounded">{fu.status_aksi}</span>
                      </div>
                      <div className="text-slate-600">PJ: <strong>{fu.penanggung_jawab}</strong> | Dukungan: {fu.daya_dukung || '-'}</div>
                      {fu.bukti_dukung_url && <a href={fu.bukti_dukung_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block pt-1 font-semibold">Buka Bukti</a>}
                      <button onClick={() => handleDeleteFollowUp(fu.id)} className="absolute top-3 right-3 p-1.5 text-rose-500 hover:bg-rose-100 rounded"><Trash className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PENGAWAS: SUPERVISI */}
        {activeTab === 'supervisi' && sessionUser?.role === 'pengawas' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
              <h2 className="text-xl font-bold">Agenda & Hasil Supervisi Seluruh Sekolah</h2>
              <div className="flex space-x-2">
                {selectedSupervision && (
                  <button onClick={() => setShowPdfModal(true)} className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-1.5">
                    <Printer className="w-4 h-4" /><span>Cetak PDF</span>
                  </button>
                )}
                <button onClick={() => setShowAddSupervisionModal(true)} className="px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-1.5">
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
                    <div><label className="font-bold block mb-1">Kondisi Lapangan</label><textarea rows={3} value={editKondisi} onChange={e => setEditKondisi(e.target.value)} className="w-full p-2 border rounded" /></div>
                    <div><label className="font-bold block mb-1">Temuan Lapangan</label><textarea rows={3} value={editTemuan} onChange={e => setEditTemuan(e.target.value)} className="w-full p-2 border rounded" /></div>
                    <div><label className="font-bold block mb-1">Rekomendasi Solutif</label><textarea rows={3} value={editRekomendasi} onChange={e => setEditRekomendasi(e.target.value)} className="w-full p-2 border rounded" /></div>
                    <div className="flex justify-between items-center pt-2">
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="p-1.5 border rounded">
                        <option value="terjadwal">Terjadwal</option>
                        <option value="tindak_lanjut">Tindak Lanjut</option>
                        <option value="selesai">Selesai</option>
                      </select>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">Simpan Catatan</button>
                    </div>

                    <div className="pt-4 border-t mt-4 space-y-3">
                      <h4 className="font-bold text-sm">Validasi Matriks Tindak Lanjut</h4>
                      {followUps.map((fu, idx) => (
                        <div key={fu.id} className="p-3 bg-slate-50 border rounded-lg space-y-2">
                          <div className="font-bold">Aksi #{idx + 1}: {fu.rencana_aksi}</div>
                          {fu.bukti_dukung_url && <a href={fu.bukti_dukung_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block pt-1 font-semibold">Cek Bukti Terlampir</a>}
                          <div className="flex items-center justify-between pt-1">
                            <span>Catatan Pengawas:</span>
                            <button type="button" onClick={() => { setActiveFollowUpId(fu.id); setValidasiText(fu.validasi_pengawas || ''); }} className="text-blue-600 font-semibold hover:underline">Beri Catatan</button>
                          </div>
                          {activeFollowUpId === fu.id ? (
                            <div className="space-y-2">
                              <textarea rows={2} value={validasiText} onChange={(e) => setValidasiText(e.target.value)} className="w-full p-2 border rounded" />
                              <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setActiveFollowUpId(null)} className="px-2 py-1 text-slate-500">Batal</button>
                                <button type="button" onClick={() => handleSaveValidation(fu.id)} className="px-3 py-1 bg-blue-600 text-white rounded font-semibold">Simpan Validasi</button>
                              </div>
                            </div>
                          ) : (
                            <div className="italic text-slate-600 p-2 bg-white rounded border">{fu.validasi_pengawas || 'Belum ada catatan.'}</div>
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

        {/* PENGAWAS: SEKOLAH BINAAN */}
        {activeTab === 'sekolah-binaan' && sessionUser?.role === 'pengawas' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="text-xl font-bold">Kelola Data Sekolah Binaan</h2>
              <p className="text-xs text-slate-500 mt-1">Daftar sekolah yang diampu dan form penambahan sekolah sasaran baru.</p>
            </div>
            
            <form onSubmit={handleAddSchool} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 text-xs">
              <h3 className="font-bold uppercase text-slate-600">+ Tambah Sekolah Sasaran</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input placeholder="NPSN" value={newSchoolForm.npsn} onChange={e => setNewSchoolForm({...newSchoolForm, npsn: e.target.value})} className="p-2 border rounded" />
                <input placeholder="Nama Sekolah Lengkap" value={newSchoolForm.nama} onChange={e => setNewSchoolForm({...newSchoolForm, nama: e.target.value})} className="col-span-2 p-2 border rounded" />
                <select value={newSchoolForm.akreditasi} onChange={e => setNewSchoolForm({...newSchoolForm, akreditasi: e.target.value})} className="p-2 border rounded">
                  <option value="A">Akreditasi A</option><option value="B">Akreditasi B</option><option value="C">Akreditasi C</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input placeholder="Nama Kepala Sekolah" value={newSchoolForm.kepsek} onChange={e => setNewSchoolForm({...newSchoolForm, kepsek: e.target.value})} className="p-2 border rounded" />
                <input placeholder="NIP Kepala Sekolah" value={newSchoolForm.nip} onChange={e => setNewSchoolForm({...newSchoolForm, nip: e.target.value})} className="p-2 border rounded" />
                <input placeholder="Alamat Sekolah" value={newSchoolForm.alamat} onChange={e => setNewSchoolForm({...newSchoolForm, alamat: e.target.value})} className="p-2 border rounded" />
              </div>
              <div className="flex justify-end pt-1">
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg">Simpan Sekolah</button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {schools.map(sch => (
                <div key={sch.id} className="bg-white rounded-xl p-5 border shadow-sm relative">
                  <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded uppercase">NPSN: {sch.npsn}</span>
                  <h3 className="font-bold text-sm mt-2 pr-6">{sch.nama_sekolah}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{sch.nama_kepsek || 'Kepala Sekolah -'}</p>
                  <button onClick={() => handleDeleteSchool(sch.id)} className="absolute top-4 right-4 text-rose-500"><Trash className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODERASI BULETIN (PENGAWAS) */}
        {activeTab === 'moderasi-buletin' && sessionUser?.role === 'pengawas' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold">Pemantauan & Moderasi Buletin</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b">
                  <tr><th className="py-3 px-4">Judul Artikel</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-center">Aksi Pengawas</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allBulletinsForSupervisor.map(b => (
                    <tr key={b.id}>
                      <td className="py-3 px-4 font-bold max-w-xs truncate">{b.judul}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${b.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{b.is_published ? 'Tayang Publik' : 'Di-Unpublish'}</span></td>
                      <td className="py-3 px-4 text-center space-x-2">
                        <button onClick={() => handleTogglePublish(b.id, b.is_published)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${b.is_published ? 'bg-rose-50 text-rose-700' : 'bg-emerald-600 text-white'}`}>{b.is_published ? 'Unpublish' : 'Tayangkan'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RUANG TULIS ARTIKEL */}
        {activeTab === 'tulis-buletin' && sessionUser && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 text-xs">
              <h2 className="text-lg font-bold">Buat Tulisan Baru (Auto-Publish)</h2>
              <form onSubmit={handleCreateArticle} className="space-y-3">
                <input placeholder="Judul Artikel" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-2 border rounded" />
                <textarea placeholder="Ringkasan Singkat" rows={2} value={newSummary} onChange={e => setNewSummary(e.target.value)} className="w-full p-2 border rounded" />
                <div className="flex items-center space-x-4">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-blue-50 file:text-blue-700" />
                  {coverPreview && <img src={coverPreview} alt="" className="w-16 h-12 rounded object-cover border" />}
                </div>
                <textarea placeholder="Isi Artikel Lengkap" rows={6} value={newContent} onChange={e => setNewContent(e.target.value)} className="w-full p-2 border rounded" />
                <button type="submit" disabled={isSubmittingArticle} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg">Terbitkan Sekarang</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL CETAK PDF */}
      {showPdfModal && (
        <PrintBeritaAcara
          supervision={selectedSupervision}
          followUps={followUps}
          onClose={() => setShowPdfModal(false)}
          systemSettings={systemSettings}
        />
      )}

      {/* MODAL JADWAL SUPERVISI */}
      {showAddSupervisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-3 text-xs">
            <h3 className="font-bold text-sm">Jadwalkan Supervisi Baru</h3>
            <form onSubmit={handleCreateSupervision} className="space-y-3">
              <select value={formSchoolId} onChange={e => setFormSchoolId(e.target.value)} className="w-full p-2 border rounded">
                {schools.map(s => <option key={s.id} value={s.id}>{s.nama_sekolah}</option>)}
              </select>
              <input type="date" value={formTanggal} onChange={e => setFormTanggal(e.target.value)} className="w-full p-2 border rounded" />
              <textarea placeholder="Fokus Pendampingan" value={formFokus} onChange={e => setFormFokus(e.target.value)} className="w-full p-2 border rounded" />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddSupervisionModal(false)} className="px-3 py-1.5 bg-slate-100 rounded">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded font-semibold">Simpan</button>
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
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              <button type="button" onClick={() => { setLoginRole('kepsek'); setIdentifier('20512345'); }} className={`py-1.5 rounded ${loginRole === 'kepsek' ? 'bg-white font-bold text-blue-600 shadow-sm' : ''}`}>Kepsek</button>
              <button type="button" onClick={() => { setLoginRole('pengawas'); setIdentifier('19700101'); }} className={`py-1.5 rounded ${loginRole === 'pengawas' ? 'bg-white font-bold text-blue-600 shadow-sm' : ''}`}>Pengawas</button>
              <button type="button" onClick={() => { setLoginRole('guru'); setIdentifier('Usnan Rofik, S.Kom.'); }} className={`py-1.5 rounded ${loginRole === 'guru' ? 'bg-white font-bold text-blue-600 shadow-sm' : ''}`}>Guru</button>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="NPSN / Identitas" className="w-full p-2 border rounded" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Kata Sandi" className="w-full p-2 border rounded" />
              <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg">Masuk</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}