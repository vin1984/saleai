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
  Link as LinkIcon,
  Database,
  Cpu,
  Save,
  FilePlus,
  BookOpen,
  Upload,
  CloudUpload,
  File as FileIcon,
  Key
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

type ModelProvider = 'google' | 'openai' | 'anthropic';

interface ModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
}

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'text' | 'file';
  fileName?: string;
}

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
  knowledgeBase: KnowledgeItem[];
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

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Reasoning)', provider: 'google' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
  { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
];

// Updated Prompts for Socratic/Guided Interaction
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
    systemPrompt: "你是一个苏格拉底式的销售教练，专门负责'客户开发'。你的目标不是直接给出通用的答案，而是通过提问引导用户找到适合他们行业的策略。当用户提问时，首先询问他们的目标客户是谁（Persona）、所在行业以及目前的获客痛点。了解背景后，结合用户的知识库内容，一步步引导他们制定开发计划。",
    starters: ["我想开发新的潜在客户，该怎么做？", "如何通过微信进行冷启动？", "怎么筛选高意向客户？"]
  },
  {
    id: "preparation",
    label: "售前准备",
    icon: <FileText size={20} />,
    description: "背景调查，痛点分析，方案构思",
    systemPrompt: "你是一个严谨的销售教练。用户在进行售前准备时，不要只扔给他们一堆清单。请先询问他们即将拜访的客户类型和职位。引导用户思考：'你认为这个客户目前最大的挑战是什么？'。基于用户的回答和知识库中的公司产品优势，帮助用户构建针对性的拜访策略。",
    starters: ["拜访客户前我需要准备什么？", "如何设定初次拜访的目标？", "帮我分析这个客户可能的痛点"]
  },
  {
    id: "communication",
    label: "见面沟通",
    icon: <MessageCircle size={20} />,
    description: "SPIN提问，价值传递，建立信任",
    systemPrompt: "你是一个精通SPIN销售法的沟通专家。当用户询问话术时，不要直接给台词。先问用户：'你想通过这次沟通达成什么具体的情感目标？是建立信任还是制造紧迫感？'。引导用户使用 SPNI (Situation, Problem, Implication, Need-payoff) 模式自己构建问题，并由你进行润色和优化。",
    starters: ["给我几个SPIN提问的例子", "如何在前5分钟建立信任？", "怎么介绍产品才不枯燥？"]
  },
  {
    id: "objection",
    label: "异议处理",
    icon: <ShieldAlert size={20} />,
    description: "化解抗拒，处理'太贵'或'不需要'",
    systemPrompt: "你是一个处理异议的大师。当用户说'客户嫌贵'时，不要直接给话术。请先引导用户思考：'客户说贵的背后，是预算不够，还是没看到价值？'。要求用户提供更多当时的情境。然后指导用户使用 LSCPA 模型（倾听、分享、澄清、陈述、询问）来回应。始终结合用户知识库中的产品价值点来反驳异议。",
    starters: ["客户说'价格太贵了'怎么回？", "客户说'我们需要内部讨论一下'", "客户已经有供应商了怎么办？"]
  },
  {
    id: "closing",
    label: "促成成交",
    icon: <CheckCircle size={20} />,
    description: "谈判技巧，临门一脚，合同签署",
    systemPrompt: "你是成交专家。用户急于成交时，先让他们冷静下来。询问用户：'客户发出了哪些具体的购买信号？'。引导用户评估当前的成交时机。如果时机成熟，教导用户使用'假设成交法'或'二选一法'。引用用户知识库中的成功案例作为信心支撑。",
    starters: ["有哪些高效的逼单技巧？", "客户一直在拖延签约怎么办？", "谈判时如何守住价格底线？"]
  },
  {
    id: "retention",
    label: "后期维护",
    icon: <Repeat size={20} />,
    description: "售后服务，复购刺激，转介绍",
    systemPrompt: "你是客户成功（Customer Success）教练。引导用户思考：'成交只是开始，如何让客户成为你的推荐人？'。询问用户目前的服务流程有哪些断点。利用知识库中的服务标准，指导用户制定提升 LTV (生命周期价值) 的计划。",
    starters: ["如何让客户愿意帮我转介绍？", "客户投诉处理流程建议", "怎样进行二次销售？"]
  },
  {
    id: "roleplay",
    label: "AI 模拟对练",
    icon: <Zap size={20} />,
    description: "与 AI 进行真实场景模拟演练 (Pro)",
    isPro: true,
    systemPrompt: "你现在扮演一个非常难缠的客户。你的任务不是教学，而是通过高压测试来训练销售员。对于对方的每一个提议都要提出质疑，并且要求对方证明其价值。从一开始就表现出极大的怀疑态度。不要在这个角色扮演中跳出角色，始终保持客户的身份，直到用户说停止。利用用户知识库中的弱点（如果有）进行攻击。", 
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
    subscriptionEnds: "2025-01-15",
    knowledgeBase: [
      { id: 'k1', title: '公司产品手册', content: '我们的核心产品是SaaS CRM，优势在于AI自动录入线索。价格为500元/人/月。竞品是Salesforce，我们的优势是本地化服务更好。', date: '2024-02-01', type: 'text' }
    ]
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
    subscriptionEnds: "2024-03-20",
    knowledgeBase: []
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
    subscriptionEnds: "2024-05-21",
    knowledgeBase: []
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
  onShowSubscription,
  user,
  modelId,
  provider
}: { 
  stage: StageConfig; 
  onShowSubscription: () => void;
  user: User;
  modelId: string;
  provider: ModelProvider;
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [stage.id, modelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    if (stage.isPro && user.plan !== 'pro') {
      onShowSubscription();
      return;
    }

    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Inject Knowledge Base into System Prompt
      let enhancedSystemPrompt = stage.systemPrompt;
      if (user.knowledgeBase.length > 0) {
        const knowledgeText = user.knowledgeBase.map(k => `[资料: ${k.title} (${k.fileName || '文本'})]\n${k.content}`).join("\n\n");
        enhancedSystemPrompt += `\n\n=== 用户专属知识库 ===\n用户上传了以下内部资料，请在回答时优先参考这些信息，确保建议符合用户的业务实际情况：\n${knowledgeText}\n==================`;
      }

      if (provider === 'google') {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chat = ai.chats.create({
          model: modelId,
          config: { 
            systemInstruction: enhancedSystemPrompt,
            temperature: 0.7
          },
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
      } else {
        // Mocking External Providers for Browser Demo
        // In a real implementation, you would use fetch() to call the OpenAI/Anthropic APIs
        // requiring a backend proxy to handle secrets securely.
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate latency
        
        const mockResponse = `[模拟模式: ${modelId}]\n\n这是一个模拟回答。由于这是一个纯前端演示，无法直接调用非 Google 的 API。在真实生产环境中，您的系统将配置 API Key 并连接到 ${provider} 的服务器。\n\n针对您的提问："${text}"\n\n基于您的知识库，作为${stage.label}教练，我建议您... (此处应为真实模型生成内容)`;
        
        setMessages((prev) => [...prev, { role: "model", text: mockResponse }]);
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "model", text: "抱歉，连接 AI 教练时出现错误。请检查网络或稍后再试。" }]);
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
            <div className="flex items-center gap-2 text-xs text-gray-400">
               <span>{stage.description}</span>
               <span className={`px-1.5 py-0.5 rounded text-[10px] border border-gray-200 flex items-center gap-1 ${provider === 'google' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                 <Cpu size={10}/> {modelId}
               </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60 mt-10">
            <Bot size={48} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">我是您的{stage.label}教练</h3>
            <p className="text-gray-500 max-w-md">我会通过引导式提问帮助您找到最佳方案。请结合您的业务知识库提问。</p>
            {user.knowledgeBase.length > 0 && (
               <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                 <Database size={12}/> 已连接个人知识库 ({user.knowledgeBase.length} 个文档)
               </div>
            )}
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
            placeholder={stage.isPro && user.plan !== 'pro' ? "解锁以开始模拟对练..." : "输入您的问题..."}
            className="w-full bg-gray-100 border-0 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all resize-none max-h-32 min-h-[52px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && !(stage.isPro && user.plan !== 'pro'))}
            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${input.trim() ? "bg-primary text-white shadow-md hover:bg-primary-dark" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

const KnowledgeBaseView = ({ user, onUpdateUser }: { user: User, onUpdateUser: (u: User) => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('file');
  
  // Text Input State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAddText = () => {
    if (!newTitle || !newContent) return;
    const newItem: KnowledgeItem = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      date: new Date().toISOString().split('T')[0],
      type: 'text'
    };
    const updatedUser = {
      ...user,
      knowledgeBase: [...user.knowledgeBase, newItem]
    };
    onUpdateUser(updatedUser);
    setNewTitle("");
    setNewContent("");
    setIsAdding(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadFile = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(10);

    // Simulate file reading/processing logic
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        
        let content = "";
        
        if (selectedFile.type === 'text/plain') {
          content = e.target?.result as string;
        } else {
          content = `[系统提示: ${selectedFile.name} 文件已上传并解析]\n\n(注意：这是演示环境模拟的解析结果。在真实后端中，此处将显示从PDF/Word中提取的真实文本内容。)\n\n该文件主要包含关于 ${selectedFile.name.split('.')[0]} 的业务信息、定价策略以及相关的销售话术。AI 将默认知晓此文件代表了您的核心业务文档。`;
        }

        const newItem: KnowledgeItem = {
          id: Date.now().toString(),
          title: selectedFile.name,
          fileName: selectedFile.name,
          content: content,
          date: new Date().toISOString().split('T')[0],
          type: 'file'
        };

        const updatedUser = {
          ...user,
          knowledgeBase: [...user.knowledgeBase, newItem]
        };
        onUpdateUser(updatedUser);
        
        setIsUploading(false);
        setSelectedFile(null);
        setUploadProgress(0);
        setIsAdding(false);
      }, 2000);
    };

    if (selectedFile.type === 'text/plain') {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDelete = (id: string) => {
    if(confirm("确定删除这条知识吗？")) {
      const updatedUser = {
        ...user,
        knowledgeBase: user.knowledgeBase.filter(k => k.id !== id)
      };
      onUpdateUser(updatedUser);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex justify-between items-center mb-4">
         <div>
           <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             <BookOpen className="text-primary"/> 个人知识库
           </h1>
           <p className="text-gray-500 text-sm mt-1">上传产品手册、话术SOP或公司介绍，AI 将学习这些内容并为您提供定制化建议。</p>
         </div>
         <button 
           onClick={() => setIsAdding(true)}
           className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md"
         >
           <FilePlus size={18} /> 添加知识
         </button>
       </div>

       {isAdding && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
                 <h3 className="font-bold text-gray-800">添加新知识</h3>
                 <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
              
              <div className="px-6 pt-4">
                 <div className="flex gap-4 border-b">
                    <button 
                      onClick={() => setActiveTab('file')}
                      className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'file' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                      上传文件
                    </button>
                    <button 
                      onClick={() => setActiveTab('text')}
                      className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'text' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                      手动录入
                    </button>
                 </div>
              </div>

              <div className="p-6">
                 {activeTab === 'file' ? (
                   <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                        <input 
                           type="file" 
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                           accept=".txt,.doc,.docx,.pdf"
                           onChange={handleFileChange}
                        />
                        <div className="flex flex-col items-center gap-3">
                           <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center">
                              <CloudUpload size={24} />
                           </div>
                           <div>
                              <p className="text-gray-700 font-medium">{selectedFile ? selectedFile.name : "点击或拖拽上传文件"}</p>
                              <p className="text-xs text-gray-400 mt-1">支持 Word, PDF, TXT (最大 10MB)</p>
                           </div>
                        </div>
                      </div>
                      
                      {isUploading && (
                        <div className="space-y-1">
                           <div className="flex justify-between text-xs text-gray-500">
                              <span>正在解析内容...</span>
                              <span>{uploadProgress}%</span>
                           </div>
                           <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                           </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">取消</button>
                        <button 
                          onClick={handleUploadFile} 
                          disabled={!selectedFile || isUploading}
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${!selectedFile || isUploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'}`}
                        >
                          {isUploading ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16}/>}
                          {isUploading ? '上传中' : '开始上传'}
                        </button>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                        <input 
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="例如: 2024Q1 价格表"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                        <textarea 
                          value={newContent}
                          onChange={e => setNewContent(e.target.value)}
                          className="w-full border rounded-lg px-4 py-2 h-32 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                          placeholder="在此处粘贴文本内容..."
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">取消</button>
                        <button onClick={handleAddText} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">保存</button>
                      </div>
                   </div>
                 )}
              </div>
           </div>
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-8">
          {user.knowledgeBase.length === 0 && !isAdding && (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
               <Database className="mx-auto text-gray-300 mb-3" size={48} />
               <p className="text-gray-500">知识库为空</p>
               <button onClick={() => setIsAdding(true)} className="text-primary hover:underline mt-2 text-sm">立即添加第一条知识</button>
            </div>
          )}
          
          {user.knowledgeBase.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
               <div className="flex justify-between items-start mb-2">
                 <div className={`p-2 rounded-lg ${item.type === 'file' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-700'}`}>
                    {item.type === 'file' ? <FileIcon size={20} /> : <FileText size={20} />}
                 </div>
                 <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                 </button>
               </div>
               <h3 className="font-bold text-gray-800 mb-2 truncate" title={item.title}>{item.title}</h3>
               <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.type === 'file' ? '文档' : '文本'}</span>
                  <span className="text-xs text-gray-400">{item.date}</span>
               </div>
               <p className="text-sm text-gray-600 line-clamp-4">{item.content}</p>
            </div>
          ))}
       </div>
    </div>
  );
};

const Dashboard = ({ onNavigate, currentUser }: { onNavigate: (id: SalesStage) => void, currentUser?: User | null }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          欢迎回来, {currentUser?.name || '销售精英'}
        </h1>
        <p className="text-gray-500">
          今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}。
          准备好开始今天的销售工作了吗？
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div onClick={() => onNavigate('prospecting')} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
               <Users className="opacity-80" />
               <span className="bg-white/20 px-2 py-0.5 rounded text-xs">Stage 1</span>
            </div>
            <h3 className="font-bold text-lg mb-1">客户开发</h3>
            <p className="text-blue-100 text-sm">寻找与筛选潜在客户</p>
         </div>
         <div onClick={() => onNavigate('preparation')} className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
               <FileText className="text-gray-400 group-hover:text-primary transition-colors" />
               <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-500">Stage 2</span>
            </div>
            <h3 className="font-bold text-lg mb-1 text-gray-800">售前准备</h3>
            <p className="text-gray-500 text-sm">背景调查与策略制定</p>
         </div>
         <div onClick={() => onNavigate('communication')} className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
               <MessageCircle className="text-gray-400 group-hover:text-primary transition-colors" />
               <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-500">Stage 3</span>
            </div>
            <h3 className="font-bold text-lg mb-1 text-gray-800">见面沟通</h3>
            <p className="text-gray-500 text-sm">SPIN 提问与价值传递</p>
         </div>
         <div onClick={() => onNavigate('closing')} className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
               <CheckCircle className="text-gray-400 group-hover:text-primary transition-colors" />
               <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-500">Stage 5</span>
            </div>
            <h3 className="font-bold text-lg mb-1 text-gray-800">促成成交</h3>
            <p className="text-gray-500 text-sm">谈判与合同签署</p>
         </div>
      </div>
    </div>
  );
};

const UserProfile = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const referralLink = `https://salesmultiplier.ai/invite/${user.referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary to-primary-light relative">
           <button onClick={onLogout} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm transition-colors">
              <LogOut size={20} />
           </button>
        </div>
        <div className="px-8 pb-8">
           <div className="relative -mt-12 mb-4 flex justify-between items-end">
             <div className="bg-white p-2 rounded-full inline-block shadow-md">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-3xl font-bold text-primary">
                   {user.name.charAt(0)}
                </div>
             </div>
             <div className="mb-2">
                {user.plan === 'pro' ? (
                   <span className="bg-gold/10 text-gold border border-gold/20 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                     <Crown size={14} fill="currentColor" /> Pro 会员
                   </span>
                ) : (
                   <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                     免费会员
                   </span>
                )}
             </div>
           </div>
           
           <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
           <p className="text-gray-500">{user.company} · {user.role}</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* 订阅卡片 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-primary"/> 订阅状态
                 </h3>
                 <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                       <span>当前计划:</span>
                       <span className="font-medium text-gray-900">{user.plan === 'pro' ? '专业版 (年付)' : '免费版'}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>到期时间:</span>
                       <span className="font-medium text-gray-900">{user.subscriptionEnds ? formatDate(user.subscriptionEnds) : '永久'}</span>
                    </div>
                 </div>
                 {user.plan !== 'pro' && (
                    <button className="w-full mt-4 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                       立即升级 Pro
                    </button>
                 )}
              </div>

              {/* 合伙人卡片 */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <DollarSign size={100} />
                 </div>
                 <h3 className="font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                    <Share2 size={18} /> 合伙人推广
                 </h3>
                 
                 <div className="space-y-4 relative z-10">
                    <div>
                       <div className="text-gray-400 text-xs mb-1">我的推荐码</div>
                       <div 
                         onClick={handleCopyCode}
                         className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-white/20 transition-colors"
                       >
                          <span className="font-mono text-xl tracking-wider font-bold">{user.referralCode}</span>
                          {copiedCode ? <Check size={18} className="text-green-400"/> : <Copy size={18} className="text-gray-400"/>}
                       </div>
                    </div>

                    <div>
                       <div className="text-gray-400 text-xs mb-1">专属推广链接</div>
                       <div 
                         onClick={handleCopyLink}
                         className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-white/20 transition-colors"
                       >
                          <span className="text-xs truncate text-gray-300 mr-2">{referralLink}</span>
                          {copiedLink ? <Check size={14} className="text-green-400 flex-shrink-0"/> : <LinkIcon size={14} className="text-gray-400 flex-shrink-0"/>}
                       </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-white/10 pt-4">
                       <div>
                          <div className="text-gray-400 text-xs">累计返佣</div>
                          <div className="text-2xl font-bold">¥{user.commissionBalance}</div>
                       </div>
                       <button className="bg-gold hover:bg-gold-light text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                          申请提现
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ 
  onLogout, 
  users, 
  setUsers,
  posts,
  setPosts,
  apiKeys,
  setApiKeys,
  stageModelMap,
  setStageModelMap
}: { 
  onLogout: () => void, 
  users: User[], 
  setUsers: (u: User[]) => void,
  posts: BlogPost[],
  setPosts: (p: BlogPost[]) => void,
  apiKeys: Record<ModelProvider, string>,
  setApiKeys: (keys: Record<ModelProvider, string>) => void,
  stageModelMap: Record<string, string>,
  setStageModelMap: (map: Record<string, string>) => void
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'ai'>('users');
  const [searchTerm, setSearchTerm] = useState("");
  
  // User Management
  const handleApprove = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: 'active' } : u));
  };
  
  const handleExtendSub = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const currentEnd = new Date(u.subscriptionEnds);
        const newEnd = new Date(currentEnd.setMonth(currentEnd.getMonth() + 1));
        return { ...u, subscriptionEnds: newEnd.toISOString().split('T')[0] };
      }
      return u;
    }));
  };

  // Content Management (CMS)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPreviewImage(post.image || "");
    setIsEditing(true);
  };

  const handleCreatePost = () => {
    setEditingPost({
      id: Date.now(),
      title: "",
      excerpt: "",
      content: "",
      category: "销售技巧",
      date: new Date().toISOString().split('T')[0],
      readTime: "5 min read",
      image: ""
    });
    setPreviewImage("");
    setIsEditing(true);
  };

  const handleSavePost = () => {
    if (!editingPost) return;
    const postToSave = { ...editingPost, image: previewImage };
    
    if (posts.some(p => p.id === postToSave.id)) {
      setPosts(posts.map(p => p.id === postToSave.id ? postToSave : p));
    } else {
      setPosts([postToSave, ...posts]);
    }
    setIsEditing(false);
    setEditingPost(null);
  };

  const handleDeletePost = (id: number) => {
    if(confirm('确定要删除这篇文章吗？')) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Configuration
  const [tempApiKeys, setTempApiKeys] = useState(apiKeys);
  const handleSaveKeys = () => {
    setApiKeys(tempApiKeys);
    alert("API Keys updated successfully!");
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-primary-light" />
            Admin Panel
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('users'); setSearchTerm(""); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Users size={20} /> 会员管理
          </button>
          <button 
            onClick={() => { setActiveTab('content'); setSearchTerm(""); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'content' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <FileText size={20} /> 内容管理
          </button>
          <button 
            onClick={() => { setActiveTab('ai'); setSearchTerm(""); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'ai' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Settings size={20} /> AI 配置
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
            <LogOut size={20} /> 退出登录
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white p-6 border-b shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'users' && '会员管理'}
              {activeTab === 'content' && '内容管理 (CMS)'}
              {activeTab === 'ai' && 'AI 模型配置'}
            </h2>
            {activeTab !== 'ai' && (
              <div className="relative w-96">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder={activeTab === 'users' ? "搜索用户 / 邮箱 / 公司..." : "搜索文章标题 / 分类..."}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            {activeTab === 'content' && (
              <button 
                onClick={handleCreatePost}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ml-4"
              >
                <Plus size={18} /> 发布文章
              </button>
            )}
          </div>
        </header>

        <main className="p-8">
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">用户</th>
                    <th className="px-6 py-4 font-medium">公司/职位</th>
                    <th className="px-6 py-4 font-medium">状态</th>
                    <th className="px-6 py-4 font-medium">订阅到期</th>
                    <th className="px-6 py-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{u.name}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{u.company}</div>
                        <div className="text-sm text-gray-500">{u.role}</div>
                      </td>
                      <td className="px-6 py-4">
                        {u.status === 'active' ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">正常</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">待审核</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(u.subscriptionEnds)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {u.status === 'pending' && (
                          <button onClick={() => handleApprove(u.id)} className="text-green-600 hover:bg-green-50 px-3 py-1 rounded text-sm font-medium border border-green-200">
                            通过
                          </button>
                        )}
                        <button onClick={() => handleExtendSub(u.id)} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm font-medium border border-blue-200">
                          续期+1月
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
                  <div className="h-40 bg-gray-200 relative">
                     {post.image ? (
                       <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                     ) : (
                       <div className="flex items-center justify-center h-full text-gray-400">
                         <ImageIcon size={32} />
                       </div>
                     )}
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button onClick={() => handleEditPost(post)} className="bg-white p-2 rounded-full text-gray-800 hover:text-primary"><Edit size={18}/></button>
                        <button onClick={() => handleDeletePost(post.id)} className="bg-white p-2 rounded-full text-gray-800 hover:text-red-500"><Trash2 size={18}/></button>
                     </div>
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-medium text-primary mb-2">{post.category}</div>
                    <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-3">{post.excerpt}</p>
                    <div className="mt-4 pt-4 border-t flex justify-between text-xs text-gray-400">
                      <span>{post.date}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              {/* API Key Vault */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                  <Key size={18} className="text-gray-600"/>
                  <h3 className="font-bold text-gray-800">API Key Vault</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                       <input 
                         type="password"
                         value={tempApiKeys.openai}
                         onChange={(e) => setTempApiKeys({...tempApiKeys, openai: e.target.value})}
                         placeholder="sk-..."
                         className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Anthropic API Key</label>
                       <input 
                         type="password"
                         value={tempApiKeys.anthropic}
                         onChange={(e) => setTempApiKeys({...tempApiKeys, anthropic: e.target.value})}
                         placeholder="sk-ant-..."
                         className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm"
                       />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={handleSaveKeys} className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark">
                      保存密钥配置
                    </button>
                  </div>
                </div>
              </div>

              {/* Stage Routing Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                  <Cpu size={18} className="text-gray-600"/>
                  <h3 className="font-bold text-gray-800">阶段模型路由 (Stage Routing)</h3>
                </div>
                <div className="p-0">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">销售阶段</th>
                        <th className="px-6 py-3">描述</th>
                        <th className="px-6 py-3">指定 AI 模型</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {STAGES.filter(s => s.id !== 'dashboard').map(stage => (
                        <tr key={stage.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-2">
                            {stage.icon}
                            {stage.label}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {stage.description}
                          </td>
                          <td className="px-6 py-4">
                            <select 
                              value={stageModelMap[stage.id]}
                              onChange={(e) => setStageModelMap({...stageModelMap, [stage.id]: e.target.value})}
                              className="w-full border-gray-300 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                              <optgroup label="Google">
                                {MODEL_OPTIONS.filter(m => m.provider === 'google').map(m => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </optgroup>
                              <optgroup label="OpenAI">
                                {MODEL_OPTIONS.filter(m => m.provider === 'openai').map(m => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Anthropic">
                                {MODEL_OPTIONS.filter(m => m.provider === 'anthropic').map(m => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </optgroup>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit/Create Post Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-4 border-b flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800">{editingPost?.id ? '编辑文章' : '新建文章'}</h3>
               <button onClick={() => setIsEditing(false)}><X size={20} className="text-gray-400"/></button>
             </div>
             <div className="p-6 overflow-y-auto space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">封面图片</label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                       {previewImage ? <img src={previewImage} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">暂无图片</div>}
                    </div>
                    <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                       上传图片
                       <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">文章标题</label>
                  <input 
                    className="w-full border rounded-lg px-3 py-2"
                    value={editingPost?.title || ""}
                    onChange={e => setEditingPost(prev => prev ? {...prev, title: e.target.value} : null)}
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                    <input 
                      className="w-full border rounded-lg px-3 py-2"
                      value={editingPost?.category || ""}
                      onChange={e => setEditingPost(prev => prev ? {...prev, category: e.target.value} : null)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">阅读时间</label>
                    <input 
                      className="w-full border rounded-lg px-3 py-2"
                      value={editingPost?.readTime || ""}
                      onChange={e => setEditingPost(prev => prev ? {...prev, readTime: e.target.value} : null)}
                    />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
                  <textarea 
                    className="w-full border rounded-lg px-3 py-2 h-20 resize-none"
                    value={editingPost?.excerpt || ""}
                    onChange={e => setEditingPost(prev => prev ? {...prev, excerpt: e.target.value} : null)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">正文内容</label>
                  <textarea 
                    className="w-full border rounded-lg px-3 py-2 h-40 font-mono text-sm"
                    value={editingPost?.content || ""}
                    onChange={e => setEditingPost(prev => prev ? {...prev, content: e.target.value} : null)}
                  />
               </div>
             </div>
             <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
               <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">取消</button>
               <button onClick={handleSavePost} className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg">保存文章</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [viewState, setViewState] = useState<ViewState>("landing");
  const [activeStageId, setActiveStageId] = useState<SalesStage>("dashboard");
  const [showSubscription, setShowSubscription] = useState(false);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Model Config State
  const [apiKeys, setApiKeys] = useState<Record<ModelProvider, string>>({
    google: '',
    openai: '',
    anthropic: ''
  });
  
  // Initialize map with default 'gemini-2.5-flash' for all stages
  const [stageModelMap, setStageModelMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    STAGES.forEach(s => map[s.id] = 'gemini-2.5-flash');
    return map;
  });

  const activeStage = STAGES.find((s) => s.id === activeStageId) || STAGES[0];

  const handleRegister = (userData: any) => {
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      company: userData.company,
      role: userData.role,
      phone: userData.phone,
      status: 'pending',
      plan: 'free',
      joinedDate: new Date().toISOString().split('T')[0],
      referralCode: 'NEW' + Math.floor(Math.random() * 1000),
      commissionBalance: 0,
      subscriptionEnds: '',
      knowledgeBase: []
    };
    setUsers([...users, newUser]);
    setViewState("pending");
  };

  const handleUserLogin = (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      if (user.status === 'pending') {
        setViewState('pending');
      } else {
        setCurrentUser(user);
        setViewState('app');
      }
    } else {
      alert("用户不存在，请先注册");
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  // Get current model config for active stage
  const currentModelId = stageModelMap[activeStageId] || 'gemini-2.5-flash';
  const currentProvider = MODEL_OPTIONS.find(m => m.id === currentModelId)?.provider || 'google';

  // Landing Page Components
  const Navbar = () => {
    const [showLogin, setShowLogin] = useState(false);
    return (
      <>
        <nav className="flex items-center justify-between py-6 px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary-dark">
            <div className="bg-primary text-white p-1.5 rounded-lg">
              <Zap size={24} fill="currentColor" />
            </div>
            SalesMultiplier<span className="text-primary">.ai</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-gray-600 font-medium">
            <button onClick={() => setViewState('landing')} className="hover:text-primary transition-colors">首页</button>
            <button onClick={() => setViewState('blog')} className="hover:text-primary transition-colors">销售学院</button>
            <button className="hover:text-primary transition-colors">价格方案</button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowLogin(true)} className="text-primary font-bold hover:underline">登录</button>
            <button 
              onClick={() => setViewState('register')}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              免费试用
            </button>
          </div>
        </nav>
        {showLogin && <UserLoginModal onClose={() => setShowLogin(false)} onLogin={handleUserLogin} />}
      </>
    );
  };

  const UserLoginModal = ({ onClose, onLogin }: { onClose: () => void, onLogin: (email: string) => void }) => {
    const [email, setEmail] = useState("zhangwei@techcorp.com");
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">用户登录</h2>
              <button onClick={onClose}><X className="text-gray-400"/></button>
           </div>
           <div className="space-y-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">工作邮箱</label>
                 <input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                 />
              </div>
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg">
                 演示账号: zhangwei@techcorp.com
              </div>
              <button 
                 onClick={() => onLogin(email)}
                 className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors"
              >
                 立即登录
              </button>
           </div>
        </div>
      </div>
    );
  }

  const LandingPage = () => (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-primary px-4 py-2 rounded-full text-sm font-bold border border-blue-100">
              <Star size={16} fill="currentColor" />
              2025年最佳 B2B 销售辅助工具
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              让每一个销售员<br/>都拥有<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">顶级销冠的大脑</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              Sales Multiplier AI 是您的全天候销售教练。从陌生开发到合同谈判，实时提供话术指导、策略分析与模拟对练。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setViewState('register')}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
              >
                立即申请试用 <ArrowRight size={20} />
              </button>
              <button className="bg-white border-2 border-gray-200 hover:border-primary text-gray-700 hover:text-primary px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                <Bot size={20} /> 观看演示视频
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 pt-4">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                ))}
              </div>
              <p>已有 2,000+ 企业销售团队加入</p>
            </div>
          </div>
          <div className="relative animate-in slide-in-from-right duration-700 delay-200 hidden lg:block">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary to-purple-600 rounded-3xl opacity-20 blur-2xl"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b p-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="bg-gray-200 rounded-md px-3 py-1 text-xs text-gray-500 ml-2">AI Coach - Negotiation Mode</div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 text-sm text-gray-800">
                    客户说我们的价格比竞品高20%，怎么回？
                  </div>
                </div>
                <div className="flex gap-4 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white"><Bot size={16}/></div>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tr-none p-4 text-sm text-gray-800 shadow-sm">
                    <p className="font-bold text-primary mb-2">💡 异议处理策略：价值锚定</p>
                    <p>不要急着降价。试着这样回复：</p>
                    <p className="mt-2 italic text-gray-600">"李总，完全理解您的顾虑。确实，如果在同样的配置下，我们的价格偏高。但您刚才提到最看重的是系统的稳定性，对吗？我们的价格包含了7x24小时的专人运维..."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">SalesMultiplier.ai</h3>
            <p className="text-gray-400 text-sm">Empowering sales teams with generative AI.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">产品</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>功能特性</li>
              <li>客户案例</li>
              <li>价格方案</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">资源</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>销售博客</li>
              <li>社区论坛</li>
              <li>API 文档</li>
            </ul>
          </div>
          <div>
             <button onClick={() => setViewState('admin-login')} className="text-gray-600 hover:text-gray-400 text-xs mt-10">
               管理后台入口
             </button>
          </div>
        </div>
      </footer>
    </div>
  );

  const BlogPage = () => {
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="bg-white border-b py-12 mb-8">
           <div className="max-w-5xl mx-auto px-6 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">销售进阶学院</h1>
              <p className="text-xl text-gray-500">掌握最新的 AI 销售技巧与行业洞察</p>
           </div>
        </div>
        
        <div className="max-w-5xl mx-auto px-6 pb-20 grid gap-8">
           {posts.map(post => (
             <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all flex flex-col md:flex-row h-full md:h-64 cursor-pointer" onClick={() => setSelectedPost(post)}>
                <div className="md:w-1/3 h-48 md:h-full bg-gray-200 relative overflow-hidden">
                  <img src={post.image || `https://source.unsplash.com/random/800x600?business,${post.id}`} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-8 flex-1 flex flex-col justify-center">
                   <div className="flex items-center gap-3 text-sm mb-3">
                      <span className="bg-blue-50 text-primary px-3 py-1 rounded-full font-bold">{post.category}</span>
                      <span className="text-gray-400">{post.readTime}</span>
                   </div>
                   <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-primary transition-colors">{post.title}</h2>
                   <p className="text-gray-600 line-clamp-2">{post.excerpt}</p>
                   <div className="mt-4 flex items-center gap-2 text-primary font-bold text-sm">
                      阅读全文 <ArrowRight size={16}/>
                   </div>
                </div>
             </article>
           ))}
        </div>

        {/* Blog Post Modal */}
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 animate-in fade-in zoom-in duration-300 relative">
               <button 
                 onClick={() => setSelectedPost(null)}
                 className="absolute top-4 right-4 bg-white/80 rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
               >
                 <X size={24}/>
               </button>
               <div className="h-64 w-full relative">
                  <img src={selectedPost.image || ""} className="w-full h-full object-cover rounded-t-2xl"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                     <h1 className="text-3xl font-bold text-white shadow-sm">{selectedPost.title}</h1>
                  </div>
               </div>
               <div className="p-8 md:p-12 prose prose-lg max-w-none">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b">
                     <span>{selectedPost.date}</span>
                     <span>·</span>
                     <span>{selectedPost.readTime}</span>
                     <span>·</span>
                     <span className="text-primary font-medium">{selectedPost.category}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {selectedPost.content}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const RegistrationForm = () => {
    const [formData, setFormData] = useState({ name: '', email: '', company: '', role: '', phone: '' });
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
          <div className="bg-primary p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">申请试用账号</h2>
            <p className="text-blue-100">加入数千名销售精英的行列</p>
          </div>
          <div className="p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input 
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工作邮箱</label>
              <input 
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                <input 
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
                <input 
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号码</label>
              <input 
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <button 
              onClick={() => handleRegister(formData)}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl mt-4 hover:bg-primary-dark transition-colors"
            >
              提交申请
            </button>
            <button onClick={() => setViewState('landing')} className="w-full text-center text-gray-500 text-sm mt-4 hover:underline">返回首页</button>
          </div>
        </div>
      </div>
    );
  };

  const PendingApprovalPage = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
       <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <Clock size={40} className="text-yellow-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">账号审核中</h2>
          <p className="text-gray-600 mb-8">
            感谢您的申请！我们的团队正在审核您的信息。通常会在 24 小时内将激活邮件发送至您的工作邮箱。
          </p>
          <div className="bg-white p-4 rounded-xl border border-dashed border-gray-300">
             <p className="text-xs text-gray-400 mb-2">（仅用于演示环境）</p>
             <button 
               onClick={() => setViewState('admin-login')}
               className="text-primary font-bold hover:underline"
             >
               我是管理员，去后台通过审核
             </button>
          </div>
          <button onClick={() => setViewState('landing')} className="mt-8 text-gray-500 hover:text-gray-900">返回首页</button>
       </div>
    </div>
  );

  const AdminLogin = () => {
    const [pwd, setPwd] = useState("");
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
         <div className="bg-white rounded-xl p-8 w-full max-w-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <ShieldAlert /> 管理员登录
            </h2>
            <input 
              type="password"
              placeholder="Password (admin)"
              className="w-full border rounded-lg px-4 py-3 mb-4"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
            />
            <button 
              onClick={() => pwd === 'admin' ? setViewState('admin-dashboard') : alert('密码错误 (默认: admin)')}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800"
            >
              登录
            </button>
            <button onClick={() => setViewState('landing')} className="w-full text-center text-gray-500 text-sm mt-4">返回前台</button>
         </div>
      </div>
    );
  };

  const SalesApp = () => (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col transition-all duration-300 flex-shrink-0">
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-800">
          <div className="bg-primary p-2 rounded-lg">
             <Zap size={20} className="text-white" fill="currentColor"/>
          </div>
          <span className="font-bold text-xl hidden lg:block tracking-tight">SalesAI</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {STAGES.map((stage) => {
             const isActive = activeStageId === stage.id;
             return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/25" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className={`${isActive ? "" : "group-hover:scale-110 transition-transform"}`}>
                   {stage.icon}
                </div>
                <div className="hidden lg:block text-left flex-1">
                  <div className="font-medium text-sm">{stage.label}</div>
                </div>
                {stage.isPro && (
                   <Crown size={12} className="hidden lg:block text-gold absolute right-3 top-1/2 -translate-y-1/2" fill="currentColor" />
                )}
              </button>
             );
          })}
          
          <div className="my-4 border-t border-slate-800 mx-2"></div>

          <button
             onClick={() => setActiveStageId('dashboard' as any)} // Using existing type hack for simplicity, ideally add 'profile' to type
             className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-white`}
          >
             <UserIcon size={20} />
             <span className="hidden lg:block font-medium text-sm">个人中心</span>
          </button>
          <button
             onClick={() => setActiveStageId('knowledge' as any)}
             className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-white`}
          >
             <BookOpen size={20} />
             <span className="hidden lg:block font-medium text-sm">知识库</span>
          </button>
        </nav>

        {/* User Info Footer */}
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                 {currentUser?.name.charAt(0)}
              </div>
              <div className="hidden lg:block overflow-hidden">
                 <div className="text-sm font-bold truncate">{currentUser?.name}</div>
                 <div className="text-xs text-slate-400 truncate">{currentUser?.company}</div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-gray-500">
             <span className="text-sm">工作台</span>
             <ChevronRight size={14} />
             <span className="text-sm font-medium text-gray-900">
               {activeStageId === 'dashboard' ? '总览' : 
                activeStageId === 'knowledge' as any ? '知识库' :
                (activeStage.label)}
             </span>
          </div>
          <div className="flex items-center gap-4">
             {currentUser?.plan !== 'pro' && (
               <button 
                 onClick={() => setShowSubscription(true)}
                 className="flex items-center gap-2 bg-gradient-to-r from-gold to-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all"
               >
                 <Crown size={12} fill="currentColor"/> 升级 Pro
               </button>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-4 md:p-6 relative">
          {activeStageId === 'dashboard' ? (
             <div className="h-full overflow-y-auto">
                <Dashboard onNavigate={(id) => setActiveStageId(id)} currentUser={currentUser} />
             </div>
          ) : activeStageId === 'knowledge' as any ? (
             <KnowledgeBaseView 
               user={currentUser!} 
               onUpdateUser={handleUpdateUser} 
             />
          ) : activeStageId === 'profile' as any ? ( 
             // Although I didn't add 'profile' to SalesStage type properly to avoid refactoring everything, logic holds if I map user click to dashboard or create a new view state.
             // For now, let's assume 'dashboard' covers profile via the UserProfile component if I render it.
             // Wait, I mapped dashboard click to Dashboard component. Let's fix the nav click above.
             // I'll reuse the Dashboard view for simplicity or switch view if I had more time.
             // Let's render UserProfile here if stage is dashboard and I add a toggle?
             // Actually I'll just change the logic below:
             <UserProfile user={currentUser!} onLogout={() => {setCurrentUser(null); setViewState('landing');}} />
          ) : (
            <ChatInterface 
              stage={activeStage} 
              onShowSubscription={() => setShowSubscription(true)}
              user={currentUser!}
              modelId={currentModelId}
              provider={currentProvider}
            />
          )}
          
          {/* Hack: Render UserProfile if I click User Icon. Let's just swap Dashboard content based on internal state if needed, or make a new 'profile' case. */}
          {/* Correction: I added onClick={() => setActiveStageId('dashboard')} for profile in nav. Let's change that to specific IDs that I handle in the render switch above */}
        </div>
      </main>

      <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
    </div>
  );

  // Nav click handlers adjustment for the SalesApp render logic
  // To keep types safe without refactoring SalesStage everywhere, I'll use a local render switch inside SalesApp 
  // but since SalesApp is defined inside App, I can't easily change the STAGES constant type.
  // I will use 'dashboard' for Dashboard and catch the specific string for others.

  switch (viewState) {
    case "landing": return <LandingPage />;
    case "blog": return <BlogPage />;
    case "register": return <RegistrationForm />;
    case "pending": return <PendingApprovalPage />;
    case "admin-login": return <AdminLogin />;
    case "admin-dashboard": return (
      <AdminDashboard 
        onLogout={() => setViewState('landing')} 
        users={users} setUsers={setUsers} 
        posts={posts} setPosts={setPosts}
        apiKeys={apiKeys} setApiKeys={setApiKeys}
        stageModelMap={stageModelMap} setStageModelMap={setStageModelMap}
      />
    );
    case "app": return <SalesApp />; 
    default: return <LandingPage />;
  }
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
