return (
    <AdminDashboardShell title="Analytics" description="Monitor performa dan aktivitas rumah sakit.">
      
      <div className="bg-slate-50 min-h-screen p-6 -mt-6 -mx-6 text-gray-800 font-sans rounded-xl">
        
        {/* ========================================== */}
        {/* BAGIAN 1: GRID METRIK 6 KOTAK (INTERAKTIF) */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard 
            label="Total Pasien" value={s.patients} icon={<Users size={20} />} color="blue" 
            onClick={() => handleNavigate('/admin/patients')}
          />
          <MetricCard 
            label="Pre-Operasi" value={s.preOp} icon={<ClipboardPlus size={20} />} color="orange" 
            // FIX: Merubah URL menjadi "pendaftaran-operasi" sesuai sidebar Anda
            onClick={() => handleNavigate('/admin/pendaftaran-operasi')} 
          />
          
          <DonutCardPremium 
            title="BPJS" total={parsedData.bpjsTotal} data={parsedData.bpjsBreakdown} colors={colorsBPJS} 
            onClick={() => handleNavigate('/admin/patients', 'BPJS')}
          />
          <DonutCardPremium 
            title="NON BPJS" total={parsedData.nonBpjsTotal} data={parsedData.nonBpjsBreakdown} colors={colorsNonBPJS} 
            onClick={() => handleNavigate('/admin/patients', 'Non BPJS')}
          />

          <MetricCard 
            label="Total Dokter" value={s.doctors} icon={<Stethoscope size={20} />} color="emerald" 
            // FIX: Merubah URL menjadi "doctors" agar tidak Not Found (Atau ubah jadi "dokter" jika nama rutenya dokter)
            onClick={() => handleNavigate('/admin/doctors')}
          />
          <MetricCard 
            label="Jumlah Kamar" value={s.rooms} icon={<BedDouble size={20} />} color="indigo" 
            onClick={() => handleNavigate('/admin/rooms')}
          />
        </div>

        {/* ========================================== */}
        {/* BAGIAN 2: GRAFIK KUNJUNGAN & DOKTER AKTIF  */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chart Kunjungan Pasien (DENGAN EFEK SHADOW BIRU) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 text-lg">Dinamika Kunjungan Pasien</h3>
                <div className="flex bg-slate-100 p-1 rounded-xl mt-3 sm:mt-0 shadow-inner">
                  <button onClick={() => setTimeScale('mingguan')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${timeScale === 'mingguan' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Mingguan</button>
                  <button onClick={() => setTimeScale('bulanan')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${timeScale === 'bulanan' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Bulanan</button>
                  <button onClick={() => setTimeScale('tahunan')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${timeScale === 'tahunan' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Tahunan</button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px 14px' }} labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }} />
                  <Bar dataKey="kunjungan" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={timeScale === 'bulanan' ? 24 : 40} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Tren Hunian Kamar (DENGAN EFEK SHADOW BIRU) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-300">
              <h3 className="mb-6 font-bold text-gray-800 text-lg">Tren Hunian Kamar (Bulan Ini)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={parsedData.dataHunian} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTerisi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10b981" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelStyle={{ fontWeight: 'bold', color: '#334155' }} />
                  <Area type="monotone" dataKey="terisi" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTerisi)" activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }} style={{ filter: 'url(#glow)' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daftar Dokter Aktif (DENGAN EFEK SHADOW BIRU) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Dokter Aktif</h3>
              <UserCheck size={20} className="text-emerald-500" />
            </div>
            <div className="flex-1 space-y-0 overflow-y-auto pr-2">
              {activeDoctors.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-10">Tidak ada dokter aktif.</div>
              ) : (
                activeDoctors.map((doc, i) => {
                  const namaDokter = doc.full_name || "Nama Dokter";
                  const initial = namaDokter.replace(/^(dr\.|drg\.)\s*/i, '').charAt(0).toUpperCase();
                  return (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-lg px-2 -mx-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-sm shadow-sm border border-emerald-100">{initial}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{namaDokter}</p>
                          <p className="text-[11px] text-gray-500 font-medium">{doc.specialization || "Umum"}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="text-[10px] h-5 px-2 rounded bg-emerald-500 hover:bg-emerald-600 shadow-sm border-0">{doc.status}</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* BAGIAN 3: TABEL JADWAL & CHART OPERASI     */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* KIRI: Tabel Jadwal Terdekat (DENGAN EFEK SHADOW BIRU) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Jadwal Terdekat (Menunggu)</h3>
              <CalendarClock size={20} className="text-blue-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold rounded-tl-lg">Dokter</th>
                    <th className="py-3 px-4 font-semibold">Pasien</th>
                    <th className="py-3 px-4 font-semibold">Waktu</th>
                    <th className="py-3 px-4 font-semibold rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">Tidak ada jadwal tertunda.</td>
                    </tr>
                  ) : (
                    activeSchedules.map((sch, idx) => {
                      const dName = sch.doctors?.full_name || "Dokter";
                      const initial = dName.replace(/^(dr\.|drg\.)\s*/i, '').charAt(0).toUpperCase();
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">{initial}</div>
                              <span className="font-semibold text-gray-900">{dName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{sch.patients?.nama || "Pasien"}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800">{sch.tanggal}</span>
                              <span className="text-[10px] text-gray-500">{sch.jam}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-200 bg-orange-50">
                              {sch.status || "Undone"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* KANAN: Line Chart Pendaftaran Operasi (DENGAN EFEK SHADOW BIRU) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Tren Pendaftaran Operasi</h3>
              <div className="flex bg-slate-100 p-1 rounded-xl mt-3 sm:mt-0 shadow-inner">
                <button onClick={() => setOpTimeScale('mingguan')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${opTimeScale === 'mingguan' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}>Mingguan</button>
                <button onClick={() => setOpTimeScale('bulanan')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${opTimeScale === 'bulanan' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}>Bulanan</button>
                <button onClick={() => setOpTimeScale('tahunan')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${opTimeScale === 'tahunan' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}>Tahunan</button>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activeOpChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.4"/>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px 14px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="operasi" 
                  stroke="#8b5cf6" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} 
                  activeDot={{ r: 7, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                  style={{ filter: 'url(#glowPurple)' }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>
    </AdminDashboardShell>
  );
}

// ==========================================
// KOMPONEN PEMBANTU (UI ELEMENTS) TETAP SAMA
// ==========================================
function MetricCard({ label, value, icon, color, onClick }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-300 group col-span-1"
    >
      <div className="flex justify-between items-start mb-3">
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
        <div className={`p-2 rounded-lg ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <h3 className="text-3xl font-black text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">{value}</h3>
    </div>
  );
}

function DonutCardPremium({ title, total, data, colors, onClick }: any) {
  const safeTotal = total > 0 ? total : 1;
  const remainder = safeTotal - data.reduce((acc: any, val: any) => acc + val.value, 0);
  
  const pieData = total > 0 
    ? [...data, { name: 'Sisa/Lama', value: remainder > 0 ? remainder : 0 }] 
    : [{ name: 'Kosong', value: 1 }];
    
  const safeColors = total > 0 ? [...colors, '#f1f5f9'] : ['#f1f5f9'];

  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:row-span-2 flex flex-col justify-between cursor-pointer hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-300 group"
    >
      <div>
        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{total}</h3>
      </div>
      
      <div className="flex flex-col xl:flex-row items-center justify-between mt-4 flex-1 gap-2">
        <div className="w-24 h-24 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" stroke="none">
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={safeColors[index % safeColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-col gap-2 w-full xl:w-auto xl:ml-2">
          {total > 0 ? (
            data.map((entry: any, i: number) => (
              <div key={i} className="flex items-center justify-between xl:justify-start gap-2 text-[10px] text-gray-500 font-medium bg-slate-50 xl:bg-transparent px-2 py-1 xl:p-0 rounded-md">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }}></div>
                  <span>{entry.name}</span>
                </div>
                <span className="font-bold text-gray-800 text-xs">{entry.value}</span>
              </div>
            ))
          ) : (
            <div className="text-[10px] text-gray-400 text-center">Belum ada data</div>
          )}
        </div>
      </div>
    </div>
  );
}