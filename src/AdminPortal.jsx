import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  ShieldCheck, LogOut, Users, Calendar, 
  CheckCircle2, AlertCircle, Download, Printer, 
  Edit3, Trash2, ArrowLeft
} from 'lucide-react';

export default function AdminPortal({ onExitAdmin }) {
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('sipandai_admin_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Login State (Bersih tanpa isian default)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tab Menu Admin
  const [adminTab, setAdminTab] = useState('dashboard');

  // Data State
  const [supervisors, setSupervisors] = useState([]);
  const [schools, setSchools] = useState([]);
  const [supervisions, setSupervisions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [bulletins, setBulletins] = useState([]);

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
    } else {
      localStorage.removeItem('sipandai_admin_session');
    }
  }, [adminUser]);

  const fetchAdminData = async () => {
    try {
      const { data: supData } = await supabase.from('supervisors').select('*').order('nama_pengawas', { ascending: true });
      if (supData) setSupervisors(supData);

      const { data: schData } = await supabase.from('schools').select('*').order('nama_sekolah', { ascending: true });
      if (schData) setSchools(schData);

      const { data: spvData } = await supabase.from('supervisions').select('*, schools(*)').order('tanggal_supervisi', { ascending: false });
      if (spvData) setSupervisions(spvData);

      const { data: fuData } = await supabase.from('follow_ups').select('*');
      if (fuData) setFollowUps(fuData);

      const { data: bulData } = await supabase.from('bulletins').select('*').order('created_at', { ascending: false });
      if (bulData) setBulletins(bulData);
    } catch (err) {
      console.error('Fetch Admin Data Error:', err);
    }
  };

  // Login Khusus Admin
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      return setLoginError('ID Admin dan Kata Sandi wajib diisi!');
    }

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

      const adminObj = {
        username: cleanUser,
        role: 'admin',
        nama: 'Administrator Utama (Ngadimin)'
      };

      setAdminUser(adminObj);
    } catch (err) {
      setLoginError('Gagal memproses login: ' + err.message);
    }
  };

  // Logout Admin: Bersihkan sesi dan kembali ke portal publik
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

        alert(`Pengawas baru berhasil didaftarkan!\nAkun Login (NIP): ${cleanNip}\nPassword: pandai12345`);
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
    if (nip) {
      await supabase.from('user_credentials').delete().eq('identifier', nip);
    }
    fetchAdminData();
  };

  // Ekspor Excel Wilayah
  const handleExportAdminExcel = () => {
    if (supervisions.length === 0) return alert('Belum ada data supervisi untuk diekspor!');

    let tableRows = '';
    supervisions.forEach((sup, idx) => {
      const relatedFu = followUps.filter(f => f.supervision_id === sup.id);
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
        relatedFu.forEach((fu, fIdx) => {
          tableRows += `
            <tr>
              <td>${fIdx === 0 ? idx + 1 : ''}</td>
              <td>${fIdx === 0 ? (sup.tanggal_supervisi || '-') : ''}</td>
              <td>${fIdx === 0 ? (sup.schools?.npsn || '-') : ''}</td>
              <td>${fIdx === 0 ? (sup.schools?.nama_sekolah || '-') : ''}</td>
              <td>${fIdx === 0 ? (sup.schools?.nama_kepsek || '-') : ''}</td>
              <td>${fIdx === 0 ? (sup.jenis_supervisi || '-') : ''}</td>
              <td>${fIdx === 0 ? (sup.fokus_pendampingan || '-') : ''}</td>
              <td>${fIdx === 0 ? (sup.status || '-') : ''}</td>
              <td>${fu.rencana_aksi || '-'}</td>
              <td>${fu.penanggung_jawab || '-'}</td>
              <td>${fu.status_aksi || '-'}</td>
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
          table { border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 10pt; }
          th { background: #0f172a; color: #fff; border: 1px solid #000; padding: 6px; }
          td { border: 1px solid #000; padding: 5px; }
        </style>
      </head>
      <body>
        <h3>REKAPITULASI PENGAWASAN WILAYAH - PANEL ADMINISTRATOR</h3>
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
              <th>PJ</th>
              <th>Status Aksi</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Supervisi_Wilayah_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintAdminPdf = () => {
    window.print();
  };

  // Metrik & Persentase
  const totalVisit = supervisions.length;
  const selesaiVisit = supervisions.filter(s => s.status === 'selesai').length;
  const tindakLanjutVisit = supervisions.filter(s => s.status === 'tindak_lanjut').length;
  const terjadwalVisit = supervisions.filter(s => s.status === 'terjadwal').length;

  const totalAksi = followUps.length;
  const tuntasAksi = followUps.filter(f => f.status_aksi === 'selesai').length;
  const persenAksi = totalAksi > 0 ? Math.round((tuntasAksi / totalAksi) * 100) : 0;

  // 1. TAMPILAN LOGIN KHUSUS ADMIN (BERSIH DARI ISIAN DEFAULT)
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

  // 2. TAMPILAN WORKSPACE MANAJEMEN ADMIN
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

          <div className="flex items-center space-x-3">
            <button 
              onClick={handleExportAdminExcel}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel Wilayah</span>
            </button>
            <button 
              onClick={handlePrintAdminPdf}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap PDF</span>
            </button>
            <button 
              onClick={handleAdminLogout}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
              title="Keluar dari Konsol Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* SUBNAV ADMIN */}
        <div className="bg-slate-900/60 border-t border-slate-800/80 px-4 sm:px-6 flex space-x-6 text-xs font-semibold">
          <button 
            onClick={() => setAdminTab('dashboard')} 
            className={`py-3 border-b-2 transition ${adminTab === 'dashboard' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Dashboard & Analitik
          </button>
          <button 
            onClick={() => setAdminTab('pengawas')} 
            className={`py-3 border-b-2 transition ${adminTab === 'pengawas' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Kelola Pengawas & Wilayah
          </button>
          <button 
            onClick={() => setAdminTab('sekolah')} 
            className={`py-3 border-b-2 transition ${adminTab === 'sekolah' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Daftar Sekolah Binaan ({schools.length})
          </button>
          <button 
            onClick={() => setAdminTab('buletin')} 
            className={`py-3 border-b-2 transition ${adminTab === 'buletin' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Audit Majalah Sekolah ({bulletins.length})
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 no-print">
        {/* 1. DASHBOARD & GRAFIK VISUAL */}
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
                <span className="text-[11px] text-amber-400 font-semibold">{tuntasAksi} Tindak Lanjut Selesai</span>
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
                      <span className="text-emerald-400 font-semibold">Bukti Dukung Tuntas & Divalidasi</span>
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
                    Setiap rencana aksi yang dituntaskan oleh Kepala Sekolah diverifikasi secara berjenjang oleh Pengawas Pembina masing-masing wilayah.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. KELOLA PENGAWAS & WILAYAH */}
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
                    placeholder="Contoh: 197005121998021001" 
                    className={`w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 ${editingSupervisorId ? 'cursor-not-allowed opacity-60' : ''}`} 
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Nama Lengkap & Gelar</label>
                  <input 
                    type="text" 
                    value={supForm.nama_pengawas} 
                    onChange={e => setSupForm({...supForm, nama_pengawas: e.target.value})}
                    placeholder="Contoh: Drs. H. Mulyono, M.Pd." 
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

            {/* TABEL PENGAWAS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-white">Daftar Pengawas Pembina Aktif ({supervisors.length})</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/80 uppercase text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">Nama Pengawas</th>
                      <th className="p-3">NIP</th>
                      <th className="p-3">Wilayah Binaan</th>
                      <th className="p-3">Kontak</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {supervisors.map(s => (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white">{s.nama_pengawas}</td>
                        <td className="p-3 font-mono">{s.nip}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-semibold">
                            {s.wilayah_tugas}
                          </span>
                        </td>
                        <td className="p-3">{s.kontak || '-'}</td>
                        <td className="p-3 text-center space-x-1">
                          <button onClick={() => handleEditSupervisor(s)} className="p-1.5 text-amber-400 hover:bg-slate-800 rounded" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteSupervisor(s.id, s.nip)} className="p-1.5 text-rose-400 hover:bg-slate-800 rounded" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. DAFTAR SEKOLAH BINAAN */}
        {adminTab === 'sekolah' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-white">Data 33 Sekolah Binaan Wilayah ({schools.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-800/80 uppercase text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3">NPSN</th>
                    <th className="p-3">Satuan Pendidikan</th>
                    <th className="p-3">Kepala Sekolah</th>
                    <th className="p-3">Alamat</th>
                    <th className="p-3 text-center">Guru / Siswa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {schools.map(sch => (
                    <tr key={sch.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-blue-400">{sch.npsn}</td>
                      <td className="p-3 font-bold text-white">{sch.nama_sekolah}</td>
                      <td className="p-3">{sch.nama_kepsek || '-'}</td>
                      <td className="p-3 text-slate-400 truncate max-w-xs">{sch.alamat}</td>
                      <td className="p-3 text-center">{sch.total_guru || 0} / {sch.total_siswa || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. AUDIT BULETIN SEKOLAH */}
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

      {/* DOKUMEN CETAK KHUSUS ADMIN */}
      <div id="area-cetak-admin" className="p-8 hidden print:block text-black bg-white">
        <div className="text-center border-b-2 border-black pb-3 mb-6">
          <h3 className="font-bold uppercase text-sm">Pemerintah Provinsi Jawa Timur • Dinas Pendidikan</h3>
          <h1 className="font-black uppercase text-lg">REKAPITULASI LAPORAN PENGAWASAN SATUAN PENDIDIKAN</h1>
          <p className="text-xs">Wilayah Kerja: Kecamatan Donorojo • Kabupaten Pacitan</p>
        </div>

        <table className="w-full text-xs border border-collapse border-black">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border border-black p-2">No</th>
              <th className="border border-black p-2">Tanggal</th>
              <th className="border border-black p-2">NPSN</th>
              <th className="border border-black p-2">Satuan Pendidikan</th>
              <th className="border border-black p-2">Fokus Pendampingan</th>
              <th className="border border-black p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {supervisions.map((sup, idx) => (
              <tr key={sup.id}>
                <td className="border border-black p-2 text-center">{idx + 1}</td>
                <td className="border border-black p-2">{sup.tanggal_supervisi}</td>
                <td className="border border-black p-2 text-center">{sup.schools?.npsn}</td>
                <td className="border border-black p-2">{sup.schools?.nama_sekolah}</td>
                <td className="border border-black p-2">{sup.fokus_pendampingan}</td>
                <td className="border border-black p-2 text-center capitalize">{sup.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
