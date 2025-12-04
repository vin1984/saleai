import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageCircle,
  ShieldAlert,
  CheckCircle,
  Repeat,
  Zap,
  Send,
  Loader2,
  Lock,
  Crown,
  Menu,
  X,
  Bot,
  ArrowRight,
  Briefcase,
  Mail,
  User as UserIcon,
  Phone,
  Check,
  Building,
  ChevronRight,
  Star,
  Settings,
  LogOut,
  Search,
  Plus,
  Trash2,
  Edit,
  MoreHorizontal,
  AlertCircle,
  LogIn,
  Image as ImageIcon,
  Calendar,
  CreditCard,
  DollarSign,
  Share2,
  Clock,
  Copy,
  Link as LinkIcon
} from "lucide-react";

// --- Types ---

type Message = {
  role: "user" | "model";
  text: string;
};

type SalesStage = 
  | "dashboard"
  | "prospecting"
  | "preparation"
  | "communication"
  | "objection"
  | "closing"
  | "retention"
  | "roleplay";

type ViewState = "landing" | "blog" | "register" | "pending" | "app" | "admin-login" | "admin-dashboard";

type UserStatus = 'pending' | 'active' | 'suspended';
type UserPlan = 'free' | 'pro';

interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  phone: string;
  status: UserStatus;
  plan: UserPlan;
  joinedDate: string;
  referralCode: string;
  commissionBalance: number;
  subscriptionEnds: string;
}

interface StageConfig {
  id: SalesStage;
  label: string;
  icon: React.ReactNode;
  systemPrompt: string;
  description: string;
  isPro?: boolean;
  starters: string[];
}

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  readTime: string;
  image?: string;
}

// --- Configuration & Data ---

const STAGES: StageConfig[] = [
  {
    id: "dashboard",
    label: "总览仪表盘",
    icon: <LayoutDashboard size={20} />,
    description: "查看您的销售进度与AI建议概览",
    systemPrompt: "You are a helpful assistant.", 
    starters: []
  },
  {
    id: "prospecting",
    label: "客户开发",
    icon: <Users size={20} />,
    description: "寻找潜在客户，制定开发策略",
    systemPrompt: "你是一个世界级的销售教练，专门负责'客户开发'阶段。你的目标是帮助销售人员找到高质量的潜在客户。请提供关于陌生拜访、线索挖掘、社交媒体营销（LinkedIn/微信）的具体策略。回答要简练、专业、且可执行。如果用户询问如何开场，请提供具体的开场白话术。",
    starters: ["如何通过微信进行冷启动开发？", "帮我写一个针对制造业CEO的陌生拜访邮件", "怎么筛选高意向客户？"]
  },
  {
    id: "preparation",
    label: "售前准备",
    icon: <FileText size={20} />,
    description: "背景调查，痛点分析，方案构思",
    systemPrompt: "你是一个世界级的销售教练，专门负责'售前准备'阶段。指导用户如何做背景调查（KYC），如何分析客户财报或新闻来寻找切入点，以及如何设定拜访目标。帮助用户预测客户可能的需求和痛点。",
    starters: ["拜访一家SaaS公司前我需要查什么？", "如何设定初次拜访的SMART目标？", "帮我分析一下客户可能的痛点"]
  },
  {
    id: "communication",
    label: "见面沟通",
    icon: <MessageCircle size={20} />,
    description: "SPIN提问，价值传递，建立信任",
    systemPrompt: "你是一个世界级的销售教练，精通沟通心理学和SPIN销售法。指导用户如何在见面时建立亲和力（Rapport），如何通过提问（SPIN）挖掘需求，以及如何进行能够打动人的价值陈述。如果用户要求话术，请给出不同语气的选项。",
    starters: ["给我几个SPIN提问的例子", "如何在前5分钟建立信任？", "怎么介绍我们的产品才不枯燥？"]
  },
  {
    id: "objection",
    label: "异议处理",
    icon: <ShieldAlert size={20} />,
    description: "化解抗拒，处理'太贵'或'不需要'",
    systemPrompt: "你是一个世界级的销售教练，擅长处理异议。当用户输入客户的反对意见（如'太贵了'、'我们要再考虑一下'、'已经有供应商了'）时，不要争辩，而是教用户使用'LSCPA'（倾听、分享、澄清、陈述、询问）等模型来化解。直接给出具体的应对回答话术。",
    starters: ["客户说'价格太贵了'怎么回？", "客户说'我们需要内部讨论一下'", "客户说'不仅有供应商了，而且合作很好'"]
  },
  {
    id: "closing",
    label: "促成成交",
    icon: <CheckCircle size={20} />,
    description: "谈判技巧，临门一脚，合同签署",
    systemPrompt: "你是一个世界级的销售教练，专注于'成交'（Closing）。帮助用户识别购买信号，提供促成技巧（如假设成交法、二选一法）。指导用户如何进行价格谈判而不丢失底线。",
    starters: ["有哪些高效的逼单技巧？", "客户一直在拖延签约怎么办？", "谈判时如何守住价格底线？"]
  },
  {
    id: "retention",
    label: "后期维护",
    icon: <Repeat size={20} />,
    description: "售后服务，复购刺激，转介绍",
    systemPrompt: "你是一个世界级的销售教练，关注客户全生命周期价值（LTV）。指导用户如何做售后服务，如何优雅地请求转介绍（Referral），以及如何通过向上销售（Up-sell）和交叉销售（Cross-sell）提升业绩。",
    starters: ["如何让客户愿意帮我转介绍？", "客户投诉处理流程建议", "怎样进行二次销售？"]
  },
  {
    id: "roleplay",
    label: "AI 模拟对练",
    icon: <Zap size={20} />,
    description: "与 AI 进行真实场景模拟演练 (Pro)",
    isPro: true,
    systemPrompt: "你现在扮演一个非常难缠的客户，对于对方的每一个提议都要提出质疑，并且要求对方证明其价值。从一开始就表现出极大的怀疑态度。不要在这个角色扮演中跳出角色，始终保持客户的身份，直到用户说停止。", 
    starters: ["开启针对'价格谈判'的模拟对练", "模拟一个极其挑剔的采购经理"]
  }
];

const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "2025年销售趋势：AI 如何重塑B2B销售流程",
    excerpt: "随着生成式AI的普及，传统的陌生拜访正在消亡。本文探讨如何利用AI工具提升300%的线索转化率...",
    content: "这是一个关于2025年销售趋势的详细文章内容。生成式AI正在改变一切...\n\n1. 自动化线索挖掘\n2. 个性化开发信\n3. 智能谈判辅助\n\n(此处省略5000字)",
    date: "2024-05-12",
    category: "行业趋势",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: 2,
    title: "告别价格战：如何通过价值销售赢得高利润订单",
    excerpt: "客户总是嫌贵？问题不在价格，而在价值传递。掌握这三个SPIN提问技巧，让客户主动成交...",
    content: "价值销售的核心在于重新定义客户的问题。如果客户只关注价格，说明你没有让他们看到痛点的代价...",
    date: "2024-05-08",
    category: "销售技巧",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: 3,
    title: "从销冠到销售经理：如何打造一支铁军",
    excerpt: "个人业绩好不代表能带好团队。建立标准化的销售SOP和复制销冠能力是关键...",
    content: "管理团队需要的是另一套技能树。从授权到辅导，从招聘到激励...",
    date: "2024-04-29",
    category: "团队管理",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  }
];

const MOCK_USERS: User[] = [
  { 
    id: "1", 
    name: "张伟", 
    email: "zhangwei@techcorp.com", 
    company: "科技先锋有限公司", 
    role: "销售经理", 
    phone: "13800138000", 
    status: "active", 
    plan: "pro", 
    joinedDate: "2024-01-15",
    referralCode: "ZW888",
    commissionBalance: 1250,
    subscriptionEnds: "2025-01-15"
  },
  { 
    id: "2", 
    name: "李娜", 
    email: "lina@globaltrade.cn", 
    company: "环球贸易", 
    role: "BD", 
    phone: "13912345678", 
    status: "active", 
    plan: "free", 
    joinedDate: "2024-02-20",
    referralCode: "LN666",
    commissionBalance: 0,
    subscriptionEnds: "2024-03-20"
  },
  { 
    id: "3", 
    name: "王强", 
    email: "wangqiang@start.up", 
    company: "未来创新", 
    role: "CEO", 
    phone: "13766668888", 
    status: "pending", 
    plan: "free", 
    joinedDate: "2024-05-14",
    referralCode: "WQ777",
    commissionBalance: 0,
    subscriptionEnds: "2024-05-21"
  },
];

// --- Helper Functions ---

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
};

// --- Sub-Components (App Internal) ---

const SubscriptionModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-primary p-6 text-center">
          <Crown className="w-12 h-12 text-gold mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white">升级到专业版</h2>
          <p className="text-blue-100 mt-1">解锁 AI 模拟对练与深度分析</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500 w-5 h-5" />
              <span className="text-gray-700">无限次 AI 对话咨询</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500 w-5 h-5" />
              <span className="text-gray-700 font-semibold">1-on-1 实战模拟对练 (Roleplay)</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500 w-5 h-5" />
              <span className="text-gray-700 font-semibold">深度销售案例分析</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500 w-5 h-5" />
              <span className="text-gray-700">优先响应支持</span>
            </div>
          </div>
          
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-500 line-through">¥199/月</span>
              <span className="text-3xl font-bold text-primary">¥99<span className="text-sm text-gray-500 font-normal">/月</span></span>
            </div>
            <button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              立即开启 7 天免费试用
            </button>
            <p className="text-xs text-center text-gray-400 mt-3">随时取消，不仅限于演示用途</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatInterface = ({ 
  stage, 
  onShowSubscription 
}: { 
  stage: StageConfig; 
  onShowSubscription: () => void 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [stage.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    if (stage.isPro) {
      onShowSubscription();
      return;
    }

    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction: stage.systemPrompt },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const result = await chat.sendMessageStream({ message: text });
      
      let fullText = "";
      setMessages((prev) => [...prev, { role: "model", text: "" }]);

      for await (const chunk of result) {
        fullText += chunk.text;
        setMessages((prev) => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: "model", text: fullText };
          return newMsgs;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "model", text: "抱歉，连接 AI 教练时出现错误。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${stage.isPro ? 'bg-gold/10 text-gold' : 'bg-primary/10 text-primary'}`}>
            {stage.icon}
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              {stage.label}
              {stage.isPro && <Crown size={16} className="text-gold fill-current" />}
            </h2>
            <p className="text-sm text-gray-500 hidden sm:block">{stage.description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60 mt-10">
            <Bot size={48} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">我是您的{stage.label}教练</h3>
            <p className="text-gray-500 max-w-md">请问在这个阶段您遇到了什么困难？</p>
            <div className="grid gap-3 mt-8 w-full max-w-lg">
              {stage.starters.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(starter)}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:border-primary hover:text-primary transition-colors text-left text-sm text-gray-600 shadow-sm"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-white rounded-br-none" : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t">
        <div className="relative max-w-4xl mx-auto flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={stage.isPro ? "解锁以开始模拟对练..." : "输入您的问题..."}
            className="w-full bg-gray-100 border-0 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all resize-none max-h-32 min-h-[52px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && !stage.isPro)}
            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${input.trim() ? "bg-primary text-white shadow-md hover:bg-primary-dark" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ onNavigate, currentUser }: { onNavigate: (id: SalesStage) => void, currentUser?: User | null }) => {
  const stats = [
    { label: "本月成交", value: "¥128,000", change: "+12%", trend: "up" },
    { label: "新增线索", value: "45", change: "+5", trend: "up" },
    { label: "转化率", value: "24%", change: "-2%", trend: "down" },
  ];

  return (
    <div className="space-y-6 overflow-y-auto h-full p-1">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">欢迎回来，{currentUser ? currentUser.name : "销售精英"}</h1>
        <p className="text-gray-500 mt-2">今天是提升业绩的好日子。准备好开始了吗？</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">技能提升捷径</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAGES.filter(s => s.id !== 'dashboard').map((stage) => (
          <button
            key={stage.id}
            onClick={() => onNavigate(stage.id)}
            className={`group text-left p-6 rounded-2xl border transition-all hover:shadow-md ${
              stage.isPro 
                ? "bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800 text-white" 
                : "bg-white border-gray-200 hover:border-primary/50 text-gray-800"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stage.isPro ? 'bg-white/10' : 'bg-blue-50 text-primary'}`}>
                {stage.icon}
              </div>
              {stage.isPro && <Crown size={18} className="text-gold" />}
            </div>
            <h3 className="font-bold text-lg mb-1">{stage.label}</h3>
            <p className={`text-sm ${stage.isPro ? 'text-gray-400' : 'text-gray-500'}`}>{stage.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const UserProfile = ({ user }: { user: User }) => {
  const isExpired = new Date(user.subscriptionEnds) < new Date();
  const referralLink = `https://salesmultiplier.ai/invite/${user.referralCode}`;

  const copyToClipboard = (text: string) => {
      try {
        navigator.clipboard.writeText(text);
        alert("已复制: " + text);
      } catch (e) {
        alert("复制失败，请手动选择复制");
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
       <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
             {user.name.charAt(0)}
          </div>
          <div className="flex-1 space-y-4">
             <div>
               <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
               <p className="text-gray-500">{user.company} | {user.role}</p>
             </div>
             <div className="flex flex-wrap gap-4">
               <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-400 block uppercase tracking-wide">当前计划</span>
                  <span className={`font-bold ${user.plan === 'pro' ? 'text-gold' : 'text-gray-700'}`}>
                    {user.plan === 'pro' ? 'PRO 专业版' : '免费基础版'}
                  </span>
               </div>
               <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-400 block uppercase tracking-wide">到期时间</span>
                  <span className={`font-bold ${isExpired ? 'text-red-500' : 'text-green-600'}`}>
                    {formatDate(user.subscriptionEnds)}
                  </span>
               </div>
             </div>
          </div>
          <button className="bg-gold hover:bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-md">
             {user.plan === 'pro' ? '续费会员' : '升级会员'}
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Referral Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
             <div className="relative z-10">
               <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                 <Share2 size={20} className="text-blue-400"/> 
                 合伙人推广
               </h3>
               <p className="text-gray-400 text-sm mb-6">邀请好友注册，您和好友均可获得 7 天 PRO 会员奖励，且享受 20% 现金返佣。</p>
               
               <div className="bg-white/10 rounded-xl p-4 mb-4 backdrop-blur-sm border border-white/10 space-y-4">
                 <div>
                    <p className="text-xs text-gray-400 mb-1">您的专属推荐码</p>
                    <div className="flex justify-between items-center">
                    <span className="text-2xl font-mono font-bold tracking-widest text-gold">{user.referralCode}</span>
                    <button 
                        onClick={() => copyToClipboard(user.referralCode)}
                        className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
                    >
                        复制
                    </button>
                    </div>
                 </div>

                 <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-1">专属推广链接</p>
                    <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 border border-white/5 group cursor-pointer hover:bg-black/30 transition-colors" onClick={() => copyToClipboard(referralLink)}>
                        <LinkIcon size={14} className="text-blue-400 flex-shrink-0" />
                        <span className="text-xs text-gray-300 truncate font-mono flex-1 select-all">{referralLink}</span>
                        <Copy size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                 </div>
               </div>
             </div>
          </div>

          {/* Commission Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
             <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-gray-800">
               <DollarSign size={20} className="text-green-600"/> 
               收益中心
             </h3>
             <div className="flex items-center justify-between mb-8">
                <div>
                   <p className="text-sm text-gray-500">可提现金额</p>
                   <p className="text-3xl font-bold text-gray-900">¥{user.commissionBalance.toFixed(2)}</p>
                </div>
                <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                   <CreditCard size={20} className="text-green-600"/>
                </div>
             </div>
             <button 
               disabled={user.commissionBalance <= 0}
               className={`w-full py-3 rounded-xl font-bold transition-colors ${user.commissionBalance > 0 ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
             >
               申请提现
             </button>
             <p className="text-xs text-center text-gray-400 mt-3">每月 15 日统一结算上月收益</p>
          </div>
       </div>
    </div>
  );
};

const SalesApp = ({ onLogout, currentUser }: { onLogout: () => void, currentUser: User | null }) => {
  // Add 'profile' to existing type logic locally or extend the type
  const [currentView, setCurrentView] = useState<SalesStage | 'profile'>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  
  const currentStageConfig = STAGES.find(s => s.id === currentView);

  const handleNavigate = (id: SalesStage | 'profile') => {
    setCurrentView(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-primary-dark text-white flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-light to-primary rounded-lg flex items-center justify-center shadow-lg">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Sales AI</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/50"><X size={20} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {STAGES.map((stage) => (
            <button
              key={stage.id}
              onClick={() => handleNavigate(stage.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${currentView === stage.id ? "bg-primary text-white shadow-lg shadow-blue-900/20" : "text-blue-200 hover:bg-white/5 hover:text-white"}`}
            >
              {stage.icon}
              <span className="flex-1 text-left">{stage.label}</span>
              {stage.isPro && <Lock size={14} className="text-blue-400" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          {currentUser?.plan === 'free' && (
            <div className="rounded-xl bg-gradient-to-r from-gold to-yellow-600 p-4 relative overflow-hidden group cursor-pointer" onClick={() => setShowSubscription(true)}>
              <div className="relative z-10">
                <h4 className="font-bold text-white text-sm">升级到专业版</h4>
                <p className="text-yellow-100 text-xs mt-1">解锁 AI 模拟对练</p>
              </div>
              <Crown className="absolute -bottom-2 -right-2 text-white/20 w-16 h-16 group-hover:scale-110 transition-transform" />
            </div>
          )}
          
          <button 
             onClick={() => handleNavigate('profile')}
             className={`w-full bg-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left ${currentView === 'profile' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
               {currentUser?.name.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
               <p className="text-xs text-blue-300 truncate">个人中心</p>
            </div>
          </button>
          <button onClick={onLogout} className="w-full text-center text-blue-200 text-sm hover:text-white flex items-center justify-center gap-2">
            <LogOut size={14} /> 退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center justify-between bg-white px-4 py-3 border-b">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600"><Menu size={24} /></button>
          <span className="font-bold text-gray-800">Sales Multiplier</span>
          <div className="w-8" />
        </div>
        <div className="flex-1 p-4 lg:p-6 overflow-hidden relative">
          {currentView === "dashboard" && <Dashboard onNavigate={(id) => handleNavigate(id)} currentUser={currentUser} />}
          {currentView === "profile" && currentUser && <UserProfile user={currentUser} />}
          {currentStageConfig && currentView !== "dashboard" && <ChatInterface stage={currentStageConfig} onShowSubscription={() => setShowSubscription(true)} />}
        </div>
      </main>
      <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
    </div>
  );
};

// --- Admin Components ---

const AdminLogin = ({ onLogin, onBack }: { onLogin: () => void, onBack: () => void }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin") {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 text-white w-full max-w-md p-8 rounded-2xl shadow-2xl border border-gray-700">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Settings className="text-blue-400" size={32} />
          <h1 className="text-2xl font-bold">后台管理系统</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">管理员密码 (默认: admin)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle size={14}/> 密码错误</p>}
          <div className="flex gap-3">
             <button type="button" onClick={onBack} className="flex-1 py-3 text-gray-400 hover:text-white transition-colors">返回首页</button>
             <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors">登录</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PostEditorModal = ({ 
  post, 
  onSave, 
  onClose 
}: { 
  post?: BlogPost | null, 
  onSave: (post: BlogPost) => void, 
  onClose: () => void 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '销售技巧',
    content: '',
    image: ''
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        category: post.category,
        content: post.content || '',
        image: post.image || ''
      });
    }
  }, [post]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: BlogPost = {
      id: post?.id || Date.now(),
      title: formData.title,
      content: formData.content,
      excerpt: formData.content.substring(0, 100) + '...',
      category: formData.category,
      date: post?.date || new Date().toISOString().split('T')[0],
      readTime: Math.ceil(formData.content.length / 500) + " min read",
      image: formData.image
    };
    onSave(newPost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{post ? '编辑文章' : '新建文章'}</h2>
          <button onClick={onClose}><X className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">文章标题</label>
            <input 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="请输入引人注目的标题"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2 bg-white"
                >
                  <option>销售技巧</option>
                  <option>行业趋势</option>
                  <option>团队管理</option>
                  <option>案例分析</option>
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">封面图片</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer border border-dashed border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <ImageIcon size={16} /> {formData.image ? '更改图片' : '上传图片'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
             </div>
          </div>

          {formData.image && (
            <div className="h-40 w-full bg-gray-100 rounded-lg overflow-hidden relative">
               <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
               <button 
                type="button"
                onClick={() => setFormData({...formData, image: ''})}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
               >
                 <X size={14} />
               </button>
            </div>
          )}

          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">正文内容</label>
            <textarea 
              required
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              className="w-full border rounded-lg px-4 py-2 min-h-[200px] flex-1 resize-y"
              placeholder="在这里撰写您的文章..."
            />
          </div>
        </form>
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">取消</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">保存文章</button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ 
  users, 
  setUsers, 
  posts, 
  setPosts,
  onLogout 
}: { 
  users: User[], 
  setUsers: React.Dispatch<React.SetStateAction<User[]>>, 
  posts: BlogPost[], 
  setPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>,
  onLogout: () => void 
}) => {
  const [tab, setTab] = useState<'users' | 'posts'>('users');
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const pendingCount = users.filter(u => u.status === 'pending').length;

  useEffect(() => {
    setSearchQuery("");
  }, [tab]);

  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.company.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
    );
  });

  const filteredPosts = posts.filter(post => {
    const q = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q)
    );
  });

  const handleApprove = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: 'active' } : u));
  };

  const handleExtendSubscription = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const currentEnd = new Date(u.subscriptionEnds);
        currentEnd.setMonth(currentEnd.getMonth() + 1);
        return { ...u, subscriptionEnds: currentEnd.toISOString().split('T')[0] };
      }
      return u;
    }));
    alert("已为用户延长 1 个月订阅");
  };

  const handleSavePost = (newPost: BlogPost) => {
    if (editingPost) {
      setPosts(posts.map(p => p.id === newPost.id ? newPost : p));
    } else {
      setPosts([newPost, ...posts]);
    }
    setIsEditorOpen(false);
    setEditingPost(null);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setIsEditorOpen(true);
  };

  const handleDeletePost = (id: number) => {
    if(confirm('确定要删除这篇文章吗？')) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">
      <header className="bg-gray-900 text-white shadow-md z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Settings className="text-blue-400" />
            <span className="font-bold text-lg">SalesAI Admin</span>
            <span className="bg-gray-800 text-xs px-2 py-1 rounded ml-2 text-gray-400">v1.2.0</span>
          </div>
          <button onClick={onLogout} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
            <LogOut size={16} /> 退出
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 gap-8">
        <aside className="w-64 flex-shrink-0">
          <nav className="space-y-2 sticky top-24">
            <button 
              onClick={() => setTab('users')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${tab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <div className="flex items-center gap-3">
                <Users size={18} />
                <span>会员管理</span>
              </div>
              {pendingCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>}
            </button>
            <button 
              onClick={() => setTab('posts')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${tab === 'posts' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <div className="flex items-center gap-3">
                <FileText size={18} />
                <span>内容管理</span>
              </div>
            </button>
          </nav>
        </aside>

        <main className="flex-1">
          {tab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <h2 className="font-bold text-gray-800 flex items-center gap-2"><Users size={20} className="text-blue-600"/> 用户列表</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索姓名、邮箱、公司..." 
                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-sm" 
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-3">用户</th>
                      <th className="px-6 py-3">公司/职位</th>
                      <th className="px-6 py-3">状态</th>
                      <th className="px-6 py-3">订阅到期</th>
                      <th className="px-6 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-gray-500 text-xs">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{user.company}</div>
                          <div className="text-gray-500 text-xs">{user.role}</div>
                        </td>
                        <td className="px-6 py-4">
                          {user.status === 'pending' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">待审核</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">活跃</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                          {user.subscriptionEnds}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {user.status === 'pending' ? (
                            <button onClick={() => handleApprove(user.id)} className="text-green-600 hover:text-green-800 font-medium text-xs bg-green-50 px-2 py-1 rounded">通过</button>
                          ) : (
                             <button onClick={() => handleExtendSubscription(user.id)} className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-2 py-1 rounded">续费+1月</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'posts' && (
             <div className="space-y-6">
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2"><FileText size={20} className="text-blue-600"/> 文章管理</h2>
                    <div className="flex gap-4">
                       <div className="relative w-64">
                          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                          <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索文章..." 
                            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-sm" 
                          />
                        </div>
                        <button 
                          onClick={() => { setEditingPost(null); setIsEditorOpen(true); }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                           <Plus size={16}/> 发布文章
                        </button>
                    </div>
                  </div>
                 
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-3">标题</th>
                        <th className="px-6 py-3">分类</th>
                        <th className="px-6 py-3">日期</th>
                        <th className="px-6 py-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPosts.map(post => (
                        <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{post.title}</div>
                            {post.image && <span className="text-xs text-blue-400 flex items-center gap-1 mt-1"><ImageIcon size={10}/> 有封面图</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs">{post.category}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{post.date}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                             <button onClick={() => handleEditPost(post)} className="text-blue-500 hover:text-blue-700 p-1">
                               <Edit size={16} />
                             </button>
                             <button onClick={() => handleDeletePost(post.id)} className="text-red-400 hover:text-red-600 p-1">
                               <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
             </div>
          )}
        </main>
      </div>
      {isEditorOpen && (
        <PostEditorModal 
          post={editingPost} 
          onSave={handleSavePost} 
          onClose={() => { setIsEditorOpen(false); setEditingPost(null); }} 
        />
      )}
    </div>
  );
};


// --- Website Components ---

const Navbar = ({ 
  onViewChange, 
  currentView,
  onLoginClick
}: { 
  onViewChange: (view: ViewState) => void, 
  currentView: ViewState,
  onLoginClick: () => void
}) => (
  <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center cursor-pointer" onClick={() => onViewChange('landing')}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
            <Zap size={18} className="text-white fill-current" />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">Sales Multiplier AI</span>
        </div>
        <div className="flex items-center space-x-8">
          <button 
            onClick={() => onViewChange('landing')}
            className={`text-sm font-medium ${currentView === 'landing' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
          >
            首页
          </button>
          <button 
            onClick={() => onViewChange('blog')}
            className={`text-sm font-medium ${currentView === 'blog' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
          >
            博客
          </button>
          <div className="flex items-center gap-4">
             <button 
               onClick={onLoginClick}
               className="text-gray-500 hover:text-primary font-medium text-sm flex items-center gap-1 transition-colors"
             >
               <LogIn size={16} /> 登录
             </button>
             <button 
               onClick={() => onViewChange('register')}
               className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl"
             >
               申请试用
             </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
);

const Footer = ({ onViewChange }: { onViewChange: (view: ViewState) => void }) => (
  <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="col-span-1 md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
           <Zap className="text-gold" />
           <span className="text-xl font-bold">Sales Multiplier AI</span>
        </div>
        <p className="text-gray-400 max-w-sm">
          专为销售团队打造的智能化陪练平台。通过实战模拟、话术生成与全流程指导，帮助企业实现业绩倍增。
        </p>
      </div>
      <div>
        <h3 className="font-bold mb-4 text-gray-200">产品</h3>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li>功能特性</li>
          <li>定价方案</li>
          <li>企业版</li>
          <li>API 接入</li>
        </ul>
      </div>
      <div>
        <h3 className="font-bold mb-4 text-gray-200">联系我们</h3>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li>help@salesmultiplier.ai</li>
          <li>商务合作: 400-888-6666</li>
          <li>北京市朝阳区科技园A座</li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm flex justify-between">
      <span>© 2024 Sales Multiplier AI. All rights reserved.</span>
      <button onClick={() => onViewChange('admin-login')} className="text-gray-700 hover:text-gray-500 text-xs">管理后台入口</button>
    </div>
  </footer>
);

const LandingPage = ({ onViewChange }: { onViewChange: (view: ViewState) => void }) => (
  <div className="bg-white">
    {/* Hero */}
    <div className="relative overflow-hidden bg-gray-900 pt-16 pb-32">
       <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80')] opacity-10 bg-cover bg-center" />
       <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900" />
       
       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm font-medium mb-6">
           <Star size={14} className="fill-current text-gold" />
           <span>2025年最佳 AI 销售辅助工具</span>
         </div>
         <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
           销售业绩 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">倍增引擎</span>
         </h1>
         <p className="text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed">
           不是简单的聊天机器人，而是您的全天候销售总监。从潜在客户开发到合同签署，全程提供世界级的话术指导与策略支持。
         </p>
         <div className="flex gap-4">
           <button onClick={() => onViewChange('register')} className="bg-primary hover:bg-blue-600 text-white text-lg px-8 py-4 rounded-full font-bold transition-all shadow-xl shadow-blue-900/50 flex items-center gap-2">
             免费申请试用 <ArrowRight size={20} />
           </button>
           <button onClick={() => onViewChange('blog')} className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-lg px-8 py-4 rounded-full font-bold transition-all border border-white/10">
             查看成功案例
           </button>
         </div>
       </div>
    </div>

    {/* Features */}
    <div className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">覆盖销售全流程的智能指导</h2>
          <p className="text-gray-500 mt-4">无论是新人入职培训，还是资深销售攻坚，都能找到即时帮助</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Users className="text-blue-500" />, title: "精准获客", desc: "自动生成针对性的开发信与破冰话术，提高线索回复率。" },
            { icon: <MessageCircle className="text-purple-500" />, title: "沟通导航", desc: "实时提供SPIN提问策略，挖掘客户深层需求。" },
            { icon: <ShieldAlert className="text-red-500" />, title: "异议粉碎", desc: "遇到“太贵了”不知所措？AI 教你用价值锚定法化解抗拒。" },
            { icon: <Zap className="text-gold" />, title: "实战演练", desc: "模拟最难缠的采购经理，进行高压对练，上战场前先练兵。" },
            { icon: <CheckCircle className="text-green-500" />, title: "成交加速", desc: "识别购买信号，提供多种逼单策略，缩短成交周期。" },
            { icon: <Repeat className="text-cyan-500" />, title: "客户深耕", desc: "制定复购与转介绍计划，最大化客户终身价值。" }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
                {React.cloneElement(feature.icon as React.ReactElement<any>, { size: 24 })}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const BlogPage = ({ posts, onViewChange }: { posts: BlogPost[], onViewChange: (view: ViewState) => void }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="bg-white border-b border-gray-200 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">销售洞察与技巧</h1>
          <p className="text-xl text-gray-500">来自一线销冠与 AI 数据的深度分析</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <article 
            key={post.id} 
            onClick={() => setSelectedPost(post)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden flex flex-col h-full"
          >
            <div className="h-48 bg-gray-200 relative overflow-hidden">
               {post.image ? (
                 <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                   <ImageIcon size={48} />
                 </div>
               )}
               <div className="absolute top-4 left-4">
                 <span className="bg-white/90 backdrop-blur text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{post.category}</span>
               </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
               <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                 <Calendar size={14}/> {post.date}
                 <span>•</span>
                 <Clock size={14}/> {post.readTime}
               </div>
               <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-primary transition-colors line-clamp-2">{post.title}</h2>
               <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">{post.excerpt}</p>
               <div className="flex items-center text-primary font-bold text-sm mt-auto group">
                阅读全文 <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
          </article>
        ))}
      </div>

      {selectedPost && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in duration-300">
               <div className="relative h-64 bg-gray-200">
                  {selectedPost.image && <img src={selectedPost.image} className="w-full h-full object-cover" />}
                  <button onClick={() => setSelectedPost(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors">
                     <X size={24} />
                  </button>
               </div>
               <div className="p-8 md:p-12">
                  <div className="flex items-center gap-3 mb-6">
                     <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{selectedPost.category}</span>
                     <span className="text-gray-500 text-sm">{selectedPost.date}</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight">{selectedPost.title}</h1>
                  <div className="prose prose-lg max-w-none text-gray-600 whitespace-pre-wrap">
                     {selectedPost.content || selectedPost.excerpt}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

const UserLoginModal = ({
  isOpen,
  onClose,
  users,
  onLoginSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onLoginSuccess: (user: User) => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate API delay
    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        setError("未找到该邮箱对应的账户");
        setLoading(false);
        return;
      }

      if (user.status === 'pending') {
        setError("您的账户正在审核中，请留意邮件通知");
        setLoading(false);
        return;
      }

      if (user.status === 'suspended') {
        setError("您的账户已被停用，请联系管理员");
        setLoading(false);
        return;
      }

      if (password.length < 1) {
         setError("请输入密码");
         setLoading(false);
         return;
      }

      onLoginSuccess(user);
      setLoading(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gray-50 px-8 py-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">用户登录</h2>
            <p className="text-gray-500 text-sm mt-1">欢迎回到 Sales Multiplier AI</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
           {error && (
             <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
               <AlertCircle size={16} />
               {error}
             </div>
           )}

           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工作邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                required 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                placeholder="name@company.com" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                required 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                placeholder="您的登录密码" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg mt-2 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "安全登录"}
          </button>
          
          <div className="text-xs text-center text-gray-400 border-t pt-4">
             演示账号: zhangwei@techcorp.com / 密码随意
          </div>
        </form>
      </div>
    </div>
  );
};

const RegistrationModal = ({ 
  onRegister, 
  onClose,
  addUser 
}: { 
  onRegister: () => void, 
  onClose: () => void,
  addUser: (user: User) => void
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call and add user to global state
    setTimeout(() => {
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        company: formData.company,
        role: formData.role,
        phone: formData.phone,
        status: 'pending',
        plan: 'free',
        joinedDate: new Date().toISOString().split('T')[0],
        referralCode: "NEW" + Math.floor(Math.random() * 1000),
        commissionBalance: 0,
        subscriptionEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days trial
      };
      
      addUser(newUser);
      setLoading(false);
      onRegister();
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300 my-8">
        <div className="bg-gray-50 px-8 py-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">申请企业试用</h2>
            <p className="text-gray-500 text-sm mt-1">请填写您的工作信息以激活账号</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
              <input required name="name" onChange={handleChange} type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors" placeholder="您的真实姓名" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工作邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input required name="email" onChange={handleChange} type="email" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors" placeholder="name@company.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
              <div className="relative">
                <Building className="absolute left-3 top-3 text-gray-400" size={18} />
                <input required name="company" onChange={handleChange} type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors" placeholder="公司全称" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
                <input required name="role" onChange={handleChange} type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors" placeholder="如：销售总监" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号码</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
              <input required name="phone" onChange={handleChange} type="tel" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors" placeholder="用于接收激活验证码" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg mt-2 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "提交申请"}
          </button>
          
          <p className="text-xs text-center text-gray-400">
            点击提交即代表您同意我们的 <a href="#" className="underline">服务条款</a> 和 <a href="#" className="underline">隐私政策</a>。
          </p>
        </form>
      </div>
    </div>
  );
};

const PendingApprovalPage = ({ onActivate }: { onActivate: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">申请已提交！</h2>
      <p className="text-gray-500 mb-8 leading-relaxed">
        感谢您对 Sales Multiplier AI 的兴趣。我们已收到您的试用申请。系统正在验证您的企业信息，激活邮件将在 24 小时内发送至您的工作邮箱。
      </p>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left text-sm text-blue-800 mb-8">
        <p className="font-bold mb-1">下一步：</p>
        <p>请留意来自 <strong>noreply@salesmultiplier.ai</strong> 的邮件，或联系管理员手动激活。</p>
      </div>

      <div className="border-t pt-6">
        <p className="text-xs text-gray-400 mb-4">(演示模式：点击下方按钮模拟管理员后台激活)</p>
        <button 
          onClick={onActivate}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          [演示] 模拟账号激活并登录
        </button>
      </div>
    </div>
  </div>
);

// --- Root Component ---

const App = () => {
  const [view, setView] = useState("landing" as ViewState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null as User | null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Lifted State for Admin Management
  const [users, setUsers] = useState(MOCK_USERS);
  const [blogPosts, setBlogPosts] = useState(INITIAL_BLOG_POSTS);

  // If authenticated as sales user, show app
  if (isAuthenticated && view === 'app') {
    return (
      <SalesApp 
        onLogout={() => { setIsAuthenticated(false); setView('landing'); setCurrentUser(null); }} 
        currentUser={currentUser}
      />
    );
  }

  // Admin Views
  if (view === 'admin-login') {
    return <AdminLogin onLogin={() => setView('admin-dashboard')} onBack={() => setView('landing')} />;
  }

  if (view === 'admin-dashboard') {
    return (
      <AdminDashboard 
        users={users} 
        setUsers={setUsers} 
        posts={blogPosts}
        setPosts={setBlogPosts}
        onLogout={() => setView('landing')} 
      />
    );
  }

  return (
    <div className="font-sans text-gray-900">
      {view !== 'pending' && (
        <Navbar 
          onViewChange={setView} 
          currentView={view} 
          onLoginClick={() => setShowLoginModal(true)}
        />
      )}
      
      {view === 'landing' && <LandingPage onViewChange={setView} />}
      
      {view === 'blog' && <BlogPage posts={blogPosts} onViewChange={setView} />}
      
      {view === 'register' && (
        <>
          <LandingPage onViewChange={setView} /> {/* Keep background context */}
          <RegistrationModal 
            onRegister={() => setView('pending')} 
            onClose={() => setView('landing')}
            addUser={(u) => setUsers([u, ...users])} 
          />
        </>
      )}

      {view === 'pending' && (
        <PendingApprovalPage onActivate={() => { 
          // Auto login simulation for registration flow
          const mockUser = users[users.length - 1] || MOCK_USERS[0];
          setCurrentUser({...mockUser, status: 'active'});
          setIsAuthenticated(true); 
          setView('app'); 
        }} />
      )}

      {view !== 'pending' && <Footer onViewChange={setView} />}

      <UserLoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        users={users}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          setView('app');
        }}
      />
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);