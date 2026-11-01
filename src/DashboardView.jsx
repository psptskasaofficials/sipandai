import React from 'react';
import { 
  Building2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Bell, 
  ChevronRight,
  Award
} from 'lucide-react';

export default function DashboardView({ 
  sessionUser, 
  currentSchool, 
  supervisions, 
  schools, 
  notifications, 
  onNavigate 
}) {
  const isPengawas = sessionUser?.role === 'pengawas';

  const totalSupervisi = supervisions.length;
  const selesaiCount = supervisions.filter(s => s.status === 'selesai').length;
  const tindakLanjutCount = supervisions.filter(s => s.status === 'tindak_lanjut').length;
  const terjadwalCount = supervisions.filter(s => s.status === 'terjadwal').length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-blue-100 rounded-full text-xs font-semibold uppercase tracking-wider">
              {isPengawas ? 'Ruang Kendali Pengawas' : 'Dasbor Satuan Pendidikan'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 leading-tight">
              Selamat Datang, {sessionUser?.nama}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              {isPengawas 
                ? `Memantau ${schools.length} Satuan Pendidikan Binaan di Wilayah Kerja.` 
                : `${currentSchool?.nama_sekolah || sessionUser?.namaSekolah} • NPSN: ${currentSchool?.npsn || sessionUser?.npsn}`}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0 min-w-[140px]">
            <span className="text-xs text-blue-200 block uppercase font-medium">Total Supervisi</span>
            <span className="text-3xl font-black">{totalSupervisi}</span>
            <span className="text-[10px] text-blue-200 block mt-0.5">Sesi Kunjungan</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isPengawas ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Sekolah Binaan</span>
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{schools.length}</div>
            <span className="text-[11px] text-slate-500">Lembaga Terdaftar</span>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Akreditasi</span>
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">Peringkat {currentSchool?.akreditasi || 'A'}</div>
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
          <span className="text-[11px] text-blue-700 font-medium">Proses Pemenuhan Bukti</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tuntas / Selesai</span>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{selesaiCount}</div>
          <span className="text-[11px] text-emerald-700 font-medium">Hasil Divalidasi</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Pemberitahuan & Isian Baru</h3>
            </div>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
              {notifications.length} Info
            </span>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Belum ada aktivitas isian baru saat ini.
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-xl border text-xs space-y-1 transition ${
                    notif.tipe === 'aksi_baru' ? 'bg-amber-50/60 border-amber-200' :
                    notif.tipe === 'supervisi_baru' ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50 border-slate-200'
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
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isPengawas ? 'Agenda Supervisi Terkini' : 'Supervisi Sekolah Anda'}
              </h3>
            </div>
            <button 
              onClick={() => onNavigate(isPengawas ? 'supervisi' : 'catatan-supervisi')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>Buka Menu</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}