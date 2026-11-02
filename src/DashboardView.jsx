import React from 'react';
import { 
  Building2, Calendar, CheckCircle, Clock, 
  AlertCircle, Bell, ChevronRight, Award, BookOpen, Download
} from 'lucide-react';

export default function DashboardView({ 
  sessionUser, 
  currentSchool, 
  supervisions, 
  schools, 
  myArticles,
  notifications, 
  onNavigate,
  onExportExcel
}) {
  const role = sessionUser?.role;
  const isPengawas = role === 'pengawas';
  const isKepsek = role === 'kepsek';
  const isGuru = role === 'guru';

  const totalSupervisi = supervisions.length;
  const selesaiCount = supervisions.filter(s => s.status === 'selesai').length;
  const tindakLanjutCount = supervisions.filter(s => s.status === 'tindak_lanjut').length;
  const terjadwalCount = supervisions.filter(s => s.status === 'terjadwal').length;

  return (
    <div className="space-y-6">
      {/* BANNER SAMBUTAN DASHBOARD */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-blue-100 rounded-full text-xs font-semibold uppercase tracking-wider">
              {isPengawas ? 'Dashboard Pengawas Pembina' : isKepsek ? 'Dashboard Kepala Sekolah' : 'Dashboard Ruang Guru'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 leading-tight">
              Selamat Datang, {sessionUser?.nama}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              {isPengawas 
                ? `Memantau ${schools.length} Satuan Pendidikan Dampingan • Wilayah Kabupaten Pacitan` 
                : `${currentSchool?.nama_sekolah || sessionUser?.namaSekolah} • NPSN: ${currentSchool?.npsn || sessionUser?.npsn}`}
            </p>
          </div>

          {(isPengawas || isKepsek) && (
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={onExportExcel}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Excel Supervisi & Aksi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KARTU INDIKATOR STATISTIK */}
      {isGuru ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-500">Artikel Saya</span>
            <div className="text-3xl font-black text-slate-900 mt-2">{myArticles.length}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Terbit di Buletin</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-500">Satuan Pendidikan</span>
            <div className="text-lg font-bold text-slate-900 mt-2 truncate">{sessionUser?.namaSekolah}</div>
            <span className="text-[11px] text-slate-500">Kontributor Aktif</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Aksi Cepat</span>
            <button 
              onClick={() => onNavigate('kelola-buletin')}
              className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition"
            >
              + Tulis Artikel Baru
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isPengawas ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Sekolah Dampingan</span>
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{schools.length}</div>
              <span className="text-[11px] text-slate-500">Lembaga Terdaftar</span>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Profil Sekolah</span>
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">Akreditasi {currentSchool?.akreditasi || 'A'}</div>
              <span className="text-[11px] text-slate-500">{currentSchool?.total_guru || 0} Guru • {currentSchool?.total_siswa || 0} Siswa</span>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Terjadwal</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{terjadwalCount}</div>
            <span className="text-[11px] text-amber-700 font-medium">Menunggu Visitasi</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Tindak Lanjut</span>
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{tindakLanjutCount}</div>
            <span className="text-[11px] text-blue-700 font-medium">Proses Rencana Aksi</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Selesai</span>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{selesaiCount}</div>
            <span className="text-[11px] text-emerald-700 font-medium">Supervisi Tuntas</span>
          </div>
        </div>
      )}

      {/* PANEL NOTIFIKASI & AGENDA TERBARU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Notifikasi & Aktivitas Baru</h3>
            </div>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">
              {notifications.length} Baru
            </span>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Belum ada aktivitas baru.
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div 
                  key={idx} 
                  onClick={() => notif.targetTab && onNavigate(notif.targetTab)}
                  className={`p-3.5 rounded-xl border text-xs space-y-1 cursor-pointer transition hover:shadow-sm ${
                    notif.tipe === 'aksi_baru' ? 'bg-amber-50/70 border-amber-200' :
                    notif.tipe === 'supervisi_baru' ? 'bg-blue-50/70 border-blue-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{notif.judul}</span>
                    <span className="text-[10px] text-slate-500">{notif.waktu}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{notif.pesan}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                {isGuru ? <BookOpen className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isGuru ? 'Artikel Buletin Terakhir Saya' : isPengawas ? 'Riwayat Supervisi Wilayah' : 'Catatan Supervisi & Rencana Aksi Sekolah'}
              </h3>
            </div>
            <button 
              onClick={() => onNavigate(isGuru ? 'kelola-buletin' : isPengawas ? 'supervisi' : 'catatan-supervisi')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>Kelola Detail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isGuru ? (
            <div className="space-y-3">
              {myArticles.slice(0, 4).map(art => (
                <div key={art.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{art.kategori}</span>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5">{art.judul}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(art.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {supervisions.slice(0, 4).map((s) => (
                <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'tindak_lanjut' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {s.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(s.tanggal_supervisi).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{s.schools?.nama_sekolah}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                      <strong>[{s.jenis_supervisi}]</strong> {s.fokus_pendampingan}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate(isPengawas ? 'supervisi' : 'rencana-aksi')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold shrink-0"
                  >
                    Buka
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
