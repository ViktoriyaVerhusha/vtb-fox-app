import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { Trophy, Settings, CreditCard, Users, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Инициализация Supabase ---
const supabaseUrl = 'https://afhnukaexyezqugazjhe.supabase.co';
const supabaseKey = 'sb_publishable_zfD1h2R-vz_JNbddo1CHsg_Fmq4re63';
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  const [user, setUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('game');
  const [showDevMenu, setShowDevMenu] = useState(false);

  // Для теста используем фиксированный ID (в Telegram он будет уникальным для каждого)
  const TEMP_USER_ID = "agent_007_vtb"; 

  useEffect(() => {
    fetchProfile();
    fetchLeaderboard();
  }, []);

  // --- Загрузка профиля из БД ---
  const fetchProfile = async () => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', TEMP_USER_ID)
        .single();

      if (error && error.code === 'PGRST116') {
        // Если профиля нет — создаем новый
        const { data: newUser } = await supabase
          .from('profiles')
          .insert([{ 
            telegram_id: TEMP_USER_ID, 
            full_name: "Виктория (Тест)", 
            region: "Москва",
            sales_count: 0,
            happiness: 50 
          }])
          .select()
          .single();
        setUser(newUser);
      } else {
        setUser(data);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Загрузка рейтинга ---
  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, sales_count, region')
      .order('sales_count', { ascending: false })
      .limit(10);
    setLeaderboard(data || []);
  };

  // --- Экшен: Продажа карты ---
  const handleSale = async () => {
    if (!user) return;

    const newSales = user.sales_count + 1;
    const newHappiness = Math.min(100, user.happiness + 20);

    // Мгновенное обновление в UI (Optimistic UI)
    setUser({ ...user, sales_count: newSales, happiness: newHappiness });
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#002882', '#EE2C3C', '#FFFFFF']
    });

    // Сохранение в базу
    await supabase
      .from('profiles')
      .update({ sales_count: newSales, happiness: newHappiness, updated_at: new Date() })
      .eq('telegram_id', TEMP_USER_ID);
    
    fetchLeaderboard(); // Обновляем топ после продажи
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-[#002882] font-bold">Загрузка VTB Fox...</div>;

  const getFoxStatus = () => {
    const h = user?.happiness || 0;
    if (h >= 100) return { emoji: '🧢🦊💰', text: 'VTB King!', color: 'text-yellow-600', bg: 'bg-blue-50' };
    if (h > 70) return { emoji: '😎🦊', text: 'Superstar!', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (h > 30) return { emoji: '🦊', text: 'Ready to work!', color: 'text-gray-700', bg: 'bg-white' };
    return { emoji: '🕸️🦊😢', text: 'Нужны продажи...', color: 'text-red-500', bg: 'bg-gray-100' };
  };

  const status = getFoxStatus();

  return (
    <div className={`min-h-screen max-w-md mx-auto flex flex-col font-sans transition-colors duration-500 ${status.bg}`}>
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-[#002882] text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#002882] font-black italic">V</div>
          <span className="font-bold tracking-tight">FOX MANAGER</span>
        </div>
        <button onClick={() => setShowDevMenu(!showDevMenu)} className="opacity-30"><Settings size={18}/></button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col p-6 relative">
        {/* Tab Switcher */}
        <div className="flex bg-gray-200/50 rounded-xl p-1 mb-8">
          <button 
            onClick={() => setActiveTab('game')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'game' ? 'bg-white text-[#002882] shadow-sm' : 'text-gray-500'}`}
          >
            Моя Лиса
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-white text-[#002882] shadow-sm' : 'text-gray-500'}`}
          >
            Рейтинг РФ
          </button>
        </div>

        {activeTab === 'game' ? (
          <div className="flex-1 flex flex-col items-center justify-between py-4">
            {/* Happiness Bar */}
            <div className="w-full">
              <div className="flex justify-between text-[10px] font-black text-blue-900 uppercase mb-1">
                <span>Уровень счастья</span>
                <span>{user.happiness}%</span>
              </div>
              <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden border border-blue-200">
                <motion.div 
                  animate={{ width: `${user.happiness}%` }}
                  className={`h-full ${user.happiness < 30 ? 'bg-red-500' : 'bg-[#002882]'}`}
                />
              </div>
            </div>

            {/* Fox Sprite */}
            <motion.div 
              key={status.emoji}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-9xl my-10 drop-shadow-xl"
            >
              {status.emoji}
            </motion.div>

            <div className="text-center space-y-2">
              <h2 className={`text-3xl font-black ${status.color}`}>{status.text}</h2>
              <p className="text-gray-400 font-medium">Всего выдано: {user.sales_count}</p>
            </div>

            <button
              onClick={handleSale}
              className="w-full bg-[#002882] active:scale-95 text-white font-black py-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-xl mt-8"
            >
              <CreditCard />
              Я ВЫДАЛА КАРТУ!
            </button>
          </div>
        ) : (
          <div className="flex-1">
            <h3 className="text-lg font-black text-[#002882] mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" /> ТОП-10 РОССИЯ
            </h3>
            <div className="space-y-3">
              {leaderboard.map((item, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${item.full_name.includes('Виктория') ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-gray-300">#{i + 1}</span>
                    <div>
                      <div className="font-bold text-sm">{item.full_name}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{item.region}</div>
                    </div>
                  </div>
                  <div className="font-black text-[#002882]">{item.sales_count} 💳</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Stats */}
      <footer className="p-6 grid grid-cols-2 gap-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><Zap size={20}/></div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">Стрик</div>
            <div className="font-black text-sm">5 Дней</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg text-green-600"><TrendingUp size={20}/></div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">В топе</div>
            <div className="font-black text-sm">Топ 5%</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
