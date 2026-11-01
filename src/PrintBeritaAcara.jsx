import React from 'react';
import { Printer, X } from 'lucide-react';

export default function PrintBeritaAcara({ supervision, followUps, onClose, systemSettings }) {
  if (!supervision) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto p-6 sm:p-10 relative print:shadow-none print:max-h-none print:w-full print:p-0">
        
        {/* Tombol aksi - disembunyikan sepenuhnya saat dicetak */}
        <div className="flex items-center justify-between border-b pb-4 mb-6 print:hidden">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Pratinjau Berita Acara Supervisi</h3>
            <p className="text-xs text-slate-500">Hanya mencetak dokumen resmi dari kop sampai tanda tangan.</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => window.print()} 
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AREA RESMI CETAK (KOP HINGGA TANDA TANGAN) */}
        <div className="text-slate-900 font-serif leading-relaxed text-sm space-y-6">
          {/* KOP DOKUMEN */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h4 className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">
              {systemSettings?.instansi || 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan'}
            </h4>
            <h2 className="text-lg font-bold uppercase tracking-wide font-sans mt-0.5">
              {systemSettings?.judul || 'SISTEM INFORMASI SUPERVISI & PENDAMPINGAN (SI PANDAI)'}
            </h2>
            <p className="text-xs font-sans text-slate-600">
              {systemSettings?.wilayah || 'Sekolah Binaan Wilayah Kerja Kabupaten Pacitan'}
            </p>
          </div>

          {/* NOMOR DAN JUDUL */}
          <div className="text-center my-4">
            <h3 className="text-base font-bold uppercase underline tracking-wider font-sans">
              BERITA ACARA & LEMBAR HASIL SUPERVISI {supervision.jenis_supervisi?.toUpperCase()}
            </h3>
            <span className="text-xs font-sans text-slate-600">
              Nomor Registrasi: REG-{supervision.id ? supervision.id.slice(0, 8).toUpperCase() : '001'}
            </span>
          </div>

          {/* IDENTITAS VISITASI */}
          <table className="w-full text-xs font-sans border-collapse">
            <tbody>
              <tr className="border-b">
                <td className="py-1.5 font-bold w-1/3">Satuan Pendidikan</td>
                <td className="py-1.5">: {supervision.schools?.nama_sekolah || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-bold">NPSN</td>
                <td className="py-1.5">: {supervision.schools?.npsn || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-bold">Hari / Tanggal Visitasi</td>
                <td className="py-1.5">: {supervision.tanggal_supervisi ? new Date(supervision.tanggal_supervisi).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-bold">Fokus Pendampingan</td>
                <td className="py-1.5">: {supervision.fokus_pendampingan || '-'}</td>
              </tr>
            </tbody>
          </table>

          {/* INSTRUMEN HASIL OBSERVASI */}
          <div className="space-y-4 font-sans text-xs">
            <div>
              <h5 className="font-bold uppercase text-slate-800 border-b pb-1">I. Kondisi & Situasi Lapangan</h5>
              <p className="mt-1.5 leading-relaxed text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded border">
                {supervision.kondisi_situasi || '-'}
              </p>
            </div>

            <div>
              <h5 className="font-bold uppercase text-slate-800 border-b pb-1">II. Temuan Lapangan</h5>
              <p className="mt-1.5 leading-relaxed text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded border">
                {supervision.temuan || '-'}
              </p>
            </div>

            <div>
              <h5 className="font-bold uppercase text-slate-800 border-b pb-1">III. Rekomendasi Solutif Pengawas</h5>
              <p className="mt-1.5 leading-relaxed text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded border">
                {supervision.rekomendasi || '-'}
              </p>
            </div>
          </div>

          {/* MATRIKS RENCANA AKSI */}
          <div className="space-y-2 font-sans text-xs">
            <h5 className="font-bold uppercase text-slate-800 border-b pb-1">IV. Matriks Komitmen Rencana Aksi Sekolah</h5>
            {(!followUps || followUps.length === 0) ? (
              <p className="italic text-slate-500 py-2">Belum ada matriks rencana aksi yang dicatatkan.</p>
            ) : (
              <table className="w-full text-left border border-slate-300 border-collapse mt-2">
                <thead className="bg-slate-100 text-slate-800 font-bold">
                  <tr>
                    <th className="border border-slate-300 p-2 text-center w-8">No</th>
                    <th className="border border-slate-300 p-2">Rencana Aksi Perbaikan</th>
                    <th className="border border-slate-300 p-2">Penanggung Jawab</th>
                    <th className="border border-slate-300 p-2">Daya Dukung</th>
                    <th className="border border-slate-300 p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.map((fu, i) => (
                    <tr key={fu.id || i} className="border-b">
                      <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                      <td className="border border-slate-300 p-2">{fu.rencana_aksi}</td>
                      <td className="border border-slate-300 p-2">{fu.penanggung_jawab}</td>
                      <td className="border border-slate-300 p-2">{fu.daya_dukung || '-'}</td>
                      <td className="border border-slate-300 p-2 text-center capitalize font-semibold">{fu.status_aksi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* TANDA TANGAN BERDAMPINGAN */}
          <div className="pt-8 font-sans text-xs grid grid-cols-2 gap-8 text-center break-inside-avoid">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold mt-0.5">Kepala Sekolah</p>
              <div className="h-20 flex items-end justify-center">
                <div className="w-48 border-b border-slate-800"></div>
              </div>
              <p className="font-bold mt-1">{supervision.schools?.nama_kepsek || '....................................'}</p>
              <p className="text-slate-600 text-[11px]">NIP. {supervision.schools?.nip_kepsek || '....................................'}</p>
            </div>
            <div>
              <p className="text-slate-600">Pacitan, {supervision.tanggal_supervisi ? new Date(supervision.tanggal_supervisi).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '........................'}</p>
              <p className="font-bold mt-0.5">Pengawas Pembina</p>
              <div className="h-20 flex items-end justify-center">
                <div className="w-48 border-b border-slate-800"></div>
              </div>
              <p className="font-bold mt-1">{systemSettings?.pengawas_nama || 'Drs. H. Mulyono, M.Pd.'}</p>
              <p className="text-slate-600 text-[11px]">NIP. {systemSettings?.pengawas_nip || '197005121998021001'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}