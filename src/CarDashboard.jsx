import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Car, Fuel, Calendar, DollarSign } from 'lucide-react';

const CarDashboard = () => {
  // Örnek veri seti - Gerçek CSV yüklendiğinde güncellenecek
  const sampleData = [
    { model: 'BMW 3 Series', year: 2020, price: 25000, transmission: 'Automatic', mileage: 15000, fuelType: 'Petrol', tax: 145, mpg: 45.2, engineSize: 2.0 },
    { model: 'Audi A4', year: 2019, price: 22000, transmission: 'Automatic', mileage: 25000, fuelType: 'Diesel', tax: 145, mpg: 55.3, engineSize: 2.0 },
    { model: 'Mercedes C Class', year: 2021, price: 30000, transmission: 'Automatic', mileage: 8000, fuelType: 'Petrol', tax: 145, mpg: 42.1, engineSize: 2.0 },
    { model: 'VW Golf', year: 2018, price: 15000, transmission: 'Manual', mileage: 35000, fuelType: 'Petrol', tax: 145, mpg: 50.2, engineSize: 1.5 },
    { model: 'Ford Focus', year: 2019, price: 13000, transmission: 'Manual', mileage: 30000, fuelType: 'Petrol', tax: 145, mpg: 48.5, engineSize: 1.6 },
    { model: 'Tesla Model 3', year: 2022, price: 45000, transmission: 'Automatic', mileage: 5000, fuelType: 'Electric', tax: 0, mpg: 0, engineSize: 0 },
    { model: 'Toyota Prius', year: 2020, price: 24000, transmission: 'Automatic', mileage: 18000, fuelType: 'Hybrid', tax: 0, mpg: 65.5, engineSize: 1.8 },
    { model: 'Honda Civic', year: 2019, price: 16000, transmission: 'Manual', mileage: 28000, fuelType: 'Petrol', tax: 145, mpg: 47.2, engineSize: 1.5 },
    { model: 'Nissan Leaf', year: 2021, price: 28000, transmission: 'Automatic', mileage: 12000, fuelType: 'Electric', tax: 0, mpg: 0, engineSize: 0 },
    { model: 'Hyundai i30', year: 2018, price: 12000, transmission: 'Manual', mileage: 40000, fuelType: 'Diesel', tax: 145, mpg: 58.2, engineSize: 1.6 },
  ];

  const [data, setData] = useState(sampleData);
  const [selectedFuel, setSelectedFuel] = useState('All');
  const [selectedTransmission, setSelectedTransmission] = useState('All');
  const [yearRange, setYearRange] = useState([2018, 2022]);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [csvName, setCsvName] = useState(null);

  const colors = {
    primary: '#c15f3c',
    secondary: '#b1ada1',
    background: '#f4f3ee',
    white: '#ffffff',
    accent1: '#d87e5f',
    accent2: '#a04d2e'
  };

  // Filtrelenmiş veri
  const filteredData = useMemo(() => {
    return data.filter(car => {
      const fuelMatch = selectedFuel === 'All' || car.fuelType === selectedFuel;
      const transMatch = selectedTransmission === 'All' || car.transmission === selectedTransmission;
      const yearMatch = car.year >= yearRange[0] && car.year <= yearRange[1];
      return fuelMatch && transMatch && yearMatch;
    });
  }, [data, selectedFuel, selectedTransmission, yearRange]);

  // KPI hesaplamaları (boş veri kontrolü eklendi)
  const avgPrice = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return Math.round(filteredData.reduce((sum, car) => sum + car.price, 0) / filteredData.length);
  }, [filteredData]);

  const avgMileage = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return Math.round(filteredData.reduce((sum, car) => sum + car.mileage, 0) / filteredData.length);
  }, [filteredData]);

  const avgMPG = useMemo(() => {
    const carsWithMPG = filteredData.filter(car => car.mpg > 0);
    return carsWithMPG.length > 0 
      ? (carsWithMPG.reduce((sum, car) => sum + car.mpg, 0) / carsWithMPG.length).toFixed(1)
      : 0;
  }, [filteredData]);

  // Yıllara göre ortalama fiyat
  const priceByYear = useMemo(() => {
    const grouped = {};
    filteredData.forEach(car => {
      if (!grouped[car.year]) {
        grouped[car.year] = { year: car.year, totalPrice: 0, count: 0 };
      }
      grouped[car.year].totalPrice += car.price;
      grouped[car.year].count++;
    });
    return Object.values(grouped)
      .map(g => ({ year: g.year, avgPrice: Math.round(g.totalPrice / g.count) }))
      .sort((a, b) => a.year - b.year);
  }, [filteredData]);

  // Yakıt tipine göre dağılım
  const fuelDistribution = useMemo(() => {
    const grouped = {};
    filteredData.forEach(car => {
      grouped[car.fuelType] = (grouped[car.fuelType] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Vites tipine göre ortalama fiyat
  const priceByTransmission = useMemo(() => {
    const grouped = {};
    filteredData.forEach(car => {
      if (!grouped[car.transmission]) {
        grouped[car.transmission] = { transmission: car.transmission, totalPrice: 0, count: 0 };
      }
      grouped[car.transmission].totalPrice += car.price;
      grouped[car.transmission].count++;
    });
    return Object.values(grouped).map(g => ({ 
      transmission: g.transmission, 
      avgPrice: Math.round(g.totalPrice / g.count) 
    }));
  }, [filteredData]);

  const COLORS = [colors.primary, colors.accent1, colors.accent2, colors.secondary];

  // Normalize parsed CSV rows to the shape expected by the dashboard
  const normalizeRows = (rows) => {
    return rows
      .map(r => ({
        model: r.model ? r.model.trim() : '',
        year: r.year ? Number(r.year) : null,
        price: r.price ? Number(r.price) : 0,
        transmission: r.transmission ? r.transmission.trim() : '',
        mileage: r.mileage ? Number(r.mileage) : 0,
        fuelType: r.fuelType ? r.fuelType.trim() : '',
        tax: r.tax ? Number(r.tax) : 0,
        mpg: r.mpg ? Number(r.mpg) : 0,
        engineSize: r.engineSize ? Number(r.engineSize) : 0,
      }))
      .filter(r => r.model && r.year);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLoadingCsv(true);
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = normalizeRows(results.data);
        setData(parsed);
        setCsvName(file.name);
        setLoadingCsv(false);
      },
      error: () => setLoadingCsv(false)
    });
  };

  const loadProjectCsv = async () => {
    setLoadingCsv(true);
    try {
      const res = await fetch('/ford.csv');
      if (!res.ok) throw new Error('Yüklenemedi');
      const text = await res.text();
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = normalizeRows(results.data);
          setData(parsed);
          setCsvName('ford.csv');
          setLoadingCsv(false);
        },
        error: () => setLoadingCsv(false)
      });
    } catch (err) {
      setLoadingCsv(false);
      alert('`ford.csv` yüklenemedi: ' + err.message);
    }
  };

  // Yardımcı: yıl aralığını güvenli güncelle
  const handleMinYearChange = (v) => {
    const min = Math.min(v, yearRange[1]);
    setYearRange([min, yearRange[1]]);
  };
  const handleMaxYearChange = (v) => {
    const max = Math.max(v, yearRange[0]);
    setYearRange([yearRange[0], max]);
  };

  return (
    <div style={{ 
      backgroundColor: colors.background, 
      minHeight: '100vh', 
      padding: '24px',
      fontFamily: "'Tiempos Text', Georgia, 'Times New Roman', serif"
    }}>
      <style>
        {`@import url('https://fonts.cdnfonts.com/css/tiempos-text');
        body {-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;}`}
      </style>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '600', color: colors.primary, marginBottom: '8px', letterSpacing: '-0.01em' }}>Araba Verileri Analizi</h1>
          <p style={{ color: colors.primary, fontSize: '17px', fontWeight: '400', letterSpacing: '0' }}>İnteraktif dashboard ile araç verilerinizi keşfedin</p>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: colors.white, padding: '32px', borderRadius: '16px', marginBottom: '28px', boxShadow: '0 1px 3px rgba(193, 95, 60, 0.08)', border: `1px solid ${colors.background}` }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: colors.primary, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filtreler</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: colors.secondary, marginBottom: '10px', fontWeight: '500' }}>Yakıt Tipi</label>
              <select value={selectedFuel} onChange={(e) => setSelectedFuel(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: `1.5px solid ${colors.background}`, backgroundColor: colors.white, color: colors.primary, fontSize: '15px', fontWeight: '400', cursor: 'pointer', outline: 'none', transition: 'all 0.2s' }}>
                <option value="All">Tümü</option>
                <option value="Petrol">Benzin</option>
                <option value="Diesel">Dizel</option>
                <option value="Electric">Elektrik</option>
                <option value="Hybrid">Hibrit</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: colors.secondary, marginBottom: '10px', fontWeight: '500' }}>Vites Tipi</label>
              <select value={selectedTransmission} onChange={(e) => setSelectedTransmission(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: `1.5px solid ${colors.background}`, backgroundColor: colors.white, color: colors.primary, fontSize: '15px', fontWeight: '400', cursor: 'pointer', outline: 'none', transition: 'all 0.2s' }}>
                <option value="All">Tümü</option>
                <option value="Manual">Manuel</option>
                <option value="Automatic">Otomatik</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: colors.secondary, marginBottom: '10px', fontWeight: '500' }}>Yıl Aralığı: {yearRange[0]} - {yearRange[1]}</label>
              <div style={{display:'flex',gap:8}}>
                <input type="range" min="2018" max="2022" value={yearRange[0]} onChange={(e)=>handleMinYearChange(parseInt(e.target.value))} style={{flex:1,accentColor:colors.primary}} />
                <input type="range" min="2018" max="2022" value={yearRange[1]} onChange={(e)=>handleMaxYearChange(parseInt(e.target.value))} style={{flex:1,accentColor:colors.primary}} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <div style={{ backgroundColor: colors.white, padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(193, 95, 60, 0.08)', border: `1px solid ${colors.background}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '13px', color: colors.secondary, marginBottom: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ortalama Fiyat</p>
                <p style={{ fontSize: '40px', fontWeight: '600', color: colors.primary, letterSpacing: '-0.02em' }}>£{avgPrice.toLocaleString()}</p>
              </div>
              <DollarSign size={36} color={colors.primary} style={{ opacity: 0.15 }} strokeWidth={1.5} />
            </div>
          </div>

          <div style={{ backgroundColor: colors.white, padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(193, 95, 60, 0.08)', border: `1px solid ${colors.background}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '13px', color: colors.secondary, marginBottom: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Toplam Araç</p>
                <p style={{ fontSize: '40px', fontWeight: '600', color: colors.primary, letterSpacing: '-0.02em' }}>{filteredData.length}</p>
              </div>
              <Car size={36} color={colors.primary} style={{ opacity: 0.15 }} strokeWidth={1.5} />
            </div>
          </div>

          <div style={{ backgroundColor: colors.white, padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(193, 95, 60, 0.08)', border: `1px solid ${colors.background}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '13px', color: colors.secondary, marginBottom: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ortalama Kilometre</p>
                <p style={{ fontSize: '40px', fontWeight: '600', color: colors.primary, letterSpacing: '-0.02em' }}>{avgMileage.toLocaleString()}</p>
              </div>
              <Calendar size={36} color={colors.primary} style={{ opacity: 0.15 }} strokeWidth={1.5} />
            </div>
          </div>

          <div style={{ backgroundColor: colors.white, padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(193, 95, 60, 0.08)', border: `1px solid ${colors.background}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '13px', color: colors.secondary, marginBottom: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ortalama MPG</p>
                <p style={{ fontSize: '40px', fontWeight: '600', color: colors.primary, letterSpacing: '-0.02em' }}>{avgMPG}</p>
              </div>
              <Fuel size={36} color={colors.primary} style={{ opacity: 0.15 }} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>

          {/* Yıllara Göre Ortalama Fiyat */}
          <div style={{ backgroundColor: colors.white, padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(193, 95, 60, 0.08)', border: `1px solid ${colors.background}` }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.primary, marginBottom: '24px', letterSpacing: '-0.01em' }}>Yıllara Göre Ortalama Fiyat</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceByYear}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} opacity={0.2} />
                <XAxis dataKey="year" stroke={colors.secondary} style={{ fontSize: '14px', fontWeight: '400' }} />
                <YAxis stroke={colors.secondary} style={{ fontSize: '14px', fontWeight: '400' }} />
                <Tooltip contentStyle={{ backgroundColor: colors.white, border: `1px solid ${colors.background}`, borderRadius: '8px' }} formatter={(value) => `£${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="avgPrice" stroke={colors.primary} strokeWidth={2.5} dot={{ fill: colors.primary, r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Yakıt Tipi Dağılımı */}
          <div style={{ backgroundColor: colors.white, padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(193, 95, 60, 0.08)', border: `1px solid ${colors.background}` }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.primary, marginBottom: '24px', letterSpacing: '-0.01em' }}>Yakıt Tipi Dağılımı</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={fuelDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {fuelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: colors.white, border: `1px solid ${colors.background}`, borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Vites Tipine Göre Ortalama Fiyat */}
          <div style={{ backgroundColor: colors.white, padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(193, 95, 60, 0.08)', border: `1px solid ${colors.background}` }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.primary, marginBottom: '24px', letterSpacing: '-0.01em' }}>Vites Tipine Göre Fiyat</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priceByTransmission}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} opacity={0.2} />
                <XAxis dataKey="transmission" stroke={colors.secondary} style={{ fontSize: '14px', fontWeight: '400' }} />
                <YAxis stroke={colors.secondary} style={{ fontSize: '14px', fontWeight: '400' }} />
                <Tooltip contentStyle={{ backgroundColor: colors.white, border: `1px solid ${colors.background}`, borderRadius: '8px' }} formatter={(value) => `£${value.toLocaleString()}`} />
                <Bar dataKey="avgPrice" fill={colors.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Kilometre vs Fiyat Scatter */}
          <div style={{ backgroundColor: colors.white, padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(193, 95, 60, 0.08)', border: `1px solid ${colors.background}` }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.primary, marginBottom: '24px', letterSpacing: '-0.01em' }}>Kilometre - Fiyat İlişkisi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} opacity={0.2} />
                <XAxis dataKey="mileage" name="Kilometre" stroke={colors.secondary} style={{ fontSize: '14px', fontWeight: '400' }} />
                <YAxis dataKey="price" name="Fiyat" stroke={colors.secondary} style={{ fontSize: '14px', fontWeight: '400' }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: colors.white, border: `1px solid ${colors.background}`, borderRadius: '8px' }} formatter={(value, name) => name === 'Fiyat' ? `£${value.toLocaleString()}` : value.toLocaleString()} />
                <Scatter data={filteredData} fill={colors.primary} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CarDashboard;
