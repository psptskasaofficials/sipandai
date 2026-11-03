import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';

export default function PrintBeritaAcara({ supervision, followUps = [], onClose, systemSettings }) {
  const school = supervision?.schools || {};

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

  const handlePrint = () => {
    window.print();
  };

  const kotaSurat = systemSettings?.kota_cetak || 'Pacitan';
  const tglVisitasi = formatTanggalIndo(supervision?.tanggal_supervisi);
  const pengawasNama = systemSettings?.pengawas_nama || 'Wijiatin, S.Pd., M.Pd.';
  const pengawasNip = systemSettings?.pengawas_nip || '197103151996032004';

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* BILAH TOMBOL AKSI ATAS */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <button
          onClick={onClose}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition text-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen (PDF)</span>
        </button>
      </div>

      {/* DOKUMEN CETAK BERITA ACARA */}
      <div 
        id="print-area" 
        className="max-w-4xl mx-auto bg-white p-8 sm:p-12 border border-slate-200 shadow-xl rounded-2xl text-slate-900 text-xs leading-relaxed"
      >
        {/* KOP RESMI SURAT */}
        <div className="text-center border-b-4 border-double border-black pb-3 mb-6">
          <h3 className="font-bold uppercase text-xs tracking-wider">
            {systemSettings?.instansi || 'Pemerintah Provinsi Jawa Timur • Dinas Pendidikan'}
          </h3>
          <h1 className="font-black uppercase text-base mt-1">
            BERITA ACARA PENDAMPINGAN DAN SUPERVISI PENDIDIKAN
          </h1>
          <p className="text-xs font-semibold mt-0.5">
            {systemSettings?.wilayah || 'Sekolah Binaan Wilayah Kerja Kabupaten Pacitan'}
          </p>
        </div>

        {/* IDENTITAS VISITASI SUPERVISI */}
        <div className="bg-slate-50 p-4 border border-black rounded-lg space-y-2 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div><strong>Satuan Pendidikan:</strong> {school.nama_sekolah || '-'}</div>
            <div><strong>NPSN:</strong> {school.npsn || '-'}</div>
            <div><strong>Kepala Sekolah:</strong> {school.nama_kepsek || '-'}</div>
            <div><strong>Pengawas Pembina:</strong> {pengawasNama}</div>
            <div><strong>Tanggal Visitasi:</strong> {tglVisitasi}</div>
            <div><strong>Jenis Supervisi:</strong> <span className="uppercase font-semibold">{supervision?.jenis_supervisi || 'Akademik'}</span></div>
          </div>
          <div className="pt-2 border-t border-slate-300">
            <strong>Fokus Pendampingan:</strong> {supervision?.fokus_pendampingan || '-'}
          </div>
        </div>

        {/* BAGIAN A: OBSERVASI & TEMUAN */}
        <div className="space-y-3 mb-6">
          <h4 className="font-bold border-b border-black pb-1 uppercase text-[11px] tracking-wide">
            A. Hasil Pengamatan & Temuan Lapangan
          </h4>
          <div className="space-y-2 pl-1">
            <p className="leading-relaxed">
              <strong>1. Kondisi / Situasi Lapangan:</strong><br />
              <span className="text-slate-800">{supervision?.kondisi_situasi || 'Tidak ada catatan kondisi khusus.'}</span>
            </p>
            <p className="leading-relaxed">
              <strong>2. Temuan Supervisi:</strong><br />
              <span className="text-slate-800">{supervision?.temuan || 'Tidak ada temuan khusus.'}</span>
            </p>
            <p className="leading-relaxed">
              <strong>3. Rekomendasi Solutif Pengawas:</strong><br />
              <span className="text-slate-800 font-medium">{supervision?.rekomendasi || 'Tindak lanjuti program perbaikan mutu.'}</span>
            </p>
          </div>
        </div>

        {/* BAGIAN B: MATRIKS RENCANA AKSI SEKOLAH */}
        <div className="space-y-3 mb-8">
          <h4 className="font-bold border-b border-black pb-1 uppercase text-[11px] tracking-wide">
            B. Matriks Rencana Aksi Tindak Lanjut Satuan Pendidikan
          </h4>
          
          <table className="w-full text-[11px] border border-collapse border-black">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-2 text-center" style={{ width: '5%' }}>No</th>
                <th className="border border-black p-2" style={{ width: '35%' }}>Rencana Aksi Komitmen</th>
                <th className="border border-black p-2" style={{ width: '22%' }}>Penanggung Jawab</th>
                <th className="border border-black p-2 text-center" style={{ width: '13%' }}>Status</th>
                <th className="border border-black p-2" style={{ width: '25%' }}>Validasi / Refleksi Pengawas</th>
              </tr>
            </thead>
            <tbody>
              {followUps.length === 0 ? (
                <tr>
                  <td colSpan="5" className="border border-black p-4 text-center italic text-slate-500">
                    Belum ada rencana aksi tindak lanjut yang dicatat.
                  </td>
                </tr>
              ) : (
                followUps.map((fu, idx) => (
                  <tr key={fu.id || idx} className="align-top">
                    <td className="border border-black p-2 text-center">{idx + 1}</td>
                    <td className="border border-black p-2 font-semibold">
                      {fu.rencana_aksi}
                      {fu.daya_dukung && (
                        <span className="block font-normal text-[10px] text-slate-600 mt-0.5">
                          Dukungan: {fu.daya_dukung}
                        </span>
                      )}
                    </td>
                    <td className="border border-black p-2">{fu.penanggung_jawab || '-'}</td>
                    <td className="border border-black p-2 text-center uppercase font-bold text-[10px]">
                      {fu.status_aksi || 'proses'}
                    </td>
                    <td className="border border-black p-2 italic">
                      {fu.validasi_pengawas || 'Menunggu verifikasi lapangan.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* BAGIAN TANDA TANGAN: KIRI (PENGAWAS PEMBINA) & KANAN (KEPALA SEKOLAH) */}
        <div className="mt-12 pt-4 grid grid-cols-2 gap-8 text-xs">
          {/* SEBELAH KIRI: PENGAWAS PEMBINA */}
          <div className="text-center space-y-1">
            <p className="invisible">Spacer Baris Titimangsa</p>
            <p className="font-semibold">Pengawas Pembina,</p>
            <div className="h-20"></div>
            <p className="font-bold underline text-sm">{pengawasNama}</p>
            <p>NIP. {pengawasNip}</p>
          </div>

          {/* SEBELAH KANAN: KEPALA SEKOLAH DENGAN TITIMANGSA */}
          <div className="text-center space-y-1">
            <p>{kotaSurat}, {tglVisitasi}</p>
            <p className="font-semibold">Kepala {school.nama_sekolah || 'Sekolah'},</p>
            <div className="h-20"></div>
            <p className="font-bold underline text-sm">
              {school.nama_kepsek || '(..................................................)'}
            </p>
            <p>NIP. {school.nip_kepsek || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
