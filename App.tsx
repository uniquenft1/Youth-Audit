
import React, { useState, useEffect, useRef } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { 
  Search, ShieldAlert, ShieldCheck, Info, Loader2, ArrowRight, X, ExternalLink, 
  Download, Share2, AlertTriangle, CheckCircle2, MessageSquare, Send, Zap, 
  Settings, Key, Star, Globe, ChevronDown, BookOpen, Activity, LayoutDashboard,
  Shield, Code2, Cpu, BarChart3, Radio, FileText, Lock, Layers, ZapOff, Fingerprint,
  Terminal, Database, RefreshCcw, History, TrendingUp, AlertCircle
} from 'lucide-react';
import { etherscanService, NETWORKS } from './services/etherscanService.ts';
import { geminiService } from './services/geminiService.ts';
import { usageService } from './services/usageService.ts';
import { ContractInfo, SecurityAudit, RiskLevel, UsageStats, Network } from './types.ts';
import { Chat } from '@google/genai';

// --- Types ---
type View = 'landing' | 'audit' | 'docs' | 'intelligence';

// --- Components ---

const Header = ({ 
  onOpenSettings, 
  currentView, 
  setView 
}: { 
  onOpenSettings: () => void; 
  currentView: View;
  setView: (v: View) => void;
}) => (
  <header className="px-8 py-5 border-b border-slate-800/60 flex justify-between items-center bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
    <button 
      onClick={() => setView('landing')}
      className="flex items-center gap-2.5 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
    >
      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/10">
        <ShieldCheck className="w-4 h-4 text-slate-950 fill-current" />
      </div>
      <span className="text-slate-100 font-extrabold tracking-tighter">Youth</span>
      <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest ml-1">AUDIT</span>
    </button>
    <nav className="hidden md:flex gap-10 text-[13px] font-semibold items-center">
      <button 
        onClick={() => setView('docs')}
        className={`${currentView === 'docs' ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'} transition-colors flex items-center gap-2`}
      >
        <BookOpen className="w-4 h-4" /> Documentation
      </button>
      <button 
        onClick={() => setView('intelligence')}
        className={`${currentView === 'intelligence' ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'} transition-colors flex items-center gap-2`}
      >
        <Activity className="w-4 h-4" /> Intelligence
      </button>
      <button 
        onClick={onOpenSettings}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-800 hover:bg-slate-900 transition-all text-slate-300 hover:border-amber-500/50"
      >
        <Settings className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Configure</span>
      </button>
    </nav>
  </header>
);

const Footer = () => (
  <footer className="p-12 border-t border-slate-900/50 text-center text-slate-500 text-xs bg-[#020617]">
    <div className="flex items-center justify-center gap-2 mb-6 font-bold tracking-[0.2em] text-slate-600">
       <div className="w-4 h-4 bg-slate-800 rounded flex items-center justify-center">
         <ShieldCheck className="w-2.5 h-2.5" />
       </div> 
       YOUTH SECURITY SYSTEMS
    </div>
    <div className="flex justify-center gap-8 mb-6 text-slate-400 font-semibold">
      <a href="#" className="hover:text-amber-400 transition-colors">Privacy Protocol</a>
      <a href="#" className="hover:text-amber-400 transition-colors">Terms of Service</a>
      <a href="#" className="hover:text-amber-400 transition-colors">API Docs</a>
    </div>
    <p>© 2024 Youth Protocol. Enterprise Smart Contract Intelligence Platform.</p>
  </footer>
);

const NetworkSelector = ({ selected, onSelect }: { selected: Network; onSelect: (n: Network) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = NETWORKS[selected];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-3.5 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-amber-500/30 transition-all min-w-[160px]"
      >
        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm shrink-0" style={{ backgroundColor: current.color }}>
          {current.shortName[0]}
        </div>
        <span className="text-sm font-semibold text-slate-200 truncate">{current.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ml-auto ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[60] py-2 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-72 overflow-y-auto">
            {Object.values(NETWORKS).map((net) => (
              <button
                key={net.id}
                onClick={() => { onSelect(net.id); setIsOpen(false); }}
                className="w-full px-5 py-3 flex items-center gap-4 hover:bg-slate-800/80 transition-colors text-left"
              >
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0" style={{ backgroundColor: net.color }}>
                  {net.shortName[0]}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-slate-100">{net.name}</div>
                </div>
                {selected === net.id && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RiskBadge = ({ level }: { level: RiskLevel }) => {
  const styles = {
    [RiskLevel.LOW]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    [RiskLevel.MEDIUM]: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    [RiskLevel.HIGH]: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className={`px-2.5 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wider ${styles[level]}`}>
      {level} RISK
    </div>
  );
};

const AuditSection = ({ title, icon: Icon, children }: { title: string; icon: any; children?: React.ReactNode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="p-1.5 bg-slate-900 border border-slate-800 rounded text-amber-400">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="bg-slate-900/20 border border-slate-800/50 p-10 rounded-[2rem]">
      {children}
    </div>
  </div>
);

const ExampleContract = ({ name, type, address, onClick }: { name: string; type: string; address: string; onClick: (addr: string) => void }) => (
  <button 
    onClick={() => onClick(address)}
    className="group p-6 bg-slate-900/30 border border-slate-800/50 rounded-2xl hover:border-amber-500/30 hover:bg-slate-900/50 transition-all text-left space-y-4"
  >
    <div className="flex justify-between items-start">
      <div className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">{type}</div>
      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-all translate-x-0 group-hover:translate-x-1" />
    </div>
    <div className="space-y-1">
      <div className="font-bold text-slate-200 group-hover:text-white transition-colors text-sm">{name}</div>
      <div className="text-[11px] text-slate-600 truncate font-mono">{address}</div>
    </div>
  </button>
);

const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<Network>(Network.ETHEREUM);
  const [keys, setKeys] = useState<Record<Network, string>>(() => {
    const initialKeys: any = {};
    Object.values(Network).forEach(n => {
      initialKeys[n] = etherscanService.getApiKey(n as Network);
    });
    return initialKeys;
  });
  
  if (!isOpen) return null;

  const handleSave = () => {
    Object.entries(keys).forEach(([net, val]) => {
      etherscanService.setApiKey(net as Network, val as string);
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 p-10 rounded-[2.5rem] max-w-2xl w-full relative shadow-3xl flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        
        <div className="space-y-2 mb-10">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">Network Architecture</h3>
          <p className="text-slate-500 text-sm">Configure encryption keys for secure block explorer indexing.</p>
        </div>

        <div className="flex gap-8 h-full overflow-hidden">
          <div className="w-1/3 flex flex-col gap-1 border-r border-slate-800/50 pr-6 overflow-y-auto">
            {Object.values(NETWORKS).map(n => (
              <button 
                key={n.id}
                onClick={() => setActiveTab(n.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left ${activeTab === n.id ? 'bg-amber-500/10 text-amber-400' : 'text-slate-500 hover:bg-slate-800/40'}`}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: n.color }} />
                <span className="text-[13px] font-bold truncate">{n.name}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-8">
              <div className="flex items-center gap-5 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                 <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-lg shrink-0" style={{ backgroundColor: NETWORKS[activeTab].color }}>
                   {NETWORKS[activeTab].shortName[0]}
                 </div>
                 <div>
                   <h4 className="font-bold text-white text-sm">{NETWORKS[activeTab].name} Mainnet</h4>
                   <a href={NETWORKS[activeTab].explorerUrl} target="_blank" className="text-[11px] text-amber-500 font-bold hover:underline uppercase tracking-wider">Access Registry →</a>
                 </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">Access Key</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="password" 
                    value={keys[activeTab]}
                    onChange={(e) => setKeys({...keys, [activeTab]: e.target.value})}
                    placeholder="********************"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-4 text-sm text-slate-200 focus:border-amber-500 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="mt-12">
               <button 
                onClick={handleSave}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-xl transition-all uppercase tracking-widest text-xs"
              >
                Save Protocol Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatBot = ({ context }: { context?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Security Analysis Node active. Ready for inquiry." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatInstance = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      if (!chatInstance.current) {
        chatInstance.current = geminiService.createChat(context);
      }
      const response = await chatInstance.current.sendMessage({ message: userMsg });
      const text = response.text || "Communication error.";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Node failure. Reconnect." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {isOpen ? (
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-3xl w-[360px] sm:w-[420px] h-[600px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.4)]"></div>
              <span className="font-bold text-xs uppercase tracking-widest text-slate-400">Security Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-slate-400 p-1 rounded-md transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed font-medium ${
                  msg.role === 'user' 
                  ? 'bg-amber-600 text-slate-950 rounded-br-none shadow-md font-bold' 
                  : 'bg-slate-900 text-slate-300 rounded-bl-none border border-slate-800'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-900 text-amber-400 p-4 rounded-2xl rounded-bl-none border border-slate-800 flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-slate-800 bg-slate-900/50">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Ask about audit logic..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-[13px] text-slate-200 focus:border-amber-500 outline-none transition-all placeholder:text-slate-700"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 p-3.5 rounded-xl text-slate-950 transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group border border-white/10"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default function App() {
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState<Network>(Network.ETHEREUM);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audit, setAudit] = useState<SecurityAudit | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [usage, setUsage] = useState<UsageStats>(usageService.getStats());
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    setUsage(usageService.getStats());
    
    // Initial live alerts
    setLiveAlerts([
      { id: 101, type: 'Flash Loan Anomaly', severity: 'HIGH', time: 'Just now', contract: '0x82f...a12' },
      { id: 102, type: 'Privileged Role Change', severity: 'MEDIUM', time: '5m ago', contract: '0x10d...b84' },
      { id: 103, type: 'Unverified Payload Detected', severity: 'LOW', time: '14m ago', contract: '0x944...c32' },
      { id: 104, type: 'Account Access Overflow', severity: 'HIGH', time: '28m ago', contract: '675kP...Mp8' }
    ]);

    // Update alerts simulation
    const interval = setInterval(() => {
      const types = ['Reentrancy Attempt', 'Mint Vulnerability', 'Self-Destruct Trigger', 'Oracle Deviation'];
      const severities = ['HIGH', 'MEDIUM', 'LOW'];
      const newAlert = {
        id: Date.now(),
        type: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        time: 'Just now',
        contract: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 5)}`
      };
      setLiveAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleScan = async (targetAddress: string = address, targetNetwork: Network = network) => {
    setError(null);
    if (!etherscanService.isValidAddress(targetAddress, targetNetwork)) {
      setError(`INVALID ${NETWORKS[targetNetwork].shortName} ADDRESS FORMAT`);
      return;
    }

    if (!usageService.canScan()) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setLoadingMessage(`CONNECTING TO ${NETWORKS[targetNetwork].name}...`);
    
    try {
      const info = await etherscanService.fetchSourceCode(targetAddress, targetNetwork);
      setContractInfo(info);
      
      setLoadingMessage("DECRYPTING LOGIC VECTORS...");
      const result = await geminiService.analyzeContract(info.name, info.sourceCode);
      
      setAudit(result);
      setCurrentView('audit');
      usageService.incrementScan();
      const newStats = usageService.getStats();
      setUsage(newStats);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      let msg = err.message || "PROTOCOL ERROR";
      if (msg.includes('MISSING_API_KEY') || msg.includes('INVALID_API_KEY')) {
        setShowSettings(true);
      }
      const cleanMsg = msg.includes(': ') ? msg.split(': ')[1] : msg;
      setError(cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAudit(null);
    setContractInfo(null);
    setAddress('');
    setError(null);
    setCurrentView('landing');
  };

  const handleUpgrade = () => {
    usageService.upgradeToPro();
    setUsage(usageService.getStats());
    setShowUpgrade(false);
  };

  const renderLanding = () => (
    <div className="max-w-6xl mx-auto pt-24 pb-32 px-8">
      <div className="text-center space-y-8 mb-20">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] animate-fade-in">
          <Globe className="w-3.5 h-3.5 text-amber-500" /> Intelligence Global Reach
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
          The <span className="gradient-text">Trust Protocol</span> <br/> for Smart Contracts.
        </h1>
        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Enterprise-grade AI auditing and threat detection. <br/> Identify critical vulnerabilities before deployment or interaction.
        </p>
      </div>

      <div className="relative group max-w-4xl mx-auto mb-24">
        <div className="relative flex flex-col md:flex-row gap-4 p-4 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
          <NetworkSelector selected={network} onSelect={setNetwork} />

          <div className="flex-1 flex items-center px-4 gap-4">
            <Search className="w-5 h-5 text-slate-600 shrink-0" />
            <input 
              type="text" 
              placeholder={network === Network.SOLANA ? "Solana Program ID" : "Paste Contract Address (0x...)"} 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-base mono font-medium text-slate-100 placeholder:text-slate-700 py-3"
            />
          </div>
          <button 
            onClick={() => handleScan()}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-4 px-12 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 whitespace-nowrap uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Audit <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
        {error && <p className="mt-6 text-red-500 text-[11px] text-center font-black uppercase tracking-widest bg-red-500/5 py-3 px-6 rounded-xl border border-red-500/10 max-w-2xl mx-auto">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-4 mb-4">
          <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Strategic Assets</h4>
        </div>
        <ExampleContract 
          name="USDC (Ethereum)" 
          type="STABLECOIN" 
          address="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" 
          onClick={(addr) => { setAddress(addr); setNetwork(Network.ETHEREUM); handleScan(addr, Network.ETHEREUM); }}
        />
        <ExampleContract 
          name="Raydium (Solana)" 
          type="EXCHANGE" 
          address="675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8" 
          onClick={(addr) => { setAddress(addr); setNetwork(Network.SOLANA); handleScan(addr, Network.SOLANA); }}
        />
        <ExampleContract 
          name="Uniswap (Polygon)" 
          type="LIQUIDITY" 
          address="0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270" 
          onClick={(addr) => { setAddress(addr); setNetwork(Network.POLYGON); handleScan(addr, Network.POLYGON); }}
        />
        <ExampleContract 
          name="Jupiter (Solana)" 
          type="AGGREGATOR" 
          address="JUP6LkbZbjS1jKKppHSsbiVtAXSrfCGEEBUY2m5L6Qx" 
          onClick={(addr) => { setAddress(addr); setNetwork(Network.SOLANA); handleScan(addr, Network.SOLANA); }}
        />
      </div>

      <div className="mt-32 flex flex-col items-center gap-8 text-slate-600">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className={`w-12 h-1 rounded-full transition-all duration-700 ${i <= usage.scansToday ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'bg-slate-900'}`}
            />
          ))}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">{usage.scansToday}/5 SCAN ALLOWANCE REMAINING</p>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!audit || !contractInfo) return null;
    const netConfig = NETWORKS[contractInfo.network];

    const riskColors = {
      [RiskLevel.LOW]: "border-emerald-500/20 bg-emerald-500/5 text-emerald-100",
      [RiskLevel.MEDIUM]: "border-amber-500/20 bg-amber-500/5 text-amber-100",
      [RiskLevel.HIGH]: "border-red-500/20 bg-red-500/5 text-red-100",
    };

    return (
      <div className="max-w-5xl mx-auto py-16 px-8 space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-4">
             <div className="flex items-center gap-4">
               <div className="px-3 py-1 bg-slate-800 rounded-md text-[10px] font-black text-slate-300 uppercase tracking-widest">
                 {netConfig.name}
               </div>
               <RiskBadge level={audit.riskLevel} />
             </div>
             <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">{audit.verdict}</h2>
          </div>
          <div className="flex gap-4 shrink-0">
             <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-slate-400">
               <Download className="w-5 h-5" />
             </button>
             <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-slate-400">
               <Share2 className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className={`p-10 rounded-[2.5rem] border backdrop-blur-md shadow-2xl ${riskColors[audit.riskLevel]}`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-8">
              <div className={`p-6 rounded-2xl shrink-0 ${audit.riskLevel === RiskLevel.HIGH ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {audit.riskLevel === RiskLevel.HIGH ? (
                  <ShieldAlert className="w-12 h-12" />
                ) : (
                  <ShieldCheck className="w-12 h-12" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-3xl text-white tracking-tight truncate">{contractInfo.name}</h3>
                <p className="text-slate-500 mono text-[13px] mt-2 truncate bg-black/20 px-3 py-1 rounded inline-block">{contractInfo.address}</p>
              </div>
            </div>
            <a 
              href={`${netConfig.explorerUrl}/${netConfig.id === Network.SOLANA ? 'account' : 'address'}/${contractInfo.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-black font-extrabold rounded-2xl text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-3 shrink-0"
            >
              Verify Source <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12">
          <AuditSection title="Logic Architecture" icon={Info}>
            <p className="text-slate-400 text-xl leading-relaxed font-medium">{audit.contractPurpose}</p>
          </AuditSection>

          <AuditSection title="Core Capabilities" icon={CheckCircle2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {audit.keyFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-5 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
                  <span className="text-slate-300 text-sm font-bold">{feature}</span>
                </div>
              ))}
            </div>
          </AuditSection>

          <AuditSection title="Threat Intelligence" icon={AlertTriangle}>
            <div className="space-y-8">
              <div className={`p-8 rounded-[2rem] border ${audit.securityRisks.canDrainWallets.status ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/10 bg-emerald-500/5'}`}>
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-3.5 h-3.5 rounded-full ${audit.securityRisks.canDrainWallets.status ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <h4 className="font-black uppercase tracking-[0.2em] text-[11px] text-slate-300">
                    Liquidity Access: {audit.securityRisks.canDrainWallets.status ? 'HIGH VULNERABILITY' : 'NOMINAL'}
                  </h4>
                </div>
                <p className="text-slate-400 text-[15px] leading-relaxed font-medium">{audit.securityRisks.canDrainWallets.explanation}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-slate-900/30 border border-slate-800 rounded-[2rem]">
                  <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6">Administrative Rights</h4>
                  <ul className="space-y-4 text-sm text-slate-400 font-bold">
                    {audit.securityRisks.adminPowers.map((p, i) => <li key={i} className="flex gap-4">
                      <span className="text-amber-500">→</span> {p}
                    </li>)}
                    {audit.securityRisks.adminPowers.length === 0 && <li className="text-emerald-500 font-bold italic">No elevated administrative overrides detected.</li>}
                  </ul>
                </div>
                <div className="p-8 bg-slate-900/30 border border-slate-800 rounded-[2rem]">
                  <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6">Economic Transparency</h4>
                  <div className="flex gap-4 items-start">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${audit.securityRisks.hiddenFees.status ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {audit.securityRisks.hiddenFees.status ? 'ANOMALY' : 'VERIFIED'}
                    </span>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{audit.securityRisks.hiddenFees.explanation}</p>
                  </div>
                </div>
              </div>
            </div>
          </AuditSection>
        </div>

        <div className="pt-16 flex flex-col items-center gap-10">
          <button 
            onClick={handleReset}
            className="px-10 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all"
          >
            Terminal Reset
          </button>
        </div>
      </div>
    );
  };

  const renderDocs = () => (
    <div className="max-w-6xl mx-auto py-16 px-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-16">
        <aside className="w-full md:w-64 space-y-8 shrink-0 sticky top-32 h-fit">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Getting Started</h4>
            <nav className="flex flex-col gap-2">
              <a href="#overview" className="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors">System Overview</a>
              <a href="#chains" className="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors">Supported Chains</a>
              <a href="#logic" className="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors">Analysis Engine</a>
            </nav>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Technical Guides</h4>
            <nav className="flex flex-col gap-2">
              <a href="#solidity" className="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors">EVM Solidity Security</a>
              <a href="#solana" className="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors">Solana Rust Safety</a>
              <a href="#api" className="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors">Enterprise API</a>
            </nav>
          </div>
        </aside>

        <article className="flex-1 space-y-20 text-slate-300 pb-32">
          <section id="overview" className="space-y-6">
            <h2 className="text-4xl font-extrabold text-white tracking-tight">System Overview</h2>
            <p className="text-lg leading-relaxed text-slate-400">
              Youth is an enterprise-grade smart contract intelligence platform that utilizes large language models (Gemini 3 Pro) 
              fine-tuned on historical exploit data to provide immediate security auditing for multi-chain environments.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3 shadow-xl shadow-amber-500/5">
                <Shield className="w-6 h-6 text-amber-500" />
                <h3 className="font-bold text-white">Threat Prevention</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Automatic detection of high-risk patterns like reentrancy, unauthorized minting, and hidden backdoors.</p>
              </div>
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3 shadow-xl shadow-amber-500/5">
                <Code2 className="w-6 h-6 text-amber-500" />
                <h3 className="font-bold text-white">Logic Analysis</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Beyond static analysis, our AI interprets business logic to find functional flaws that automated scanners miss.</p>
              </div>
            </div>
          </section>

          <section id="chains" className="space-y-8 pt-12 border-t border-slate-900">
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Globe className="w-8 h-8 text-amber-500" /> Supported Infrastructure
            </h2>
            <p className="text-slate-400 leading-relaxed max-w-2xl">
              Youth indexes every major high-liquidity ecosystem to ensure cross-chain security parity. Our indexers maintain sub-second block latency.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.values(NETWORKS).map(net => (
                <div key={net.id} className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: net.color }} />
                  <span className="text-xs font-bold text-slate-200">{net.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="logic" className="space-y-6 pt-12 border-t border-slate-900">
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Cpu className="w-8 h-8 text-amber-500" /> Analysis Engine
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Our core engine translates complex bytecode or high-level source code into "Logic Vectors". These vectors are then compared against 
              known threat profiles across Ethereum, Polygon, and Solana. 
            </p>
            <div className="bg-black/40 p-6 rounded-xl border border-slate-800 font-mono text-[13px] text-amber-400 space-y-2 overflow-x-auto">
              <div className="flex items-center gap-2"><span className="text-slate-600">01</span> <span className="text-amber-500">INIT</span> security_pipeline_v4;</div>
              <div className="flex items-center gap-2"><span className="text-slate-600">02</span> <span className="text-amber-500">FETCH</span> source_code FROM indexer WHERE network = "SOLANA";</div>
              <div className="flex items-center gap-2"><span className="text-slate-600">03</span> <span className="text-amber-500">ANALYZE</span> logic_flow WITH gemini_3_pro;</div>
              <div className="flex items-center gap-2"><span className="text-slate-600">04</span> <span className="text-amber-500">DETECT</span> vulnerabilities(overflow, reentrancy, access_control);</div>
              <div className="flex items-center gap-2"><span className="text-slate-600">05</span> <span className="text-amber-500">GENERATE</span> structural_audit_report;</div>
            </div>
          </section>

          <section id="solidity" className="space-y-6 pt-12 border-t border-slate-900">
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Layers className="w-8 h-8 text-amber-500" /> EVM Solidity Security
            </h2>
            <div className="space-y-4">
              <div className="p-6 bg-slate-900/50 border-l-4 border-l-amber-500 rounded-r-2xl space-y-3">
                <h4 className="font-bold text-slate-100">Reentrancy Protection</h4>
                <p className="text-sm text-slate-400 leading-relaxed">Always use the Checks-Effects-Interactions pattern. Youth flags any external calls made before updating the contract's internal state.</p>
              </div>
              <div className="p-6 bg-slate-900/50 border-l-4 border-l-amber-500 rounded-r-2xl space-y-3">
                <h4 className="font-bold text-slate-100">Access Control Overrides</h4>
                <p className="text-sm text-slate-400 leading-relaxed">Centralization is a risk. Youth identifies `onlyOwner` or `onlyAdmin` functions that can rug-pull liquidity or pause critical services.</p>
              </div>
            </div>
          </section>

          <section id="solana" className="space-y-6 pt-12 border-t border-slate-900">
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Fingerprint className="w-8 h-8 text-amber-500" /> Solana Rust Safety
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Solana's programming model requires explicit account validation. Youth detects Anchor-specific vulnerabilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <h4 className="text-sm font-bold text-white mb-2">Account Reload Failure</h4>
                <p className="text-xs text-slate-500">Programs failing to reload account data after internal updates, leading to stale state exploitation.</p>
              </div>
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <h4 className="text-sm font-bold text-white mb-2">PDA Seed Collision</h4>
                <p className="text-xs text-slate-500">Mismatched or predictable Program Derived Address seeds that allow attackers to hijack storage accounts.</p>
              </div>
            </div>
          </section>

          <section id="api" className="space-y-6 pt-12 border-t border-slate-900">
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Terminal className="w-8 h-8 text-amber-500" /> Enterprise API Access
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Integrate Youth audits directly into your CI/CD pipeline or wallet browser extension.
            </p>
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-mono text-[12px]">
              <div className="text-slate-600 mb-2"># Requesting an automated audit</div>
              <div className="text-amber-400 italic">curl -X POST "https://api.youth.systems/v1/audit" \</div>
              <div className="text-amber-400 italic ml-4">-H "Authorization: Bearer YOUR_API_KEY" \</div>
              <div className="text-amber-400 italic ml-4">-d '{"address": "0x...", "network": "1"}'</div>
            </div>
          </section>

          <section className="bg-amber-600/10 border border-amber-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl font-bold text-white">Advanced Protocol Audit?</h3>
              <p className="text-sm text-slate-400">Our senior research team provides manual deep-dives for Tier 1 protocols and DAO launches.</p>
            </div>
            <button className="px-8 py-3 bg-white text-black font-bold rounded-xl text-xs uppercase tracking-widest whitespace-nowrap hover:bg-slate-200 transition-colors">
              Schedule Review
            </button>
          </section>
        </article>
      </div>
    </div>
  );

  const renderIntelligence = () => (
    <div className="max-w-6xl mx-auto py-16 px-8 animate-in fade-in duration-500 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-400 font-black text-[10px] uppercase tracking-[0.3em]">
            <Radio className="w-3 h-3 animate-pulse text-red-500" /> Live Monitoring System
          </div>
          <h2 className="text-5xl font-extrabold text-white tracking-tighter">Market Security Health</h2>
        </div>
        <div className="flex gap-4 p-1.5 bg-slate-900/50 border border-slate-800 rounded-xl">
          <button className="px-5 py-2.5 bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-lg">Global Feed</button>
          <button className="px-5 py-2.5 text-slate-500 hover:text-slate-300 text-xs font-bold transition-colors">Smart Money</button>
          <button className="px-5 py-2.5 text-slate-500 hover:text-slate-300 text-xs font-bold transition-colors">Threat Map</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] space-y-8">
          <div className="flex justify-between items-center">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Global Risk Index</h4>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-center py-4 relative">
             <div className="text-7xl font-black text-white tracking-tighter">14.2</div>
             <div className="text-[11px] text-emerald-500 font-bold uppercase tracking-[0.2em] mt-3">Nominal Stability</div>
             <div className="absolute -bottom-4 right-0 flex items-center gap-1.5 text-[10px] text-slate-600">
               <TrendingUp className="w-3 h-3" /> -1.4% (24h)
             </div>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 w-[14%]" />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Risk index represents weighted exploit frequency vs total TVL movement across indexed chains.
          </p>
        </div>

        <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] space-y-8">
          <div className="flex justify-between items-center">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-red-500">Active Mitigation</h4>
            <BarChart3 className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-center py-4">
             <div className="text-7xl font-black text-white tracking-tighter">842</div>
             <div className="text-[11px] text-amber-400 font-bold uppercase tracking-[0.2em] mt-3">Threats Defused Today</div>
          </div>
          <div className="space-y-3 pt-4 border-t border-slate-800/50">
             <div className="flex justify-between text-[11px] font-bold">
               <span className="text-slate-500">MEV Protection</span>
               <span className="text-slate-200">99.8%</span>
             </div>
             <div className="flex justify-between text-[11px] font-bold">
               <span className="text-slate-500">Honeypot Detection</span>
               <span className="text-slate-200">12.4k</span>
             </div>
          </div>
        </div>

        <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] space-y-8">
          <div className="flex justify-between items-center">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Protocol Uptime</h4>
            <Globe className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-5 pt-2">
            {[
              { name: 'Ethereum Mainnet', status: 'Online', delay: '12ms', health: 99 },
              { name: 'Polygon PoS', status: 'Online', delay: '48ms', health: 98 },
              { name: 'Solana Program Index', status: 'Optimal', delay: '102ms', health: 100 },
              { name: 'Base Network', status: 'Online', delay: '31ms', health: 97 }
            ].map(net => (
              <div key={net.name} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-slate-200">{net.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 font-mono">{net.delay}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full">
                  <div className="h-full bg-amber-600/40 rounded-full" style={{ width: `${net.health}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-amber-500" /> Live Intelligence Stream
          </h3>
          <div className="bg-slate-900/20 border border-slate-800 rounded-[2.5rem] divide-y divide-slate-800/50 overflow-hidden shadow-2xl">
            {liveAlerts.map(alert => (
              <div key={alert.id} className="p-8 flex items-center justify-between hover:bg-slate-800/20 transition-all group animate-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-8">
                  <div className={`p-4 rounded-2xl transition-colors ${alert.severity === 'HIGH' ? 'bg-red-500/10 text-red-500' : alert.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-500/10 text-amber-400'}`}>
                     <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors">{alert.type}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-1.5 flex items-center gap-2">
                       <span className="bg-black/40 px-2 py-0.5 rounded tracking-tighter">{alert.contract}</span>
                       <span className="text-slate-700">|</span>
                       <span className="text-slate-600 italic">Youth Node: A-42</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">{alert.time}</div>
                  <div className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm ${alert.severity === 'HIGH' ? 'border-red-500/30 bg-red-500/5 text-red-500' : alert.severity === 'MEDIUM' ? 'border-amber-500/30 bg-amber-500/5 text-amber-500' : 'border-amber-500/30 bg-amber-500/5 text-amber-500'}`}>
                    {alert.severity} THREAT
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
           <h3 className="text-xl font-extrabold text-white flex items-center gap-3">
            <Database className="w-5 h-5 text-amber-500" /> Intelligence Nodes
          </h3>
          <div className="p-10 bg-gradient-to-br from-red-900/20 to-slate-900 border border-slate-800 rounded-[2.5rem] space-y-10 shadow-2xl shadow-red-500/5">
             <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Resource Allocation</h4>
               <div className="space-y-6">
                 <div>
                   <div className="flex justify-between text-xs font-bold mb-2">
                     <span className="text-slate-400">Memory Cluster</span>
                     <span className="text-amber-400">82%</span>
                   </div>
                   <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 w-[82%]" />
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between text-xs font-bold mb-2">
                     <span className="text-slate-400">AI Compute Cycles</span>
                     <span className="text-amber-400">41%</span>
                   </div>
                   <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 w-[41%]" />
                   </div>
                 </div>
               </div>
             </div>

             <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-red-500">Network Load (24h)</h4>
               <div className="flex items-end gap-1.5 h-20">
                 {[40, 60, 45, 80, 50, 90, 100, 70, 30, 60, 85, 40].map((h, i) => (
                   <div key={i} className={`flex-1 ${h > 80 ? 'bg-red-500 border-red-500' : 'bg-amber-500/20 border-amber-500'} border-t-2 rounded-t-sm`} style={{ height: `${h}%` }} />
                 ))}
               </div>
             </div>

             <div className="pt-6 border-t border-slate-800/50 flex flex-col gap-4">
               <button className="w-full py-4 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all">
                 Download Raw Audit Logs
               </button>
               <button className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all">
                 Request Node Expansion
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-12 px-8 text-center">
      <div className="relative">
        <div className="w-28 h-28 border-[3px] border-slate-900 border-t-amber-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-amber-500 fill-current" />
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Processing Security Nodes</h2>
        <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">{loadingMessage}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#020617]">
      <Header 
        onOpenSettings={() => setShowSettings(true)} 
        currentView={currentView}
        setView={setCurrentView}
      />
      
      <main className="flex-1 relative">
        {loading ? renderLoading() : (
          <>
            {currentView === 'landing' && renderLanding()}
            {currentView === 'audit' && renderResults()}
            {currentView === 'docs' && renderDocs()}
            {currentView === 'intelligence' && renderIntelligence()}
          </>
        )}
      </main>

      <Footer />

      <SpeedInsights />

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <ChatBot context={audit ? `YOUTH CONTEXT: ${contractInfo?.name} on ${NETWORKS[contractInfo?.network || Network.ETHEREUM].name}. RISK: ${audit.riskLevel}.` : "General inquiry."} />

      {showUpgrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border border-slate-800 p-12 rounded-[3rem] max-w-lg w-full relative shadow-3xl space-y-10">
            <button 
              onClick={() => setShowUpgrade(false)}
              className="absolute top-8 right-8 text-slate-600 hover:text-white transition-colors"
            >
              <X className="w-7 h-7" />
            </button>
            <div className="text-center space-y-5">
              <div className="w-20 h-20 bg-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-600/20">
                <ShieldCheck className="w-10 h-10 text-slate-950 fill-current" />
              </div>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">Institutional Access</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Professional-tier license required for unlimited cross-chain auditing and high-priority AI processing.
              </p>
            </div>
            
            <div className="pt-4">
              <button 
                onClick={handleUpgrade}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
              >
                Acquire License — $49/mo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
