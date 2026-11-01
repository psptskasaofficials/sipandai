import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import PrintBeritaAcara from './PrintBeritaAcara';
import { 
  LogIn, 
  LogOut, 
  PlusCircle, 
  Eye, 
  Trash2, 
  ExternalLink, 
  Edit3, 
  Save, 
  Printer, 
  Download,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [activeTab, setActiveTab] = useState('buletin');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState('kepsek');
  const [identifier, setIdentifier] = useState('20512345');
  const [password, setPassword] = useState('123456');

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

  // State Supervisi & Sekolah
  const [schools, setSchools] = useState([]);
  const [supervisions, setSupervisions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [selectedSupervision, setSelectedSupervision] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

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

  // State Modul Kepsek
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
  const [newAksi, setNewAksi] = useState('');
  const [newPJ, setNewPJ] = useState('');
  const [newDayaDukung, setNewDayaDukung] = useState('');
  const [newBuktiUrl, setNewBuktiUrl] = useState('');

  // 1. Ambil Data Buletin
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
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Ambil Data Supervisi & Sekolah
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
            nama_sekolah: matched.nama_sekolah || '',
            akreditasi: matched.akreditasi || '',
            alamat: matched.alamat || '',
            nama_kepsek: matched.nama_kepsek || '',
            nip_kepsek: matched.nip_kepsek || '',
            total_guru: matched.total_guru || 0,
            total_siswa: matched.total_siswa || 0,
            sarpras: matched.sarpras || ''
          });
          fetchTeachers(matched.npsn);
        }
      }

      let supQuery = supabase
        .from('supervisions')
        .select(`*, schools ( id, npsn, nama_sekolah, alamat, nama_kepsek, nip_kepsek )`)
        .order('tanggal_supervisi', { ascending: false });

      if (user && user.role === 'kepsek' && matched) {
        supQuery = supQuery.eq('school_id', matched.id);
      }

      const { data: supData } = await supQuery;
      if (supData) {
        setSupervisions(supData);
        if (supData.length > 0) {
          loadSupervisionDetail(supData[0]);
        } else {
          setSelectedSupervision(null);
          setFollowUps([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
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

  // Handler Aksi CRUD
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentSchool) return;
    await supabase.from('schools').update({
      nama_sekolah: profileForm.nama_sekolah,
      akreditasi: profileForm.akreditasi,
      alamat: profileForm.alamat,
      nama_kepsek: profileForm.nama_kepsek,
      nip_kepsek: profileForm.nip_kepsek,
      total_guru: parseInt(profileForm.total_guru) || 0,
      total_siswa: parseInt(profileForm.total_siswa) || 0,
      sarpras: profileForm.sarpras
    }).eq('id', currentSchool.id);
    alert('Profil berhasil diperbarui!');
    setIsEditingProfile(false);
    fetchSupervisionData(sessionUser);
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!teacherForm.nama.trim()) return alert('Nama guru wajib diisi!');
    await supabase.from('teachers').insert([{
      npsn: currentSchool?.npsn || sessionUser.npsn,
      nama_guru: teacherForm.nama.trim(),
      nip: teacherForm.nip.trim(),
      email: teacherForm.email.trim(),
      mata_pelajaran: teacherForm.mapel.trim()
    }]);
    setTeacherForm({ nama: '', nip: '', email: '', mapel: '' });
    fetchTeachers(currentSchool?.npsn || sessionUser.npsn);
    alert('Guru berhasil disimpan!');
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedSupervision || !newAksi.trim()) return alert('Pilih supervisi dan isi rencana aksi!');
    await supabase.from('follow_ups').insert([{
      supervision_id: selectedSupervision.id,
      rencana_aksi: newAksi.trim(),
      penanggung_jawab: newPJ.trim(),
      daya_dukung: newDayaDukung.trim(),
      bukti_dukung_url: newBuktiUrl.trim(),
      status_aksi: 'proses'
    }]);
    setNewAksi(''); setNewPJ(''); setNewDayaDukung(''); setNewBuktiUrl('');
    loadSupervisionDetail(selectedSupervision);
    alert('Rencana aksi berhasil disimpan!');
  };

  const handleCreateSupervision = async (e) => {
    e.preventDefault();
    if (!formSchoolId || !formTanggal) return alert('Lengkapi data supervisi!');
    await supabase.from('supervisions').insert([{
      school_id: formSchoolId,
      tanggal_supervisi: formTanggal,
      jenis_supervisi: formJenis,
      fokus_pendampingan: formFokus.trim(),
      status: 'terjadwal',
      kondisi_situasi: 'Menunggu visitasi.',
      temuan: 'Belum dilakukan visitasi.',
      rekomendasi: 'Siapkan instrumen supervisi.'
    }]);
    setShowAddSupervisionModal(false);
    fetchSupervisionData(sessionUser);
  };

  const handleUpdateObservation = async (e) => {
    e.preventDefault();
    if (!selectedSupervision) return;
    await supabase.from('supervisions').update({
      kondisi_situasi: editKondisi,
      temuan: editTemuan,
      rekomendasi: editRekomendasi,
      status: editStatus
    }).eq('id', selectedSupervision.id);
    alert('Catatan observasi diperbarui!');
    fetchSupervisionData(sessionUser);
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return alert('Judul wajib diisi!');
    await supabase.from('bulletins').insert([{
      judul: newTitle.trim(),
      ringkasan: newSummary.trim(),
      konten: newContent.trim(),
      kategori: newCategory,
      cover_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
      author_name: sessionUser?.nama || 'Kontributor',
      author_role: sessionUser?.role || 'guru',
      author_school: sessionUser?.namaSekolah || 'Sekolah Binaan',
      is_published: true
    }]);
    setNewTitle(''); setNewSummary(''); setNewContent('');
    fetchBulletins();
    alert('Artikel berhasil langsung diterbitkan!');
  };

  const handleExportCsv = () => {
    if (supervisions.length === 0) return alert('Tidak ada data supervisi!');
    const rows = supervisions.map((s, i) => [
      i + 1,
      `"${s.tanggal_supervisi}"`,
      `"${s.schools?.nama_sekolah || ''}"`,
      `"${s.jenis_supervisi}"`,
      `"${(s.fokus_pendampingan || '').replace(/"/g, '""')}"`,
      `"${s.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFFNo,Tanggal,Sekolah,Jenis,Fokus,Status\n' + rows.map(e => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Rekap_Supervisi_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const found = schools.find(s => String(s.npsn).trim() === String(identifier).trim());
    const userObj = {
      nama: loginRole === 'pengawas' ? 'Drs. H. Mulyono, M.Pd.' : (found ? found.nama_kepsek : 'Kepala Sekolah'),
      role: loginRole,
      npsn: identifier.trim(),
      namaSekolah: found ? found.nama_sekolah : `Sekolah (${identifier})`
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
            <button onClick={() => setActiveTab('buletin')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'buletin' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>
              Buletin
            </button>
            {sessionUser ? (
              <div className="flex items-center space-x-2 pl-3 border-l">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold block">{sessionUser.nama}</span>
                  <span className="text-[10px] text-blue-600 uppercase font-semibold">{sessionUser.role}</span>
                </div>
                <button onClick={() => { setSessionUser(null); setActiveTab('buletin'); }} className="p-1.5 text-slate-400 hover:text-rose-600">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm">
                Masuk Sistem
              </button>
            )}
          </div>
        </div>
      </header>

      {/* NAVBAR MENU ROLE */}
      {sessionUser && (
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800 print:hidden">
          <div className="max-w-7xl mx-auto px-4 flex space-x-4 text-xs font-medium overflow-x-auto">
            {sessionUser.role === 'pengawas' && (
              <>
                <button onClick={() => setActiveTab('supervisi')} className={`py-3 whitespace-nowrap border-b-2 ${activeTab === 'supervisi' ? 'border-blue-500 text-white font-semibold' : 'border-transparent'}`}>Agenda Supervisi</button>
                <button onClick={() => setActiveTab('sekolah-binaan')} className={`py-3 whitespace-nowrap border-b-2 ${activeTab === 'sekolah-binaan' ? 'border-blue-500 text-white font-semibold' : 'border-transparent'}`}>Sekolah Binaan</button>
                <button onClick={() => setActiveTab('moderasi-buletin')} className={`py-3 whitespace-nowrap border-b-2 ${activeTab === 'moderasi-buletin' ? 'border-blue-500 text-white font-semibold' : 'border-transparent'}`}>Pantau Buletin</button>
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
        {/* BULETIN */}
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

        {/* KEPSEK 1: PROFIL */}
        {activeTab === 'profil-sekolah' && sessionUser?.role === 'kepsek' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">NPSN: {currentSchool?.npsn}</span>
                <h2 className="text-xl font-bold mt-1">{profileForm.nama_sekolah}</h2>
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
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-sm">Daftar Guru ({teachers.length})</h3>
              <form onSubmit={handleAddTeacher} className="flex gap-2">
                <input placeholder="Nama Guru" value={teacherForm.nama} onChange={e => setTeacherForm({...teacherForm, nama: e.target.value})} className="p-2 border rounded text-xs flex-1" />
                <input placeholder="Mapel" value={teacherForm.mapel} onChange={e => setTeacherForm({...teacherForm, mapel: e.target.value})} className="p-2 border rounded text-xs flex-1" />
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold">+ Tambah</button>
              </form>
              <div className="divide-y text-xs">
                {teachers.map(t => <div key={t.id} className="py-2 flex justify-between"><span>{t.nama_guru}</span><span className="text-slate-500">{t.mata_pelajaran}</span></div>)}
              </div>
            </div>
          </div>
        )}

        {/* KEPSEK 2: CATATAN SUPERVISI */}
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
                    <div key={fu.id || idx} className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-bold"><span>Aksi #{idx + 1}: {fu.rencana_aksi}</span><span className="uppercase text-[10px] px-2 py-0.5 bg-slate-200 rounded">{fu.status_aksi}</span></div>
                      <div className="text-slate-600">PJ: <strong>{fu.penanggung_jawab}</strong> | Dukungan: {fu.daya_dukung || '-'}</div>
                      {fu.bukti_dukung_url && <a href={fu.bukti_dukung_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block pt-1 font-semibold">Buka Dokumen Bukti</a>}
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
                <button onClick={handleExportCsv} className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-1.5"><Download className="w-4 h-4" /><span>Rekap Excel</span></button>
                {selectedSupervision && <button onClick={() => setShowPdfModal(true)} className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-1.5"><Printer className="w-4 h-4" /><span>Cetak PDF</span></button>}
                <button onClick={() => setShowAddSupervisionModal(true)} className="px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-1.5"><PlusCircle className="w-4 h-4" /><span>Jadwalkan Baru</span></button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-2">
                {supervisions.map(s => (
                  <div key={s.id} onClick={() => loadSupervisionDetail(s)} className={`p-4 rounded-xl border cursor-pointer ${selectedSupervision?.id === s.id ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}>
                    <span className="text-[10px] text-slate-500">{new Date(s.tanggal_supervisi).toLocaleDateString('id-ID')}</span>
                    <h4 className="text-xs font-bold">{s.schools?.nama_sekolah}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{s.fokus_pendampingan}</p>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-8">
                {selectedSupervision ? (
                  <form onSubmit={handleUpdateObservation} className="bg-white p-6 rounded-2xl border shadow-sm space-y-3 text-xs">
                    <h3 className="font-bold text-sm">{selectedSupervision.schools?.nama_sekolah}</h3>
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
                  </form>
                ) : <div className="p-8 text-center text-xs text-slate-400">Pilih sesi supervisi.</div>}
              </div>
            </div>
          </div>
        )}

        {/* RUANG TULIS ARTIKEL */}
        {activeTab === 'tulis-buletin' && sessionUser && (
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl border shadow-sm space-y-4 text-xs">
            <h2 className="text-lg font-bold">Buat Tulisan Baru (Auto-Publish)</h2>
            <form onSubmit={handleCreateArticle} className="space-y-3">
              <input placeholder="Judul Artikel" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-2 border rounded" />
              <textarea placeholder="Ringkasan Singkat" rows={2} value={newSummary} onChange={e => setNewSummary(e.target.value)} className="w-full p-2 border rounded" />
              <textarea placeholder="Isi Artikel Lengkap" rows={6} value={newContent} onChange={e => setNewContent(e.target.value)} className="w-full p-2 border rounded" />
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg">Terbitkan Sekarang</button>
            </form>
          </div>
        )}
      </main>

      {/* MODAL CETAK (DIPANGGIL DARI FILE KEDUA) */}
      {showPdfModal && (
        <PrintBeritaAcara
          supervision={selectedSupervision}
          followUps={followUps}
          onClose={() => setShowPdfModal(false)}
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