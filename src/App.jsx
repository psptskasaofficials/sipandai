{/* HALAMAN PENGURUSAN ARTIKEL BULETIN */}
        {activeTab === 'kelola-buletin' && sessionUser && (
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* 1. BORANG TULIS / KEMAS KINI ARTIKEL */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingArticleId ? 'Sunting Artikel' : 'Tulis Artikel Amalan Terbaik Baharu'}
                  </h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {editingArticleId ? 'Kemas kini butiran artikel anda di bawah.' : 'Artikel yang dihantar akan dipaparkan secara langsung di portal utama.'}
                  </p>
                </div>
                {editingArticleId && (
                  <button 
                    type="button"
                    onClick={handleCancelEditArticle}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                  >
                    Batal Sunting
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveArticle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">Kategori Artikel</label>
                    <select 
                      value={newCategory} 
                      onChange={e => setNewCategory(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg bg-white"
                    >
                      <option value="Praktik Baik">Amalan Terbaik Pembelajaran</option>
                      <option value="Inovasi Pembelajaran">Inovasi Kurikulum & Media</option>
                      <option value="Kabar Sekolah">Berita Sekolah</option>
                      <option value="Manajerial">Kepimpinan & Pengurusan</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">Tajuk Artikel</label>
                    <input 
                      type="text"
                      placeholder="Masukkan tajuk artikel..." 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg text-xs" 
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Ringkasan Ringkas (1-2 Ayat)</label>
                  <textarea 
                    placeholder="Penerangan ringkas mengenai isi kandungan artikel..." 
                    rows={2} 
                    value={newSummary} 
                    onChange={e => setNewSummary(e.target.value)} 
                    className="w-full p-2.5 border rounded-lg text-xs" 
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Gambar Kulit / Dokumentasi</label>
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
                      <img src={coverPreview} alt="Pratonton" className="w-16 h-12 rounded-lg object-cover border" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Kandungan Penuh Artikel</label>
                  <textarea 
                    placeholder="Huraikan latar belakang, pelaksanaan inovasi, serta refleksi pengajaran di sini..." 
                    rows={8} 
                    value={newContent} 
                    onChange={e => setNewContent(e.target.value)} 
                    className="w-full p-2.5 border rounded-lg text-xs leading-relaxed" 
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmittingArticle} 
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    {isSubmittingArticle ? 'Menyimpan...' : (editingArticleId ? 'Simpan Perubahan' : 'Terbitkan Artikel Sekarang')}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. SENARAI RIWAYAT ARTIKEL (KEMBALI KE SINI SELEPAS SIMPAN) */}
            <div id="senarai-riwayat-artikel" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {sessionUser.role === 'pengawas' ? 'Semua Artikel Sistem' : 'Riwayat Artikel Saya'} ({myArticles.length})
                </h3>
              </div>

              {myArticles.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  Tiada artikel yang tersimpan setakat ini. Sila hantar artikel pertama anda di atas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 uppercase text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="p-3">Tajuk Artikel</th>
                        <th className="p-3">Penulis</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Tarikh</th>
                        <th className="p-3 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myArticles.map((art) => (
                        <tr key={art.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">{art.judul}</td>
                          <td className="p-3 text-slate-600">{art.author_name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold">
                              {art.kategori}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">
                            {new Date(art.created_at).toLocaleDateString('ms-MY')}
                          </td>
                          <td className="p-3 text-center space-x-1">
                            <button 
                              onClick={() => setSelectedArticle(art)} 
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" 
                              title="Baca Lengkap"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditArticle(art)} 
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" 
                              title="Sunting"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteArticle(art.id)} 
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" 
                              title="Padam"
                            >
                              <Trash2 className="w-4 h-4" />
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