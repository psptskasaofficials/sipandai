import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import PrintBeritaAcara from './PrintBeritaAcara';
import DashboardView from './DashboardView';
import AdminPortal from './AdminPortal';
import { 
  LogOut, PlusCircle, Eye, Trash2, 
  Edit3, Printer, Trash, UserCheck, X, ArrowRight, Download, KeyRound, Search, Lock, Shield,
  Building2, School, Check, AlertCircle
} from 'lucide-react';

export default function App() {
  const [sessionUser, setSessionUser] = useState(() => {
    const saved = localStorage.getItem('sipandai_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('sipandai_session') ? 'dashboard' : 'buletin';
  });

  // Mode Konsol Admin & Modal Verifikasi PIN (0852)
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState('');

  // State login portal pengguna
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState('kepsek');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Profil & Sandi
  const [profileNama, setProfileNama] = useState('');
  const [profileNip, setProfileNip] = useState('');
  const [profileMapel, setProfileMapel] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Pengaturan Kop Surat & Identitas Pengawas
  const [systemSettings, setSystemSettings] = useState({
    instansi: 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan',
    judul: 'SISTEM INFORMASI SUPERVISI & PENDAMPINGAN (SI PANDAI)',
    wilayah: 'Sekolah Binaan Wilayah Kerja Kabupaten Pacitan',
    pengawas_nama: 'Wijiatin, S.Pd., M.Pd.',
    pengawas_nip: '197103151996032004'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Buletin
  const [bulletins, setBulletins] = useState([]);
  const [allBulletinsForSupervisor, setAllBulletinsForSupervisor] = useState([]);
  const [myArticles, setMyArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchBulletin, setSearchBulletin] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');

  // Form Buletin
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
  const [allFollowUps, setAllFollowUps] = useState([]);
  const [selectedSupervision, setSelectedSupervision] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Notifikasi
  const [notifications, setNotifications] = useState([]);

  // Form CRUD Sekolah Binaan oleh Pengawas
  const [editingSchoolId, setEditingSchoolId] = useState(null);
  const [searchSchoolQuery, setSearchSchoolQuery] = useState('');
  const [schoolForm, setSchoolForm] = useState({
    npsn: '',
    nama_sekolah: '',
    nama_kepsek: '',
    nip_kepsek: '',
    akreditasi: 'B',
    alamat: ''
  });

  // Form CRUD Supervisi
  const [showAddSupervisionModal, setShowAddSupervisionModal] = useState(false);
  const [editingSupervisionId, setEditingSupervisionId] = useState(null);
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formJenis, setFormJenis] = useState('akademik');
  const [formFokus, setFormFokus] = useState('');

  // Form Observasi
  const [editKondisi, setEditKondisi] = useState('');
  const [editTemuan, setEditTemuan] = useState('');
  const [editRekomendasi, setEditRekomendasi] = useState('');
  const [editStatus, setEditStatus] = useState('terjadwal');
  const [validasiText, setValidasiText] = useState('');
  const [activeFollowUpId, setActiveFollowUpId] = useState(null);

  // Form Kepsek & Profil
  const [currentSchool, setCurrentSchool] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nama_sekolah: '', akreditasi: '', alamat: '', nama_kepsek: '', nip_kepsek: '', total_guru: 0, total_siswa: 0, sarpras: ''
  });

  const [teachers, setTeachers] = useState([]);
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [teacherForm, setTeacherForm] = useState({ nama: '', nip: '', email: '', mapel: '' });

  const [editingFollowUpId, setEditingFollowUpId] = useState(null);
  const [newAksi, setNewAksi] = useState('');
  const [newPJ, setNewPJ] = useState('');
  const [newDayaDukung, setNewDayaDukung] = useState('');
  const [newBuktiUrl, setNewBuktiUrl] = useState('');

  // Persistensi sesi login
  useEffect(() => {
    if (sessionUser) {
      localStorage.setItem('sipandai_session', JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem('sipandai_session');
    }
  }, [sessionUser]);

  // 1. Ambil pengaturan kop
  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').eq('id', 'sistem_config').single();
      if (data) setSystemSettings(data);
    } catch (e) {
      console.error('Load settings:', e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 2. Ambil buletin
  const fetchBulletins = async (user = sessionUser) => {
    try {
      const { data: pub } = await supabase.from('bulletins').select('*').eq('is_published', true).order('created_at', { ascending: false });
      if (pub) setBulletins(pub);

      const { data: all } = await supabase.from('bulletins').select('*').order('created_at', { ascending: false });
      if (all) {
        setAllBulletinsForSupervisor(all);
        if (user) {
          setMyArticles(user.role === 'pengawas' ? all : all.filter(a => a.author_name === user.nama));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Ambil data supervisi & sekolah
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
        } else if (user && user.role === 'guru') {
          matched = schData.find(s => String(s.npsn).trim() === String(user.npsn).trim());
          if (matched) setCurrentSchool(matched);
        }
      }

      let supQuery = supabase.from('supervisions').select(`*, schools ( id, npsn, nama_sekolah, alamat, nama_kepsek, nip_kepsek )`).order('tanggal_supervisi', { ascending: false });
      if (user && user.role === 'kepsek' && matched) {
        supQuery = supQuery.eq('school_id', matched.id);
      }
      
      const { data: supData } = await supQuery;
      const { data: allFuData } = await supabase.from('follow_ups').select('*').order('created_at', { ascending: false });
      if (allFuData) setAllFollowUps(allFuData);

      if (supData) {
        setSupervisions(supData);
        if (supData.length > 0) {
          const activeSup = selectedSupervision ? (supData.find(s => s.id === selectedSupervision.id) || supData[0]) : supData[0];
          loadSupervisionDetail(activeSup);
        } else {
          setSelectedSupervision(null);
          setFollowUps([]);
        }

        const generatedNotifs = [];
        if (user?.role === 'pengawas') {
          const pendingFu = (allFuData || []).filter(f => f.status_aksi === 'proses');
          pendingFu.slice(0, 4).forEach(f => {
            generatedNotifs.push({
              tipe: 'aksi_baru',
              judul: 'Rencana Aksi Menunggu Validasi',
              pesan: `Komitmen: "${f.rencana_aksi}" (PJ: ${f.penanggung_jawab})`,
              waktu: f.created_at ? new Date(f.created_at).toLocaleDateString('id-ID') : 'Baru',
              targetTab: 'supervisi'
            });
          });
        } else if (user?.role === 'kepsek') {
          supData.slice(0, 3).forEach(s => {
            generatedNotifs.push({
              tipe: 'supervisi_baru',
              judul: `Supervisi ${s.jenis_supervisi.toUpperCase()}`,
              pesan: `Fokus: ${s.fokus_pendampingan}`,
              waktu: new Date(s.tanggal_supervisi).toLocaleDateString('id-ID'),
              targetTab: 'catatan-supervisi'
            });
          });
        } else if (user?.role === 'guru') {
          generatedNotifs.push({
            tipe: 'info',
            judul: 'Ruang Literasi Guru Aktif',
            pesan: 'Bagikan karya inovasi dan praktik baik pembelajaran Anda di Buletin.',
            waktu: 'Aktif',
            targetTab: 'kelola-buletin'
          });
        }
        setNotifications(generatedNotifs);
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
    fetchBulletins(sessionUser);
    fetchSupervisionData(sessionUser);
  }, [sessionUser]);

  // =========================================================================
  // CRUD SEKOLAH DAMPINGAN OLEH PENGAWAS
  // =========================================================================
  const handleSaveSchoolBySupervisor = async (e) => {
    e.preventDefault();
    const cleanNpsn = schoolForm.npsn.trim();
    const cleanNama = schoolForm.nama_sekolah.trim();
    const cleanKepsek = schoolForm.nama_kepsek.trim();

    if (!cleanNpsn || !cleanNama || !cleanKepsek) {
      return alert('NPSN, Nama Sekolah, dan Nama Kepala Sekolah wajib diisi!');
    }

    try {
      if (editingSchoolId) {
        // Mode Perbarui (Update)
        const { error: errUpdate } = await supabase
          .from('schools')
          .update({
            nama_sekolah: cleanNama,
            nama_kepsek: cleanKepsek,
            nip_kepsek: schoolForm.nip_kepsek.trim(),
            akreditasi: schoolForm.akreditasi,
            alamat: schoolForm.alamat.trim()
          })
          .eq('id', editingSchoolId);

        if (errUpdate) throw errUpdate;
        alert('Data sekolah dampingan berhasil diperbarui!');
      } else {
        // Mode Tambah Baru (Insert)
        const { error: errInsert } = await supabase
          .from('schools')
          .insert([{
            npsn: cleanNpsn,
            nama_sekolah: cleanNama,
            nama_kepsek: cleanKepsek,
            nip_kepsek: schoolForm.nip_kepsek.trim(),
            akreditasi: schoolForm.akreditasi,
            alamat: schoolForm.alamat.trim(),
            supervisor_nip: sessionUser?.nip || '197103151996032004'
          }]);

        if (errInsert) throw errInsert;

        // Otomatis buatkan akun login default untuk Kepala Sekolah
        await supabase.from('user_credentials').upsert({
          identifier: cleanNpsn,
          role: 'kepsek',
          password: 'pandai12345',
          updated_at: new Date().toISOString()
        });

        alert(`Sekolah binaan baru ditambahkan!\nAkun login Kepala Sekolah aktif:\nNPSN: ${cleanNpsn}\nPassword: pandai12345`);
      }

      handleCancelSchoolForm();
      fetchSupervisionData(sessionUser);
    } catch (err) {
      alert('Gagal menyimpan sekolah: ' + err.message);
    }
  };

  const handleEditSchoolClick = (sch) => {
    setEditingSchoolId(sch.id);
    setSchoolForm({
      npsn: sch.npsn || '',
      nama_sekolah: sch.nama_sekolah || '',
      nama_kepsek: sch.nama_kepsek || '',
      nip_kepsek: sch.nip_kepsek || '',
      akreditasi: sch.akreditasi || 'B',
      alamat: sch.alamat || ''
    });
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleDeleteSchoolBySupervisor = async (sch) => {
    if (!window.confirm(`Yakin ingin menghapus sekolah "${sch.nama_sekolah}" (NPSN: ${sch.npsn})?\nSeluruh data jadwal supervisi terkait akan ikut terhapus.`)) {
      return;
    }

    try {
      const { error: errDel } = await supabase.from('schools').delete().eq('id', sch.id);
      if (errDel) throw errDel;

      // Hapus kredensial login kepsek
      if (sch.npsn) {
        await supabase.from('user_credentials').delete().eq('identifier', sch.npsn);
      }

      alert('Sekolah binaan berhasil dihapus.');
      fetchSupervisionData(sessionUser);
    } catch (err) {
      alert('Gagal menghapus sekolah: ' + err.message);
    }
  };

  const handleCancelSchoolForm = () => {
    setEditingSchoolId(null);
    setSchoolForm({
      npsn: '',
      nama_sekolah: '',
      nama_kepsek: '',
      nip_kepsek: '',
      akreditasi: 'B',
      alamat: ''
    });
  };

  // Verifikasi PIN Akses Admin
  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (inputPin.trim() === '0852') {
      setShowPinModal(false);
      setInputPin('');
      setPinError('');
      setIsAdminMode(true);
    } else {
      setPinError('PIN verifikasi salah! Akses ditolak.');
    }
  };

  // Ekspor Excel
  const handleExportExcel = () => {
    if (!supervisions || supervisions.length === 0) {
      return alert('Belum ada data supervisi untuk diekspor!');
    }

    let tableRows = '';
    supervisions.forEach((sup, idx) => {
      const relatedFu = allFollowUps.filter(f => f.supervision_id === sup.id);
      if (relatedFu.length === 0) {
        tableRows += `
          <tr>
            <td>${idx + 1}</td>
            <td>${sup.tanggal_supervisi || '-'}</td>
            <td>${sup.schools?.npsn || '-'}</td>
            <td>${sup.schools?.nama_sekolah || '-'}</td>
            <td>${sup.schools?.nama_kepsek || '-'}</td>
            <td>${sup.jenis_supervisi || '-'}</td>
            <td>${sup.fokus_pendampingan || '-'}</td>
            <td>${sup.status || '-'}</td>
            <td>Belum ada rencana aksi</td>
            <td>-</td>
            <td>-</td>
          </tr>
        `;
      } else {
        relatedFu.forEach((fu, fuIdx) => {
          tableRows += `
            <tr>
              <td>${fuIdx === 0 ? idx + 1 : ''}</td>
              <td>${fuIdx === 0 ? (sup.tanggal_supervisi || '-') : ''}</td>
              <td>${fuIdx === 0 ? (sup.schools?.npsn || '-') : ''}</td>
              <td>${fuIdx === 0 ? (sup.schools?.nama_sekolah || '-') : ''}</td>
              <td>${fuIdx === 0 ? (sup.schools?.nama_kepsek || '-') : ''}</td>
              <td>${fuIdx === 0 ? (sup.jenis_supervisi || '-') : ''}</td>
              <td>${fuIdx === 0 ? (sup.fokus_pendampingan || '-') : ''}</td>
              <td>${fuIdx === 0 ? (sup.status || '-') : ''}</td>
              <td>${fu.rencana_aksi || '-'}</td>
              <td>${fu.penanggung_jawab || '-'}</td>
              <td>${fu.status_aksi || '-'}</td>
            </tr>
          `;
        });
      }
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11pt; }
          th { background-color: #1e40af; color: #ffffff; font-weight: bold; border: 1px solid #000000; padding: 8px; }
          td { border: 1px solid #000000; padding: 6px; vertical-align: top; }
        </style>
      </head>
      <body>
        <h3>LAPORAN SUPERVISI DAN MATRIKS RENCANA AKSI SEKOLAH - SI PANDAI</h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal Visitasi</th>
              <th>NPSN</th>
              <th>Satuan Pendidikan</th>
              <th>Kepala Sekolah</th>
              <th>Jenis Supervisi</th>
              <th>Fokus Pendampingan</th>
              <th>Status Supervisi</th>
              <th>Rencana Aksi Sekolah</th>
              <th>Penanggung Jawab (PJ)</th>
              <th>Status Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Supervisi_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Simpan pengaturan kop
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
      alert('Pengaturan Kop Berita Acara berhasil disimpan!');
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Simpan Profil & Kata Sandi
  const handleSaveUserProfile = async (e) => {
    e.preventDefault();
    if (!profileNama.trim()) return alert('Nama lengkap tidak boleh kosong!');
    if (newPassword && newPassword !== confirmPassword) {
      return alert('Konfirmasi kata sandi baru tidak cocok!');
    }

    try {
      const userKey = sessionUser.identifierKey || sessionUser.npsn;

      if (newPassword) {
        const { data: cred } = await supabase
          .from('user_credentials')
          .select('password')
          .eq('identifier', userKey)
          .maybeSingle();

        const currentDbPass = cred ? cred.password : 'pandai12345';
        if (oldPassword !== currentDbPass) {
          return alert('Kata sandi saat ini yang Anda masukkan salah!');
        }

        await supabase.from('user_credentials').upsert({
          identifier: userKey,
          role: sessionUser.role,
          password: newPassword,
          updated_at: new Date().toISOString()
        });
      }

      if (sessionUser.role === 'pengawas') {
        await supabase.from('supervisors').update({
          nama_pengawas: profileNama.trim()
        }).eq('nip', userKey);
      } else if (sessionUser.role === 'kepsek' && currentSchool) {
        await supabase.from('schools').update({
          nama_kepsek: profileNama.trim()
        }).eq('id', currentSchool.id);
      } else if (sessionUser.role === 'guru') {
        await supabase.from('teachers').update({
          nama_guru: profileNama.trim(),
          mata_pelajaran: profileMapel.trim()
        }).eq('nip', userKey);
      }

      setSessionUser(prev => ({ 
        ...prev, 
        nama: profileNama.trim(), 
        mapel: profileMapel.trim()
      }));

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert(newPassword ? 'Profil dan Kata Sandi baru berhasil disimpan ke database!' : 'Identitas profil berhasil diperbarui!');
    } catch (err) {
      alert('Gagal memperbarui profil: ' + err.message);
    }
  };

  // CRUD Buletin
  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return alert('Judul dan isi artikel wajib diisi!');
    setIsSubmittingArticle(true);

    try {
      let publicCoverUrl = coverPreview || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80';

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const cleanFileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error: upErr } = await supabase.storage
          .from('sipandai-storage')
          .upload(cleanFileName, coverFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (upErr) {
          throw new Error('Gagal mengunggah foto ke storage Supabase: ' + upErr.message);
        }

        const { data: urlData } = supabase.storage
          .from('sipandai-storage')
          .getPublicUrl(cleanFileName);

        if (urlData?.publicUrl) {
          publicCoverUrl = urlData.publicUrl;
        }
      }

      if (editingArticleId) {
        const { error: updateErr } = await supabase.from('bulletins').update({
          judul: newTitle.trim(),
          ringkasan: newSummary.trim(),
          konten: newContent.trim(),
          kategori: newCategory,
          cover_url: publicCoverUrl
        }).eq('id', editingArticleId);

        if (updateErr) throw updateErr;
        alert('Artikel berhasil diperbarui!');
      } else {
        const { error: insertErr } = await supabase.from('bulletins').insert([{
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

        if (insertErr) throw insertErr;
        alert('Artikel berhasil diterbitkan ke halaman utama!');
      }

      handleCancelEditArticle();
      await fetchBulletins(sessionUser);

      setTimeout(() => {
        const targetEl = document.getElementById('tabel-manajemen-artikel');
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
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
    if (!window.confirm('Hapus artikel ini secara permanen?')) return;
    await supabase.from('bulletins').delete().eq('id', id);
    fetchBulletins(sessionUser);
  };

  const handleTogglePublish = async (id, currentStatus) => {
    await supabase.from('bulletins').update({ is_published: !currentStatus }).eq('id', id);
    fetchBulletins(sessionUser);
  };

  const handleCancelEditArticle = () => {
    setEditingArticleId(null);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setCoverFile(null);
    setCoverPreview('');
  };

  // CRUD Supervisi
  const handleSaveSupervision = async (e) => {
    e.preventDefault();
    if (!formSchoolId || !formTanggal) return alert('Sekolah dan tanggal wajib diisi!');
    
    if (editingSupervisionId) {
      await supabase.from('supervisions').update({
        school_id: formSchoolId,
        tanggal_supervisi: formTanggal,
        jenis_supervisi: formJenis,
        fokus_pendampingan: formFokus.trim()
      }).eq('id', editingSupervisionId);
      alert('Agenda supervisi berhasil diperbarui!');
    } else {
      await supabase.from('supervisions').insert([{
        school_id: formSchoolId,
        tanggal_supervisi: formTanggal,
        jenis_supervisi: formJenis,
        fokus_pendampingan: formFokus.trim(),
        supervisor_nip: sessionUser?.nip || '197103151996032004',
        status: 'terjadwal',
        kondisi_situasi: 'Menunggu visitasi.',
        temuan: 'Belum dilakukan visitasi.',
        rekomendasi: 'Siapkan instrumen.'
      }]);
      alert('Jadwal supervisi dibuat!');
    }

    setShowAddSupervisionModal(false);
    setEditingSupervisionId(null);
    setFormFokus('');
    setFormTanggal('');
    fetchSupervisionData(sessionUser);
  };

  const openEditSupervisionModal = (sup) => {
    setEditingSupervisionId(sup.id);
    setFormSchoolId(sup.school_id);
    setFormTanggal(sup.tanggal_supervisi);
    setFormJenis(sup.jenis_supervisi || 'akademik');
    setFormFokus(sup.fokus_pendampingan || '');
    setShowAddSupervisionModal(true);
  };

  const handleDeleteSupervision = async (id) => {
    if (!window.confirm('Hapus sesi agenda supervisi ini?')) return;
    await supabase.from('supervisions').delete().eq('id', id);
    fetchSupervisionData(sessionUser);
  };

  // CRUD Rencana Aksi
  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedSupervision || !newAksi.trim()) return alert('Deskripsi rencana aksi wajib diisi!');
    
    if (editingFollowUpId) {
      await supabase.from('follow_ups').update({
        rencana_aksi: newAksi.trim(),
        penanggung_jawab: newPJ.trim(),
        daya_dukung: newDayaDukung.trim(),
        bukti_dukung_url: newBuktiUrl.trim()
      }).eq('id', editingFollowUpId);
      alert('Rencana aksi berhasil diperbarui!');
    } else {
      await supabase.from('follow_ups').insert([{
        supervision_id: selectedSupervision.id,
        rencana_aksi: newAksi.trim(),
        penanggung_jawab: newPJ.trim(),
        daya_dukung: newDayaDukung.trim(),
        bukti_dukung_url: newBuktiUrl.trim(),
        status_aksi: 'proses'
      }]);
      alert('Rencana aksi berhasil disimpan!');
    }

    setEditingFollowUpId(null);
    setNewAksi('');
    setNewPJ('');
    setNewDayaDukung('');
    setNewBuktiUrl('');
    loadSupervisionDetail(selectedSupervision);
    fetchSupervisionData(sessionUser);
  };

  const handleEditFollowUpClick = (fu) => {
    setEditingFollowUpId(fu.id);
    setNewAksi(fu.rencana_aksi || '');
    setNewPJ(fu.penanggung_jawab || '');
    setNewDayaDukung(fu.daya_dukung || '');
    setNewBuktiUrl(fu.bukti_dukung_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFollowUp = async (id) => {
    if (!window.confirm('Hapus komitmen rencana aksi ini?')) return;
    await supabase.from('follow_ups').delete().eq('id', id);
    if (selectedSupervision) loadSupervisionDetail(selectedSupervision);
    fetchSupervisionData(sessionUser);
  };

  const handleToggleFollowUpStatus = async (fu) => {
    const nextStatus = fu.status_aksi === 'selesai' ? 'proses' : 'selesai';
    await supabase.from('follow_ups').update({ status_aksi: nextStatus }).eq('id', fu.id);
    if (selectedSupervision) loadSupervisionDetail(selectedSupervision);
    fetchSupervisionData(sessionUser);
  };

  // CRUD GURU
  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    if (!teacherForm.nama.trim()) return alert('Nama guru wajib diisi!');
    const cleanNip = teacherForm.nip.trim();
    if (!cleanNip) return alert('NIP atau NUPTK guru wajib diisi sebagai identitas akun login!');
    
    try {
      if (editingTeacherId) {
        await supabase.from('teachers').update({
          nama_guru: teacherForm.nama.trim(),
          nip: cleanNip,
          email: teacherForm.email.trim(),
          mata_pelajaran: teacherForm.mapel.trim()
        }).eq('id', editingTeacherId);
        
        await supabase.from('user_credentials').upsert({
          identifier: cleanNip,
          role: 'guru'
        });

        alert('Data guru berhasil diperbarui!');
      } else {
        await supabase.from('teachers').insert([{
          npsn: currentSchool?.npsn || sessionUser.npsn,
          nama_guru: teacherForm.nama.trim(),
          nip: cleanNip,
          email: teacherForm.email.trim(),
          mata_pelajaran: teacherForm.mapel.trim()
        }]);

        await supabase.from('user_credentials').upsert({
          identifier: cleanNip,
          role: 'guru',
          password: 'pandai12345',
          updated_at: new Date().toISOString()
        });

        alert(`Guru baru ditambahkan! Akun login aktif:\nNIP/ID: ${cleanNip}\nKata Sandi: pandai12345`);
      }

      setEditingTeacherId(null);
      setTeacherForm({ nama: '', nip: '', email: '', mapel: '' });
      fetchTeachers(currentSchool?.npsn || sessionUser.npsn);
    } catch (err) {
      alert('Gagal menyimpan data guru: ' + err.message);
    }
  };

  const handleEditTeacherClick = (t) => {
    setEditingTeacherId(t.id);
    setTeacherForm({
      nama: t.nama_guru || '',
      nip: t.nip || '',
      email: t.email || '',
      mapel: t.mata_pelajaran || ''
    });
  };

  const handleDeleteTeacher = async (id, nip) => {
    if (!window.confirm('Hapus guru ini dari daftar?')) return;
    await supabase.from('teachers').delete().eq('id', id);
    if (nip) {
      await supabase.from('user_credentials').delete().eq('identifier', nip);
    }
    fetchTeachers(currentSchool?.npsn || sessionUser.npsn);
  };

  // Simpan Profil Sekolah oleh Kepsek
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
    
    alert('Profil satuan pendidikan diperbarui!');
    setIsEditingProfile(false);
    fetchSupervisionData(sessionUser);
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
      fetchSupervisionData(sessionUser);
    } catch (err) {
      alert(err.message);
    }
  };

  // SISTEM LOGIN PORTAL PENGGUNA (PENGAWAS, KEPSEK, GURU)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanId = identifier.trim();
    if (!cleanId) return setLoginError('Identitas (NPSN / NIP / NUPTK) tidak boleh kosong!');
    if (!password) return setLoginError('Kata sandi wajib diisi!');

    try {
      const { data: cred } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('identifier', cleanId)
        .maybeSingle();

      const expectedPass = cred ? cred.password : 'pandai12345';
      if (password !== expectedPass) {
        return setLoginError('Kata sandi yang Anda masukkan salah!');
      }

      let defaultName = cleanId;
      let defaultNip = cleanId;
      let defaultMapel = '';
      let userNpsn = '20511270';
      let namaSekolah = 'Wilayah Donorojo';

      if (loginRole === 'pengawas') {
        const { data: spvData } = await supabase
          .from('supervisors')
          .select('*')
          .eq('nip', cleanId)
          .maybeSingle();

        defaultName = spvData ? spvData.nama_pengawas : (systemSettings?.pengawas_nama || 'Wijiatin, S.Pd., M.Pd.');
        defaultNip = cleanId;
        namaSekolah = spvData ? `Sekolah Binaan Wilayah ${spvData.wilayah_tugas}` : 'Wilayah Kerja Pengawas';

        if (spvData) {
          setSystemSettings(prev => ({
            ...prev,
            pengawas_nama: spvData.nama_pengawas,
            pengawas_nip: spvData.nip,
            wilayah: `Sekolah Binaan Wilayah ${spvData.wilayah_tugas}`
          }));
        }
      } else if (loginRole === 'kepsek') {
        const { data: schoolRow } = await supabase
          .from('schools')
          .select('*')
          .eq('npsn', cleanId)
          .maybeSingle();

        if (schoolRow) {
          defaultName = schoolRow.nama_kepsek || `Kepala Sekolah (${cleanId})`;
          defaultNip = schoolRow.nip_kepsek || '-';
          namaSekolah = schoolRow.nama_sekolah;
          userNpsn = schoolRow.npsn;
        } else {
          return setLoginError('NPSN tidak ditemukan dalam database sekolah binaan!');
        }
      } else if (loginRole === 'guru') {
        const { data: teacherRow } = await supabase
          .from('teachers')
          .select('*')
          .eq('nip', cleanId)
          .maybeSingle();

        if (teacherRow) {
          defaultName = teacherRow.nama_guru || cleanId;
          defaultNip = teacherRow.nip;
          defaultMapel = teacherRow.mata_pelajaran || '';
          userNpsn = teacherRow.npsn || '20511270';

          const { data: schoolOfTeacher } = await supabase
            .from('schools')
            .select('nama_sekolah')
            .eq('npsn', userNpsn)
            .maybeSingle();

          namaSekolah = schoolOfTeacher ? schoolOfTeacher.nama_sekolah : `Sekolah (NPSN: ${userNpsn})`;
        } else {
          return setLoginError('NIP/NUPTK Guru belum didaftarkan oleh Kepala Sekolah di profil sekolah!');
        }
      }

      const userObj = {
        identifierKey: cleanId,
        nama: defaultName,
        nip: defaultNip,
        mapel: defaultMapel,
        role: loginRole,
        npsn: userNpsn,
        namaSekolah: namaSekolah
      };

      setSessionUser(userObj);
      setProfileNama(userObj.nama);
      setProfileNip(userObj.nip);
      setProfileMapel(userObj.mapel);
      setShowLoginModal(false);
      setActiveTab('dashboard');
      fetchSupervisionData(userObj);
      fetchBulletins(userObj);
    } catch (err) {
      setLoginError('Gagal memverifikasi login: ' + err.message);
    }
  };

  const openProfileTab = () => {
    setProfileNama(sessionUser?.nama || '');
    setProfileNip(sessionUser?.nip || currentSchool?.nip_kepsek || systemSettings?.pengawas_nip || '');
    setProfileMapel(sessionUser?.mapel || '');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setActiveTab('profil-pengguna');
  };

  const filteredBulletins = bulletins.filter(b => {
    const matchCategory = filterCategory === 'Semua' || b.kategori === filterCategory;
    const matchSearch = (b.judul || '').toLowerCase().includes(searchBulletin.toLowerCase()) ||
                        (b.author_name || '').toLowerCase().includes(searchBulletin.toLowerCase()) ||
                        (b.ringkasan || '').toLowerCase().includes(searchBulletin.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Filter sekolah dampingan di tab pengawas
  const filteredSchoolsBySupervisor = schools.filter(sch => {
    const q = searchSchoolQuery.toLowerCase();
    return (sch.nama_sekolah || '').toLowerCase().includes(q) ||
           (sch.nama_kepsek || '').toLowerCase().includes(q) ||
           (sch.npsn || '').toLowerCase().includes(q) ||
           (sch.alamat || '').toLowerCase().includes(q);
  });

  // JIKA MODE ADMIN AKTIF: RENDER ADMIN PORTAL
  if (isAdminMode) {
    return (
      <AdminPortal 
        onExitAdmin={() => setIsAdminMode(false)} 
        systemSettings={systemSettings} 
      />
    );
  }

  // JIKA MODE CETAK BERITA ACARA
  if (showPdfModal && selectedSupervision) {
    return (
      <PrintBeritaAcara
        supervision={selectedSupervision}
        followUps={followUps}
        onClose={() => setShowPdfModal(false)}
        systemSettings={systemSettings}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* HEADER UTAMA */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* 1. IKON SHIELD DI POJOK KIRI ATAS DENGAN PROTEKSI PIN */}
            <button 
              onClick={() => {
                setInputPin('');
                setPinError('');
                setShowPinModal(true);
              }}
              className="p-2 text-slate-300 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition mr-1"
              title="Akses Konsol Administrator"
            >
              <Shield className="w-5 h-5" />
            </button>

            {/* LOGO SI PANDAI */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab(sessionUser ? 'dashboard' : 'buletin')}>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">P</div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">SI PANDAI</span>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Supervisi & Majalah Sekolah</span>
              </div>
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
                  onClick={openProfileTab}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl transition border ${
                    activeTab === 'profil-pengguna' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title="Halaman Profil & Ganti Password"
                >
                  <UserCheck className={`w-4 h-4 ${activeTab === 'profil-pengguna' ? 'text-white' : 'text-blue-600'}`} />
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-bold block max-w-[130px] truncate leading-tight">{sessionUser.nama}</span>
                    <span className={`text-[10px] uppercase font-semibold block ${activeTab === 'profil-pengguna' ? 'text-blue-100' : 'text-blue-600'}`}>
                      Profil & Sandi
                    </span>
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
                onClick={() => { 
                  setIdentifier(''); 
                  setPassword(''); 
                  setLoginError(''); 
                  setShowLoginModal(true); 
                }} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                Masuk Sistem
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SUB-NAVBAR ROLE */}
      {sessionUser && (
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800">
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
                <button onClick={() => setActiveTab('sekolah-binaan')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'sekolah-binaan' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>Sekolah Dampingan</button>
                <button onClick={() => setActiveTab('pengaturan')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'pengaturan' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>Pengaturan Kop</button>
              </>
            )}

            {sessionUser.role === 'kepsek' && (
              <>
                <button onClick={() => setActiveTab('profil-sekolah')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'profil-sekolah' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>Profil Satuan Pendidikan</button>
                <button onClick={() => setActiveTab('catatan-supervisi')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'catatan-supervisi' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>Catatan Supervisi</button>
                <button onClick={() => setActiveTab('rencana-aksi')} className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'rencana-aksi' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}>Rencana Aksi</button>
              </>
            )}

            <button 
              onClick={() => { setActiveTab('kelola-buletin'); handleCancelEditArticle(); }} 
              className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'kelola-buletin' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}
            >
              Manajemen Artikel (CRUD)
            </button>

            <button 
              onClick={openProfileTab} 
              className={`py-3 whitespace-nowrap border-b-2 transition ${activeTab === 'profil-pengguna' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'}`}
            >
              Profil & Kata Sandi
            </button>
          </div>
        </div>
      )}

      {/* KONTEN UTAMA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && sessionUser && (
          <DashboardView
            sessionUser={sessionUser}
            currentSchool={currentSchool}
            supervisions={supervisions}
            schools={schools}
            myArticles={myArticles}
            notifications={notifications}
            onNavigate={(tab) => setActiveTab(tab)}
            onExportExcel={handleExportExcel}
          />
        )}

        {/* 2. HALAMAN PROFIL PENGGUNA & GANTI PASSWORD */}
        {activeTab === 'profil-pengguna' && sessionUser && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full uppercase">
                  Peran: {sessionUser.role}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">Pengaturan Profil & Kata Sandi</h2>
                <p className="text-xs text-slate-500">Perbarui identitas profil dan kata sandi akun Anda.</p>
              </div>
            </div>

            <form onSubmit={handleSaveUserProfile} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Identitas Pengguna</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 flex items-center space-x-1">
                      <span>{sessionUser.role === 'kepsek' ? 'NPSN Sekolah (ID Login)' : sessionUser.role === 'guru' ? 'NIP / NUPTK (ID Login)' : 'NIP Pengawas'}</span>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </label>
                    <input 
                      value={sessionUser.identifierKey || sessionUser.npsn || sessionUser.nip} 
                      disabled
                      readOnly
                      className="w-full p-2.5 border rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed font-mono font-bold" 
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Identitas login akun terkunci oleh sistem.</span>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">Nama Lengkap & Gelar</label>
                    <input 
                      value={profileNama} 
                      onChange={e => setProfileNama(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg focus:border-blue-500 outline-none" 
                    />
                  </div>
                </div>

                {sessionUser.role === 'guru' && (
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">Mata Pelajaran / Bidang Tugas</label>
                    <input 
                      value={profileMapel} 
                      onChange={e => setProfileMapel(e.target.value)} 
                      placeholder="Contoh: Tematik / Matematika / PJOK"
                      className="w-full p-2.5 border rounded-lg focus:border-blue-500 outline-none" 
                    />
                  </div>
                )}
              </div>

              {/* GANTI KATA SANDI */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Ganti Kata Sandi Login</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">Kata Sandi Saat Ini</label>
                    <input 
                      type="password" 
                      placeholder="Masukkan sandi lama"
                      value={oldPassword} 
                      onChange={e => setOldPassword(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg focus:border-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">Kata Sandi Baru</label>
                    <input 
                      type="password" 
                      placeholder="Kosongkan jika tetap"
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg focus:border-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">Konfirmasi Sandi Baru</label>
                    <input 
                      type="password" 
                      placeholder="Ulangi sandi baru"
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg focus:border-blue-500 outline-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition">
                  Simpan Profil & Kata Sandi
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. BULETIN PUBLIK */}
        {activeTab === 'buletin' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-lg">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
                Portal Literasi & Inspirasi
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold mt-3">Kabar Inovasi & Praktik Baik Sekolah Binaan</h1>
              <p className="mt-2 text-blue-100 text-sm sm:text-base max-w-2xl">
                Publikasi karya pembelajaran guru, inovasi tata kelola kepala sekolah, serta refleksi supervisi pengawas.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {['Semua', 'Praktik Baik', 'Inovasi Pembelajaran', 'Kabar Sekolah', 'Manajerial'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      filterCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari judul atau nama penulis..."
                  value={searchBulletin}
                  onChange={e => setSearchBulletin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBulletins.map(b => (
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

        {/* 4. MANAJEMEN BULETIN */}
        {activeTab === 'kelola-buletin' && sessionUser && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingArticleId ? 'Edit Artikel Buletin' : 'Tulis Artikel Baru'}
                  </h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {editingArticleId ? 'Perbarui konten artikel yang sedang dipilih.' : 'Artikel otomatis tayang di beranda publik setelah diterbitkan.'}
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
                      placeholder="Masukkan judul artikel..." 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg" 
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Ringkasan Singkat (1-2 Kalimat)</label>
                  <textarea 
                    placeholder="Ringkasan singkat isi artikel..." 
                    rows={2} 
                    value={newSummary} 
                    onChange={e => setNewSummary(e.target.value)} 
                    className="w-full p-2.5 border rounded-lg" 
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Foto Sampul Artikel</label>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) { 
                          setCoverFile(f); 
                          setCoverPreview(URL.createObjectURL(f)); 
                        }
                      }} 
                      className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-blue-50 file:text-blue-700" 
                    />
                    {coverPreview && (
                      <div className="relative">
                        <img src={coverPreview} alt="Pratinjau" className="w-20 h-14 rounded-lg object-cover border" />
                        <span className="text-[9px] bg-slate-900/70 text-white px-1 rounded absolute bottom-0.5 right-0.5">Aktif</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Isi Lengkap Artikel</label>
                  <textarea 
                    placeholder="Tuliskan isi lengkap artikel di sini..." 
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
                    {isSubmittingArticle ? 'Menyimpan...' : (editingArticleId ? 'Simpan Perubahan' : 'Terbitkan Artikel')}
                  </button>
                </div>
              </form>
            </div>

            <div id="tabel-manajemen-artikel" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {sessionUser.role === 'pengawas' ? 'Semua Artikel Sistem (Moderasi & CRUD)' : 'Daftar Artikel Saya (CRUD)'} ({myArticles.length})
                </h3>
              </div>

              {myArticles.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Belum ada artikel yang tersimpan.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 uppercase text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="p-3">Foto</th>
                        <th className="p-3">Judul Artikel</th>
                        <th className="p-3">Penulis</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Aksi CRUD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myArticles.map(art => (
                        <tr key={art.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <img src={art.cover_url} alt="" className="w-12 h-9 rounded object-cover border" />
                          </td>
                          <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">{art.judul}</td>
                          <td className="p-3 text-slate-600">{art.author_name}</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold">{art.kategori}</span></td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${art.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {art.is_published ? 'Tayang' : 'Draft / Ditarik'}
                            </span>
                          </td>
                          <td className="p-3 text-center space-x-1">
                            <button onClick={() => setSelectedArticle(art)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Baca"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => handleEditArticle(art)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Edit"><Edit3 className="w-4 h-4" /></button>
                            {sessionUser.role === 'pengawas' && (
                              <button 
                                onClick={() => handleTogglePublish(art.id, art.is_published)} 
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                              >
                                {art.is_published ? 'Unpublish' : 'Publish'}
                              </button>
                            )}
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

        {/* 5. PENGATURAN KOP (PENGAWAS) */}
        {activeTab === 'pengaturan' && sessionUser?.role === 'pengawas' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="text-xl font-bold">Pengaturan Kop Berita Acara</h2>
              <p className="text-xs text-slate-500 mt-1">Konfigurasi teks kop resmi untuk pencetakan PDF Berita Acara Supervisi.</p>
            </div>
            
            <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl border shadow-sm space-y-6 text-xs">
              <div className="space-y-4">
                <h3 className="font-bold border-b pb-2 uppercase text-slate-600">Kop Dokumen Resmi</h3>
                <div><label className="font-semibold block mb-1">Nama Instansi Induk</label><input value={systemSettings.instansi} onChange={e => setSystemSettings({...systemSettings, instansi: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
                <div><label className="font-semibold block mb-1">Judul Sistem / Dokumen</label><input value={systemSettings.judul} onChange={e => setSystemSettings({...systemSettings, judul: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
                <div><label className="font-semibold block mb-1">Wilayah Kerja</label><input value={systemSettings.wilayah} onChange={e => setSystemSettings({...systemSettings, wilayah: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={isSavingSettings} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl transition">
                  {isSavingSettings ? 'Menyimpan...' : 'Simpan Kop Surat'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 6. KELOLA SEKOLAH DAMPINGAN (CRUD LENGKAP OLEH PENGAWAS) */}
        {activeTab === 'sekolah-binaan' && sessionUser?.role === 'pengawas' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full uppercase">
                  Pengawas Pembina: {sessionUser.nama}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">Kelola Sekolah Dampingan & Kepala Sekolah</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tambah, sunting, dan hapus satuan pendidikan sasaran dampingan. Akun login Kepala Sekolah terbuat otomatis.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Dampingan</span>
                <span className="text-2xl font-black text-blue-600">{schools.length} Sekolah</span>
              </div>
            </div>

            {/* FORMULIR CRUD SEKOLAH DAMPINGAN */}
            <form onSubmit={handleSaveSchoolBySupervisor} className="bg-white p-6 sm:p-8 rounded-2xl border shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>{editingSchoolId ? 'Sunting Data Sekolah Dampingan' : '+ Daftarkan Sekolah Dampingan Baru'}</span>
                </h3>
                {editingSchoolId && (
                  <button 
                    type="button" 
                    onClick={handleCancelSchoolForm} 
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. NPSN */}
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 flex items-center space-x-1">
                    <span>NPSN Sekolah (ID Login)</span>
                    {editingSchoolId && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </label>
                  <input 
                    type="text"
                    maxLength={8}
                    placeholder="8 digit NPSN (cth: 20511270)"
                    value={schoolForm.npsn}
                    disabled={!!editingSchoolId}
                    onChange={e => setSchoolForm({...schoolForm, npsn: e.target.value})}
                    className={`w-full p-2.5 border rounded-xl font-mono ${editingSchoolId ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-bold' : 'focus:border-blue-500 outline-none'}`}
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">NPSN sekaligus menjadi ID login Kepala Sekolah.</span>
                </div>

                {/* 2. Nama Sekolah */}
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-slate-700">Nama Satuan Pendidikan</label>
                  <input 
                    type="text"
                    placeholder="Contoh: SD Negeri 1 Belah"
                    value={schoolForm.nama_sekolah}
                    onChange={e => setSchoolForm({...schoolForm, nama_sekolah: e.target.value})}
                    className="w-full p-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>

                {/* 3. Akreditasi */}
                <div>
                  <label className="font-semibold block mb-1 text-slate-700">Status Akreditasi</label>
                  <select 
                    value={schoolForm.akreditasi} 
                    onChange={e => setSchoolForm({...schoolForm, akreditasi: e.target.value})}
                    className="w-full p-2.5 border rounded-xl bg-white focus:border-blue-500 outline-none"
                  >
                    <option value="A">Akreditasi A (Unggul)</option>
                    <option value="B">Akreditasi B (Baik)</option>
                    <option value="C">Akreditasi C (Cukup)</option>
                    <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                  </select>
                </div>

                {/* 4. Nama Kepala Sekolah */}
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-slate-700">Nama Lengkap Kepala Sekolah & Gelar</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Dati Maryatun, S.Pd., M.M"
                    value={schoolForm.nama_kepsek}
                    onChange={e => setSchoolForm({...schoolForm, nama_kepsek: e.target.value})}
                    className="w-full p-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>

                {/* 5. NIP Kepala Sekolah */}
                <div>
                  <label className="font-semibold block mb-1 text-slate-700">NIP Kepala Sekolah (Opsional)</label>
                  <input 
                    type="text"
                    placeholder="Contoh: 196805141992032005"
                    value={schoolForm.nip_kepsek}
                    onChange={e => setSchoolForm({...schoolForm, nip_kepsek: e.target.value})}
                    className="w-full p-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>

                {/* 6. Alamat Sekolah */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="font-semibold block mb-1 text-slate-700">Alamat Lengkap Satuan Pendidikan</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Jl. Donorojo-Kalak Dsn. Nglebeng Ds. Belah Kec. Donorojo"
                    value={schoolForm.alamat}
                    onChange={e => setSchoolForm({...schoolForm, alamat: e.target.value})}
                    className="w-full p-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  {editingSchoolId ? 'Simpan Perubahan Sekolah' : '+ Daftarkan Sekolah Dampingan'}
                </button>
              </div>
            </form>

            {/* TABEL DAFTAR SEKOLAH DAMPINGAN */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border shadow-sm space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900">
                  Daftar Satuan Pendidikan Dampingan ({filteredSchoolsBySupervisor.length})
                </h3>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Cari sekolah, kepsek, NPSN..." 
                    value={searchSchoolQuery}
                    onChange={e => setSearchSchoolQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {filteredSchoolsBySupervisor.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  Tidak ditemukan data sekolah yang sesuai kriteria pencarian.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 uppercase text-slate-600 font-semibold border-b text-[11px]">
                      <tr>
                        <th className="p-3 text-center" style={{ width: '5%' }}>No</th>
                        <th className="p-3" style={{ width: '15%' }}>NPSN</th>
                        <th className="p-3" style={{ width: '25%' }}>Nama Sekolah</th>
                        <th className="p-3" style={{ width: '12%' }}>Akreditasi</th>
                        <th className="p-3" style={{ width: '23%' }}>Nama Kepala Sekolah</th>
                        <th className="p-3" style={{ width: '20%' }}>Alamat</th>
                        <th className="p-3 text-center">Aksi CRUD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredSchoolsBySupervisor.map((sch, idx) => (
                        <tr key={sch.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-blue-600">{sch.npsn}</td>
                          <td className="p-3 font-bold text-slate-900">{sch.nama_sekolah}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Akreditasi {sch.akreditasi || 'B'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-900 block">{sch.nama_kepsek || '-'}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">NIP: {sch.nip_kepsek || '-'}</span>
                          </td>
                          <td className="p-3 text-slate-500 max-w-xs truncate" title={sch.alamat}>{sch.alamat || '-'}</td>
                          <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                            <button 
                              onClick={() => handleEditSchoolClick(sch)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Sunting Sekolah"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSchoolBySupervisor(sch)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Sekolah"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
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

        {/* 7. PROFIL SEKOLAH (KEPSEK) */}
        {activeTab === 'profil-sekolah' && sessionUser?.role === 'kepsek' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase flex items-center space-x-1">
                  <span>NPSN: {currentSchool?.npsn || sessionUser?.npsn}</span>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </span>
                <h2 className="text-xl font-bold mt-1">{profileForm.nama_sekolah || currentSchool?.nama_sekolah}</h2>
              </div>
              <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl">
                {isEditingProfile ? 'Batal' : 'Edit Profil Sekolah'}
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1 flex items-center space-x-1">
                    <span>NPSN Sekolah (Terkunci)</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </label>
                  <input 
                    disabled 
                    readOnly 
                    value={currentSchool?.npsn || sessionUser?.npsn} 
                    className="w-full p-2.5 border rounded-lg bg-slate-100 text-slate-500 font-mono font-bold cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Akreditasi</label>
                  <input disabled={!isEditingProfile} value={profileForm.akreditasi} onChange={e => setProfileForm({...profileForm, akreditasi: e.target.value})} className="w-full p-2.5 border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Nama Satuan Pendidikan</label>
                <input disabled={!isEditingProfile} value={profileForm.nama_sekolah} onChange={e => setProfileForm({...profileForm, nama_sekolah: e.target.value})} className="w-full p-2.5 border rounded-lg" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Alamat Sekolah</label>
                <textarea disabled={!isEditingProfile} rows={2} value={profileForm.alamat} onChange={e => setProfileForm({...profileForm, alamat: e.target.value})} className="w-full p-2.5 border rounded-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="font-semibold block mb-1">Nama Kepala Sekolah</label><input disabled={!isEditingProfile} value={profileForm.nama_kepsek} onChange={e => setProfileForm({...profileForm, nama_kepsek: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
                <div><label className="font-semibold block mb-1">NIP Kepala Sekolah</label><input disabled={!isEditingProfile} value={profileForm.nip_kepsek} onChange={e => setProfileForm({...profileForm, nip_kepsek: e.target.value})} className="w-full p-2.5 border rounded-lg" /></div>
              </div>
              {isEditingProfile && <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-xl">Simpan Profil Sekolah</button>}
            </form>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{editingTeacherId ? 'Edit Data Guru' : `Kelola Data Guru (${teachers.length})`}</h3>
                  <p className="text-[11px] text-slate-500">NIP/NUPTK yang didaftarkan otomatis menjadi akun login guru (Password: pandai12345).</p>
                </div>
                {editingTeacherId && (
                  <button onClick={() => { setEditingTeacherId(null); setTeacherForm({ nama: '', nip: '', email: '', mapel: '' }); }} className="text-xs text-slate-500 hover:underline">
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveTeacher} className="flex flex-wrap gap-2">
                <input placeholder="Nama Lengkap Guru" value={teacherForm.nama} onChange={e => setTeacherForm({...teacherForm, nama: e.target.value})} className="p-2 border rounded-lg text-xs flex-1 min-w-[120px]" />
                <input placeholder="NIP / NUPTK (ID Login)" value={teacherForm.nip} onChange={e => setTeacherForm({...teacherForm, nip: e.target.value})} className="p-2 border rounded-lg text-xs w-40" />
                <input placeholder="Mata Pelajaran" value={teacherForm.mapel} onChange={e => setTeacherForm({...teacherForm, mapel: e.target.value})} className="p-2 border rounded-lg text-xs flex-1 min-w-[120px]" />
                <button type="submit" className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold">
                  {editingTeacherId ? 'Simpan Perubahan' : '+ Tambah Guru'}
                </button>
              </form>

              <div className="divide-y text-xs mt-4 border-t">
                {teachers.map(t => (
                  <div key={t.id} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold block">{t.nama_guru}</span>
                      <span className="text-slate-500">ID Login (NIP/NUPTK): <strong>{t.nip || '-'}</strong> • Mapel: {t.mata_pelajaran || '-'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => handleEditTeacherClick(t)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Edit Guru"><Edit3 className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteTeacher(t.id, t.nip)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg" title="Hapus Guru"><Trash className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 8. CATATAN SUPERVISI (KEPSEK) */}
        {activeTab === 'catatan-supervisi' && sessionUser?.role === 'kepsek' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold">Catatan Supervisi Sekolah Anda</h2>
              <div className="flex items-center space-x-2">
                <button onClick={handleExportExcel} className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm">
                  <Download className="w-4 h-4" /><span>Export Excel</span>
                </button>
                {selectedSupervision && (
                  <button onClick={() => setShowPdfModal(true)} className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm">
                    <Printer className="w-4 h-4" /><span>Cetak Berita Acara (PDF)</span>
                  </button>
                )}
              </div>
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

        {/* 9. RENCANA AKSI (KEPSEK) */}
        {activeTab === 'rencana-aksi' && sessionUser?.role === 'kepsek' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
              <h2 className="text-xl font-bold">Matriks Rencana Aksi Tindak Lanjut</h2>
              <button onClick={handleExportExcel} className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm">
                <Download className="w-4 h-4" /><span>Export Excel</span>
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-2">
                {supervisions.map(s => (
                  <div key={s.id} onClick={() => loadSupervisionDetail(s)} className={`p-4 rounded-xl border cursor-pointer ${selectedSupervision?.id === s.id ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}>
                    <h4 className="text-xs font-bold line-clamp-1">{s.fokus_pendampingan}</h4>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-8 space-y-4">
                <form onSubmit={handleSaveFollowUp} className="bg-white p-6 rounded-2xl border shadow-sm space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold uppercase">{editingFollowUpId ? 'Edit Rencana Aksi' : '+ Tambah Rencana Aksi'}</h4>
                    {editingFollowUpId && (
                      <button type="button" onClick={() => { setEditingFollowUpId(null); setNewAksi(''); setNewPJ(''); setNewDayaDukung(''); setNewBuktiUrl(''); }} className="text-slate-500 hover:underline">
                        Batal Edit
                      </button>
                    )}
                  </div>
                  <input placeholder="Deskripsi Rencana Aksi" value={newAksi} onChange={e => setNewAksi(e.target.value)} className="w-full p-2.5 border rounded-lg" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Penanggung Jawab" value={newPJ} onChange={e => setNewPJ(e.target.value)} className="p-2.5 border rounded-lg" />
                    <input placeholder="Daya Dukung" value={newDayaDukung} onChange={e => setNewDayaDukung(e.target.value)} className="p-2.5 border rounded-lg" />
                  </div>
                  <input placeholder="Tautan Dokumen Bukti Dukung (Google Drive)" value={newBuktiUrl} onChange={e => setNewBuktiUrl(e.target.value)} className="w-full p-2.5 border rounded-lg" />
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">
                    {editingFollowUpId ? 'Simpan Perubahan Aksi' : 'Simpan Aksi'}
                  </button>
                </form>
                
                <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
                  <h4 className="font-bold text-xs uppercase border-b pb-2">Daftar Komitmen Tindak Lanjut</h4>
                  {followUps.map((fu, idx) => (
                    <div key={fu.id} className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1 relative">
                      <div className="flex justify-between font-bold pr-16">
                        <span>Aksi #{idx + 1}: {fu.rencana_aksi}</span>
                        <button 
                          onClick={() => handleToggleFollowUpStatus(fu)}
                          className={`uppercase text-[10px] px-2 py-0.5 rounded font-bold ${fu.status_aksi === 'selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                          {fu.status_aksi} (Klik Ubah)
                        </button>
                      </div>
                      <div className="text-slate-600">PJ: <strong>{fu.penanggung_jawab}</strong> | Dukungan: {fu.daya_dukung || '-'}</div>
                      {fu.bukti_dukung_url && <a href={fu.bukti_dukung_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block pt-1 font-semibold">Buka Bukti</a>}
                      <div className="absolute top-3 right-3 flex items-center space-x-1">
                        <button onClick={() => handleEditFollowUpClick(fu)} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg" title="Edit Aksi"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteFollowUp(fu.id)} className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg" title="Hapus Aksi"><Trash className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. AGENDA SUPERVISI (PENGAWAS) */}
        {activeTab === 'supervisi' && sessionUser?.role === 'pengawas' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold">Agenda & Hasil Supervisi Seluruh Sekolah</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleExportExcel} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5">
                  <Download className="w-4 h-4" /><span>Export Excel</span>
                </button>
                {selectedSupervision && (
                  <button onClick={() => setShowPdfModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5">
                    <Printer className="w-4 h-4" /><span>Cetak Berita Acara (PDF)</span>
                  </button>
                )}
                <button 
                  onClick={() => {
                    setEditingSupervisionId(null);
                    setFormFokus('');
                    setFormTanggal('');
                    setShowAddSupervisionModal(true);
                  }} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5"
                >
                  <PlusCircle className="w-4 h-4" /><span>Jadwalkan Baru</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-2">
                {supervisions.map(s => (
                  <div key={s.id} onClick={() => loadSupervisionDetail(s)} className={`p-4 rounded-xl border relative cursor-pointer ${selectedSupervision?.id === s.id ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}>
                    <span className="text-[10px] text-slate-500">{new Date(s.tanggal_supervisi).toLocaleDateString('id-ID')}</span>
                    <h4 className="text-xs font-bold pr-14">{s.schools?.nama_sekolah}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{s.fokus_pendampingan}</p>
                    <div className="absolute top-3.5 right-3 flex items-center space-x-1">
                      <button onClick={(e) => { e.stopPropagation(); openEditSupervisionModal(s); }} className="p-1 text-slate-400 hover:text-amber-600" title="Edit Jadwal/Fokus"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSupervision(s.id); }} className="p-1 text-slate-400 hover:text-rose-600" title="Hapus Agenda"><Trash className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-8">
                {selectedSupervision ? (
                  <form onSubmit={handleUpdateObservation} className="bg-white p-6 rounded-2xl border shadow-sm space-y-3 text-xs">
                    <h3 className="font-bold text-sm border-b pb-2">{selectedSupervision.schools?.nama_sekolah} — {selectedSupervision.fokus_pendampingan}</h3>
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
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Aksi #{idx + 1}: {fu.rencana_aksi}</span>
                            <button 
                              type="button"
                              onClick={() => handleToggleFollowUpStatus(fu)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${fu.status_aksi === 'selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                            >
                              {fu.status_aksi}
                            </button>
                          </div>
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
      </main>

      {/* MODAL INPUT PIN AKSES ADMIN (PIN: 0852) */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Verifikasi Akses Admin</h3>
              <p className="text-xs text-slate-500 mt-1">Masukkan 4 digit PIN otorisasi untuk membuka konsol</p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input 
                type="password"
                maxLength={4}
                value={inputPin}
                onChange={e => setInputPin(e.target.value)}
                placeholder="••••"
                autoFocus
                className="w-full text-center tracking-[1em] text-lg font-mono p-3 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none"
              />

              {pinError && <p className="text-[11px] text-rose-600 font-semibold">{pinError}</p>}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button 
                  type="button" 
                  onClick={() => setShowPinModal(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Buka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BACA ARTIKEL */}
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

      {/* MODAL JADWAL SUPERVISI */}
      {showAddSupervisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-3 text-xs">
            <h3 className="font-bold text-sm">
              {editingSupervisionId ? 'Edit Jadwal & Fokus Supervisi' : 'Jadwalkan Supervisi Baru'}
            </h3>
            <form onSubmit={handleSaveSupervision} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Sekolah Sasaran</label>
                <select value={formSchoolId} onChange={e => setFormSchoolId(e.target.value)} className="w-full p-2.5 border rounded-lg">
                  {schools.map(s => <option key={s.id} value={s.id}>{s.nama_sekolah}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Tanggal Visitasi</label>
                  <input type="date" value={formTanggal} onChange={e => setFormTanggal(e.target.value)} className="w-full p-2.5 border rounded-lg" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Jenis Supervisi</label>
                  <select value={formJenis} onChange={e => setFormJenis(e.target.value)} className="w-full p-2.5 border rounded-lg">
                    <option value="akademik">Akademik</option>
                    <option value="manajerial">Manajerial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Fokus Pendampingan</label>
                <textarea rows={3} placeholder="Fokus Pendampingan" value={formFokus} onChange={e => setFormFokus(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => { setShowAddSupervisionModal(false); setEditingSupervisionId(null); }} className="px-3.5 py-1.5 bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOGIN PENGGUNA UMUM */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Masuk ke SI PANDAI</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4"/></button>
            </div>
            
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              <button 
                type="button" 
                onClick={() => { setLoginRole('kepsek'); setIdentifier(''); setPassword(''); setLoginError(''); }} 
                className={`py-1.5 rounded-lg transition ${loginRole === 'kepsek' ? 'bg-white font-bold text-blue-600 shadow-sm' : ''}`}
              >
                Kepsek
              </button>
              <button 
                type="button" 
                onClick={() => { setLoginRole('pengawas'); setIdentifier(''); setPassword(''); setLoginError(''); }} 
                className={`py-1.5 rounded-lg transition ${loginRole === 'pengawas' ? 'bg-white font-bold text-blue-600 shadow-sm' : ''}`}
              >
                Pengawas
              </button>
              <button 
                type="button" 
                onClick={() => { setLoginRole('guru'); setIdentifier(''); setPassword(''); setLoginError(''); }} 
                className={`py-1.5 rounded-lg transition ${loginRole === 'guru' ? 'bg-white font-bold text-blue-600 shadow-sm' : ''}`}
              >
                Guru
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1 text-slate-600">
                  {loginRole === 'kepsek' ? 'NPSN Sekolah' : loginRole === 'pengawas' ? 'NIP Pengawas' : 'NIP / NUPTK Guru'}
                </label>
                <input 
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)} 
                  placeholder={loginRole === 'kepsek' ? 'Masukkan 8 digit NPSN' : loginRole === 'pengawas' ? 'Masukkan NIP Pengawas' : 'Masukkan NIP / NUPTK Anda'} 
                  className="w-full p-2.5 border rounded-lg focus:border-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-600">Kata Sandi</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Masukkan kata sandi" 
                  className="w-full p-2.5 border rounded-lg focus:border-blue-500 outline-none" 
                />
              </div>

              {loginError && <p className="text-rose-600 font-semibold leading-relaxed">{loginError}</p>}
              
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition">
                Masuk
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
