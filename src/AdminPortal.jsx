import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  ShieldCheck, LogOut, Users, Calendar, 
  CheckCircle2, AlertCircle, Download, Printer, 
  Edit3, Trash2, ArrowLeft, Settings, FileText, Filter, Check, Eye, X, Building2, Search, GraduationCap
} from 'lucide-react';

export default function AdminPortal({ onExitAdmin }) {
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('sipandai_admin_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tab Menu Admin: 'dashboard', 'pengawas', 'siklus', 'setting-kop', 'buletin'
  const [adminTab, setAdminTab] = useState('dashboard');

  // Mode Cetak: null | 'rekap-wilayah' | 'siklus-detail'
  const [printMode, setPrintMode] = useState(null);
  const [selectedSupervisionForDetail, setSelectedSupervisionForDetail] = useState(null);

  // Modal Detail Sekolah Binaan Pengawas
  const [selectedSupervisorForSchools, setSelectedSupervisorForSchools] = useState(null);
  const [searchSchoolQuery, setSearchSchoolQuery] = useState('');

  // Filter Tanggal Jadwal
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Data State
  const [supervisors, setSupervisors] = useState([]);
  const [schools, setSchools] = useState([]);
  const [supervisions, setSupervisions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [bulletins, setBulletins] = useState([]);

  // KOP & Tanda Tangan Koordinator Pengawas (Tersimpan di Database)
  const [adminKopSettings, setAdminKopSettings] = useState({
    instansi: 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan',
    judul: 'LAPORAN REKAPITULASI PENGAWASAN DAN PENDAMPINGAN SATUAN PENDIDIKAN',
    wilayah: 'Wilayah Kerja Pengawasan Kabupaten Pacitan',
    nama_admin: 'Drs. H. Mulyono, M.Pd.',
    nip_admin: '197005121998021001',
    jabatan: 'Koordinator Pengawas Sekolah',
    kota_cetak: 'Pacitan',
    tanggal_cetak: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  });
  const [isSavingKop, setIsSavingKop] = useState(false);

  // Form CRUD Pengawas
  const [editingSupervisorId, setEditingSupervisorId] = useState(null);
  const [supForm, setSupForm] = useState({
    nip: '',
    nama_pengawas: '',
    wilayah_tugas: 'Kecamatan Donorojo',
    kontak: '',
    instansi: 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan'
  });

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('sipandai_admin_session', JSON.stringify(adminUser));
      fetchAdminData();
      fetchAdminKopSettings();
    } else {
      localStorage.removeItem('sipandai_admin_session');
    }
  }, [adminUser]);

  const fetchAdminKopSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').eq('id', 'admin_kop_config').maybeSingle();
      if (data) {
        setAdminKopSettings({
          instansi: data.instansi || 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan',
          judul: data.judul || 'LAPORAN REKAPITULASI PENGAWASAN DAN PENDAMPINGAN SATUAN PENDIDIKAN',
          wilayah: data.wilayah || 'Wilayah Kerja Pengawasan Kabupaten Pacitan',
          nama_admin: data.pengawas_nama || 'Drs. H. Mulyono, M.Pd.',
          nip_admin: data.pengawas_nip || '197005121998021001',
          jabatan: data.jabatan || 'Koordinator Pengawas Sekolah',
          kota_cetak: data.kota_cetak || 'Pacitan',
          tanggal_cetak: data.tanggal_cetak || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        });
      }
    } catch (e) {
      console.error('Gagal mengambil pengaturan KOP Admin:', e);
    }
  };

  const fetchAdminData = async () => {
    try {
      const { data: supData } = await supabase.from('supervisors').select('*').order('nama_pengawas', { ascending: true });
      if (supData) setSupervisors(supData);

      const { data: schData } = await supabase.from('schools').select('*').order('nama_sekolah', { ascending: true });
      if (schData) setSchools(schData);

      const { data: spvData } = await supabase.from('supervisions').select('*, schools(*)').order('tanggal_supervisi', { ascending: false });
      if (spvData) setSupervisions(spvData);

      const { data: fuData } = await supabase.from('follow_ups').select('*').order('created_at', { ascending: true });
      if (fuData) setFollowUps(fuData);

      const { data: bulData } = await supabase.from('bulletins').select('*').order('created_at', { ascending: false });
      if (bulData) setBulletins(bulData);
    } catch (err) {
      console.error('Fetch Admin Data Error:', err);
    }
  };

  // Simpan KOP Koordinator Pengawas ke Supabase
  const handleSaveKopSettings = async (e) => {
    e.preventDefault();
    setIsSavingKop(true);
    try {
      const { error } = await supabase.from('settings').upsert({
        id: 'admin_kop_config',
        instansi: adminKopSettings.instansi,
        judul: adminKopSettings.judul,
        wilayah: adminKopSettings.wilayah,
        pengawas_nama: adminKopSettings.nama_admin,
        pengawas_nip: adminKopSettings.nip_admin,
        jabatan: adminKopSettings.jabatan,
        kota_cetak: adminKopSettings.kota_cetak,
        tanggal_cetak: adminKopSettings.tanggal_cetak
      });
      if (error) throw error;
      alert('Pengaturan KOP Laporan & Format Tanda Tangan Koordinator Pengawas berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan KOP Admin: ' + err.message);
    } finally {
      setIsSavingKop(false);
    }
  };

  // Login Admin
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = username.trim();
    if (!cleanUser || !password) return setLoginError('ID Admin dan Kata Sandi wajib diisi!');

    try {
      const { data: cred } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('identifier', cleanUser)
        .eq('role', 'admin')
        .maybeSingle();

      const expectedPass = cred ? cred.password : 'pandai12345';
      if (!cred || password !== expectedPass) {
        return setLoginError('Kredensial Administrator tidak valid!');
      }

      const adminObj = { username: cleanUser, role: 'admin', nama: 'Administrator Utama (Ngadimin)' };
      setAdminUser(adminObj);
    } catch (err) {
      setLoginError('Gagal memproses login: ' + err.message);
    }
  };

  // Logout Admin
  const handleAdminLogout = () => {
    localStorage.removeItem('sipandai_admin_session');
    setAdminUser(null);
    setUsername('');
    setPassword('');
    onExitAdmin();
  };

  // CRUD Pengawas
  const handleSaveSupervisor = async (e) => {
    e.preventDefault();
    if (!supForm.nip.trim() || !supForm.nama_pengawas.trim()) {
      return alert('NIP dan Nama Pengawas wajib diisi!');
    }

    try {
      const cleanNip = supForm.nip.trim();
      if (editingSupervisorId) {
        await supabase.from('supervisors').update({
          nama_pengawas: supForm.nama_pengawas.trim(),
          wilayah_tugas: supForm.wilayah_tugas.trim(),
          kontak: supForm.kontak.trim(),
          instansi: supForm.instansi.trim()
        }).eq('id', editingSupervisorId);
        alert('Data pengawas berhasil diperbarui!');
      } else {
        await supabase.from('supervisors').insert([{
          nip: cleanNip,
          nama_pengawas: supForm.nama_pengawas.trim(),
          wilayah_tugas: supForm.wilayah_tugas.trim(),
          kontak: supForm.kontak.trim(),
          instansi: supForm.instansi.trim()
        }]);

        await supabase.from('user_credentials').upsert({
          identifier: cleanNip,
          role: 'pengawas',
          password: 'pandai12345',
          updated_at: new Date().toISOString()
        });

        alert(`Pengawas baru berhasil didaftarkan!\nAkun Login (NIP): ${cleanNip}\nPassword bawaan: pandai12345`);
      }

      setEditingSupervisorId(null);
      setSupForm({ nip: '', nama_pengawas: '', wilayah_tugas: 'Kecamatan Donorojo', kontak: '', instansi: 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan' });
      fetchAdminData();
    } catch (err) {
      alert('Gagal menyimpan pengawas: ' + err.message);
    }
  };

  const handleEditSupervisor = (sup) => {
    setEditingSupervisorId(sup.id);
    setSupForm({
      nip: sup.nip || '',
      nama_pengawas: sup.nama_pengawas || '',
      wilayah_tugas: sup.wilayah_tugas || '',
      kontak: sup.kontak || '',
      instansi: sup.instansi || 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan'
    });
  };

  const handleDeleteSupervisor = async (id, nip) => {
    if (!window.confirm('Hapus pengawas ini beserta akun loginnya?')) return;
    await supabase.from('supervisors').delete().eq('id', id);
    if (nip) await supabase.from('user_credentials').delete().eq('identifier', nip);
    fetchAdminData();
  };

  // Helper pencarian data profil Pengawas dari sesi supervisi
  const getSupervisorInfo = (sup) => {
    if (!sup) {
      return { 
        nama: supervisors[0]?.nama_pengawas || 'Wijiatin, S.Pd., M.Pd.', 
        nip: supervisors[0]?.nip || '197103151996032004', 
        wilayah: supervisors[0]?.wilayah_tugas || 'Kecamatan Donorojo', 
        instansi: supervisors[0]?.instansi || 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan' 
      };
    }
    const matched = supervisors.find(s => s.nip === sup.supervisor_nip);
    if (matched) {
      return {
        nama: matched.nama_pengawas,
        nip: matched.nip,
        wilayah: matched.wilayah_tugas,
        instansi: matched.instansi || 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan'
      };
    }
    return {
      nama: supervisors[0]?.nama_pengawas || 'Wijiatin, S.Pd., M.Pd.',
      nip: sup.supervisor_nip || supervisors[0]?.nip || '197103151996032004',
      wilayah: supervisors[0]?.wilayah_tugas || 'Kecamatan Donorojo',
      instansi: supervisors[0]?.instansi || 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan'
    };
  };

  // Filter sekolah binaan milik pengawas tertentu (berdasarkan wilayah tugas atau relasi)
  const getSchoolsForSupervisor = (supervisor) => {
    if (!supervisor) return [];
    const wilayahClean = (supervisor.wilayah_tugas || '').toLowerCase().replace(/kecamatan|wilayah|kabupaten/g, '').trim();
    return schools.filter(sch => {
      // Jika ada kolom supervisor_nip langsung
      if (sch.supervisor_nip && sch.supervisor_nip === supervisor.nip) return true;
      // Jika dicocokkan berdasarkan wilayah tugas
      if (wilayahClean && (sch.alamat || '').toLowerCase().includes(wilayahClean)) return true;
      // Fallback: jika wilayah Donorojo dan mencakup semua 33 sekolah binaan
      return true;
    });
  };

  // Format tanggal Indonesia
  const formatTanggalIndo = (tglStr) => {
    if (!tglStr) return '-';
    try {
      const parts = tglStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return new Date(tglStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return tglStr;
    }
  };

  // Filter Data Supervisi Berdasarkan Rentang Jadwal
  const filteredSupervisions = supervisions.filter(sup => {
    if (!sup.tanggal_supervisi) return true;
    if (filterStartDate && sup.tanggal_supervisi < filterStartDate) return false;
    if (filterEndDate && sup.tanggal_supervisi > filterEndDate) return false;
    return true;
  });

  // Ekspor Excel Menyeluruh (Baris Diduplikasi per Rencana Aksi)
  const handleExportComprehensiveExcel = () => {
    if (filteredSupervisions.length === 0) {
      return alert('Tidak ada data supervisi pada rentang jadwal yang dipilih untuk diekspor!');
    }

    let tableRows = '';
    let rowNumber = 1;

    filteredSupervisions.forEach(sup => {
      const relatedFu = followUps.filter(f => f.supervision_id === sup.id);
      const spvInfo = getSupervisorInfo(sup);

      if (relatedFu.length === 0) {
        tableRows += `
          <tr>
            <td style="text-align: center;">${rowNumber++}</td>
            <td style="text-align: center;">${sup.tanggal_supervisi || '-'}</td>
            <td style="text-align: center;">'${sup.schools?.npsn || '-'}</td>
            <td>${sup.schools?.nama_sekolah || '-'}</td>
            <td>${sup.schools?.nama_kepsek || '-'}</td>
            <td>${spvInfo.nama}</td>
            <td style="text-align: center;">${sup.jenis_supervisi?.toUpperCase() || '-'}</td>
            <td>${sup.fokus_pendampingan || '-'}</td>
            <td>${sup.kondisi_situasi || '-'}</td>
            <td>${sup.temuan || '-'}</td>
            <td>${sup.rekomendasi || '-'}</td>
            <td style="text-align: center; text-transform: uppercase;">${sup.status || '-'}</td>
            <td>(Belum ada rencana aksi)</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
          </tr>
        `;
      } else {
        relatedFu.forEach(fu => {
          tableRows += `
            <tr>
              <td style="text-align: center;">${rowNumber++}</td>
              <td style="text-align: center;">${sup.tanggal_supervisi || '-'}</td>
              <td style="text-align: center;">'${sup.schools?.npsn || '-'}</td>
              <td>${sup.schools?.nama_sekolah || '-'}</td>
              <td>${sup.schools?.nama_kepsek || '-'}</td>
              <td>${spvInfo.nama}</td>
              <td style="text-align: center;">${sup.jenis_supervisi?.toUpperCase() || '-'}</td>
              <td>${sup.fokus_pendampingan || '-'}</td>
              <td>${sup.kondisi_situasi || '-'}</td>
              <td>${sup.temuan || '-'}</td>
              <td>${sup.rekomendasi || '-'}</td>
              <td style="text-align: center; text-transform: uppercase;">${sup.status || '-'}</td>
              <td>${fu.rencana_aksi || '-'}</td>
              <td>${fu.penanggung_jawab || '-'}</td>
              <td>${fu.daya_dukung || '-'}</td>
              <td>${fu.bukti_dukung_url || '-'}</td>
              <td style="text-align: center; text-transform: uppercase;">${fu.status_aksi || '-'}</td>
              <td>${fu.validasi_pengawas || 'Belum ada catatan validasi.'}</td>
            </tr>
          `;
        });
      }
    });

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Calibri, sans-serif; font-size: 10pt; }
          th { background: #1e3a8a; color: #ffffff; border: 1px solid #000000; padding: 8px; font-weight: bold; }
          td { border: 1px solid #000000; padding: 6px; vertical-align: top; }
        </style>
      </head>
      <body>
        <h3>${adminKopSettings.instansi}</h3>
        <h2>${adminKopSettings.judul}</h2>
        <p>Wilayah: ${adminKopSettings.wilayah} | Periode: ${filterStartDate || 'Awal'} s.d. ${filterEndDate || 'Kini'}</p>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal Visitasi</th>
              <th>NPSN</th>
              <th>Satuan Pendidikan</th>
              <th>Kepala Sekolah</th>
              <th>Pengawas Pembina</th>
              <th>Jenis</th>
              <th>Fokus Pendampingan</th>
              <th>Kondisi Lapangan</th>
              <th>Temuan Lapangan</th>
              <th>Rekomendasi Awal</th>
              <th>Status Supervisi</th>
              <th>Rencana Aksi Sekolah</th>
              <th>Penanggung Jawab (PJ)</th>
              <th>Daya Dukung</th>
              <th>Bukti Dukung</th>
              <th>Status Aksi</th>
              <th>Refleksi / Validasi Pengawas</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <br/><br/>
        <table>
          <tr>
            <td colspan="13" style="border: none;"></td>
            <td colspan="5" style="border: none; text-align: center;">
              ${adminKopSettings.kota_cetak}, ${adminKopSettings.tanggal_cetak}<br/>
              ${adminKopSettings.jabatan},<br/><br/><br/><br/>
              <strong>${adminKopSettings.nama_admin}</strong><br/>
              NIP. ${adminKopSettings.nip_admin}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Supervisi_Menyeluruh_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const triggerPrintPdf = (mode, sup = null) => {
    setPrintMode(mode);
    setSelectedSupervisionForDetail(sup);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Metrik Statistik
  const totalVisit = supervisions.length;
  const selesaiVisit = supervisions.filter(s => s.status === 'selesai').length;
  const tindakLanjutVisit = supervisions.filter(s => s.status === 'tindak_lanjut').length;
  const terjadwalVisit = supervisions.filter(s => s.status === 'terjadwal').length;

  const totalAksi = followUps.length;
  const tuntasAksi = followUps.filter(f => f.status_aksi === 'selesai').length;
  const persenAksi = totalAksi > 0 ? Math.round((tuntasAksi / totalAksi) * 100) : 0;

  // Sekolah yang difilter di dalam Modal Detail Pengawas
  const activeSupervisorSchools = selectedSupervisorForSchools 
    ? getSchoolsForSupervisor(selectedSupervisorForSchools).filter(s => {
        const q = searchSchoolQuery.toLowerCase();
        return (s.nama_sekolah || '').toLowerCase().includes(q) ||
               (s.nama_kepsek || '').toLowerCase().includes(q) ||
               (s.npsn || '').toLowerCase().includes(q) ||
               (s.alamat || '').toLowerCase().includes(q);
      })
    : [];

  // 1. FORM LOGIN ADMIN
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-200">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Konsol Administrator</h1>
            <p className="text-xs text-slate-400">Portal Manajemen Wilayah & Pengawasan Satuan Pendidikan</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">ID Akun Admin</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan ID Administrator"
                className="w-full p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white outline-none focus:border-blue-500 transition" 
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Kata Sandi Khusus</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white outline-none focus:border-blue-500 transition" 
              />
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition text-sm"
            >
              Masuk Konsol Admin
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center">
            <button 
              onClick={onExitAdmin}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Portal Sekolah & Publik</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. WORKSPACE UTAMA ADMIN
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #area-cetak-admin, #area-cetak-admin * { visibility: visible !important; }
          #area-cetak-admin {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            color: black !important;
            background: white !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* HEADER KHUSUS ADMIN */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md">
              A
            </div>
            <div>
              <span className="text-base font-bold text-white block leading-tight">SI PANDAI • Konsol Manajemen</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block">Level: Administrator</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={handleExportComprehensiveExcel}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              title="Ekspor seluruh siklus supervisi ke Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>
            <button 
              onClick={() => triggerPrintPdf('rekap-wilayah')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              title="Cetak matriks rekapitulasi wilayah ke PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap PDF</span>
            </button>
            <button 
              onClick={handleAdminLogout}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition ml-2"
              title="Keluar dari Konsol Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* SUBNAV ADMIN */}
        <div className="bg-slate-900/60 border-t border-slate-800/80 px-4 sm:px-6 flex space-x-6 text-xs font-semibold overflow-x-auto">
          <button 
            onClick={() => setAdminTab('dashboard')} 
            className={`py-3 whitespace-nowrap border-b-2 transition ${adminTab === 'dashboard' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Dashboard & Analitik
          </button>
          <button 
            onClick={() => setAdminTab('siklus')} 
            className={`py-3 whitespace-nowrap border-b-2 transition ${adminTab === 'siklus' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Siklus Supervisi & Refleksi ({filteredSupervisions.length})
          </button>
          <button 
            onClick={() => setAdminTab('pengawas')} 
            className={`py-3 whitespace-nowrap border-b-2 transition ${adminTab === 'pengawas' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Kelola Pengawas & Wilayah
          </button>
          <button 
            onClick={() => setAdminTab('setting-kop')} 
            className={`py-3 whitespace-nowrap border-b-2 transition ${adminTab === 'setting-kop' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Pengaturan KOP & TTD
          </button>
          <button 
            onClick={() => setAdminTab('buletin')} 
            className={`py-3 whitespace-nowrap border-b-2 transition ${adminTab === 'buletin' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Audit Majalah Sekolah ({bulletins.length})
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 no-print">
        
        {/* 1. DASHBOARD ANALITIK */}
        {adminTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">Pengawas Aktif</span>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-black text-white mt-2">{supervisors.length}</div>
                <span className="text-[11px] text-slate-500">Membina {schools.length} Sekolah</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">Total Visitasi</span>
                  <Calendar className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="text-3xl font-black text-white mt-2">{totalVisit}</div>
                <span className="text-[11px] text-indigo-400 font-semibold">{selesaiVisit} Selesai • {terjadwalVisit} Terjadwal</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">Komitmen Aksi</span>
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-3xl font-black text-white mt-2">{totalAksi}</div>
                <span className="text-[11px] text-amber-400 font-semibold">{tuntasAksi} Tindak Lanjut Tuntas</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">Rasio Tuntas</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-3xl font-black text-emerald-400 mt-2">{persenAksi}%</div>
                <span className="text-[11px] text-slate-500">Efektivitas Pendampingan</span>
              </div>
            </div>

            {/* DIAGRAM STATUS SUPERVISI & RENCANA AKSI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center justify-between border-b border-slate-800 pb-3">
                  <span>Distribusi Progres Kunjungan Supervisi</span>
                  <span className="text-xs font-normal text-slate-400">Total {totalVisit} Sesi</span>
                </h3>

                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-emerald-400 font-semibold">Tuntas / Selesai</span>
                      <span className="font-mono">{selesaiVisit} ({totalVisit > 0 ? Math.round((selesaiVisit / totalVisit) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${totalVisit > 0 ? (selesaiVisit / totalVisit) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-amber-400 font-semibold">Dalam Proses Rencana Aksi</span>
                      <span className="font-mono">{tindakLanjutVisit} ({totalVisit > 0 ? Math.round((tindakLanjutVisit / totalVisit) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-amber-500 h-3 rounded-full transition-all duration-500" style={{ width: `${totalVisit > 0 ? (tindakLanjutVisit / totalVisit) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-blue-400 font-semibold">Terjadwal (Menunggu Visitasi)</span>
                      <span className="font-mono">{terjadwalVisit} ({totalVisit > 0 ? Math.round((terjadwalVisit / totalVisit) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${totalVisit > 0 ? (terjadwalVisit / totalVisit) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center justify-between border-b border-slate-800 pb-3">
                  <span>Capaian Komitmen Rencana Aksi Satuan Pendidikan</span>
                  <span className="text-xs font-normal text-slate-400">{totalAksi} Komitmen</span>
                </h3>

                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-emerald-400 font-semibold">Bukti Dukung Tuntas & Divalidasi Pengawas</span>
                      <span className="font-mono">{tuntasAksi} Aksi</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full" style={{ width: `${persenAksi}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-rose-400 font-semibold">Belum Selesai / Dalam Pemenuhan</span>
                      <span className="font-mono">{totalAksi - tuntasAksi} Aksi</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-rose-500 h-3 rounded-full" style={{ width: `${totalAksi > 0 ? ((totalAksi - tuntasAksi) / totalAksi) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    Setiap rencana aksi diverifikasi oleh Pengawas Pembina dan disinkronkan otomatis ke laporan kompilasi dinas.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TAB SIKLUS SUPERVISI, TINDAK LANJUT & REFLEKSI */}
        {adminTab === 'siklus' && (
          <div className="space-y-6">
            {/* FILTER RENTANG JADWAL */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-white">Filter Periode Jadwal:</span>
                <input 
                  type="date" 
                  value={filterStartDate} 
                  onChange={e => setFilterStartDate(e.target.value)} 
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none" 
                />
                <span className="text-slate-500">s.d.</span>
                <input 
                  type="date" 
                  value={filterEndDate} 
                  onChange={e => setFilterEndDate(e.target.value)} 
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none" 
                />
                {(filterStartDate || filterEndDate) && (
                  <button 
                    onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px]"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleExportComprehensiveExcel}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl inline-flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" /><span>Export Excel</span>
                </button>
                <button 
                  onClick={() => triggerPrintPdf('rekap-wilayah')}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl inline-flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" /><span>Cetak Rekap Matriks PDF</span>
                </button>
              </div>
            </div>

            {/* TABEL SIKLUS PENUH */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-white">1 Siklus Penuh Pengawasan ({filteredSupervisions.length} Sesi Visitasi)</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/80 uppercase text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">Jadwal & Sasaran</th>
                      <th className="p-3">Kondisi Nyata</th>
                      <th className="p-3">Temuan Lapangan</th>
                      <th className="p-3">Rekomendasi Awal</th>
                      <th className="p-3">Rencana Aksi Sekolah</th>
                      <th className="p-3">Refleksi / Validasi Pengawas</th>
                      <th className="p-3 text-center">Cetak Siklus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 align-top">
                    {filteredSupervisions.map(sup => {
                      const relatedFu = followUps.filter(f => f.supervision_id === sup.id);
                      const spvInfo = getSupervisorInfo(sup);

                      return (
                        <tr key={sup.id} className="hover:bg-slate-800/40">
                          <td className="p-3">
                            <span className="font-bold text-white block">{sup.schools?.nama_sekolah}</span>
                            <span className="text-[11px] text-blue-400 font-mono block">NPSN: {sup.schools?.npsn}</span>
                            <span className="text-[11px] text-slate-400 block mt-1">Visitasi: {sup.tanggal_supervisi || '-'}</span>
                            <span className="text-[11px] text-emerald-400 block">Pengawas: {spvInfo.nama}</span>
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded uppercase font-bold inline-block mt-1">
                              {sup.jenis_supervisi}
                            </span>
                          </td>
                          <td className="p-3 max-w-xs">{sup.kondisi_situasi || '-'}</td>
                          <td className="p-3 max-w-xs">{sup.temuan || '-'}</td>
                          <td className="p-3 max-w-xs text-blue-300">{sup.rekomendasi || '-'}</td>
                          <td className="p-3 max-w-sm space-y-2">
                            {relatedFu.length === 0 ? (
                              <span className="italic text-slate-500">Belum ada komitmen aksi</span>
                            ) : (
                              relatedFu.map((fu, fIdx) => (
                                <div key={fu.id} className="p-2 bg-slate-800/80 rounded border border-slate-700 text-[11px]">
                                  <div className="font-bold text-white">{fIdx + 1}. {fu.rencana_aksi}</div>
                                  <div className="text-slate-400">PJ: {fu.penanggung_jawab} | Status: <strong className={fu.status_aksi === 'selesai' ? 'text-emerald-400' : 'text-amber-400'}>{fu.status_aksi}</strong></div>
                                </div>
                              ))
                            )}
                          </td>
                          <td className="p-3 max-w-xs space-y-2">
                            {relatedFu.length === 0 ? (
                              <span className="italic text-slate-500">-</span>
                            ) : (
                              relatedFu.map((fu, fIdx) => (
                                <div key={fu.id} className="p-2 bg-slate-800/50 rounded border border-slate-700/60 text-[11px] italic text-slate-300">
                                  <strong>Refleksi #{fIdx + 1}:</strong> {fu.validasi_pengawas || 'Belum ada catatan validasi.'}
                                </div>
                              ))
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => triggerPrintPdf('siklus-detail', sup)}
                              className="px-2.5 py-1.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-[11px] font-semibold transition"
                              title="Cetak lembar laporan detail per sesi"
                            >
                              Detail PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. PENGATURAN KOP & TANDA TANGAN KOORDINATOR */}
        {adminTab === 'setting-kop' && (
          <div className="max-w-4xl mx-auto space-y-6 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <span>Pengaturan KOP & Tanda Tangan Koordinator Pengawas</span>
              </h2>
              <p className="text-slate-400 text-[11px] mt-1">
                KOP dan tanda tangan tunggal ini akan otomatis tertera pada cetakan <strong>Rekapitulasi Keseluruhan Wilayah</strong> dan ekspor Excel.
              </p>
            </div>

            <form onSubmit={handleSaveKopSettings} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Bagian KOP Laporan Rekapitulasi Dinas</h3>
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Instansi Induk</label>
                  <input 
                    type="text" 
                    value={adminKopSettings.instansi} 
                    onChange={e => setAdminKopSettings({...adminKopSettings, instansi: e.target.value})}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Judul Dokumen / Laporan</label>
                  <input 
                    type="text" 
                    value={adminKopSettings.judul} 
                    onChange={e => setAdminKopSettings({...adminKopSettings, judul: e.target.value})}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Keterangan Wilayah / Satuan Kerja</label>
                  <input 
                    type="text" 
                    value={adminKopSettings.wilayah} 
                    onChange={e => setAdminKopSettings({...adminKopSettings, wilayah: e.target.value})}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" 
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Identitas Koordinator Pengawas (Tanda Tangan Kanan Bawah)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-300">Kota Cetak</label>
                    <input 
                      type="text" 
                      value={adminKopSettings.kota_cetak} 
                      onChange={e => setAdminKopSettings({...adminKopSettings, kota_cetak: e.target.value})}
                      placeholder="Contoh: Pacitan"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 text-slate-300">Tanggal Pengesahan Rekap</label>
                    <input 
                      type="text" 
                      value={adminKopSettings.tanggal_cetak} 
                      onChange={e => setAdminKopSettings({...adminKopSettings, tanggal_cetak: e.target.value})}
                      placeholder="Contoh: 3 November 2026"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 text-slate-300">Nama Koordinator Pengawas & Gelar</label>
                    <input 
                      type="text" 
                      value={adminKopSettings.nama_admin} 
                      onChange={e => setAdminKopSettings({...adminKopSettings, nama_admin: e.target.value})}
                      placeholder="Contoh: Drs. H. Mulyono, M.Pd."
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 text-slate-300">NIP Koordinator Pengawas</label>
                    <input 
                      type="text" 
                      value={adminKopSettings.nip_admin} 
                      onChange={e => setAdminKopSettings({...adminKopSettings, nip_admin: e.target.value})}
                      placeholder="Contoh: 197005121998021001"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1 text-slate-300">Jabatan Pengesah</label>
                    <input 
                      type="text" 
                      value={adminKopSettings.jabatan} 
                      onChange={e => setAdminKopSettings({...adminKopSettings, jabatan: e.target.value})}
                      placeholder="Contoh: Koordinator Pengawas Sekolah"
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={isSavingKop}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition"
                >
                  {isSavingKop ? 'Menyimpan...' : 'Simpan Konfigurasi KOP'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. KELOLA PENGAWAS DENGAN TOMBOL DETAIL SEKOLAH BINAAN */}
        {adminTab === 'pengawas' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingSupervisorId ? 'Edit Data Pengawas' : 'Daftarkan Pengawas Pembina Baru'}
                  </h2>
                  <p className="text-slate-400 text-[11px]">Akun login otomatis aktif menggunakan NIP dengan kata sandi: pandai12345</p>
                </div>
                {editingSupervisorId && (
                  <button 
                    onClick={() => { setEditingSupervisorId(null); setSupForm({ nip: '', nama_pengawas: '', wilayah_tugas: 'Kecamatan Donorojo', kontak: '', instansi: 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan' }); }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveSupervisor} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">NIP Pengawas (ID Login)</label>
                  <input 
                    type="text" 
                    value={supForm.nip} 
                    disabled={!!editingSupervisorId}
                    onChange={e => setSupForm({...supForm, nip: e.target.value})}
                    placeholder="Contoh: 197103151996032004" 
                    className={`w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 ${editingSupervisorId ? 'cursor-not-allowed opacity-60' : ''}`} 
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Nama Lengkap & Gelar</label>
                  <input 
                    type="text" 
                    value={supForm.nama_pengawas} 
                    onChange={e => setSupForm({...supForm, nama_pengawas: e.target.value})}
                    placeholder="Contoh: Wijiatin, S.Pd., M.Pd." 
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Wilayah Tugas Pengawasan</label>
                  <input 
                    type="text" 
                    value={supForm.wilayah_tugas} 
                    onChange={e => setSupForm({...supForm, wilayah_tugas: e.target.value})}
                    placeholder="Contoh: Kecamatan Donorojo" 
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Nomor Kontak / WA</label>
                  <input 
                    type="text" 
                    value={supForm.kontak} 
                    onChange={e => setSupForm({...supForm, kontak: e.target.value})}
                    placeholder="08xxxxxxxxxx" 
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" 
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition"
                  >
                    {editingSupervisorId ? 'Simpan Perubahan Pengawas' : '+ Daftarkan Pengawas'}
                  </button>
                </div>
              </form>
            </div>

            {/* TABEL PENGAWAS DENGAN TOMBOL DETAIL */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-white">Daftar Pengawas Pembina Aktif ({supervisors.length})</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/80 uppercase text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">Nama Pengawas</th>
                      <th className="p-3">NIP</th>
                      <th className="p-3">Wilayah Binaan</th>
                      <th className="p-3 text-center">Jumlah Binaan</th>
                      <th className="p-3">Kontak</th>
                      <th className="p-3 text-center">Aksi & Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {supervisors.map(s => {
                      const countSchools = getSchoolsForSupervisor(s).length;

                      return (
                        <tr key={s.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-white">{s.nama_pengawas}</td>
                          <td className="p-3 font-mono">{s.nip}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-semibold">
                              {s.wilayah_tugas}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-400">
                            {countSchools} Sekolah
                          </td>
                          <td className="p-3">{s.kontak || '-'}</td>
                          <td className="p-3 text-center space-x-1.5">
                            {/* TOMBOL DETAIL SEKOLAH & KEPSEK BINAAN */}
                            <button 
                              onClick={() => {
                                setSelectedSupervisorForSchools(s);
                                setSearchSchoolQuery('');
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1 transition"
                              title="Lihat daftar sekolah dan kepala sekolah binaan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Binaan</span>
                            </button>
                            <button 
                              onClick={() => handleEditSupervisor(s)} 
                              className="p-1.5 text-amber-400 hover:bg-slate-800 rounded" 
                              title="Edit Data Pengawas"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSupervisor(s.id, s.nip)} 
                              className="p-1.5 text-rose-400 hover:bg-slate-800 rounded" 
                              title="Hapus Pengawas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. AUDIT BULETIN */}
        {adminTab === 'buletin' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-white">Seluruh Artikel Majalah Sekolah & Praktik Baik ({bulletins.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-800/80 uppercase text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3">Judul Artikel</th>
                    <th className="p-3">Penulis</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {bulletins.map(art => (
                    <tr key={art.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white max-w-xs truncate">{art.judul}</td>
                      <td className="p-3">{art.author_name} ({art.author_role})</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full font-bold">{art.kategori}</span></td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${art.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {art.is_published ? 'Tayang' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{new Date(art.created_at).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL POP-UP: DETAIL SEKOLAH & KEPALA SEKOLAH BINAAN PENGAWAS             */}
      {/* ========================================================================= */}
      {selectedSupervisorForSchools && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-xs overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Sekolah & Kepala Sekolah Binaan: {selectedSupervisorForSchools.nama_pengawas}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      NIP: {selectedSupervisorForSchools.nip} • Wilayah: {selectedSupervisorForSchools.wilayah_tugas}
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSupervisorForSchools(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header Filter & Pencarian Cepat */}
            <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-slate-300 font-semibold">
                Total Binaan: <strong className="text-emerald-400">{activeSupervisorSchools.length} Satuan Pendidikan</strong>
              </span>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  value={searchSchoolQuery}
                  onChange={e => setSearchSchoolQuery(e.target.value)}
                  placeholder="Cari sekolah, kepsek, atau NPSN..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            {/* Isi Tabel Sekolah & Kepala Sekolah */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeSupervisorSchools.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  Tidak ditemukan data sekolah atau kepala sekolah yang sesuai kata kunci.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/80 uppercase text-slate-400 font-semibold border-b border-slate-700 text-[11px]">
                      <tr>
                        <th className="p-3 text-center" style={{ width: '5%' }}>No</th>
                        <th className="p-3" style={{ width: '30%' }}>Nama Satuan Pendidikan</th>
                        <th className="p-3" style={{ width: '15%' }}>NPSN</th>
                        <th className="p-3" style={{ width: '25%' }}>Nama Kepala Sekolah</th>
                        <th className="p-3" style={{ width: '25%' }}>Alamat Sekolah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 text-xs">
                      {activeSupervisorSchools.map((sch, idx) => (
                        <tr key={sch.id} className="hover:bg-slate-800/40">
                          <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-3">
                            <span className="font-bold text-white block">{sch.nama_sekolah}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-semibold mt-0.5 inline-block">
                              Akreditasi {sch.akreditasi || 'B'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-blue-400 font-bold">{sch.npsn}</td>
                          <td className="p-3">
                            <span className="font-semibold text-emerald-300 block">{sch.nama_kepsek || '-'}</span>
                            <span className="text-[11px] text-slate-400 block">NIP: {sch.nip_kepsek || '-'}</span>
                            {sch.email_kepsek && (
                              <span className="text-[10px] text-slate-500 truncate block">{sch.email_kepsek}</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400 max-w-xs">{sch.alamat || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
              <button 
                onClick={() => setSelectedSupervisorForSchools(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AREA CETAK RESMI ADMIN (PDF PRINT VIEW) */}
      {/* ========================================================================= */}
      <div id="area-cetak-admin" className="p-8 hidden print:block text-black bg-white font-sans">
        
        {/* FORMAT CETAK 1: REKAPITULASI MATRIKS WILAYAH (LANDSCAPE) */}
        {printMode === 'rekap-wilayah' && (
          <div className="space-y-6">
            <div className="text-center border-b-4 border-double border-black pb-3 mb-6">
              <h3 className="font-bold uppercase text-sm tracking-wider">{adminKopSettings.instansi}</h3>
              <h1 className="font-black uppercase text-base mt-1">{adminKopSettings.judul}</h1>
              <p className="text-xs font-semibold mt-0.5">{adminKopSettings.wilayah}</p>
              {(filterStartDate || filterEndDate) && (
                <p className="text-[11px] text-gray-700 italic mt-0.5">
                  Periode Jadwal: {formatTanggalIndo(filterStartDate) || 'Awal'} s.d. {formatTanggalIndo(filterEndDate) || 'Kini'}
                </p>
              )}
            </div>

            <table className="w-full text-[10px] border border-collapse border-black">
              <thead>
                <tr className="bg-gray-100 font-bold">
                  <th className="border border-black p-1.5 text-center">No</th>
                  <th className="border border-black p-1.5 text-center">Jadwal</th>
                  <th className="border border-black p-1.5">Satuan Pendidikan</th>
                  <th className="border border-black p-1.5">Pengawas Pembina</th>
                  <th className="border border-black p-1.5">Fokus Pendampingan</th>
                  <th className="border border-black p-1.5">Kondisi Lapangan</th>
                  <th className="border border-black p-1.5">Temuan Nyata</th>
                  <th className="border border-black p-1.5">Rencana Aksi Sekolah</th>
                  <th className="border border-black p-1.5">Refleksi / Validasi Pengawas</th>
                </tr>
              </thead>
              <tbody>
                {filteredSupervisions.map((sup, idx) => {
                  const relatedFu = followUps.filter(f => f.supervision_id === sup.id);
                  const spvInfo = getSupervisorInfo(sup);
                  return (
                    <tr key={sup.id} className="align-top">
                      <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                      <td className="border border-black p-1.5 text-center whitespace-nowrap">{formatTanggalIndo(sup.tanggal_supervisi)}</td>
                      <td className="border border-black p-1.5 font-bold">
                        {sup.schools?.nama_sekolah}
                        <span className="block font-normal text-[9px] text-gray-700">NPSN: {sup.schools?.npsn}</span>
                      </td>
                      <td className="border border-black p-1.5">{spvInfo.nama}</td>
                      <td className="border border-black p-1.5">{sup.fokus_pendampingan || '-'}</td>
                      <td className="border border-black p-1.5">{sup.kondisi_situasi || '-'}</td>
                      <td className="border border-black p-1.5">{sup.temuan || '-'}</td>
                      <td className="border border-black p-1.5 space-y-1">
                        {relatedFu.length === 0 ? '-' : relatedFu.map((fu, fIdx) => (
                          <div key={fu.id}>{fIdx + 1}. {fu.rencana_aksi} (PJ: {fu.penanggung_jawab})</div>
                        ))}
                      </td>
                      <td className="border border-black p-1.5 italic space-y-1">
                        {relatedFu.length === 0 ? '-' : relatedFu.map((fu, fIdx) => (
                          <div key={fu.id}>#{fIdx + 1}: {fu.validasi_pengawas || 'Menunggu validasi.'}</div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* TANDA TANGAN REKAP: HANYA 1 DI SEBELAH KANAN (KOORDINATOR PENGAWAS) */}
            <div className="mt-8 pt-4 flex justify-end text-xs">
              <div className="w-72 text-center space-y-1">
                <p>{adminKopSettings.kota_cetak}, {adminKopSettings.tanggal_cetak}</p>
                <p className="font-semibold">{adminKopSettings.jabatan},</p>
                <div className="h-20"></div>
                <p className="font-bold underline text-sm">{adminKopSettings.nama_admin}</p>
                <p>NIP. {adminKopSettings.nip_admin}</p>
              </div>
            </div>
          </div>
        )}

        {/* FORMAT CETAK 2: LEMBAR SIKLUS INDIVIDUAL PER SEKOLAH (PORTRAIT) */}
        {printMode === 'siklus-detail' && selectedSupervisionForDetail && (() => {
          const spvInfo = getSupervisorInfo(selectedSupervisionForDetail);
          const schoolObj = selectedSupervisionForDetail.schools || {};
          const tglSupervisiIndo = formatTanggalIndo(selectedSupervisionForDetail.tanggal_supervisi);

          return (
            <div className="space-y-4 text-xs">
              {/* KOP RESMI MENGIKUTI PENGAWAS PEMBINA */}
              <div className="text-center border-b-4 border-double border-black pb-3 mb-6">
                <h3 className="font-bold uppercase text-xs tracking-wider">{spvInfo.instansi}</h3>
                <h1 className="font-black uppercase text-base mt-1">BERITA ACARA & SIKLUS SUPERVISI AKADEMIK / MANAJERIAL</h1>
                <p className="text-xs font-semibold mt-0.5">Sekolah Binaan Wilayah: {spvInfo.wilayah}</p>
              </div>

              {/* IDENTITAS VISITASI */}
              <div className="bg-gray-50 p-4 border border-black rounded space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Satuan Pendidikan:</strong> {schoolObj.nama_sekolah || '-'}</div>
                  <div><strong>NPSN Sekolah:</strong> {schoolObj.npsn || '-'}</div>
                  <div><strong>Kepala Sekolah:</strong> {schoolObj.nama_kepsek || '-'}</div>
                  <div><strong>Pengawas Pembina:</strong> {spvInfo.nama}</div>
                  <div><strong>Tanggal Visitasi:</strong> {tglSupervisiIndo}</div>
                  <div><strong>Jenis Supervisi:</strong> <span className="uppercase">{selectedSupervisionForDetail.jenis_supervisi}</span></div>
                </div>
                <div className="pt-2 border-t border-gray-300">
                  <strong>Fokus Pendampingan:</strong> {selectedSupervisionForDetail.fokus_pendampingan}
                </div>
              </div>

              {/* KONDISI AWAL & TEMUAN */}
              <div className="space-y-2 pt-1">
                <h4 className="font-bold border-b border-black pb-1 uppercase">A. Kondisi Lapangan & Temuan Hasil Visitasi</h4>
                <p className="leading-relaxed"><strong>Kondisi / Situasi Nyata:</strong> {selectedSupervisionForDetail.kondisi_situasi || '-'}</p>
                <p className="leading-relaxed"><strong>Temuan Nyata Pengawas:</strong> {selectedSupervisionForDetail.temuan || '-'}</p>
                <p className="leading-relaxed"><strong>Rekomendasi Awal Pengawas:</strong> {selectedSupervisionForDetail.rekomendasi || '-'}</p>
              </div>

              {/* MATRIKS RENCANA AKSI & REFLEKSI */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold border-b border-black pb-1 uppercase">B. Matriks Rencana Aksi Sekolah & Refleksi Validasi Pengawas</h4>
                <table className="w-full text-xs border border-collapse border-black">
                  <thead>
                    <tr className="bg-gray-100 font-bold">
                      <th className="border border-black p-2 text-center" style={{ width: '5%' }}>No</th>
                      <th className="border border-black p-2" style={{ width: '35%' }}>Komitmen Rencana Aksi</th>
                      <th className="border border-black p-2" style={{ width: '20%' }}>PJ & Daya Dukung</th>
                      <th className="border border-black p-2 text-center" style={{ width: '12%' }}>Status</th>
                      <th className="border border-black p-2" style={{ width: '28%' }}>Refleksi / Validasi Pengawas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followUps.filter(f => f.supervision_id === selectedSupervisionForDetail.id).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="border border-black p-4 text-center italic text-gray-500">
                          Belum ada komitmen rencana aksi tindak lanjut yang dicatat.
                        </td>
                      </tr>
                    ) : (
                      followUps.filter(f => f.supervision_id === selectedSupervisionForDetail.id).map((fu, fIdx) => (
                        <tr key={fu.id} className="align-top">
                          <td className="border border-black p-2 text-center">{fIdx + 1}</td>
                          <td className="border border-black p-2 font-bold">{fu.rencana_aksi}</td>
                          <td className="border border-black p-2">{fu.penanggung_jawab} (Dukungan: {fu.daya_dukung || '-'})</td>
                          <td className="border border-black p-2 text-center uppercase font-bold">{fu.status_aksi}</td>
                          <td className="border border-black p-2 italic">{fu.validasi_pengawas || 'Belum ada catatan validasi.'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* TANDA TANGAN: KIRI (PENGAWAS), KANAN (KEPALA SEKOLAH) */}
              <div className="mt-12 pt-4 grid grid-cols-2 gap-8 text-xs">
                <div className="text-center space-y-1">
                  <p className="invisible">Spacer Titimangsa</p>
                  <p className="font-semibold">Pengawas Pembina,</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline text-sm">{spvInfo.nama}</p>
                  <p>NIP. {spvInfo.nip}</p>
                </div>

                <div className="text-center space-y-1">
                  <p>{adminKopSettings.kota_cetak}, {tglSupervisiIndo}</p>
                  <p className="font-semibold">Kepala {schoolObj.nama_sekolah || 'Sekolah'},</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline text-sm">{schoolObj.nama_kepsek || '(..................................................)'}</p>
                  <p>NIP. {schoolObj.nip_kepsek || '-'}</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
