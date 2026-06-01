<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VaultForge Intelligence - Private Deal Network</title>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
  * {
    font-family: 'IBM Plex Mono', monospace;
    border-radius: 0 !important;
  }
  body {
    background: #0A0A0A;
    color: #E5E5E5;
    overflow-x: hidden;
  }
  .gold-glow {
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
  }
  .gold-text-glow {
    text-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
  }
  .ticker-scroll {
    animation: scroll 25s linear infinite;
  }
  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .hairline {
    height: 1px;
    background: linear-gradient(90deg, transparent, #D4AF37, transparent);
  }
  .steel-border {
    border: 1px solid #2A2A2A;
  }
  .gold-border {
    border: 1px solid rgba(212, 175, 55, 0.2);
  }
  .gold-border-strong {
    border: 1px solid #D4AF37;
  }
  .modal-backdrop {
    backdrop-filter: blur(8px);
    background: rgba(0, 0, 0, 0.85);
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0A0A0A;
  }
  ::-webkit-scrollbar-thumb {
    background: #D4AF37;
  }
  .image-blur {
    filter: blur(8px) brightness(0.4);
  }
</style>
</head>
<body>
<div id="root"></div>

<script type="text/babel">
const { useState, useEffect } = React;

const Logo = ({ width, opacity = 1, className = "" }) => {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return (
      <div style={{ width: `${width}px`, opacity }} className={`${className} flex items-center justify-center h-12 bg-[#D4AF37]/10 border border-[#D4AF37]/30`}>
        <span className="text-[#D4AF37] font-bold text-sm tracking-widest">VAULTFORGE</span>
      </div>
    );
  }
  
  return (
    <img 
      src="/logo.png" 
      alt="VaultForge" 
      style={{ width: `${width}px`, opacity }}
      className={className}
      onError={() => setImgError(true)}
    />
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-black gold-border-strong max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-black border-b border-[#D4AF37]/20 p-6 flex items-center justify-between">
          <h3 className="text-[#D4AF37] text-xl font-bold tracking-wider uppercase">{title}</h3>
          <button onClick={onClose} className="text-[#D4AF37] hover:text-[#F4CF47] text-2xl leading-none">×</button>
        </div>
        <div className="p-6 text-[#E5E5E5] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

const TickerBar = () => {
  const text = "◆ 492 ACTIVE DEALS ROUTED TODAY ◆ BPS 80+ = SELLER MUST SELL ◆ 193 FOUNDING SEATS LEFT ◆ DQI 90+ = INSTITUTIONAL GRADE ◆";
  return (
    <div className="bg-gradient-to-r from-[#B8941F] via-[#D4AF37] to-[#B8941F] text-black overflow-hidden py-2">
      <div className="flex whitespace-nowrap ticker-scroll">
        <span className="text-xs font-bold tracking-widest px-4">{text}</span>
        <span className="text-xs font-bold tracking-widest px-4">{text}</span>
      </div>
    </div>
  );
};

const Nav = ({ setCurrentPage, setModal }) => {
  return (
    <nav className="bg-black border-b border-[#D4AF37]/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-6">
            <Logo width={180} />
            <div className="hidden md:block">
              <div className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase font-semibold">VAULTFORGE</div>
              <div className="text-[#D4AF37]/60 text-[10px] tracking-[0.4em] uppercase mt-1">PRIVATE INTELLIGENCE</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setModal({ type: 'founders', title: 'FOUNDERS' })}
              className="text-[#D4AF37] text-xs tracking-widest uppercase hover:text-[#F4CF47] transition-colors"
            >
              FOUNDERS
            </button>
            <button 
              onClick={() => setModal({ type: 'invite', title: 'REQUEST INVITE' })}
              className="bg-[#D4AF37] text-black px-6 py-2 text-xs font-bold tracking-widest uppercase hover:bg-[#F4CF47] transition-colors"
            >
              REQUEST INVITE
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ setModal }) => {
  return (
    <section className="bg-[#000000] py-20 md:py-32 border-b gold-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-[#D4AF37] text-xs tracking-[0.6em] uppercase mb-8 font-semibold">
            VETERAN OWNED. PRIVATE DEAL INTELLIGENCE NETWORK.
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[10rem] font-black leading-none mb-12 tracking-tight">
            <span className="text-[#E5E5E5]">PUBLIC GETS</span><br/>
            <span className="text-[#DC2626]">LEFTOVERS.</span><br/>
            <span className="text-[#E5E5E5]">YOU GET</span><br/>
            <span className="text-[#D4AF37] gold-text-glow">OWNERSHIP.</span>
          </h1>
          <div className="hairline w-32 mx-auto my-12"></div>
          <p className="text-[#E5E5E5]/80 text-sm md:text-base max-w-3xl mx-auto mb-12 leading-relaxed tracking-wide uppercase">
            BPS 80+ SIGNALS DISTRESS BEFORE MLS. DQI 90+ GRADES INSTITUTIONAL QUALITY.<br/>
            MEMBERS ACCESS INVENTORY THE PUBLIC NEVER SEES.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => setModal({ type: 'invite', title: 'CLAIM FOUNDING SEAT' })}
              className="bg-[#D4AF37] text-black px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-[#F4CF47] transition-all gold-glow w-full sm:w-auto"
            >
              CLAIM FOUNDING SEAT
            </button>
            <button 
              onClick={() => setModal({ type: 'login', title: 'MEMBER LOGIN' })}
              className="border border-[#D4AF37] text-[#D4AF37] px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-[#D4AF37]/10 transition-all w-full sm:w-auto"
            >
              MEMBER LOGIN
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const LiveStats = () => {
  const stats = [
    { value: '492', label: 'DEALS IN NETWORK' },
    { value: '193', label: 'HIGH MOTIVATION' },
    { value: '87', label: 'DQI 90+' },
    { value: '685', label: 'FOUNDING SEATS' }
  ];
  
  return (
    <section className="bg-[#0A0A0A]">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="gold-border p-8 text-center">
            <div className="text-4xl md:text-6xl font-black text-[#D4AF37] mb-2">{stat.value}</div>
            <div className="text-[#E5E5E5] text-xs tracking-widest uppercase">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

const DealCard = ({ deal, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="steel-border bg-black p-5 hover:border-[#D4AF37]/40 transition-all cursor-pointer group"
    >
      <div className="relative mb-4 overflow-hidden steel-border">
        <img 
          src={deal.image} 
          alt="Property" 
          className="w-full h-40 object-cover image-blur group-hover:blur-[6px] transition-all"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 border border-[#D4AF37]/30">
          <span className="text-[#D4AF37] text-[10px] tracking-widest font-bold">LOCKED</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[#E5E5E5] text-sm font-bold tracking-wider">{deal.city}, {deal.state}</span>
          <span className="text-[#D4AF37] text-xs font-bold">BPS {deal.bps}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#E5E5E5]/60">ARV ${deal.arv}K</span>
          <span className="text-[#E5E5E5]/60">ASK ${deal.ask}K</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
          <span className="text-[#E5E5E5]/60 text-[10px] tracking-widest">DQI {deal.dqi}</span>
          <div className="flex gap-1">
            {deal.flags.map((flag, i) => (
              <span key={i} className="text-[#DC2626] text-[10px] tracking-wider font-semibold">{flag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LiveIntelFeed = ({ setModal }) => {
  const [updatedSeconds, setUpdatedSeconds] = useState(23);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdatedSeconds(s => s > 0 ? s - 1 : 23);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const highMotivation = [
    { city: 'FULTON', state: 'GA', arv: 385, ask: 245, bps: 94, dqi: 91, flags: ['DIVORCE'], image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80' },
    { city: 'MIAMI', state: 'FL', arv: 520, ask: 310, bps: 88, dqi: 89, flags: ['TAX_LIEN'], image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
    { city: 'PHOENIX', state: 'AZ', arv: 445, ask: 285, bps: 91, dqi: 93, flags: ['VACANT'], image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' }
  ];
  
  const standard = [
    { city: 'DALLAS', state: 'TX', arv: 410, ask: 295, bps: 67, dqi: 92, flags: ['PROBATE'], image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80' },
    { city: 'TAMPA', state: 'FL', arv: 365, ask: 275, bps: 62, dqi: 88, flags: ['RETIREE'], image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80' },
    { city: 'ATLANTA', state: 'GA', arv: 395, ask: 310, bps: 58, dqi: 90, flags: ['JOB_LOSS'], image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80' }
  ];

  return (
    <section className="bg-black py-20 border-b gold-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[#D4AF37] text-2xl md:text-3xl font-bold tracking-wider uppercase">LIVE INTEL</h2>
            <span className="text-[#D4AF37]/60 text-xs tracking-widest">UPDATED {updatedSeconds} SECONDS AGO</span>
          </div>
          <p className="text-[#E5E5E5]/60 text-xs tracking-widest uppercase">NO ADDRESSES SHOWN. CITY + STATE ONLY.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-[#DC2626] text-sm font-bold tracking-widest uppercase mb-4 pb-2 border-b border-[#DC2626]/30">HIGH MOTIVATION BPS 50+</h3>
            <div className="space-y-4">
              {highMotivation.map((deal, i) => (
                <DealCard 
                  key={i} 
                  deal={deal} 
                  onClick={() => setModal({ type: 'deal', title: `${deal.city}, ${deal.state}`, data: deal })}
                />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-[#D4AF37] text-sm font-bold tracking-widest uppercase mb-4 pb-2 border-b border-[#D4AF37]/30">STANDARD DQI GRADED</h3>
            <div className="space-y-4">
              {standard.map((deal, i) => (
                <DealCard 
                  key={i} 
                  deal={deal} 
                  onClick={() => setModal({ type: 'deal', title: `${deal.city}, ${deal.state}`, data: deal })}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ExplainerSection = ({ setModal }) => {
  return (
    <section className="bg-[#0A0A0A] py-20 border-b gold-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[#D4AF37] text-2xl md:text-3xl font-bold tracking-wider uppercase text-center mb-16">
          TWO ROOMS. ZERO LEAKS.
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div 
            onClick={() => setModal({ type: 'painroom', title: 'PAIN ROOM' })}
            className="steel-border bg-black p-8 hover:border-[#D4AF37]/40 transition-all cursor-pointer group"
          >
            <div className="text-[#DC2626] text-xl font-bold tracking-wider uppercase mb-4">PAIN ROOM</div>
            <p className="text-[#E5E5E5]/70 text-sm leading-relaxed tracking-wide uppercase">
              WHERE DISTRESS SIGNALS ORIGINATE. BPS 80+ = SELLER MUST SELL. DIVORCE. TAX LIENS. VACANT. PRE-FORECLOSURE. ROUTED BEFORE MLS.
            </p>
            <div className="hairline mt-6 group-hover:bg-[#D4AF37] transition-colors"></div>
          </div>
          
          <div 
            onClick={() => setModal({ type: 'dealroom', title: 'DEAL ROOM' })}
            className="steel-border bg-black p-8 hover:border-[#D4AF37]/40 transition-all cursor-pointer group"
          >
            <div className="text-[#D4AF37] text-xl font-bold tracking-wider uppercase mb-4">DEAL ROOM</div>
            <p className="text-[#E5E5E5]/70 text-sm leading-relaxed tracking-wide uppercase">
              WHERE DQI 90+ DEALS ARE GRADED. INSTITUTIONAL GRADE INVENTORY. ARV VERIFIED. OWNER OCCUPIED FILTERED. LOCKBOX READY.
            </p>
            <div className="hairline mt-6 group-hover:bg-[#D4AF37] transition-colors"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

const MemberToMember = ({ setModal }) => {
  const cards = [
    { title: 'MEMBERS CREATE SIGNALS', type: 'signals', desc: 'EVERY SEARCH TRAINS THE NETWORK' },
    { title: 'MEMBERS CREATE ALERTS', type: 'alerts', desc: 'YOUR FILTERS BECOME INTEL FOR OTHERS' },
    { title: 'MEMBERS CREATE PROFILES', type: 'profiles', desc: 'BUY BOX DATA FEEDS BPS ALGORITHM' },
    { title: 'MEMBERS CREATE PAIN', type: 'pain', desc: 'DISTRESS MARKERS ROUTED INSTANTLY' }
  ];
  
  return (
    <section className="bg-black py-20 border-b gold-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[#D4AF37] text-2xl md:text-3xl font-bold tracking-wider uppercase text-center mb-16">
          YOU DON'T USE VAULTFORGE.<br/>YOU TRAIN IT.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <div 
              key={i}
              onClick={() => setModal({ type: card.type, title: card.title })}
              className="steel-border bg-[#0A0A0A] p-6 hover:border-[#D4AF37]/40 transition-all cursor-pointer group"
            >
              <div className="text-[#D4AF37] text-sm font-bold tracking-wider uppercase mb-3">{card.title}</div>
              <p className="text-[#E5E5E5]/60 text-xs leading-relaxed tracking-wide uppercase">{card.desc}</p>
              <div className="hairline mt-4 group-hover:bg-[#D4AF37] transition-colors"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FoundingSeats = ({ setModal }) => {
  const roles = [
    { name: 'LENDERS', seats: 8, access: 1500, monthly: 299 },
    { name: 'BUYERS', seats: 33, access: 750, monthly: 199 },
    { name: 'WHOLESALERS', seats: 27, access: 500, monthly: 99 },
    { name: 'CONTRACTORS', seats: 16, access: 1000, monthly: 249 },
    { name: 'TITLE', seats: 14, access: 2500, monthly: 499 },
    { name: 'AGENTS', seats: 27, access: 500, monthly: 149 },
    { name: 'APPRAISERS', seats: 22, access: 1000, monthly: 199 },
    { name: 'INSPECTORS', seats: 28, access: 500, monthly: 149 },
    { name: 'PRIVATE MONEY', seats: 9, access: 2000, monthly: 399 },
    { name: 'ARCHITECTS', seats: 9, access: 1500, monthly: 299 }
  ];
  
  return (
    <section className="bg-[#0A0A0A] py-20 border-b gold-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[#D4AF37] text-2xl md:text-3xl font-bold tracking-wider uppercase text-center mb-4">
          685 SEATS. 10 ROLES. ONE PRIVATE NETWORK.
        </h2>
        <div className="hairline w-32 mx-auto mb-16"></div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {roles.map((role, i) => (
            <div 
              key={i}
              onClick={() => setModal({ type: 'role', title: role.name, data: role })}
              className="steel-border bg-black p-5 hover:border-[#D4AF37]/40 transition-all cursor-pointer group"
            >
              <div className="text-[#D4AF37] text-sm font-bold tracking-wider uppercase mb-3">{role.name}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#E5E5E5]/60">LEFT:</span>
                  <span className="text-[#DC2626] font-bold">{role.seats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#E5E5E5]/60">ACCESS:</span>
                  <span className="text-[#E5E5E5]">${role.access}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#E5E5E5]/60">MONTHLY:</span>
                  <span className="text-[#E5E5E5]">${role.monthly}</span>
                </div>
              </div>
              <div className="hairline mt-4 group-hover:bg-[#D4AF37] transition-colors"></div>
            </div>
          ))}
        </div>
        
        <div className="text-center steel-border bg-black p-8">
          <div className="text-[#DC2626] text-4xl font-black mb-2">193 TOTAL SEATS LEFT</div>
          <div className="text-[#E5E5E5]/60 text-xs tracking-widest uppercase">AFTER 685, WAITLIST ONLY. ACCESS DOUBLES.</div>
        </div>
      </div>
    </section>
  );
};

const ComingSoon = ({ setModal }) => {
  const features = [
    { name: 'ARV CONFIDENCE INDEX', type: 'aci', desc: 'AI-POWERED ARV VALIDATION' },
    { name: 'LENDER ALERTS SMS', type: 'lenderalerts', desc: 'INSTANT SMS ON APPROVED DEALS' },
    { name: 'VAULT SCORE', type: 'vaultscore', desc: 'PROPRIETARY DEAL RATING 0-100' },
    { name: 'DEAL ROOMS', type: 'dealrooms', desc: 'PRIVATE NEGOTIATION SPACES' }
  ];
  
  return (
    <section className="bg-black py-20 border-b gold-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[#D4AF37] text-2xl md:text-3xl font-bold tracking-wider uppercase text-center mb-2">
          LOCKED IN. DEPLOYING TO MEMBERS FIRST.
        </h2>
        <div className="hairline w-32 mx-auto mb-16"></div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div 
              key={i}
              onClick={() => setModal({ type: feature.type, title: feature.name })}
              className="steel-border bg-[#0A0A0A] p-6 hover:border-[#D4AF37]/40 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 bg-[#D4AF37]/20 px-2 py-1">
                <span className="text-[#D4AF37] text-[10px] tracking-widest font-bold">SOON</span>
              </div>
              <div className="text-[#D4AF37] text-sm font-bold tracking-wider uppercase mb-3 mt-4">{feature.name}</div>
              <p className="text-[#E5E5E5]/60 text-xs leading-relaxed tracking-wide uppercase">{feature.desc}</p>
              <div className="hairline mt-4 group-hover:bg-[#D4AF37] transition-colors"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FinalCTA = ({ setModal }) => {
  return (
    <section className="bg-[#0A0A0A] py-20 border-b gold-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-[#E5E5E5] text-3xl md:text-5xl font-black tracking-tight uppercase mb-8 leading-tight">
          THE PUBLIC FIGHTS FOR LISTINGS.<br/>
          <span className="text-[#D4AF37] gold-text-glow">MEMBERS OWN THE INVENTORY.</span>
        </h2>
        <button 
          onClick={() => setModal({ type: 'invite', title: 'REQUEST PRIVATE INVITE' })}
          className="bg-[#D4AF37] text-black px-12 py-5 text-sm font-bold tracking-widest uppercase hover:bg-[#F4CF47] transition-all gold-glow"
        >
          REQUEST PRIVATE INVITE
        </button>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Logo width={120} opacity={0.5} className="mx-auto mb-6" />
        <div className="text-[#E5E5E5]/40 text-[10px] tracking-[0.3em] uppercase">
          © 2026 VAULTFORGE // VETERAN OWNED // MEMBERS ONLY // NDA PROTECTED
        </div>
      </div>
    </footer>
  );
};

const LoginPage = ({ setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Logo width={200} className="mx-auto mb-8" />
          <h1 className="text-[#D4AF37] text-2xl font-bold tracking-wider uppercase mb-2">MEMBER ACCESS</h1>
          <div className="hairline w-24 mx-auto"></div>
        </div>
        
        <div className="steel-border bg-[#0A0A0A] p-8">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-[#D4AF37] text-xs tracking-widest uppercase mb-2">EMAIL</label>
              <input 
                type="email" 
                className="w-full bg-black steel-border text-[#E5E5E5] px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="MEMBER@VAULTFORGE.COM"
              />
            </div>
            <div>
              <label className="block text-[#D4AF37] text-xs tracking-widest uppercase mb-2">PASSWORD</label>
              <input 
                type="password" 
                className="w-full bg-black steel-border text-[#E5E5E5] px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="••••••••••••"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-[#D4AF37] text-black py-4 text-sm font-bold tracking-widest uppercase hover:bg-[#F4CF47] transition-all gold-glow"
            >
              ENTER NETWORK
            </button>
          </form>
          
          <div className="mt-6 flex items-center justify-between text-xs">
            <button className="text-[#D4AF37]/60 hover:text-[#D4AF37] tracking-widest uppercase transition-colors">
              CREATE ACCOUNT
            </button>
            <span className="text-[#2A2A2A]">|</span>
            <button className="text-[#D4AF37]/60 hover:text-[#D4AF37] tracking-widest uppercase transition-colors">
              FORGOT PASSWORD
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => setCurrentPage('home')}
            className="text-[#E5E5E5]/40 hover:text-[#D4AF37] text-xs tracking-widest uppercase transition-colors"
          >
            ← BACK TO INTEL
          </button>
          <div className="hairline mt-8 mb-4"></div>
          <div className="text-[#E5E5E5]/40 text-[10px] tracking-[0.3em] uppercase">VETERAN OWNED</div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [modal, setModal] = useState(null);
  
  const getModalContent = () => {
    if (!modal) return null;
    
    const contents = {
      founders: (
        <div className="space-y-4">
          <p>FOUNDING MEMBERS RECEIVE LIFETIME ACCESS TO VAULTFORGE INTELLIGENCE AT FOUNDING RATES.</p>
          <p className="text-[#D4AF37]">LIMITED TO 685 SEATS ACROSS 10 ROLES. ONCE FILLED, NEW MEMBERS JOIN WAITLIST AT DOUBLE ACCESS FEES.</p>
          <p>CURRENT FOUNDING BENEFITS: PRIORITY DEAL ROUTING, DIRECT LENDER ACCESS, BPS 80+ ALERTS, DQI 90+ FILTERS.</p>
        </div>
      ),
      invite: (
        <div className="space-y-4">
          <p>VAULTFORGE IS A PRIVATE INVITE-ONLY NETWORK. ALL MEMBERS SIGN NDA.</p>
          <p className="text-[#D4AF37]">REQUEST PROCESS: SUBMIT APPLICATION → VETERAN VERIFICATION → ROLE ASSIGNMENT → NDA EXECUTION → ONBOARDING</p>
          <p>CURRENT WAIT TIME: 48-72 HOURS FOR FOUNDING SEAT APPLICATIONS.</p>
          <div className="pt-4">
            <button className="w-full bg-[#D4AF37] text-black py-3 text-sm font-bold tracking-widest uppercase hover:bg-[#F4CF47]">
              SUBMIT APPLICATION
            </button>
          </div>
        </div>
      ),
      login: (
        <div className="space-y-4">
          <p>REDIRECTING TO SECURE MEMBER PORTAL...</p>
          <button 
            onClick={() => { setCurrentPage('login'); setModal(null); }}
            className="w-full bg-[#D4AF37] text-black py-3 text-sm font-bold tracking-widest uppercase hover:bg-[#F4CF47]"
          >
            CONTINUE TO LOGIN
          </button>
        </div>
      ),
      deal: modal.data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[#E5E5E5]/60 text-xs tracking-widest">LOCATION</div>
              <div className="text-[#E5E5E5] font-bold">{modal.data.city}, {modal.data.state}</div>
            </div>
            <div>
              <div className="text-[#E5E5E5]/60 text-xs tracking-widest">BPS SCORE</div>
              <div className="text-[#DC2626] font-bold">{modal.data.bps}</div>
            </div>
            <div>
              <div className="text-[#E5E5E5]/60 text-xs tracking-widest">ARV</div>
              <div className="text-[#E5E5E5] font-bold">${modal.data.arv}K</div>
            </div>
            <div>
              <div className="text-[#E5E5E5]/60 text-xs tracking-widest">ASKING</div>
              <div className="text-[#E5E5E5] font-bold">${modal.data.ask}K</div>
            </div>
          </div>
          <div className="pt-4 border-t border-[#2A2A2A]">
            <div className="text-[#E5E5E5]/60 text-xs tracking-widest mb-2">PAIN FLAGS</div>
            <div className="flex gap-2">
              {modal.data.flags.map((flag, i) => (
                <span key={i} className="bg-[#DC2626]/20 text-[#DC2626] px-3 py-1 text-xs font-bold tracking-wider">{flag}</span>
              ))}
            </div>
          </div>
          <p className="text-[#D4AF37] text-xs tracking-wide pt-4">
            FULL ADDRESS, SELLER CONTACT, AND DEAL DOCS AVAILABLE TO VERIFIED MEMBERS ONLY. NDA REQUIRED.
          </p>
          <button className="w-full bg-[#D4AF37] text-black py-3 text-sm font-bold tracking-widest uppercase hover:bg-[#F4CF47] mt-4">
            REQUEST PRIVATE INVITE
          </button>
        </div>
      ),
      painroom: (
        <div className="space-y-4">
          <p className="text-[#DC2626] font-bold">PAIN ROOM EXPLAINED</p>
          <p>THE PAIN ROOM INGESTS DISTRESS SIGNALS FROM 47 PUBLIC DATA SOURCES BEFORE THEY HIT MLS.</p>
          <p>BPS (BUYER PAIN SCORE) 0-100 MEASURES SELLER MOTIVATION. BPS 80+ = SELLER MUST SELL.</p>
          <p className="text-[#D4AF37]">SIGNALS: DIVORCE FILINGS, TAX LIENS, CODE VIOLATIONS, UTILITY SHUTOFFS, VACANT REGISTRY, PRE-FORECLOSURE, PROBATE.</p>
          <p>MEMBERS RECEIVE ALERTS WITHIN 23 SECONDS OF SIGNAL DETECTION.</p>
        </div>
      ),
      dealroom: (
        <div className="space-y-4">
          <p className="text-[#D4AF37] font-bold">DEAL ROOM EXPLAINED</p>
          <p>THE DEAL ROOM GRADES INVENTORY USING DQI (DEAL QUALITY INDEX) 0-100.</p>
          <p>DQI 90+ = INSTITUTIONAL GRADE. VERIFIED ARV. TITLE CLEAR. OWNER OCCUPIED FILTERED.</p>
          <p className="text-[#D4AF37]">AUTOMATION: AUTO-COMPS, REPAIR ESTIMATES, RENTAL ANALYSIS, LOCKBOX COORDINATION.</p>
          <p>MEMBERS ACCESS LOCKBOX CODES AND SUBMIT OFFERS DIRECT TO SELLER THROUGH VAULTFORGE ESCROW.</p>
        </div>
      ),
      signals: (
        <div className="space-y-4">
          <p className="text-[#D4AF37] font-bold">MEMBERS CREATE SIGNALS</p>
          <p>EVERY SEARCH YOU RUN, EVERY FILTER YOU SET, EVERY DEAL YOU STAR TRAINS THE VAULT INTELLIGENCE ENGINE.</p>
          <p>YOUR BUY BOX BECOMES A SIGNAL. WHEN A PROPERTY MATCHES 10+ MEMBER BUY BOXES, BPS AUTO-INCREASES.</p>
          <p className="text-[#D4AF37]">RESULT: THE MORE YOU USE VAULTFORGE, THE SMARTER IT GETS FOR EVERYONE.</p>
        </div>
      ),
      alerts: (
        <div className="space-y-4">
          <p className="text-[#D4AF37] font-bold">MEMBERS CREATE ALERTS</p>
          <p>SET YOUR EXACT CRITERIA ONCE. WHEN A PROPERTY HITS YOUR THRESHOLD, YOU GET SMS IN UNDER 30 SECONDS.</p>
          <p>BUT IT GETS BETTER: YOUR ALERTS FEED THE NETWORK. IF 50 MEMBERS WANT 3BR IN FULTON GA, THAT ZIP GETS PRIORITY SCRAPING.</p>
          <p className="text-[#D4AF37]">YOUR FILTERS BECOME INTELLIGENCE FOR THE ENTIRE NETWORK.</p>
        </div>
      ),
      profiles: (
        <div className="space-y-4">
          <p className="text-[#D4AF37] font-bold">MEMBERS CREATE PROFILES</p>
          <p>YOUR PROFILE = YOUR BUY BOX + FUNDING STATUS + CLOSING SPEED + REHAB CAPACITY.</p>
          <p>LENDERS SEE YOUR VAULT SCORE. SELLERS SEE YOUR CLOSE RATE. THE ALGORITHM MATCHES YOU TO DEALS YOU CAN ACTUALLY CLOSE.</p>
          <p className="text-[#D4AF37]">NO TIRE KICKERS. NO GHOST BUYERS. ONLY QUALIFIED CAPITAL.</p>
        </div>
      ),
      pain: (
        <div className="space-y-4">
          <p className="text-[#DC2626] font-bold">MEMBERS CREATE PAIN</p>
          <p>WHEN YOU PASS ON A DEAL, MARK WHY: TOO HIGH, BAD AREA, NEEDS TOO MUCH WORK.</p>
          <p>THOSE PASSES TRAIN BPS. IF 20 BUYERS PASS ON A $250K ASK, BPS FLAGS SELLER AS DELUSIONAL. IF THEY DROP TO $200K, BPS JUMPS 30 POINTS AND ALERTS GO OUT.</p>
          <p className="text-[#D4AF37]">YOUR REJECTIONS CREATE OPPORTUNITIES FOR OTHER MEMBERS.</p>
        </div>
      ),
      role: modal.data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[#E5E5E5]/60 text-xs tracking-widest">SEATS REMAINING</div>
              <div className="text-[#DC2626] font-bold text-2xl">{modal.data.seats}</div>
            </div>
            <div>
              <div className="text-[#E5E5E5]/60 text-xs tracking-widest">ACCESS FEE</div>
              <div className="text-[#E5E5E5] font-bold text-2xl">${modal.data.access}</div>
            </div>
          </div>
          <div className="pt-4 border-t border-[#2A2A2A]">
            <div className="text-[#E5E5E5]/60 text-xs tracking-widest mb-2">MONTHLY</div>
            <div className="text-[#D4AF37] font-bold text-xl">${modal.data.monthly}/MO</div>
          </div>
          <div className="pt-4 space-y-2 text-xs">
            <p className="text-[#D4AF37] font-bold">FOUNDING SEAT INCLUDES:</p>
            <p>• LIFETIME RATE LOCK AT ${modal.data.monthly}/MO</p>
            <p>• PRIORITY DEAL ROUTING FOR YOUR ROLE</p>
            <p>• DIRECT ACCESS TO OTHER SEAT HOLDERS</p>
            <p>• VAULTFORGE ESCROW COORDINATION</p>
            <p>• AFTER 685 SEATS: ACCESS DOUBLES TO ${modal.data.access * 2}</p>
          </div>
          <button className="w-full bg-[#D4AF37] text-black py-3 text-sm font-bold tracking-widest uppercase hover:bg-[#F4CF47] mt-4">
            CLAIM {modal.title} SEAT
          </button>
        </div>
      ),
      aci: (
        <div className="space-y-4">
          <p className="text-[#D4AF37] font-bold">ARV CONFIDENCE INDEX</p>
          <p>AI-POWERED AFTER REPAIR VALUE VALIDATION USING 12 DATA POINTS.</p>
          <p className="text-[#D4AF37]">INPUTS: RECENT COMPS, RENTAL RATES, DAYS ON MARKET, PRICE REDUCTIONS, REHAB ESTIMATES, PERMIT DATA.</p>
          <p>OUTPUT: ACI SCORE 0-100. ACI 90+ = 98% ACCURACY TO ACTUAL SALE PRICE.</p>
          <p>DEPLOYING Q1 2026 TO FOUNDING MEMBERS FIRST.</p>
        </div>
      ),
      lenderalerts: (
        <div className="space-y-4">
          <p className="text-[#D4AF37] font-bold">LENDER ALERTS SMS</p>
          <p>INSTANT SMS WHEN A DEAL MATCHES YOUR LENDING CRITERIA AND PASSES DQI 85+.</p>
          <p className="text-[#D4AF37]">INCLUDES: ADDRESS, ARV, ASK, DQI, BPS, BORROWER VAULT SCORE, ESTIMATED LOAN AMOUNT.</p>
          <p>REPLY "FUND" TO LOCK DEAL FOR 4 HOURS. REPLY "PASS" TO ROUTE TO NEXT LENDER.</p>
          <p>DEPLOYING Q1 2026 TO LENDER SEAT HOLDERS FIRST.</p>
        </div>
      ),
      vaultscore: (
        <div className="space-y-4">
          <p className="text-[#D4AF37] font-bold">VAULT SCORE</p>
          <p>PROPRIETARY DEAL RATING 0-100 COMBINING BPS + DQI + ACI + MEMBER DEMAND.</p>
          <p className="text-[#D4AF37]">VAULT SCORE 90+ = UNICORN DEAL. TYPICALLY 3-5 PER WEEK NATIONWIDE.</p>
          <p>VAULT SCORE 70-89 = STRONG DEAL. VAULT SCORE UNDER 70 = ROUTED TO WHOLESALERS.</p>
          <p>DEPLOYING Q2 2026 TO ALL MEMBERS.</p>
        </div>
      ),
      dealrooms: (
        <div className="space-y-4">
          <p className="text-[#D4AF37] font-bold">DEAL ROOMS</p>
          <p>PRIVATE NEGOTIATION SPACES FOR BUYER + SELLER + LENDER + TITLE.</p>
          <p className="text-[#D4AF37]">FEATURES: ENCRYPTED CHAT, DOC SHARING, E-SIGN, ESCROW TRACKING, MILESTONE ALERTS.</p>
          <p>VAULTFORGE ESCROW HOLDS EMD. CLOSE IN 7 DAYS OR LESS.</p>
          <p>DEPLOYING Q2 2026 TO FOUNDING MEMBERS FIRST.</p>
        </div>
      )
    };
    
    return contents[modal.type] || <p>COMING SOON</p>;
  };
  
  if (currentPage === 'login') {
    return <LoginPage setCurrentPage={setCurrentPage} />;
  }
  
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <TickerBar />
      <Nav setCurrentPage={setCurrentPage} setModal={setModal} />
      <Hero setModal={setModal} />
      <LiveStats />
      <LiveIntelFeed setModal={setModal} />
      <ExplainerSection setModal={setModal} />
      <MemberToMember setModal={setModal} />
      <FoundingSeats setModal={setModal} />
      <ComingSoon setModal={setModal} />
      <FinalCTA setModal={setModal} />
      <Footer />
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.title}>
        {getModalContent()}
      </Modal>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
</script>
<script>(function(){document.addEventListener("click",function(e){var a=e.target.closest("[data-product-id]");if(!a)return;e.preventDefault();var pid=a.getAttribute("data-product-id");if(pid)parent.postMessage({type:"ecto-artifact-link-click",productId:pid},"*")})})();</script>
</body>
</html>
