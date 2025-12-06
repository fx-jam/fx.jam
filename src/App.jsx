import React, { useState, useMemo } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from './common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import { allEvents } from './data/events';
import { getUpcomingDates, getPastDates, getEventUrgencyLabel } from './utils/dateUtils';

const { FiCalendar, FiMail, FiInstagram, FiExternalLink, FiCpu, FiMusic } = FiIcons;
const { FaSoundcloud, FaBandcamp, FaSpotify } = FaIcons;
const { MdPiano, MdTimer, MdLibraryMusic } = MdIcons;

// --- Components ---

const Header = () => (
  <header className="text-center py-6 shrink-0 z-10 relative">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-block mb-2"
    >
      <div className="h-1 w-20 bg-accent-highlight rounded-full mx-auto mb-3 opacity-50" />
    </motion.div>
    <motion.h1 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-accent-highlight via-orange-400 to-accent-primary mb-2 tracking-tight drop-shadow-lg"
    >
      fx_jam
    </motion.h1>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-text-secondary text-xs font-bold tracking-[0.2em] uppercase"
    >
      Producteur Électronique & DJ
    </motion.p>
  </header>
);

const NavTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dj', label: 'Live & Releases', icon: FiMusic },
    { id: 'tools', label: 'Studio Tools', icon: FiCpu },
    { id: 'contact', label: 'Contact', icon: FiMail }
  ];

  return (
    <nav className="flex justify-center gap-3 py-4 flex-wrap z-10 relative">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            relative px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300
            border backdrop-blur-xl flex items-center gap-2 group
            ${activeTab === tab.id 
              ? 'text-white border-accent-primary/50 bg-accent-primary/20 shadow-[0_0_20px_rgba(102,126,234,0.3)]' 
              : 'text-text-secondary border-white/5 bg-bg-card/30 hover:bg-white/10 hover:border-white/20 hover:text-white'}
          `}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-xl -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <SafeIcon icon={tab.icon} className={`text-sm ${activeTab === tab.id ? 'text-accent-highlight' : 'group-hover:text-accent-highlight transition-colors'}`} />
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

const DjSection = () => {
  // Calculer les dates à l'affichage pour éviter les bateaux manqués
  const upcomingDates = useMemo(() => getUpcomingDates(allEvents), []);
  const pastDates = useMemo(() => getPastDates(allEvents), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full flex flex-col lg:flex-row gap-4"
    >
      {/* Colonne dates - Étroite et haute (300px max) */}
      <div className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 flex flex-col shadow-2xl hover:border-white/20 transition-all duration-500 lg:w-64 lg:h-[520px] w-full h-auto">

        {/* Section Prochaines Dates */}
        <div className="flex-shrink-0">
          <h3 className="text-accent-highlight text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 border-b border-white/5 pb-2">
            <SafeIcon icon={FiCalendar} className="text-sm" />Prochaines
          </h3>

          {upcomingDates.length > 0 ? (
            <div className="space-y-1.5 mb-3">
              {upcomingDates.map((item, i) => {
                const urgencyLabel = getEventUrgencyLabel(item.date);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-accent-primary/20 hover:bg-white/10 hover:border-accent-primary/40 transition-all group cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center bg-accent-primary/25 border border-accent-primary/40 rounded-md w-11 h-11 shrink-0 group-hover:scale-105 transition-transform">
                      <span className="text-accent-highlight font-bold text-[10px] text-center leading-tight">
                        {item.date.split(' ')[0]}<br/>{item.date.split(' ')[1]}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-white text-[11px] font-bold tracking-wide group-hover:text-accent-highlight transition-colors truncate">
                        {item.event}
                      </span>
                      <span className="text-text-muted text-[9px] font-medium truncate">
                        {item.genre}
                      </span>
                      {urgencyLabel && (
                        <span className="text-accent-highlight text-[8px] font-bold mt-0.5">
                          {urgencyLabel}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-text-muted text-[11px] text-center py-3 opacity-60">
              Aucune date disponible
            </div>
          )}
        </div>

        {/* Section Archives */}
        <div className="flex-1 flex flex-col min-h-0 mt-2 border-t border-white/5 pt-2">
          <h3 className="text-text-muted text-xs font-black uppercase tracking-widest mb-1.5 border-b border-white/5 pb-1.5 flex-shrink-0">
            Archives
          </h3>
          <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 pr-1">
            {pastDates.length > 0 ? (
              pastDates.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-1.5 rounded-md hover:bg-white/5 transition-colors opacity-60 hover:opacity-100 group text-[10px]"
                >
                  <span className="text-text-secondary font-mono min-w-[50px] text-right border-r border-white/10 pr-1.5 flex-shrink-0">
                    {item.date}
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-text-primary font-bold group-hover:text-white truncate">
                      {item.event}
                    </span>
                    <span className="text-text-muted text-[8px] truncate">
                      {item.genre}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-text-muted text-[10px] text-center py-2 opacity-60">
                Aucun événement archivé
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Colonne musique - Stacked vertically pour mobile, prend la place restante sur desktop */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        {/* Conteneur SoundCloud */}
        <div className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden group hover:border-accent-highlight/30 transition-all duration-500">
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-white/5">
            <h3 className="text-accent-highlight text-xs font-bold flex items-center gap-2 uppercase tracking-wider">
              <SafeIcon icon={FaSoundcloud} className="text-lg" /> Releases
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-bold text-text-muted bg-black/20 px-2 py-1 rounded border border-white/5">Latest Tracks</span>
            </div>
          </div>
          <iframe
            width="100%"
            height="300"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            className="opacity-90 group-hover:opacity-100 transition-opacity duration-500"
            src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/hamcatmusic/tracks&color=%23ffd93d&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=false"
            title="SoundCloud - Derniers tracks"
          ></iframe>
        </div>

        {/* Conteneur Spotify */}
        <div className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden group hover:border-[#1DB954]/50 transition-all duration-500">
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-white/5">
            <h3 className="text-[#1DB954] text-xs font-bold flex items-center gap-2 uppercase tracking-wider">
              <SafeIcon icon={FaSpotify} className="text-lg" /> Spotify Playlist
            </h3>
            <SafeIcon icon={FiExternalLink} className="text-text-muted text-xs group-hover:text-white transition-colors" />
          </div>
          <iframe
            style={{borderRadius: '0 0 12px 12px'}}
            src="https://open.spotify.com/embed/playlist/0HXFBbIxUQD9g7PjRt9gpR?utm_source=generator&theme=0"
            width="100%"
            height="120"
            frameBorder="0"
            allowFullScreen=""
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="opacity-90 group-hover:opacity-100 transition-opacity duration-500"
            title="Spotify - Playlist"
          ></iframe>
        </div>
      </div>
    </motion.div>
  );
};

const ToolsSection = () => {
  const tools = [
    { name: "Pitch/Tempo Pro", icon: MdTimer, desc: "Harmonic mixing calculator", link: "tools/pitch.html", color: "text-blue-400" },
    { name: "BPM Converter", icon: MdLibraryMusic, desc: "Binary to Ternary & more", link: "tools/bpm.html", color: "text-purple-400" },
    { name: "Sample Manager", icon: MdPiano, desc: "Organize your library", link: "tools/samples.html", color: "text-emerald-400" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full"
    >
      {tools.map((tool, index) => (
        <a 
          key={index}
          href={tool.link}
          className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:border-accent-primary hover:-translate-y-2 transition-all duration-300 shadow-2xl group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className={`text-4xl ${tool.color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 drop-shadow-lg`}>
            <SafeIcon icon={tool.icon} />
          </div>
          <div className="relative z-10">
            <h3 className="text-white font-bold text-sm tracking-wide">{tool.name}</h3>
            <p className="text-text-secondary text-xs mt-1 font-medium">{tool.desc}</p>
          </div>
        </a>
      ))}
    </motion.div>
  );
};

const ContactSection = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
    >
      <div className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-2xl hover:border-white/20 transition-all duration-500">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-primary to-accent-secondary mb-4 flex items-center justify-center shadow-lg">
          <SafeIcon icon={FiMusic} className="text-xl text-white" />
        </div>
        <h3 className="text-accent-highlight text-lg font-black uppercase tracking-widest mb-4">À propos</h3>
        <p className="text-text-secondary text-xs mb-2 leading-relaxed max-w-sm">
          Régisseur son professionnel avec <strong className="text-white">5+ ans d'expérience</strong> sur les grands festivals.
        </p>
        <p className="text-text-secondary text-xs mb-4 leading-relaxed max-w-sm">
          Formation en musicologie, spécialisé en <strong className="text-white">Behringer X32/M32</strong> et <strong className="text-white">Ableton Live</strong>.
        </p>
        <div className="flex gap-3">
          <a href="mailto:contact@hamcat.live" className="p-3 bg-white/5 rounded-xl hover:bg-accent-primary hover:text-white hover:-translate-y-1 transition-all text-text-secondary border border-white/10 shadow-lg group">
            <SafeIcon icon={FiMail} className="text-lg group-hover:scale-110 transition-transform" />
          </a>
          <a href="https://soundcloud.com/hamcatmusic" target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-xl hover:bg-[#ff5500] hover:text-white hover:-translate-y-1 transition-all text-text-secondary border border-white/10 shadow-lg group">
            <SafeIcon icon={FaSoundcloud} className="text-lg group-hover:scale-110 transition-transform" />
          </a>
          <a href="https://bandcamp.com" target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-xl hover:bg-[#629aa9] hover:text-white hover:-translate-y-1 transition-all text-text-secondary border border-white/10 shadow-lg group">
            <SafeIcon icon={FaBandcamp} className="text-lg group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>

      <a 
        href="https://instagram.com/hamcatmusic" 
        target="_blank" 
        rel="noreferrer"
        className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-accent-secondary/50 transition-all group shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 to-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="text-5xl text-transparent bg-clip-text bg-gradient-to-tr from-purple-500 to-orange-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 drop-shadow-2xl">
          <SafeIcon icon={FiInstagram} />
        </div>
        <div className="text-center relative z-10">
          <h3 className="text-white font-black text-xl tracking-tight mb-1">Suivez-moi</h3>
          <p className="text-accent-highlight text-xs font-bold tracking-widest uppercase">@hamcatmusic</p>
        </div>
      </a>
    </motion.div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('dj');

  return (
    <Router>
      <div className="min-h-screen flex flex-col items-center relative overflow-hidden font-sans selection:bg-accent-highlight/30 selection:text-white">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-black/30 z-0 pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-6xl px-6 flex flex-col h-screen">
          <Header />
          <NavTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main className="flex-1 flex items-start justify-center py-4 relative z-10 min-h-0 w-full overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'dj' && (
                <motion.div key="dj" className="w-full h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20" initial={{opacity:0, scale: 0.98}} animate={{opacity:1, scale: 1}} exit={{opacity:0, scale: 1.02}} transition={{duration: 0.3}}>
                  <DjSection />
                </motion.div>
              )}
              {activeTab === 'tools' && (
                <motion.div key="tools" className="w-full h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20" initial={{opacity:0, scale: 0.98}} animate={{opacity:1, scale: 1}} exit={{opacity:0, scale: 1.02}} transition={{duration: 0.3}}>
                  <ToolsSection />
                </motion.div>
              )}
              {activeTab === 'contact' && (
                <motion.div key="contact" className="w-full h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20" initial={{opacity:0, scale: 0.98}} animate={{opacity:1, scale: 1}} exit={{opacity:0, scale: 1.02}} transition={{duration: 0.3}}>
                  <ContactSection />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;