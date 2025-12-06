import React, { useState } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from './common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';

const { FiCalendar, FiMail, FiInstagram, FiExternalLink, FiCpu, FiMusic } = FiIcons;
const { FaSoundcloud, FaBandcamp, FaSpotify } = FaIcons;
const { MdPiano, MdTimer, MdLibraryMusic } = MdIcons;

// --- Components ---

const Header = () => (
  <header className="text-center py-8 shrink-0 z-10 relative">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-block mb-2"
    >
      <div className="h-1 w-20 bg-accent-highlight rounded-full mx-auto mb-4 opacity-50" />
    </motion.div>
    <motion.h1 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-accent-highlight via-orange-400 to-accent-primary mb-2 tracking-tight drop-shadow-lg"
    >
      Hamcat
    </motion.h1>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-text-secondary text-sm font-bold tracking-[0.2em] uppercase"
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
    <nav className="flex justify-center gap-3 py-6 flex-wrap z-10 relative">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            relative px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300
            border backdrop-blur-xl flex items-center gap-2 group
            ${activeTab === tab.id 
              ? 'text-white border-accent-primary/50 bg-accent-primary/20 shadow-[0_0_20px_rgba(102,126,234,0.3)]' 
              : 'text-text-secondary border-white/5 bg-bg-card/30 hover:bg-white/10 hover:border-white/20 hover:text-white'}
          `}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-2xl -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <SafeIcon icon={tab.icon} className={`text-lg ${activeTab === tab.id ? 'text-accent-highlight' : 'group-hover:text-accent-highlight transition-colors'}`} />
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

const DjSection = () => {
  const futureDates = [
    { date: "31 Août", event: "Hadra Trance Festival", genre: "Hi-Tech Live" },
    { date: "20 Sept", event: "Out of the Void", genre: "Acid / Mental" },
  ];

  const pastDates = [
    { date: "13 Juil 25", event: "ADN Music Festival", genre: "Closing Mashup" },
    { date: "13 Juin 25", event: "La Belle Électrique", genre: "Techno Rodeo" },
    { date: "08 Juin 25", event: "Nexen Festival", genre: "Hi-Tech Mashup" },
    { date: "05 Juin 25", event: "Open Air @ EVE", genre: "Goa / Neotrance" },
    { date: "26 Avr 25", event: "Equipe B @ Drak'Art", genre: "Goa Trance" },
    { date: "31 Déc 24", event: "New Year Special", genre: "Multi Mashup" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20"
    >
      {/* Dates Column */}
      <div className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 flex flex-col gap-6 shadow-2xl hover:border-white/20 transition-all duration-500 h-fit">
        <div>
          <h3 className="text-accent-highlight text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
            <SafeIcon icon={FiCalendar} className="text-lg" /> Prochaines Dates
          </h3>
          <div className="space-y-3">
            {futureDates.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-accent-primary/30 transition-all group">
                <div className="flex flex-col items-center justify-center bg-accent-primary/20 border border-accent-primary/30 rounded-lg w-14 h-14 shrink-0 group-hover:scale-105 transition-transform">
                  <span className="text-accent-highlight font-bold text-xs text-center leading-tight">{item.date.split(' ')[0]}<br/>{item.date.split(' ')[1]}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-sm font-bold tracking-wide group-hover:text-accent-highlight transition-colors">{item.event}</span>
                  <span className="text-text-secondary text-xs font-medium bg-black/20 w-fit px-2 py-0.5 rounded mt-1">{item.genre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-2">
          <h3 className="text-text-muted text-xs font-black uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Archives</h3>
          <div className="space-y-1 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {pastDates.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors opacity-70 hover:opacity-100 group">
                <span className="text-text-secondary text-xs font-mono min-w-[70px] text-right border-r border-white/10 pr-3">{item.date}</span>
                <div className="flex flex-col">
                  <span className="text-text-primary text-xs font-bold group-hover:text-white">{item.event}</span>
                  <span className="text-text-muted text-[10px]">{item.genre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Music Column */}
      <div className="flex flex-col gap-6">
        {/* Soundcloud Container */}
        <div className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-1 shadow-2xl overflow-hidden group hover:border-accent-highlight/30 transition-all duration-500">
           <div className="px-5 py-3 flex items-center justify-between border-b border-white/5 bg-white/5">
            <h3 className="text-accent-highlight text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
              <SafeIcon icon={FaSoundcloud} className="text-xl" /> Releases
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-text-muted bg-black/20 px-2 py-1 rounded border border-white/5">Latest Tracks</span>
            </div>
          </div>
          <iframe 
            width="100%" 
            height="380" 
            scrolling="no" 
            frameBorder="no" 
            allow="autoplay" 
            className="opacity-90 group-hover:opacity-100 transition-opacity duration-500"
            src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/hamcatmusic/tracks&color=%23ffd93d&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=false"
          ></iframe>
        </div>

        {/* Spotify Container */}
        <div className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-1 shadow-2xl overflow-hidden group hover:border-[#1DB954]/50 transition-all duration-500">
           <div className="px-5 py-3 flex items-center justify-between border-b border-white/5 bg-white/5">
            <h3 className="text-[#1DB954] text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
              <SafeIcon icon={FaSpotify} className="text-xl" /> Spotify Playlist
            </h3>
             <SafeIcon icon={FiExternalLink} className="text-text-muted text-xs group-hover:text-white transition-colors" />
          </div>
          <iframe 
            style={{borderRadius: '0 0 16px 16px'}} 
            src="https://open.spotify.com/embed/playlist/0HXFBbIxUQD9g7PjRt9gpR?utm_source=generator&theme=0" 
            width="100%" 
            height="152" 
            frameBorder="0" 
            allowFullScreen="" 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy"
            className="opacity-90 group-hover:opacity-100 transition-opacity duration-500"
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
      className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full"
    >
      {tools.map((tool, index) => (
        <a 
          key={index}
          href={tool.link}
          className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 hover:border-accent-primary hover:-translate-y-2 transition-all duration-300 shadow-2xl group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className={`text-5xl ${tool.color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 drop-shadow-lg`}>
            <SafeIcon icon={tool.icon} />
          </div>
          <div className="relative z-10">
            <h3 className="text-white font-bold text-lg tracking-wide">{tool.name}</h3>
            <p className="text-text-secondary text-xs mt-2 font-medium">{tool.desc}</p>
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
      className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
    >
      <div className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col justify-center items-center text-center shadow-2xl hover:border-white/20 transition-all duration-500">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent-primary to-accent-secondary mb-6 flex items-center justify-center shadow-lg">
          <SafeIcon icon={FiMusic} className="text-2xl text-white" />
        </div>
        <h3 className="text-accent-highlight text-xl font-black uppercase tracking-widest mb-6">À propos</h3>
        <p className="text-text-secondary text-sm mb-3 leading-relaxed max-w-sm">
          Régisseur son professionnel avec <strong className="text-white">5+ ans d'expérience</strong> sur les grands festivals.
        </p>
        <p className="text-text-secondary text-sm mb-8 leading-relaxed max-w-sm">
          Formation en musicologie, spécialisé en <strong className="text-white">Behringer X32/M32</strong> et <strong className="text-white">Ableton Live</strong>.
        </p>
        <div className="flex gap-4">
          <a href="mailto:contact@hamcat.live" className="p-4 bg-white/5 rounded-2xl hover:bg-accent-primary hover:text-white hover:-translate-y-1 transition-all text-text-secondary border border-white/10 shadow-lg group">
            <SafeIcon icon={FiMail} className="text-xl group-hover:scale-110 transition-transform" />
          </a>
          <a href="https://soundcloud.com/hamcatmusic" target="_blank" rel="noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-[#ff5500] hover:text-white hover:-translate-y-1 transition-all text-text-secondary border border-white/10 shadow-lg group">
            <SafeIcon icon={FaSoundcloud} className="text-xl group-hover:scale-110 transition-transform" />
          </a>
          <a href="https://bandcamp.com" target="_blank" rel="noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-[#629aa9] hover:text-white hover:-translate-y-1 transition-all text-text-secondary border border-white/10 shadow-lg group">
            <SafeIcon icon={FaBandcamp} className="text-xl group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>

      <a 
        href="https://instagram.com/hamcatmusic" 
        target="_blank" 
        rel="noreferrer"
        className="bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-6 hover:border-accent-secondary/50 transition-all group shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 to-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="text-6xl text-transparent bg-clip-text bg-gradient-to-tr from-purple-500 to-orange-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 drop-shadow-2xl">
          <SafeIcon icon={FiInstagram} />
        </div>
        <div className="text-center relative z-10">
          <h3 className="text-white font-black text-2xl tracking-tight mb-1">Suivez-moi</h3>
          <p className="text-accent-highlight text-sm font-bold tracking-widest uppercase">@hamcatmusic</p>
        </div>
      </a>
    </motion.div>
  );
};

const Footer = () => (
  <footer className="w-full text-center py-8 mt-auto border-t border-white/5 bg-bg-card/20 backdrop-blur-md z-10 relative">
    <div className="flex justify-center gap-8 mb-4">
      <a href="#" className="text-text-secondary hover:text-accent-highlight hover:scale-110 transition-all duration-300"><SafeIcon icon={FaBandcamp} className="text-lg" /></a>
      <a href="#" className="text-text-secondary hover:text-accent-highlight hover:scale-110 transition-all duration-300"><SafeIcon icon={FaSoundcloud} className="text-lg" /></a>
      <a href="#" className="text-text-secondary hover:text-accent-highlight hover:scale-110 transition-all duration-300"><SafeIcon icon={FiInstagram} className="text-lg" /></a>
      <a href="#" className="text-text-secondary hover:text-accent-highlight hover:scale-110 transition-all duration-300"><SafeIcon icon={FiMail} className="text-lg" /></a>
    </div>
    <p className="text-text-muted text-[10px] uppercase tracking-widest opacity-60">© 2025 Hamcat. Créé avec ♫ pour les musiciens numériques.</p>
  </footer>
);

function App() {
  const [activeTab, setActiveTab] = useState('dj');

  return (
    <Router>
      <div className="min-h-screen flex flex-col items-center relative overflow-hidden font-sans selection:bg-accent-highlight/30 selection:text-white">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-black/30 z-0 pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-5xl px-6 flex flex-col h-screen">
          <Header />
          <NavTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main className="flex-1 flex items-start justify-center py-6 relative z-10 min-h-0 w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'dj' && (
                <motion.div key="dj" className="w-full h-full" initial={{opacity:0, scale: 0.98}} animate={{opacity:1, scale: 1}} exit={{opacity:0, scale: 1.02}} transition={{duration: 0.3}}>
                  <DjSection />
                </motion.div>
              )}
              {activeTab === 'tools' && (
                <motion.div key="tools" className="w-full" initial={{opacity:0, scale: 0.98}} animate={{opacity:1, scale: 1}} exit={{opacity:0, scale: 1.02}} transition={{duration: 0.3}}>
                  <ToolsSection />
                </motion.div>
              )}
              {activeTab === 'contact' && (
                <motion.div key="contact" className="w-full" initial={{opacity:0, scale: 0.98}} animate={{opacity:1, scale: 1}} exit={{opacity:0, scale: 1.02}} transition={{duration: 0.3}}>
                  <ContactSection />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
          
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;