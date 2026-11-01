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
  Printer,
  Download,
  UserPlus,
  Users,
  Save,
  CheckSquare
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

  // Form Agenda Supervisi Baru (Pengawas)
  const [showAddSupervisionModal, setShowAddSupervisionModal] = useState(false);
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formJenis, setFormJenis] = useState('akademik');
  const [formFokus, setFormFokus] = useState('');
  const [isSavingSupervision, setIsSavingSupervision] = useState(false);

  // Form Observasi Supervisi (Pengawas)
  const [editKondisi, setEditKondisi] = useState('');
  const [editTemuan, setEditTemuan] = useState('');
  const [editRekomendasi, setEditRekomendasi] = useState('');
  const [editStatus, setEditStatus] = useState('terjadwal');
  const [isUpdatingSupervision, setIsUpdatingSupervision] = useState(false);

  // Form Validasi Pengawas
  const [validasiText, setValidasiText] = useState('');
  const [activeFollowUpId, setActiveFollowUpId] = useState(null);

  // Form Tambah Rencana Aksi Baru (Kepsek)
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [actionRencana, setActionRencana] = useState('');
  const [actionPJ, setActionPJ] = useState('');
  const [actionDukung, setActionDukung] = useState('');
  const [actionBukti, setActionBukti] = useState('');
  const [isSavingAction, setIsSavingAction] = useState(false);

  // State Profil Sekolah (Kepsek & Pengawas)
  const [activeSchoolProfile, setActiveSchoolProfile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState('');

  // State Manajemen Guru (Kepsek)
  const [teachers, setTeachers] = useState([]);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherMapel, setTeacherMapel] = useState('');

  // 1. Fetch Buletin
  const fetchBulletins = async () => {
    setLoadingBulletins(true);
    try {
      const { data, error } = await supabase
        .from('bulletins')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBulletins(data.filter(b => b.is_published));
        setMyArticles(data);
      }
    } catch (err) {
      console.error('Fetch buletin err:', err);
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

        // Tentukan profil sekolah untuk peran kepala sekolah
        if (sessionUser?.role === 'kepala_sekolah') {
          const matched = schoolsData.find(s => s.npsn === sessionUser.npsn);
          if (matched) setActiveSchoolProfile(matched);
        }
      }

      let supQuery = supabase
        .from('supervisions')
        .select(`*, schools ( id, npsn, nama_sekolah, alamat, nama_kepsek, nip_kepsek )`)
        .order('tanggal_supervisi', { ascending: false });

      if (sessionUser?.role === 'kepala_sekolah') {
        const matched = schoolsData?.find(s => s.npsn === sessionUser.npsn);
        if (matched) {
          supQuery = supQuery.eq('school_id', matched.id);
        }
      }

      const { data: supData, error: supErr } = await supQuery;
      if (!supErr && supData) {
        setSupervisions(supData);
        if (supData.length > 0) {
          loadSupervisionDetail(supData[0]);
        }
      }
    } catch (err) {
      console.error('Fetch supervisi err:', err);
    } finally {
      setLoadingSupervision(false);
    }
  };

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

  useEffect(() => {
    fetchBulletins();
    if (sessionUser) {
      fetchSupervisionData();
    }
  }, [sessionUser]);

  // Tambah Agenda Supervisi (Pengawas)
  const handleCreateSupervision = async (e) => {
    e.preventDefault();
    if (!formSchoolId || !formTanggal || !formFokus.trim()) {
      alert('Lengkapi sekolah, tanggal, dan fokus pendampingan.');
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
        *, schools ( id, npsn, nama_sekolah, alamat, nama_kepsek, nip_kepsek )
      `);

      if (error) throw error;

      setShowAddSupervisionModal(false);
      setFormFokus('');
      setFormTanggal('');
      fetchSupervisionData();
      if (data && data[0]) loadSupervisionDetail(data[0]);
    } catch (err) {
      alert(`Gagal membuat agenda: ${err.message}`);
    } finally {
      setIsSavingSupervision(false);
    }
  };

  // Update Catatan Observasi Lapangan (Pengawas)
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
      alert('Hasil observasi supervisi berhasil diperbarui.');
      fetchSupervisionData();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsUpdatingSupervision(false);
    }
  };

  // Tambah Rencana Aksi Baru (Kepala Sekolah)
  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedSupervision || !actionRencana.trim() || !actionPJ.trim()) {
      alert('Harap isi rencana aksi dan penanggung jawab.');
      return;
    }

    setIsSavingAction(true);
    try {
      const payload = {
        supervision_id: selectedSupervision.id,
        rencana_aksi: actionRencana.trim(),
        penanggung_jawab: actionPJ.trim(),
        daya_dukung: actionDukung.trim() || '-',
        bukti_dukung_url: actionBukti.trim() || null,
        status_aksi: 'proses',
        validasi_pengawas: 'Menunggu tinjauan pengawas.'
      };

      const { error } = await supabase.from('follow_ups').insert([payload]);
      if (error) throw error;

      setShowAddActionModal(false);
      setActionRencana('');
      setActionPJ('');
      setActionDukung('');
      setActionBukti('');
      loadSupervisionDetail(selectedSupervision);
    } catch (err) {
      alert(`Gagal menambah rencana aksi: ${err.message}`);
    } finally {
      setIsSavingAction(false);
    }
  };

  // Validasi Pengawas
  const handleSaveValidation = async (fuId) => {
    try {
      const { error } = await supabase
        .from('follow_ups')
        .update({ validasi_pengawas: validasiText })
        .eq('id', fuId);

      if (error) throw error;
      setActiveFollowUpId(null);
      setValidasiText('');
      if (selectedSupervision) loadSupervisionDetail(selectedSupervision);
    } catch (err) {
      alert(`Gagal validasi: ${err.message}`);
    }
  };

  // Simpan Perubahan Profil Sekolah (Kepala Sekolah)
  const handleUpdateSchoolProfile = async (e) => {
    e.preventDefault();
    if (!activeSchoolProfile) return;

    setIsSavingProfile(true);
    setProfileFeedback('');
    try {
      const { error } = await supabase
        .from('schools')
        .update({
          nama_kepsek: activeSchoolProfile.nama_kepsek,
          nip_kepsek: activeSchoolProfile.nip_kepsek,
          akreditasi: activeSchoolProfile.akreditasi,
          alamat: activeSchoolProfile.alamat,
          total_guru: parseInt(activeSchoolProfile.total_guru) || 0,
          total_siswa: parseInt(activeSchoolProfile.total_siswa) || 0,
          sarpras: activeSchoolProfile.sarpras
        })
        .eq('id', activeSchoolProfile.id);

      if (error) throw error;
      setProfileFeedback('Profil sekolah berhasil disimpan ke basis data.');
      fetchSupervisionData();
    } catch (err) {
      setProfileFeedback(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Tambah Akun Guru oleh Kepsek
  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (!teacherName.trim()) return;

    const newTeacher = {
      id: Date.now(),
      nama: teacherName.trim(),
      email: teacherEmail.trim() || `${teacherName.toLowerCase().replace(/[^a-z0-9]/g, '')}@sekolah.sch.id`,
      mapel: teacherMapel.trim() || 'Guru Mata Pelajaran',
      status: 'Aktif'
    };

    setTeachers([newTeacher, ...teachers]);
    setShowAddTeacherModal(false);
    setTeacherName('');
    setTeacherEmail('');
    setTeacherMapel('');
    alert(`Akun untuk ${newTeacher.nama} berhasil didaftarkan.`);
  };

  // Fitur Cetak Berita Acara PDF Resmi
  const handlePrintPDF = () => {
    window.print();
  };

  // Ekspor Rekap Excel (Format CSV Kedinasan)
  const handleExportCSV = () => {
    if (supervisions.length === 0) {
      alert('Tidak ada data supervisi untuk diekspor.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Tanggal Kunjungan,NPSN,Nama Sekolah,Jenis Supervisi,Fokus Pendampingan,Status,Temuan,Rekomendasi\n";

    supervisions.forEach((s, idx) => {
      const cleanTemuan = (s.temuan || '').replace(/[\n\r]+/g, ' ').replace(/"/g, '""');
      const cleanRekom = (s.rekomendasi || '').replace(/[\n\r]+/g, ' ').replace(/"/g, '""');
      csvContent += `${idx + 1},"${s.tanggal_supervisi}","${s.schools?.npsn}","${s.schools?.nama_sekolah}","${s.jenis_supervisi}","${s.fokus_pendampingan}","${s.status}","${cleanTemuan}","${cleanRekom}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Supervisi_SIPANDAI_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Buletin Form
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
      setArticleFeedback({ type: 'error', text: 'Semua kolom teks wajib diisi.' });
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
          console.warn('Storage upload fallback:', ex);
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
      setLoginError('Harap isi identitas akun.');
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
      defaultName = identifier;
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
      {/* ======================================================== */}
      {/* DOKUMEN CETAK PDF RESMI (KOP RESMI KEDINASAN A4) */}
      {/* ======================================================== */}
      {selectedSupervision && (
        <div className="hidden print:block p-8 bg-white text-black font-serif">
          {/* KOP RESMI */}
          <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
            <h2 className="text-base font-bold uppercase tracking-wide">Pemerintah Provinsi Jawa Timur</h2>
            <h1 className="text-xl font-extrabold uppercase">Dinas Pendidikan Wilayah Kabupaten Pacitan</h1>
            <p className="text-xs italic">Jl. Veteran No. 10 Pacitan, Jawa Timur - Pos 63511</p>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider underline">BERITA ACARA & LAPORAN SUPERVISI RUTIN</h3>
            <p className="text-xs">Nomor: 421 / SP-PND / {new Date(selectedSupervision.tanggal_supervisi).getFullYear()}</p>
          </div>

          {/* IDENTITAS */}
          <table className="w-full text-xs mb-4">
            <tbody>
              <tr>
                <td className="w-40 py-1 font-semibold">Nama Satuan Pendidikan</td>
                <td className="w-4 py-1">:</td>
                <td className="py-1 font-bold">{selectedSupervision.schools?.nama_sekolah}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Nomor Pokok Sekolah Nasional (NPSN)</td>
                <td className="py-1">:</td>
                <td className="py-1">{selectedSupervision.schools?.npsn}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Nama Kepala Sekolah</td>
                <td className="py-1">:</td>
                <td className="py-1">{selectedSupervision.schools?.nama_kepsek || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Hari / Tanggal Visitasi</td>
                <td className="py-1">:</td>
                <td className="py-1">{new Date(selectedSupervision.tanggal_supervisi).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Fokus Pendampingan Utama</td>
                <td className="py-1">:</td>
                <td className="py-1 font-semibold capitalize">Supervisi {selectedSupervision.jenis_supervisi} - {selectedSupervision.fokus_pendampingan}</td>
              </tr>
            </tbody>
          </table>

          {/* TABEL CATATAN SUPERVISI */}
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase border-b border-black pb-1 mb-2">I. Catatan Kondisi & Rekomendasi Pengawas</h4>
            <table className="w-full text-xs border border-black border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black p-2 text-left w-1/2">Temuan Nyata & Fakta Lapangan</th>
                  <th className="border border-black p-2 text-left w-1/2">Rekomendasi Solutif Pengawas</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2 align-top whitespace-pre-line leading-relaxed">{selectedSupervision.temuan || '-'}</td>
                  <td className="border border-black p-2 align-top whitespace-pre-line leading-relaxed">{selectedSupervision.rekomendasi || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* MATRIKS KOMITMEN TINDAK LANJUT */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase border-b border-black pb-1 mb-2">II. Matriks Komitmen Rencana Aksi Sekolah</h4>
            <table className="w-full text-xs border border-black border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black p-1.5 w-8 text-center">No</th>
                  <th className="border border-black p-1.5 text-left">Rencana Aksi Perbaikan</th>
                  <th className="border border-black p-1.5 text-left w-36">Penanggung Jawab</th>
                  <th className="border border-black p-1.5 text-left w-28">Daya Dukung</th>
                  <th className="border border-black p-1.5 text-center w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {followUps.map((fu, i) => (
                  <tr key={fu.id}>
                    <td className="border border-black p-1.5 text-center">{i + 1}</td>
                    <td className="border border-black p-1.5">{fu.rencana_aksi}</td>
                    <td className="border border-black p-1.5">{fu.penanggung_jawab}</td>
                    <td className="border border-black p-1.5">{fu.daya_dukung || '-'}</td>
                    <td className="border border-black p-1.5 text-center capitalize">{fu.status_aksi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* KOLOM TANDA TANGAN BERDAMPINGAN */}
          <div className="grid grid-cols-2 text-xs text-center mt-12 pt-6">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold">Kepala {selectedSupervision.schools?.nama_sekolah}</p>
              <div className="h-20"></div>
              <p className="font-bold underline">{selectedSupervision.schools?.nama_kepsek || '........................................'}</p>
              <p>NIP. {selectedSupervision.schools?.nip_kepsek || '........................................'}</p>
            </div>
            <div>
              <p>Pacitan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-semibold">Pengawas Pembina Sekolah,</p>
              <div className="h-20"></div>
              <p className="font-bold underline">Drs. H. Mulyono, M.Pd.</p>
              <p>NIP. 19700101 199503 1 002</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER NAVIGASI */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
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

      {/* WORKSPACE SUB-NAVBAR KETIKA LOGIN */}
      {sessionUser && (
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800 print:hidden">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:hidden">
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
        {/* TAMPILAN 2: MODUL SUPERVISI & TINDAK LANJUT */}
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
                    ? 'Kelola fokus pendampingan, catat temuan riil, dan pantau bukti aksi sekolah.'
                    : 'Tinjau rekomendasi pembinaan pengawas dan kelola matriks aksi tindak lanjut.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* TOMBOL EKSPOR & CETAK */}
                {selectedSupervision && (
                  <button
                    onClick={handlePrintPDF}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-sm transition"
                    title="Cetak Berita Acara PDF Resmi"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak PDF Laporan</span>
                  </button>
                )}

                {sessionUser.role === 'pengawas' && (
                  <>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition"
                      title="Ekspor Seluruh Rekapitulasi Data ke Excel"
                    >
                      <Download className="w-4 h-4" />
                      <span>Ekspor Excel/CSV</span>
                    </button>
                    <button
                      onClick={() => setShowAddSupervisionModal(true)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-sm transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Jadwalkan Kunjungan</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* DUA KOLOM AREA KERJA */}
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

              {/* KOLOM KANAN: INSTRUMEN CATATAN & MATRIKS AKSI */}
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

                      {/* BLOK CATATAN OBSERVASI */}
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
                                {editKondisi || 'Belum ada catatan kondisi/situasi.'}
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

                    {/* BLOK MATRIKS TINDAK LANJUT */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4 border-b pb-3">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            Matriks Komitmen Tindak Lanjut Sekolah
                          </h4>
                          <p className="text-xs text-slate-500">
                            Rencana aksi perbaikan, penanggung jawab, daya dukung, dan catatan validasi pengawas.
                          </p>
                        </div>

                        {/* TOMBOL TAMBAH AKSI KHUSUS KEPSEK */}
                        {sessionUser.role === 'kepala_sekolah' && (
                          <button
                            onClick={() => setShowAddActionModal(true)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Tambah Rencana Aksi</span>
                          </button>
                        )}
                      </div>

                      {followUps.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                          Belum ada butir rencana aksi yang didaftarkan.
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

                              {fu.bukti_dukung_url && (
                                <div className="text-[11px]">
                                  <a 
                                    href={fu.bukti_dukung_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center space-x-1.5 text-blue-600 hover:underline font-semibold"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Buka Dokumen / Bukti Pelaksanaan</span>
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
        {/* TAMPILAN 3: PROFIL SATUAN PENDIDIKAN (KEPALA SEKOLAH) */}
        {/* ======================================================== */}
        {activeTab === 'profil-sekolah' && sessionUser?.role === 'kepala_sekolah' && activeSchoolProfile && (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Profil Satuan Pendidikan</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Perbarui data sarana dan demografis sekolah sebagai acuan resmi pengawas.
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full">
                NPSN: {activeSchoolProfile.npsn}
              </span>
            </div>

            <form onSubmit={handleUpdateSchoolProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Satuan Pendidikan
                  </label>
                  <input
                    type="text"
                    disabled
                    value={activeSchoolProfile.nama_sekolah}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Peringkat Akreditasi
                  </label>
                  <select
                    value={activeSchoolProfile.akreditasi || 'A'}
                    onChange={(e) => setActiveSchoolProfile({ ...activeSchoolProfile, akreditasi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="A">Terakreditasi A (Unggul)</option>
                    <option value="B">Terakreditasi B (Baik)</option>
                    <option value="C">Terakreditasi C (Cukup)</option>
                    <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Lengkap Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={activeSchoolProfile.nama_kepsek || ''}
                    onChange={(e) => setActiveSchoolProfile({ ...activeSchoolProfile, nama_kepsek: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nama beserta gelar akademik"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={activeSchoolProfile.nip_kepsek || ''}
                    onChange={(e) => setActiveSchoolProfile({ ...activeSchoolProfile, nip_kepsek: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1970xxxxxxxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alamat Lengkap Sekolah
                </label>
                <textarea
                  rows={2}
                  value={activeSchoolProfile.alamat || ''}
                  onChange={(e) => setActiveSchoolProfile({ ...activeSchoolProfile, alamat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Total Dewan Guru (Orang)
                  </label>
                  <input
                    type="number"
                    value={activeSchoolProfile.total_guru || 0}
                    onChange={(e) => setActiveSchoolProfile({ ...activeSchoolProfile, total_guru: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Total Peserta Didik (Orang)
                  </label>
                  <input
                    type="number"
                    value={activeSchoolProfile.total_siswa || 0}
                    onChange={(e) => setActiveSchoolProfile({ ...activeSchoolProfile, total_siswa: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sarana & Prasarana Utama Satuan Pendidikan
                </label>
                <textarea
                  rows={3}
                  value={activeSchoolProfile.sarpras || ''}
                  onChange={(e) => setActiveSchoolProfile({ ...activeSchoolProfile, sarpras: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rincian ruang kelas, studio, laboratorium, perpustakaan, dan kapasitas internet..."
                />
              </div>

              {profileFeedback && (
                <div className={`p-3 rounded-lg text-xs font-medium ${profileFeedback.includes('berhasil') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {profileFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Pembaruan Profil'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAMPILAN 4: KELOLA AKUN GURU (KEPALA SEKOLAH) */}
        {/* ======================================================== */}
        {activeTab === 'kelola-guru' && sessionUser?.role === 'kepala_sekolah' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Kelola Dewan Guru & Penulis</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Daftarkan dewan guru dari sekolah Anda untuk dapat berkontribusi menulis di buletin praktik baik.
                </p>
              </div>

              <button
                onClick={() => setShowAddTeacherModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Akun Guru Baru</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b">
                    <tr>
                      <th className="py-3 px-4">Nama Lengkap Guru</th>
                      <th className="py-3 px-4">Email Akses Login</th>
                      <th className="py-3 px-4">Tugas / Mata Pelajaran</th>
                      <th className="py-3 px-4">Hak Akses</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">Usnan Rofik, S.Kom.</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">usnan@smkn1pacitan.sch.id</td>
                      <td className="py-3.5 px-4 text-xs font-medium">PSPT & Broadcasting</td>
                      <td className="py-3.5 px-4 text-xs">Penulis Buletin</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">Aktif</span>
                      </td>
                    </tr>
                    {teachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{t.nama}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">{t.email}</td>
                        <td className="py-3.5 px-4 text-xs font-medium">{t.mapel}</td>
                        <td className="py-3.5 px-4 text-xs">Penulis Buletin</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">Aktif</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAMPILAN 5: DAFTAR SEKOLAH BINAAN (PENGAWAS VIEW) */}
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
        {/* TAMPILAN 6: RUANG PENULISAN ARTIKEL BULETIN */}
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
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-