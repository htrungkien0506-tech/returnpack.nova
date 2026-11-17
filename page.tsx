'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  QrCode,
  Store,
  CreditCard,
  Truck,
  Warehouse,
  Award,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowRight,
  Lock,
  Unlock,
  Sparkles,
  FileSpreadsheet,
  MapPin,
  ChevronLeft,
  RotateCcw,
  Leaf,
  History,
  Wrench,
  Recycle,
  X,
  Check,
  Info,
  LogOut,
  Users,
  ScanLine,
  TrendingUp,
  AlertCircle,
  Copy,
  Camera,
  Eye,
  Ticket,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================
type StakeholderRole = 'ADMIN' | 'SHOP' | 'CUSTOMER';

type BagStatus =
  | 'AVAILABLE_AT_WAREHOUSE'
  | 'AT_SHOP'
  | 'IN_TRANSIT'
  | 'WAITING_RETURN'
  | 'PICKED_UP_BY_SHIPPER'
  | 'PENDING_INSPECTION'
  | 'CLEANING_MAINTENANCE'
  | 'LOCKED_DEFECTIVE'
  | 'RETIRED_WAITING_RECYCLE'
  | 'HANDED_OVER_RECYCLE'
  | 'LOST';

type ReturnRequestStatus =
  | 'RECEIVED'
  | 'MATCHING_ROUTE'
  | 'ASSIGNED_SHIPPER'
  | 'PICKED_UP'
  | 'COMPLETED_AT_WAREHOUSE'
  | 'FAILED_PICKUP';

interface BagEvent {
  id: string;
  bagCode: string;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
  location: string;
  cycleNumber: number;
}

interface BagRecord {
  id: string;
  bagCode: string;
  size: 'S (25x35cm)' | 'M (32x43cm)' | 'L (40x55cm)';
  batchCode: string;
  currentLocation: string;
  holdingShopId: string | null;
  holdingShopName: string | null;
  status: BagStatus;
  cyclesUsed: number;
  maxCycles: number;
  qualityGrade: 'A' | 'B' | 'C';
  lastInspectionResult: string;
  updatedAt: string;
}

interface ShopOrderRecord {
  id: string;
  shopId: string;
  orderCode: string;
  bagCode: string;
  packedAt: string;
  status: string;
}

interface ShopRecord {
  id: string;
  shopCode: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  planId: 'PLAN_BASIC' | 'PLAN_STANDARD' | 'PLAN_ENTERPRISE';
  planName: string;
  monthlyQuotaTurns: number;
  usedTurns: number;
  concurrentBagLimit: number;
  currentBagsHeld: number;
  packedOrdersCount: number;
  outstandingDebtVnd: number;
  subscriptionEnd: string;
  status: 'ACTIVE' | 'LOCKED';
}

interface ReturnRequestRecord {
  id: string;
  requestCode: string;
  bagCode: string;
  usageCycleKey: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  areaDistrict: string;
  preferredTimeSlot: string;
  customerNote: string;
  status: ReturnRequestStatus;
  assignedShipperName: string | null;
  scheduledWindow: string;
  waitingHours: number;
  isOverdue: boolean;
  rewardGranted: boolean;
  createdAt: string;
}

interface AllocationRecord {
  id: string;
  allocationCode: string;
  shopId: string;
  shopName: string;
  size: 'S (25x35cm)' | 'M (32x43cm)' | 'L (40x55cm)';
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'CONFIRMED';
  createdAt: string;
}

interface MaintenanceJobRecord {
  id: string;
  bagCode: string;
  jobType: 'Vệ sinh khử khuẩn' | 'Sửa khóa kéo' | 'Thay tem QR';
  status: 'IN_PROGRESS' | 'COMPLETED';
  assignedStaff: string;
  startedAt: string;
}

interface RecyclingHandoffRecord {
  id: string;
  handoffCode: string;
  bagCode: string;
  partnerName: string;
  status: 'WAITING_HANDOVER' | 'HANDED_OVER' | 'VERIFIED_RECYCLED';
  handedOverAt: string;
}

interface RewardTransactionRecord {
  id: string;
  txCode: string;
  customerName: string;
  bagCode: string;
  usageCycleKey: string;
  txType: 'EARN_RETURN' | 'REDEEM_OFFER' | 'REVERSAL';
  pointsDelta: number;
  description: string;
  createdAt: string;
}

interface CustomerVoucher {
  id: string;
  code: string;
  title: string;
  sponsor: string;
  redeemedAt: string;
  status: 'Sẵn sàng dùng' | 'Đã sử dụng';
}

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AuditLogRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
}

const BAG_STATUS_META: Record<
  BagStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  AVAILABLE_AT_WAREHOUSE: {
    label: 'Sẵn sàng tại kho',
    bg: 'bg-[#E5F7ED]',
    text: 'text-[#155C3B]',
    dot: 'bg-[#48B86C]'
  },
  AT_SHOP: {
    label: 'Đang tại Shop',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    dot: 'bg-[#61C6EC]'
  },
  IN_TRANSIT: {
    label: 'Đang giao hàng',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    dot: 'bg-blue-500'
  },
  WAITING_RETURN: {
    label: 'Chờ thu hồi',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    dot: 'bg-[#FFD866]'
  },
  PICKED_UP_BY_SHIPPER: {
    label: 'Shipper đã nhận',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500'
  },
  PENDING_INSPECTION: {
    label: 'Chờ kiểm tra kho',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    dot: 'bg-purple-500'
  },
  CLEANING_MAINTENANCE: {
    label: 'Đang vệ sinh',
    bg: 'bg-cyan-50',
    text: 'text-cyan-900',
    dot: 'bg-cyan-500'
  },
  LOCKED_DEFECTIVE: {
    label: 'Đã khóa',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    dot: 'bg-rose-500'
  },
  RETIRED_WAITING_RECYCLE: {
    label: 'Chờ tái chế (Loại C)',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    dot: 'bg-orange-500'
  },
  HANDED_OVER_RECYCLE: {
    label: 'Đã giao tái chế',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    dot: 'bg-stone-500'
  },
  LOST: {
    label: 'Thất lạc',
    bg: 'bg-red-50',
    text: 'text-red-800',
    dot: 'bg-red-600'
  }
};

const RETURN_STATUS_META: Record<
  ReturnRequestStatus,
  { label: string; badge: string; stepIndex: number }
> = {
  RECEIVED: {
    label: 'Đã tiếp nhận',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    stepIndex: 1
  },
  MATCHING_ROUTE: {
    label: 'Đang ghép chuyến',
    badge: 'bg-sky-100 text-sky-900 border-sky-300',
    stepIndex: 2
  },
  ASSIGNED_SHIPPER: {
    label: 'Đã gán Shipper',
    badge: 'bg-blue-100 text-blue-900 border-blue-300',
    stepIndex: 3
  },
  PICKED_UP: {
    label: 'Đã thu hồi',
    badge: 'bg-[#E5F7ED] text-[#155C3B] border-[#48B86C]',
    stepIndex: 4
  },
  COMPLETED_AT_WAREHOUSE: {
    label: 'Hoàn tất nhập kho',
    badge: 'bg-[#155C3B] text-white border-[#155C3B]',
    stepIndex: 5
  },
  FAILED_PICKUP: {
    label: 'Thu hồi chưa thành công',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    stepIndex: 2
  }
};

// ============================================================================
// CUSTOM SVG COMPONENTS: 3D EARTH MASCOT & RETURNPACK PP WOVEN BAG
// ============================================================================
const EarthMascot3D: React.FC<{
  pose?: 'wave' | 'thumb' | 'happy';
  size?: number;
}> = ({ pose = 'wave', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-md transition-transform duration-300 hover:scale-105 shrink-0"
  >
    <defs>
      <radialGradient id="earthOcean3D" cx="32%" cy="28%" r="72%">
        <stop offset="0%" stopColor="#7AD3F6" />
        <stop offset="55%" stopColor="#3B9ECE" />
        <stop offset="100%" stopColor="#145374" />
      </radialGradient>
      <linearGradient id="leafGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A9E65A" />
        <stop offset="100%" stopColor="#155C3B" />
      </linearGradient>
      <radialGradient id="cheekPink" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="70" cy="129" rx="30" ry="5" fill="#0B1F17" fillOpacity="0.22" />
    <path d="M68 26 C65 12, 50 8, 46 17 C44 23, 57 28, 68 26 Z" fill="url(#leafGrad3D)" stroke="#0B1F17" strokeWidth="1.8" />
    <path d="M71 26 C75 10, 92 8, 95 18 C96 24, 83 28, 71 26 Z" fill="url(#leafGrad3D)" stroke="#0B1F17" strokeWidth="1.8" />
    <path d="M69.5 29 L69.5 22" stroke="#0B1F17" strokeWidth="2.2" strokeLinecap="round" />
    <rect x="54" y="106" width="10" height="16" rx="5" fill="#267BA6" stroke="#0B1F17" strokeWidth="1.8" />
    <rect x="76" y="106" width="10" height="16" rx="5" fill="#267BA6" stroke="#0B1F17" strokeWidth="1.8" />
    {pose === 'wave' ? (
      <path d="M29 68 C18 59, 15 48, 22 43 C27 40, 32 50, 34 58" fill="#3B9ECE" stroke="#0B1F17" strokeWidth="2" strokeLinecap="round" />
    ) : (
      <path d="M29 72 C19 74, 18 82, 25 86 C31 88, 34 81, 35 77" fill="#3B9ECE" stroke="#0B1F17" strokeWidth="2" />
    )}
    {pose === 'thumb' ? (
      <g>
        <path d="M109 70 C120 66, 124 57, 118 52 C114 48, 109 57, 105 64" fill="#3B9ECE" stroke="#0B1F17" strokeWidth="2" />
        <circle cx="119" cy="50" r="4.5" fill="#D4AF37" stroke="#0B1F17" strokeWidth="1.6" />
      </g>
    ) : (
      <path d="M109 72 C119 75, 121 83, 114 87 C108 89, 105 82, 104 77" fill="#3B9ECE" stroke="#0B1F17" strokeWidth="2" />
    )}
    <circle cx="70" cy="72" r="42" fill="url(#earthOcean3D)" stroke="#0B1F17" strokeWidth="2.2" />
    <path d="M43 47 C52 43, 61 49, 58 58 C55 65, 44 67, 38 61 C34 55, 38 49, 43 47 Z" fill="#2DAF73" />
    <path d="M83 45 C93 46, 103 54, 100 66 C97 74, 88 72, 83 65 C78 57, 77 45, 83 45 Z" fill="#2DAF73" />
    <path d="M53 91 C62 87, 78 89, 85 96 C88 101, 77 108, 65 108 C54 108, 48 95, 53 91 Z" fill="#A9E65A" fillOpacity="0.8" />
    <ellipse cx="53" cy="46" rx="12" ry="5.5" transform="rotate(-24 53 46)" fill="#FFFFFF" fillOpacity="0.45" />
    <circle cx="57" cy="67" r="4.8" fill="#0B1F17" />
    <circle cx="55.5" cy="65" r="1.6" fill="#FFFFFF" />
    <circle cx="83" cy="67" r="4.8" fill="#0B1F17" />
    <circle cx="81.5" cy="65" r="1.6" fill="#FFFFFF" />
    <path d="M63 76 Q70 81 77 76" stroke="#0B1F17" strokeWidth="2.4" strokeLinecap="round" fill="none" />
  </svg>
);

const QrMatrixSvg: React.FC<{ value: string; size?: number }> = ({ value, size = 56 }) => {
  const cells: boolean[] = [];
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isFinder = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
      const bit = ((hash >>> ((r * 7 + c) % 24)) & 1) === 1;
      cells.push(isFinder || bit);
    }
  }
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" className="bg-white p-1 rounded border border-[#155C3B]/30">
      {cells.map((filled, idx) => {
        if (!filled) return null;
        const r = Math.floor(idx / 7);
        const c = idx % 7;
        return <rect key={idx} x={c * 10 + 1} y={r * 10 + 1} width="8" height="8" rx="1" fill="#183A2A" />;
      })}
    </svg>
  );
};

const ReturnpackBagIllustration: React.FC<{
  bagCode?: string;
  sizeLabel?: string;
  compact?: boolean;
}> = ({ bagCode = 'RP-000001', sizeLabel = 'M (32x43cm)', compact = false }) => (
  <svg
    width={compact ? 115 : 175}
    height={compact ? 150 : 225}
    viewBox="0 0 200 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-md shrink-0"
  >
    <defs>
      <pattern id="ppWovenGrid" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#8FA88E" strokeWidth="0.6" strokeOpacity="0.45" />
      </pattern>
      <linearGradient id="sageBagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B8CBB7" />
        <stop offset="50%" stopColor="#A3B8A2" />
        <stop offset="100%" stopColor="#8EA58D" />
      </linearGradient>
    </defs>
    <rect x="24" y="20" width="152" height="220" rx="8" fill="url(#sageBagGrad)" stroke="#155C3B" strokeWidth="2.5" />
    <rect x="25" y="21" width="150" height="218" rx="7" fill="url(#ppWovenGrid)" />
    <rect x="24" y="20" width="152" height="14" rx="4" fill="#1E2421" />
    <line x1="28" y1="27" x2="172" y2="27" stroke="#64776C" strokeWidth="2" strokeDasharray="3 3" />
    <rect x="38" y="23" width="10" height="8" rx="2" fill="#4A5550" />
    <rect x="80" y="16" width="40" height="24" rx="3" fill="#FFFFFF" stroke="#155C3B" strokeWidth="1.5" />
    <text x="100" y="27" textAnchor="middle" fill="#155C3B" fontSize="6.5" fontWeight="bold">SEALED</text>
    <text x="100" y="35" textAnchor="middle" fill="#64776C" fontSize="5.5">NIÊM PHONG</text>
    <text x="100" y="57" textAnchor="middle" fill="#155C3B" fontSize="11" fontWeight="800" letterSpacing="1">RETURNPACK</text>
    <rect x="42" y="76" width="116" height="86" rx="5" fill="#FFFFFF" fillOpacity="0.85" stroke="#FFFFFF" strokeWidth="2" />
    <rect x="48" y="82" width="104" height="74" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
    <text x="54" y="94" fill="#183A2A" fontSize="7" fontWeight="bold">VẬN ĐƠN TMĐT</text>
    <line x1="54" y1="98" x2="146" y2="98" stroke="#E2E8F0" strokeWidth="1" />
    <g transform="translate(56, 103)">
      {[0, 4, 7, 12, 15, 20, 24, 27, 32, 37, 40, 45, 50, 53, 58, 63, 66, 70, 75, 80, 84].map((xPos, idx) => (
        <rect key={idx} x={xPos} y="0" width={idx % 3 === 0 ? '2.5' : '1.2'} height="24" fill="#183A2A" />
      ))}
    </g>
    <text x="100" y="138" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">VD-ECOM-2026</text>
    <text x="100" y="149" textAnchor="middle" fill="#155C3B" fontSize="6.5" fontWeight="bold">{sizeLabel}</text>
    <g transform="translate(36, 182)">
      <rect x="0" y="0" width="46" height="48" rx="4" fill="#FFFFFF" stroke="#155C3B" strokeWidth="1.5" />
      <rect x="5" y="5" width="10" height="10" fill="#183A2A" />
      <rect x="7" y="7" width="6" height="6" fill="#FFFFFF" />
      <rect x="8.5" y="8.5" width="3" height="3" fill="#183A2A" />
      <rect x="31" y="5" width="10" height="10" fill="#183A2A" />
      <rect x="33" y="7" width="6" height="6" fill="#FFFFFF" />
      <rect x="34.5" y="8.5" width="3" height="3" fill="#183A2A" />
      <rect x="5" y="25" width="10" height="10" fill="#183A2A" />
      <rect x="7" y="27" width="6" height="6" fill="#FFFFFF" />
      <rect x="8.5" y="28.5" width="3" height="3" fill="#183A2A" />
      <rect x="19" y="7" width="4" height="4" fill="#183A2A" />
      <rect x="24" y="12" width="4" height="4" fill="#183A2A" />
      <rect x="18" y="18" width="9" height="9" fill="#155C3B" />
      <rect x="30" y="22" width="5" height="5" fill="#183A2A" />
      <rect x="20" y="30" width="5" height="5" fill="#183A2A" />
      <rect x="32" y="30" width="8" height="5" fill="#183A2A" />
      <text x="23" y="44" textAnchor="middle" fill="#155C3B" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
        {bagCode}
      </text>
    </g>
    <g transform="translate(142, 185)">
      <rect x="0" y="0" width="34" height="38" rx="4" fill="#155C3B" />
      <text x="17" y="14" textAnchor="middle" fill="#B8EF8B" fontSize="7" fontWeight="bold">REUSE</text>
      <text x="17" y="24" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="extrabold">15 VÒNG</text>
      <text x="17" y="33" textAnchor="middle" fill="#E5F7ED" fontSize="5.5">TUẦN HOÀN</text>
    </g>
  </svg>
);

// ============================================================================
// INITIAL BUSINESS SEED DATA
// ============================================================================
const STORAGE_KEY = 'returnpack_rms_state_v2';

const DEFAULT_SHOPS: ShopRecord[] = [
  {
    id: 'SHOP-A',
    shopCode: 'SH-GREENSTYLE',
    shopName: 'GreenStyle Fashion',
    ownerName: 'Nguyễn Minh Thảo',
    phone: '0912345678',
    email: 'shop@greenstyle.vn',
    address: '128 Nguyễn Gia Trí, P.25',
    district: 'Quận Bình Thạnh',
    planId: 'PLAN_STANDARD',
    planName: 'Gói Tiêu chuẩn',
    monthlyQuotaTurns: 1000,
    usedTurns: 412,
    concurrentBagLimit: 250,
    currentBagsHeld: 3,
    packedOrdersCount: 412,
    outstandingDebtVnd: 0,
    subscriptionEnd: '30/11/2026',
    status: 'ACTIVE'
  },
  {
    id: 'SHOP-B',
    shopCode: 'SH-ECOCOSMETICS',
    shopName: 'EcoCosmetics VN',
    ownerName: 'Phạm Hoàng Yến',
    phone: '0987654321',
    email: 'sales@ecocosmetics.vn',
    address: '45 Lê Văn Sỹ, P.13',
    district: 'Quận 3',
    planId: 'PLAN_BASIC',
    planName: 'Gói Cơ bản',
    monthlyQuotaTurns: 500,
    usedTurns: 486,
    concurrentBagLimit: 150,
    currentBagsHeld: 1,
    packedOrdersCount: 486,
    outstandingDebtVnd: 235000,
    subscriptionEnd: '30/11/2026',
    status: 'ACTIVE'
  },
  {
    id: 'SHOP-C',
    shopCode: 'SH-MINIMALHOME',
    shopName: 'Minimalist Home Decor',
    ownerName: 'Đặng Tuấn Kiệt',
    phone: '0909112233',
    email: 'hello@minimalhome.vn',
    address: '88 Nguyễn Thị Thập, P.Tân Hưng',
    district: 'Quận 7',
    planId: 'PLAN_ENTERPRISE',
    planName: 'Gói Mở rộng',
    monthlyQuotaTurns: 2000,
    usedTurns: 1120,
    concurrentBagLimit: 500,
    currentBagsHeld: 1,
    packedOrdersCount: 1120,
    outstandingDebtVnd: 0,
    subscriptionEnd: '30/11/2026',
    status: 'ACTIVE'
  }
];

const DEFAULT_BAGS: BagRecord[] = [
  {
    id: 'BAG-1',
    bagCode: 'RP-000001',
    size: 'M (32x43cm)',
    batchCode: 'LOT-2610A',
    currentLocation: 'GreenStyle Fashion (Q. Bình Thạnh)',
    holdingShopId: 'SHOP-A',
    holdingShopName: 'GreenStyle Fashion',
    status: 'AT_SHOP',
    cyclesUsed: 3,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Đạt chuẩn Loại A',
    updatedAt: '16/11 09:00'
  },
  {
    id: 'BAG-2',
    bagCode: 'RP-000002',
    size: 'M (32x43cm)',
    batchCode: 'LOT-2610A',
    currentLocation: 'GreenStyle Fashion (Q. Bình Thạnh)',
    holdingShopId: 'SHOP-A',
    holdingShopName: 'GreenStyle Fashion',
    status: 'AT_SHOP',
    cyclesUsed: 5,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Đạt chuẩn Loại A',
    updatedAt: '16/11 09:15'
  },
  {
    id: 'BAG-3',
    bagCode: 'RP-000003',
    size: 'L (40x55cm)',
    batchCode: 'LOT-2610B',
    currentLocation: 'Đang giao khách (Quận 1)',
    holdingShopId: null,
    holdingShopName: null,
    status: 'IN_TRANSIT',
    cyclesUsed: 7,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Đạt chuẩn Loại A',
    updatedAt: '16/11 11:20'
  },
  {
    id: 'BAG-4',
    bagCode: 'RP-000004',
    size: 'M (32x43cm)',
    batchCode: 'LOT-2610A',
    currentLocation: 'Chờ thu hồi (Q. Bình Thạnh)',
    holdingShopId: null,
    holdingShopName: null,
    status: 'WAITING_RETURN',
    cyclesUsed: 8,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Đạt chuẩn Loại A',
    updatedAt: '16/11 10:05'
  },
  {
    id: 'BAG-5',
    bagCode: 'RP-000005',
    size: 'S (25x35cm)',
    batchCode: 'LOT-2609C',
    currentLocation: 'Chờ thu hồi (Quận 3)',
    holdingShopId: null,
    holdingShopName: null,
    status: 'WAITING_RETURN',
    cyclesUsed: 11,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Đạt chuẩn Loại A',
    updatedAt: '14/11 18:30'
  },
  {
    id: 'BAG-6',
    bagCode: 'RP-000006',
    size: 'M (32x43cm)',
    batchCode: 'LOT-2610A',
    currentLocation: 'Shipper Lê Hoàng Nam',
    holdingShopId: null,
    holdingShopName: null,
    status: 'PICKED_UP_BY_SHIPPER',
    cyclesUsed: 4,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Đạt chuẩn Loại A',
    updatedAt: '16/11 14:10'
  },
  {
    id: 'BAG-7',
    bagCode: 'RP-000007',
    size: 'M (32x43cm)',
    batchCode: 'LOT-2609C',
    currentLocation: 'Kho Thủ Đức - Khu vệ sinh',
    holdingShopId: null,
    holdingShopName: null,
    status: 'CLEANING_MAINTENANCE',
    cyclesUsed: 9,
    maxCycles: 15,
    qualityGrade: 'B',
    lastInspectionResult: 'Loại B - Cần vệ sinh & kiểm lại',
    updatedAt: '16/11 13:00'
  },
  {
    id: 'BAG-8',
    bagCode: 'RP-000008',
    size: 'L (40x55cm)',
    batchCode: 'LOT-2610B',
    currentLocation: 'Kho Thủ Đức - Kệ A1',
    holdingShopId: null,
    holdingShopName: null,
    status: 'AVAILABLE_AT_WAREHOUSE',
    cyclesUsed: 2,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Đạt chuẩn Loại A',
    updatedAt: '16/11 08:00'
  },
  {
    id: 'BAG-9',
    bagCode: 'RP-000009',
    size: 'M (32x43cm)',
    batchCode: 'LOT-2610A',
    currentLocation: 'Kho Thủ Đức - Kệ A2',
    holdingShopId: null,
    holdingShopName: null,
    status: 'AVAILABLE_AT_WAREHOUSE',
    cyclesUsed: 14,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Sắp chạm ngưỡng 15 vòng',
    updatedAt: '16/11 08:30'
  },
  {
    id: 'BAG-10',
    bagCode: 'RP-000010',
    size: 'S (25x35cm)',
    batchCode: 'LOT-2608A',
    currentLocation: 'Kho Thủ Đức - Khu Loại C',
    holdingShopId: null,
    holdingShopName: null,
    status: 'RETIRED_WAITING_RECYCLE',
    cyclesUsed: 15,
    maxCycles: 15,
    qualityGrade: 'C',
    lastInspectionResult: 'Hết giới hạn 15/15 vòng',
    updatedAt: '15/11 17:20'
  },
  {
    id: 'BAG-11',
    bagCode: 'RP-000011',
    size: 'M (32x43cm)',
    batchCode: 'LOT-2609C',
    currentLocation: 'Chưa xác định (>14 ngày)',
    holdingShopId: null,
    holdingShopName: null,
    status: 'LOST',
    cyclesUsed: 6,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Nghi thất lạc',
    updatedAt: '01/11 16:00'
  },
  {
    id: 'BAG-12',
    bagCode: 'RP-000012',
    size: 'M (32x43cm)',
    batchCode: 'LOT-2610A',
    currentLocation: 'EcoCosmetics VN (Quận 3)',
    holdingShopId: 'SHOP-B',
    holdingShopName: 'EcoCosmetics VN',
    status: 'AT_SHOP',
    cyclesUsed: 4,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Đạt chuẩn Loại A',
    updatedAt: '16/11 09:40'
  },
  {
    id: 'BAG-13',
    bagCode: 'RP-000013',
    size: 'L (40x55cm)',
    batchCode: 'LOT-2610B',
    currentLocation: 'Minimalist Home Decor (Quận 7)',
    holdingShopId: 'SHOP-C',
    holdingShopName: 'Minimalist Home Decor',
    status: 'AT_SHOP',
    cyclesUsed: 1,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Đạt chuẩn Loại A',
    updatedAt: '16/11 10:15'
  },
  {
    id: 'BAG-14',
    bagCode: 'RP-000014',
    size: 'M (32x43cm)',
    batchCode: 'LOT-2610A',
    currentLocation: 'Kho Thủ Đức - Chờ QC',
    holdingShopId: null,
    holdingShopName: null,
    status: 'PENDING_INSPECTION',
    cyclesUsed: 6,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Chờ kiểm tra đầu vào',
    updatedAt: '16/11 15:00'
  },
  {
    id: 'BAG-15',
    bagCode: 'RP-000015',
    size: 'M (32x43cm)',
    batchCode: 'LOT-2610A',
    currentLocation: 'GreenStyle Fashion (Q. Bình Thạnh)',
    holdingShopId: 'SHOP-A',
    holdingShopName: 'GreenStyle Fashion',
    status: 'AT_SHOP',
    cyclesUsed: 2,
    maxCycles: 15,
    qualityGrade: 'A',
    lastInspectionResult: 'Đạt chuẩn Loại A',
    updatedAt: '16/11 09:00'
  }
];

const DEFAULT_RETURN_REQUESTS: ReturnRequestRecord[] = [
  {
    id: 'RET-1',
    requestCode: 'YC-2026-101',
    bagCode: 'RP-000004',
    usageCycleKey: 'RP-000004-CYCLE-8',
    customerName: 'Lê Minh Anh',
    customerPhone: '0908112233',
    pickupAddress: '215 Điện Biên Phủ, P.15, Q. Bình Thạnh',
    areaDistrict: 'Quận Bình Thạnh',
    preferredTimeSlot: '14:00 - 17:00',
    customerNote: 'Gửi tại quầy lễ tân tòa nhà',
    status: 'ASSIGNED_SHIPPER',
    assignedShipperName: 'Lê Hoàng Nam',
    scheduledWindow: '14:00 - 17:00 hôm nay',
    waitingHours: 6,
    isOverdue: false,
    rewardGranted: false,
    createdAt: '16/11 09:30'
  },
  {
    id: 'RET-2',
    requestCode: 'YC-2026-102',
    bagCode: 'RP-000005',
    usageCycleKey: 'RP-000005-CYCLE-11',
    customerName: 'Phạm Quốc Huy',
    customerPhone: '0938776655',
    pickupAddress: '102 Võ Văn Tần, P.6, Quận 3',
    areaDistrict: 'Quận 3',
    preferredTimeSlot: '09:00 - 12:00',
    customerNote: 'Gọi trước 10 phút',
    status: 'MATCHING_ROUTE',
    assignedShipperName: null,
    scheduledWindow: 'Đang ghép chuyến',
    waitingHours: 36,
    isOverdue: true,
    rewardGranted: false,
    createdAt: '14/11 18:30'
  },
  {
    id: 'RET-3',
    requestCode: 'YC-2026-103',
    bagCode: 'RP-000006',
    usageCycleKey: 'RP-000006-CYCLE-4',
    customerName: 'Trương Quỳnh Nhi',
    customerPhone: '0977554433',
    pickupAddress: '19 Nguyễn Hữu Cảnh, Q. Bình Thạnh',
    areaDistrict: 'Quận Bình Thạnh',
    preferredTimeSlot: '13:00 - 16:00',
    customerNote: '',
    status: 'PICKED_UP',
    assignedShipperName: 'Lê Hoàng Nam',
    scheduledWindow: 'Đã thu hồi 14:10',
    waitingHours: 4,
    isOverdue: false,
    rewardGranted: true,
    createdAt: '16/11 10:00'
  }
];

const DEFAULT_BAG_EVENTS: BagEvent[] = [
  {
    id: 'EV-1',
    bagCode: 'RP-000001',
    timestamp: '16/11/2026 08:00',
    title: 'Nhập kho & Kiểm định đạt chuẩn A',
    description: 'Hoàn tất khử khuẩn, kiểm tra khóa kéo và tem QR.',
    actor: 'Kho Thủ Đức',
    location: 'TP. Thủ Đức',
    cycleNumber: 3
  },
  {
    id: 'EV-2',
    bagCode: 'RP-000001',
    timestamp: '16/11/2026 09:00',
    title: 'Cấp phát cho GreenStyle Fashion',
    description: 'Xuất kho theo phiếu AL-2026-089 và Shop xác nhận đã nhận.',
    actor: 'Nguyễn Minh Thảo',
    location: '128 Nguyễn Gia Trí, Q. Bình Thạnh',
    cycleNumber: 3
  }
];

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  // Authentication & Stakeholder Portal State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<StakeholderRole>('ADMIN');
  const [loginEmail, setLoginEmail] = useState<string>('admin@returnpack.id.vn');
  const [loginPassword, setLoginPassword] = useState<string>('••••••••');
  const [loggedInUserName, setLoggedInUserName] = useState<string>('Quản trị viên');

  // Active Portal & Route State
  const [activeRole, setActiveRole] = useState<StakeholderRole>('ADMIN');
  const [activeShopId, setActiveShopId] = useState<string>('SHOP-A');
  const [currentRoute, setCurrentRoute] = useState<string>('/admin/dashboard');
  const [selectedBagCode, setSelectedBagCode] = useState<string>('RP-000001');
  const [returnPortalToken, setReturnPortalToken] = useState<string>('RP-000001');
  const [trackingRequestCode, setTrackingRequestCode] = useState<string>('YC-2026-101');

  // System Config
  const [maxAllowedCycles, setMaxAllowedCycles] = useState<number>(15);
  const [pointsPerReturn, setPointsPerReturn] = useState<number>(100);

  // Core Business Data State
  const [bags, setBags] = useState<BagRecord[]>(DEFAULT_BAGS);
  const [bagEvents, setBagEvents] = useState<BagEvent[]>(DEFAULT_BAG_EVENTS);
  const [shops, setShops] = useState<ShopRecord[]>(DEFAULT_SHOPS);
  const [shopOrders, setShopOrders] = useState<ShopOrderRecord[]>([
    { id: 'SO-1', shopId: 'SHOP-A', orderCode: 'DH-8821', bagCode: 'RP-000003', packedAt: '16/11 11:20', status: 'Đang giao' },
    { id: 'SO-2', shopId: 'SHOP-A', orderCode: 'DH-8790', bagCode: 'RP-000004', packedAt: '15/11 16:45', status: 'Chờ thu hồi' }
  ]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequestRecord[]>(DEFAULT_RETURN_REQUESTS);
  const [allocations, setAllocations] = useState<AllocationRecord[]>([
    {
      id: 'AL-1',
      allocationCode: 'AL-2026-089',
      shopId: 'SHOP-A',
      shopName: 'GreenStyle Fashion',
      size: 'M (32x43cm)',
      quantity: 3,
      status: 'CONFIRMED',
      createdAt: '16/11 09:00'
    },
    {
      id: 'AL-2',
      allocationCode: 'AL-2026-090',
      shopId: 'SHOP-B',
      shopName: 'EcoCosmetics VN',
      size: 'M (32x43cm)',
      quantity: 20,
      status: 'PENDING',
      createdAt: '16/11 11:00'
    }
  ]);
  const [maintenanceJobs, setMaintenanceJobs] = useState<MaintenanceJobRecord[]>([
    {
      id: 'MJ-1',
      bagCode: 'RP-000007',
      jobType: 'Vệ sinh khử khuẩn',
      status: 'IN_PROGRESS',
      assignedStaff: 'Trần Văn Khoa',
      startedAt: '16/11 13:00'
    }
  ]);
  const [recyclingHandoffs, setRecyclingHandoffs] = useState<RecyclingHandoffRecord[]>([
    {
      id: 'RC-1',
      handoffCode: 'TC-2026-01',
      bagCode: 'RP-000010',
      partnerName: 'Nhựa Xanh Việt',
      status: 'WAITING_HANDOVER',
      handedOverAt: '15/11 17:30'
    }
  ]);

  // Customer Rewards & Vouchers
  const [customerRewardPoints, setCustomerRewardPoints] = useState<number>(350);
  const [customerTotalEarned, setCustomerTotalEarned] = useState<number>(450);
  const [customerSuccessfulReturns, setCustomerSuccessfulReturns] = useState<number>(4);
  const [customerVouchers, setCustomerVouchers] = useState<CustomerVoucher[]>([
    {
      id: 'VC-1',
      code: 'RP-GREEN15K-882',
      title: 'Giảm 15.000đ tại GreenStyle Fashion',
      sponsor: 'GreenStyle Fashion',
      redeemedAt: '12/11/2026',
      status: 'Sẵn sàng dùng'
    }
  ]);
  const [rewardTransactions, setRewardTransactions] = useState<RewardTransactionRecord[]>([
    {
      id: 'RTX-1',
      txCode: 'GR-901',
      customerName: 'Trương Quỳnh Nhi',
      bagCode: 'RP-000006',
      usageCycleKey: 'RP-000006-CYCLE-4',
      txType: 'EARN_RETURN',
      pointsDelta: 100,
      description: 'Hoàn trả túi RP-000006 thành công',
      createdAt: '16/11 14:10'
    },
    {
      id: 'RTX-2',
      txCode: 'GR-880',
      customerName: 'Lê Minh Anh',
      bagCode: 'RP-000002',
      usageCycleKey: 'RP-000002-CYCLE-4',
      txType: 'REDEEM_OFFER',
      pointsDelta: -100,
      description: 'Đổi Voucher GreenStyle Fashion 15K',
      createdAt: '12/11 19:20'
    }
  ]);

  // Idempotency Keys
  const [processedOrderKeys, setProcessedOrderKeys] = useState<string[]>(['SHOP-A::DH-8821']);
  const [rewardedCycleKeys, setRewardedCycleKeys] = useState<string[]>(['RP-000006-CYCLE-4']);

  // Notifications & Audit Logs
  const [notifications, setNotifications] = useState<NotificationRecord[]>([
    {
      id: 'N-1',
      title: 'Yêu cầu thu hồi quá hạn',
      message: 'YC-2026-102 (RP-000005 - Quận 3) đã chờ ghép chuyến 36 giờ.',
      isRead: false,
      createdAt: '10 phút trước'
    },
    {
      id: 'N-2',
      title: 'Shop sắp hết lượt',
      message: 'EcoCosmetics VN còn 14/500 lượt sử dụng.',
      isRead: false,
      createdAt: '25 phút trước'
    }
  ]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([
    {
      id: 'AUD-1',
      timestamp: '16/11 14:10',
      actor: 'Lê Hoàng Nam (Shipper)',
      action: 'Xác nhận thu hồi',
      entity: 'YC-2026-103 / RP-000006',
      detail: 'Đã nhận túi và cộng 100 điểm thưởng.'
    }
  ]);

  // Modals & Interactive States
  const [toast, setToast] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; title: string; message: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [showNotifPopover, setShowNotifPopover] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [showQrScannerModal, setShowQrScannerModal] = useState<{ open: boolean; target: 'SHOP' | 'WAREHOUSE' | 'SHIPPER'; reqCode?: string }>({ open: false, target: 'SHOP' });
  const [showPrintQrModal, setShowPrintQrModal] = useState<boolean>(false);
  const [showVietQrModal, setShowVietQrModal] = useState<{ open: boolean; planName: string; price: number; turns: number; planId: 'PLAN_BASIC' | 'PLAN_STANDARD' | 'PLAN_ENTERPRISE' } | null>(null);
  const [showAddBagModal, setShowAddBagModal] = useState<boolean>(false);
  const [showAddShopModal, setShowAddShopModal] = useState<boolean>(false);

  // Inputs
  const [bagSearchQuery, setBagSearchQuery] = useState<string>('');
  const [bagStatusFilter, setBagStatusFilter] = useState<string>('ALL');
  const [bagPage, setBagPage] = useState<number>(1);
  const [newBagCodeInput, setNewBagCodeInput] = useState<string>('RP-000016');
  const [newBagSizeInput, setNewBagSizeInput] = useState<'S (25x35cm)' | 'M (32x43cm)' | 'L (40x55cm)'>('M (32x43cm)');
  const [newBagBatchInput, setNewBagBatchInput] = useState<string>('LOT-2611A');

  const [newShopName, setNewShopName] = useState<string>('');
  const [newShopOwner, setNewShopOwner] = useState<string>('');
  const [newShopPhone, setNewShopPhone] = useState<string>('');
  const [newShopLimit, setNewShopLimit] = useState<number>(200);

  const [scanBagCodeInput, setScanBagCodeInput] = useState<string>('RP-000001');
  const [scanVerifiedBag, setScanVerifiedBag] = useState<BagRecord | null>(null);
  const [packingOrderCodeInput, setPackingOrderCodeInput] = useState<string>('DH-9001');

  const [custReturnName, setCustReturnName] = useState<string>('Hoàng Trung Kiên');
  const [custReturnPhone, setCustReturnPhone] = useState<string>('0905889900');
  const [custReturnAddress, setCustReturnAddress] = useState<string>('279 Nguyễn Tri Phương, P.5');
  const [custReturnDistrict, setCustReturnDistrict] = useState<string>('Quận 10');
  const [custReturnTimeSlot, setCustReturnTimeSlot] = useState<string>('14:00 - 17:00');
  const [custReturnNote, setCustReturnNote] = useState<string>('');
  const [submittedReturnCode, setSubmittedReturnCode] = useState<string | null>(null);

  const [warehouseScanInput, setWarehouseScanInput] = useState<string>('RP-000014');
  const [selectedInspectGrade, setSelectedInspectGrade] = useState<'A' | 'B' | 'C'>('A');
  const [inspectNoteInput, setInspectNoteInput] = useState<string>('Khóa kéo, màng PP và tem QR đạt chuẩn.');

  const [returnDistrictFilter, setReturnDistrictFilter] = useState<string>('ALL');
  const [returnStatusFilter, setReturnStatusFilter] = useState<string>('ALL');

  // ==========================================================================
  // PERSISTENCE IN LOCALSTORAGE (SAFE HYDRATION + FULL STATE)
  // ==========================================================================
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.bags)) setBags(parsed.bags);
        if (Array.isArray(parsed.shops)) setShops(parsed.shops);
        if (Array.isArray(parsed.shopOrders)) setShopOrders(parsed.shopOrders);
        if (Array.isArray(parsed.returnRequests)) setReturnRequests(parsed.returnRequests);
        if (Array.isArray(parsed.allocations)) setAllocations(parsed.allocations);
        if (Array.isArray(parsed.maintenanceJobs)) setMaintenanceJobs(parsed.maintenanceJobs);
        if (Array.isArray(parsed.recyclingHandoffs)) setRecyclingHandoffs(parsed.recyclingHandoffs);
        if (Array.isArray(parsed.bagEvents)) setBagEvents(parsed.bagEvents);
        if (Array.isArray(parsed.rewardTransactions)) setRewardTransactions(parsed.rewardTransactions);
        if (typeof parsed.customerRewardPoints === 'number') setCustomerRewardPoints(parsed.customerRewardPoints);
        if (typeof parsed.customerTotalEarned === 'number') setCustomerTotalEarned(parsed.customerTotalEarned);
        if (typeof parsed.customerSuccessfulReturns === 'number') setCustomerSuccessfulReturns(parsed.customerSuccessfulReturns);
        if (Array.isArray(parsed.customerVouchers)) setCustomerVouchers(parsed.customerVouchers);
        if (Array.isArray(parsed.processedOrderKeys)) setProcessedOrderKeys(parsed.processedOrderKeys);
        if (Array.isArray(parsed.rewardedCycleKeys)) setRewardedCycleKeys(parsed.rewardedCycleKeys);
        if (Array.isArray(parsed.auditLogs)) setAuditLogs(parsed.auditLogs);
        if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
      }
    } catch {
      // Ignore storage errors
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          bags,
          shops,
          shopOrders,
          returnRequests,
          allocations,
          maintenanceJobs,
          recyclingHandoffs,
          bagEvents,
          rewardTransactions,
          customerRewardPoints,
          customerTotalEarned,
          customerSuccessfulReturns,
          customerVouchers,
          processedOrderKeys,
          rewardedCycleKeys,
          auditLogs,
          notifications
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [
    isHydrated,
    bags,
    shops,
    shopOrders,
    returnRequests,
    allocations,
    maintenanceJobs,
    recyclingHandoffs,
    bagEvents,
    rewardTransactions,
    customerRewardPoints,
    customerTotalEarned,
    customerSuccessfulReturns,
    customerVouchers,
    processedOrderKeys,
    rewardedCycleKeys,
    auditLogs,
    notifications
  ]);

  const copyTextWithFallback = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback below
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const triggerToast = (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
    setToast({ type, title, message });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const addAuditLog = (action: string, entity: string, detail: string) => {
    setAuditLogs((prev) => [
      {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        actor: loggedInUserName,
        action,
        entity,
        detail
      },
      ...prev
    ]);
  };

  const currentShop = useMemo(() => shops.find((s) => s.id === activeShopId) || shops[0], [shops, activeShopId]);

  const kpiMetrics = useMemo(() => {
    const totalBags = bags.length;
    const availableBags = bags.filter((b) => b.status === 'AVAILABLE_AT_WAREHOUSE').length;
    const bagsAtShop = bags.filter((b) => b.status === 'AT_SHOP').length;
    const bagsInTransit = bags.filter((b) => b.status === 'IN_TRANSIT').length;
    const bagsWaitingReturn = bags.filter((b) => b.status === 'WAITING_RETURN').length;
    const bagsRecovered = bags.filter((b) => b.status === 'PICKED_UP_BY_SHIPPER' || b.status === 'PENDING_INSPECTION').length;
    const bagsCleaning = bags.filter((b) => b.status === 'CLEANING_MAINTENANCE').length;
    const totalUsageCycles = bags.reduce((acc, b) => acc + b.cyclesUsed, 0);
    const completedReturnsCount = returnRequests.filter((r) => r.status === 'PICKED_UP' || r.status === 'COMPLETED_AT_WAREHOUSE').length;
    const recoveryRate = returnRequests.length > 0 ? Math.round(((completedReturnsCount + availableBags) / (returnRequests.length + availableBags)) * 100) : 90;
    const activeShopsCount = shops.filter((s) => s.status === 'ACTIVE').length;
    const totalSubscriptionRevenue = shops.reduce((sum, s) => sum + (s.planId === 'PLAN_BASIC' ? 235000 : s.planId === 'PLAN_STANDARD' ? 460000 : 900000), 0);
    const totalRewardPointsIssued = rewardTransactions.filter((t) => t.pointsDelta > 0).reduce((sum, t) => sum + t.pointsDelta, 0);

    return {
      totalBags,
      availableBags,
      bagsAtShop,
      bagsInTransit,
      bagsWaitingReturn,
      bagsRecovered,
      bagsCleaning,
      totalUsageCycles,
      recoveryRate,
      activeShopsCount,
      totalSubscriptionRevenue,
      totalRewardPointsIssued
    };
  }, [bags, returnRequests, shops, rewardTransactions]);

  // ==========================================================================
  // AUTHENTICATION HANDLERS (3 STAKEHOLDERS)
  // ==========================================================================
  const handleSelectAuthTab = (role: StakeholderRole) => {
    setAuthTab(role);
    if (role === 'ADMIN') {
      setLoginEmail('admin@returnpack.id.vn');
    } else if (role === 'SHOP') {
      setLoginEmail('shop@greenstyle.vn');
    } else {
      setLoginEmail('kien.hoang@gmail.com');
    }
  };

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isShopRegisterMode, setIsShopRegisterMode] = useState<boolean>(false);
  const [regShopName, setRegShopName] = useState<string>('');
  const [regShopOwner, setRegShopOwner] = useState<string>('');
  const [regShopPhone, setRegShopPhone] = useState<string>('');
  const [regShopDistrict, setRegShopDistrict] = useState<string>('Quận 1');

  const handleLoginSubmit = (e?: React.FormEvent, overrideRole?: StakeholderRole) => {
    if (e) e.preventDefault();
    const targetRole = overrideRole || authTab;
    if (!overrideRole) {
      if (!loginEmail.trim() || !loginPassword.trim()) {
        setLoginError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
        return;
      }
      if (targetRole === 'SHOP' && isShopRegisterMode) {
        if (!regShopName.trim() || !regShopOwner.trim() || !regShopPhone.trim()) {
          setLoginError('Vui lòng điền đầy đủ Tên Shop, Chủ Shop và Số điện thoại.');
          return;
        }
        const newShopId = `SHOP-${Date.now()}`;
        const createdShop: ShopRecord = {
          id: newShopId,
          shopCode: `SH-${regShopName.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'NEW'}`,
          shopName: regShopName.trim(),
          ownerName: regShopOwner.trim(),
          phone: regShopPhone.trim(),
          email: loginEmail.trim(),
          address: regShopDistrict,
          district: regShopDistrict,
          planId: 'PLAN_BASIC',
          planName: 'Gói Cơ bản',
          monthlyQuotaTurns: 500,
          usedTurns: 0,
          concurrentBagLimit: 150,
          currentBagsHeld: 0,
          packedOrdersCount: 0,
          outstandingDebtVnd: 0,
          subscriptionEnd: '30/12/2026',
          status: 'ACTIVE'
        };
        setShops((prev) => [...prev, createdShop]);
        setActiveShopId(newShopId);
        setIsShopRegisterMode(false);
        setLoginError(null);
        setActiveRole('SHOP');
        setLoggedInUserName(createdShop.shopName);
        setCurrentRoute('/shop/dashboard');
        setIsAuthenticated(true);
        triggerToast('success', 'Đăng ký Shop thành công', `Chào mừng ${createdShop.shopName} đến với RETURNPACK!`);
        return;
      }
    }
    setLoginError(null);
    setActiveRole(targetRole);
    setIsAuthenticated(true);

    if (targetRole === 'ADMIN') {
      setLoggedInUserName('Quản trị viên Returnpack');
      setCurrentRoute('/admin/dashboard');
    } else if (targetRole === 'SHOP') {
      const matchedShop = overrideRole
        ? currentShop
        : shops.find((sp) => sp.email.toLowerCase() === loginEmail.trim().toLowerCase());
      if (!overrideRole && !matchedShop) {
        setIsAuthenticated(false);
        setLoginError('Không tìm thấy tài khoản Shop với email này.');
        return;
      }
      const targetShop = matchedShop || currentShop;
      setActiveShopId(targetShop.id);
      setLoggedInUserName(targetShop.shopName);
      setCurrentRoute('/shop/dashboard');
    } else {
      setLoggedInUserName(custReturnName || 'Hoàng Trung Kiên');
      setCurrentRoute(`/return/${returnPortalToken}`);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setScanVerifiedBag(null);
  };

  // ==========================================================================
  // BUSINESS OPERATIONS
  // ==========================================================================
  const handleCreateSingleBag = () => {
    const cleanCode = newBagCodeInput.trim().toUpperCase();
    if (!cleanCode.startsWith('RP-')) {
      triggerToast('error', 'Mã túi không hợp lệ', 'Vui lòng nhập theo định dạng RP-xxxxxx.');
      return;
    }
    if (bags.some((b) => b.bagCode === cleanCode)) {
      triggerToast('error', 'Trùng mã túi', `Mã ${cleanCode} đã tồn tại trong hệ thống.`);
      return;
    }
    const newBag: BagRecord = {
      id: `BAG-${Date.now()}`,
      bagCode: cleanCode,
      size: newBagSizeInput,
      batchCode: newBagBatchInput,
      currentLocation: 'Kho Thủ Đức - Kệ A1',
      holdingShopId: null,
      holdingShopName: null,
      status: 'AVAILABLE_AT_WAREHOUSE',
      cyclesUsed: 0,
      maxCycles: maxAllowedCycles,
      qualityGrade: 'A',
      lastInspectionResult: 'Túi mới - Đạt chuẩn A',
      updatedAt: 'Vừa xong'
    };
    setBags((prev) => [newBag, ...prev]);
    setBagEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        bagCode: cleanCode,
        timestamp: 'Vừa xong',
        title: 'Khởi tạo túi & Sinh mã QR',
        description: `Nhập kho lô ${newBagBatchInput}, kích thước ${newBagSizeInput}.`,
        actor: loggedInUserName,
        location: 'Kho Thủ Đức',
        cycleNumber: 0
      },
      ...prev
    ]);
    setShowAddBagModal(false);
    const nextNum = parseInt(cleanCode.replace('RP-', ''), 10) + 1;
    if (!isNaN(nextNum)) setNewBagCodeInput(`RP-${String(nextNum).padStart(6, '0')}`);
    triggerToast('success', 'Đã thêm túi mới', `Túi ${cleanCode} đã sẵn sàng tại kho.`);
  };

  const handleShopVerifyQrOnly = (codeInput?: string) => {
    const code = (codeInput ?? scanBagCodeInput).trim().toUpperCase();
    const targetBag = bags.find((b) => b.bagCode === code);
    if (!targetBag) {
      setScanVerifiedBag(null);
      triggerToast('error', 'Không tìm thấy túi', `Mã ${code} không tồn tại.`);
      return;
    }
    if (targetBag.holdingShopId !== currentShop.id) {
      setScanVerifiedBag(null);
      triggerToast('error', 'Không thuộc quyền quản lý', `Túi ${code} hiện không nằm trong kho của ${currentShop.shopName}.`);
      return;
    }
    if (targetBag.status !== 'AT_SHOP') {
      setScanVerifiedBag(null);
      triggerToast('warning', 'Trạng thái không hợp lệ', `Túi ${code} đang ở trạng thái ${BAG_STATUS_META[targetBag.status].label}.`);
      return;
    }
    setScanVerifiedBag(targetBag);
    triggerToast('info', 'Túi hợp lệ', `Đã xác thực túi ${code}. Nhập mã đơn và xác nhận bàn giao.`);
  };

  const handleShopConfirmPacking = () => {
    const bagCode = (scanVerifiedBag?.bagCode ?? scanBagCodeInput).trim().toUpperCase();
    const orderCode = packingOrderCodeInput.trim().toUpperCase();
    if (!bagCode || !orderCode) {
      triggerToast('error', 'Thiếu thông tin', 'Vui lòng chọn túi và nhập mã đơn hàng.');
      return;
    }
    const idempotencyKey = `${currentShop.id}::${orderCode}`;
    if (processedOrderKeys.includes(idempotencyKey)) {
      triggerToast('warning', 'Đơn hàng đã đóng gói', `Mã đơn ${orderCode} đã được ghi nhận trước đó.`);
      return;
    }
    const targetBag = bags.find((b) => b.bagCode === bagCode);
    if (!targetBag || targetBag.holdingShopId !== currentShop.id || targetBag.status !== 'AT_SHOP') {
      triggerToast('error', 'Túi không hợp lệ', `Túi ${bagCode} không sẵn sàng tại ${currentShop.shopName}.`);
      return;
    }
    if (currentShop.monthlyQuotaTurns - currentShop.usedTurns <= 0) {
      triggerToast('error', 'Hết lượt sử dụng', 'Vui lòng gia hạn hoặc nâng cấp gói dịch vụ.');
      return;
    }

    const newCycle = targetBag.cyclesUsed + 1;
    setBags((prev) =>
      prev.map((b) =>
        b.bagCode === bagCode
          ? {
              ...b,
              status: 'IN_TRANSIT',
              holdingShopId: null,
              holdingShopName: null,
              currentLocation: `Đang giao đơn ${orderCode}`,
              cyclesUsed: newCycle,
              updatedAt: 'Vừa xong'
            }
          : b
      )
    );
    setShops((prev) =>
      prev.map((s) =>
        s.id === currentShop.id
          ? {
              ...s,
              usedTurns: s.usedTurns + 1,
              currentBagsHeld: Math.max(0, s.currentBagsHeld - 1),
              packedOrdersCount: s.packedOrdersCount + 1
            }
          : s
      )
    );
    setShopOrders((prev) => [
      { id: `SO-${Date.now()}`, shopId: currentShop.id, orderCode, bagCode, packedAt: 'Vừa xong', status: 'Đang giao' },
      ...prev
    ]);
    setBagEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        bagCode,
        timestamp: 'Vừa xong',
        title: `Đóng gói đơn ${orderCode} (Vòng #${newCycle})`,
        description: `Bàn giao vận chuyển từ ${currentShop.shopName}.`,
        actor: currentShop.shopName,
        location: currentShop.address,
        cycleNumber: newCycle
      },
      ...prev
    ]);
    setProcessedOrderKeys((prev) => [...prev, idempotencyKey]);
    setScanVerifiedBag(null);
    addAuditLog('Đóng gói đơn hàng', `${orderCode} / ${bagCode}`, `Trừ 1 lượt gói của ${currentShop.shopName}.`);
    triggerToast('success', 'Bàn giao thành công', `Đơn ${orderCode} đã xuất đi bằng túi ${bagCode}.`);
  };

  const handleCustomerSubmitReturn = () => {
    const code = returnPortalToken.trim().toUpperCase();
    const targetBag = bags.find((b) => b.bagCode === code);
    if (!targetBag) {
      triggerToast('error', 'Mã túi không tồn tại', `Không tìm thấy túi ${code}.`);
      return;
    }
    if (targetBag.status !== 'IN_TRANSIT' && targetBag.status !== 'AT_SHOP') {
      triggerToast('warning', 'Trạng thái túi không hợp lệ', `Túi ${code} hiện đang ở trạng thái "${BAG_STATUS_META[targetBag.status].label}", không thể tạo yêu cầu hoàn trả.`);
      return;
    }
    const cycleKey = `${code}-CYCLE-${targetBag.cyclesUsed || 1}`;
    if (returnRequests.some((r) => r.usageCycleKey === cycleKey)) {
      triggerToast('warning', 'Đã có yêu cầu hoàn trả', `Túi ${code} đang trong quá trình thu hồi.`);
      return;
    }

    const reqCode = `YC-2026-${104 + returnRequests.length}`;
    const newReq: ReturnRequestRecord = {
      id: `RET-${Date.now()}`,
      requestCode: reqCode,
      bagCode: code,
      usageCycleKey: cycleKey,
      customerName: custReturnName.trim() || 'Khách hàng',
      customerPhone: custReturnPhone.trim() || '0905889900',
      pickupAddress: `${custReturnAddress.trim()}, ${custReturnDistrict}`,
      areaDistrict: custReturnDistrict,
      preferredTimeSlot: custReturnTimeSlot,
      customerNote: custReturnNote,
      status: 'RECEIVED',
      assignedShipperName: null,
      scheduledWindow: `Dự kiến ${custReturnTimeSlot}`,
      waitingHours: 0,
      isOverdue: false,
      rewardGranted: false,
      createdAt: 'Vừa xong'
    };
    setReturnRequests((prev) => [newReq, ...prev]);
    setBags((prev) =>
      prev.map((b) =>
        b.bagCode === code
          ? { ...b, status: 'WAITING_RETURN', currentLocation: `Chờ thu hồi (${custReturnDistrict})`, updatedAt: 'Vừa xong' }
          : b
      )
    );
    setBagEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        bagCode: code,
        timestamp: 'Vừa xong',
        title: `Đăng ký hoàn trả (${reqCode})`,
        description: `Khách hẹn thu hồi tại ${custReturnDistrict} (${custReturnTimeSlot}).`,
        actor: custReturnName,
        location: custReturnDistrict,
        cycleNumber: targetBag.cyclesUsed || 1
      },
      ...prev
    ]);
    setSubmittedReturnCode(reqCode);
    setTrackingRequestCode(reqCode);
    triggerToast('success', 'Đăng ký hoàn trả thành công', `Mã theo dõi của bạn là ${reqCode}.`);
  };

  const handleAssignShipper = (requestCode: string) => {
    const req = returnRequests.find((r) => r.requestCode === requestCode);
    if (!req) return;
    setReturnRequests((prev) =>
      prev.map((r) =>
        r.requestCode === requestCode
          ? { ...r, status: 'ASSIGNED_SHIPPER', assignedShipperName: 'Lê Hoàng Nam', scheduledWindow: `${r.preferredTimeSlot} (Đã ghép tuyến)`, isOverdue: false }
          : r
      )
    );
    triggerToast('success', 'Đã phân công Shipper', `Giao cho Shipper Lê Hoàng Nam thu hồi ${req.bagCode}.`);
  };

  const handleConfirmPickup = (requestCode: string, scannedBagCode?: string) => {
    const req = returnRequests.find((r) => r.requestCode === requestCode);
    if (!req) return;
    if (req.status === 'PICKED_UP' || req.status === 'COMPLETED_AT_WAREHOUSE') {
      triggerToast('warning', 'Đã xác nhận trước đó', 'Yêu cầu này đã được thu hồi.');
      return;
    }
    const verifyCode = (scannedBagCode ?? '').trim().toUpperCase();
    if (!verifyCode || verifyCode !== req.bagCode) {
      triggerToast('error', 'Mã túi không khớp', `Cần quét đúng mã túi ${req.bagCode} để xác nhận thu hồi.`);
      return;
    }

    const alreadyRewarded = rewardedCycleKeys.includes(req.usageCycleKey);
    setReturnRequests((prev) =>
      prev.map((r) =>
        r.requestCode === requestCode ? { ...r, status: 'PICKED_UP', scheduledWindow: 'Đã thu hồi', rewardGranted: true } : r
      )
    );
    setBags((prev) =>
      prev.map((b) =>
        b.bagCode === req.bagCode
          ? { ...b, status: 'PICKED_UP_BY_SHIPPER', currentLocation: 'Shipper Lê Hoàng Nam đang giữ', updatedAt: 'Vừa xong' }
          : b
      )
    );
    if (!alreadyRewarded) {
      setRewardedCycleKeys((prev) => [...prev, req.usageCycleKey]);
      setCustomerRewardPoints((prev) => prev + pointsPerReturn);
      setCustomerTotalEarned((prev) => prev + pointsPerReturn);
      setCustomerSuccessfulReturns((prev) => prev + 1);
      setRewardTransactions((prev) => [
        {
          id: `RTX-${Date.now()}`,
          txCode: `GR-${902 + prev.length}`,
          customerName: req.customerName,
          bagCode: req.bagCode,
          usageCycleKey: req.usageCycleKey,
          txType: 'EARN_RETURN',
          pointsDelta: pointsPerReturn,
          description: `Hoàn trả túi ${req.bagCode} thành công`,
          createdAt: 'Vừa xong'
        },
        ...prev
      ]);
    }
    setBagEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        bagCode: req.bagCode,
        timestamp: 'Vừa xong',
        title: `Shipper đã nhận túi & Cộng +${pointsPerReturn} điểm`,
        description: `Shipper Lê Hoàng Nam xác nhận thu hồi tại ${req.areaDistrict}.`,
        actor: 'Lê Hoàng Nam',
        location: req.pickupAddress,
        cycleNumber: 4
      },
      ...prev
    ]);
    triggerToast('success', 'Thu hồi thành công', `Đã nhận túi ${req.bagCode} và cộng +${pointsPerReturn} điểm Green Rewards.`);
  };

  const handleWarehouseReceive = (bagCodeInput: string) => {
    const code = bagCodeInput.trim().toUpperCase();
    const bag = bags.find((b) => b.bagCode === code);
    if (!bag) {
      triggerToast('error', 'Không tìm thấy túi', `Mã ${code} không tồn tại.`);
      return;
    }
    if (bag.status !== 'PICKED_UP_BY_SHIPPER' && bag.status !== 'WAITING_RETURN') {
      triggerToast('error', 'Không thể nhập kho', `Túi ${code} đang ở trạng thái "${BAG_STATUS_META[bag.status].label}", chưa qua bước thu hồi.`);
      return;
    }
    setBags((prev) =>
      prev.map((b) =>
        b.bagCode === code
          ? { ...b, status: 'PENDING_INSPECTION', currentLocation: 'Kho Thủ Đức - Chờ QC', updatedAt: 'Vừa xong' }
          : b
      )
    );
    setReturnRequests((prev) =>
      prev.map((r) => (r.bagCode === code && r.status === 'PICKED_UP' ? { ...r, status: 'COMPLETED_AT_WAREHOUSE' } : r))
    );
    triggerToast('success', 'Đã nhập kho', `Túi ${code} đã chuyển sang hàng đợi kiểm định.`);
  };

  const handleWarehouseInspect = (bagCodeInput: string, grade: 'A' | 'B' | 'C', note: string) => {
    const code = bagCodeInput.trim().toUpperCase();
    const bag = bags.find((b) => b.bagCode === code);
    if (!bag) return;
    const effectiveGrade: 'A' | 'B' | 'C' = bag.cyclesUsed >= maxAllowedCycles ? 'C' : grade;
    let nextStatus: BagStatus = 'AVAILABLE_AT_WAREHOUSE';
    let nextLocation = 'Kho Thủ Đức - Kệ Sẵn Sàng';
    if (effectiveGrade === 'B') {
      nextStatus = 'CLEANING_MAINTENANCE';
      nextLocation = 'Kho Thủ Đức - Khu Vệ Sinh';
      setMaintenanceJobs((prev) => [
        { id: `MJ-${Date.now()}`, bagCode: code, jobType: 'Vệ sinh khử khuẩn', status: 'IN_PROGRESS', assignedStaff: 'Trần Văn Khoa', startedAt: 'Vừa xong' },
        ...prev
      ]);
    } else if (effectiveGrade === 'C') {
      nextStatus = 'RETIRED_WAITING_RECYCLE';
      nextLocation = 'Kho Thủ Đức - Khu Loại C';
      setRecyclingHandoffs((prev) => [
        { id: `RC-${Date.now()}`, handoffCode: `TC-2026-0${prev.length + 1}`, bagCode: code, partnerName: 'Nhựa Xanh Việt', status: 'WAITING_HANDOVER', handedOverAt: 'Vừa xong' },
        ...prev
      ]);
    }
    setBags((prev) =>
      prev.map((b) =>
        b.bagCode === code
          ? { ...b, status: nextStatus, qualityGrade: effectiveGrade, currentLocation: nextLocation, lastInspectionResult: note, updatedAt: 'Vừa xong' }
          : b
      )
    );
    setBagEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        bagCode: code,
        timestamp: 'Vừa xong',
        title: `Kiểm định chất lượng Loại ${effectiveGrade}`,
        description: note,
        actor: 'QC Kho Thủ Đức',
        location: 'Kho Thủ Đức',
        cycleNumber: bag.cyclesUsed
      },
      ...prev
    ]);
    triggerToast('success', `Đã phân loại ${effectiveGrade}`, `Túi ${code} chuyển sang trạng thái ${BAG_STATUS_META[nextStatus].label}.`);
  };

  const handleAllocateToShop = (bagCode: string, shopId: string) => {
    const bag = bags.find((b) => b.bagCode === bagCode);
    const shop = shops.find((s) => s.id === shopId);
    if (!bag || !shop) return;
    if (bag.status !== 'AVAILABLE_AT_WAREHOUSE') {
      triggerToast('error', 'Túi chưa sẵn sàng', 'Chỉ cấp phát các túi đang sẵn sàng tại kho.');
      return;
    }
    if (shop.currentBagsHeld >= shop.concurrentBagLimit) {
      triggerToast('error', 'Vượt hạn mức giữ túi', `${shop.shopName} đã đạt giới hạn ${shop.concurrentBagLimit} túi.`);
      return;
    }
    setBags((prev) =>
      prev.map((b) =>
        b.bagCode === bagCode
          ? { ...b, status: 'AT_SHOP', holdingShopId: shop.id, holdingShopName: shop.shopName, currentLocation: `${shop.shopName} (${shop.district})`, updatedAt: 'Vừa xong' }
          : b
      )
    );
    setShops((prev) => prev.map((s) => (s.id === shop.id ? { ...s, currentBagsHeld: s.currentBagsHeld + 1 } : s)));
    setBagEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        bagCode,
        timestamp: 'Vừa xong',
        title: `Cấp phát cho ${shop.shopName}`,
        description: `Xuất kho tái phân phối về ${shop.shopName}.`,
        actor: 'Kho Thủ Đức',
        location: shop.address,
        cycleNumber: bag.cyclesUsed
      },
      ...prev
    ]);
    triggerToast('success', 'Cấp phát thành công', `Đã chuyển túi ${bagCode} về ${shop.shopName}.`);
  };

  const handleApproveAllocation = (allocationId: string) => {
    const alloc = allocations.find((a) => a.id === allocationId);
    if (!alloc || alloc.status !== 'PENDING') return;
    const shop = shops.find((s) => s.id === alloc.shopId);
    if (!shop) return;
    const availBags = bags.filter((b) => b.status === 'AVAILABLE_AT_WAREHOUSE');
    if (availBags.length === 0) {
      triggerToast('error', 'Kho hết túi sẵn sàng', 'Cần kiểm định thêm túi đạt Loại A trước khi duyệt cấp phát.');
      return;
    }
    const dispatchCount = Math.min(alloc.quantity, availBags.length, Math.max(0, shop.concurrentBagLimit - shop.currentBagsHeld));
    if (dispatchCount <= 0) {
      triggerToast('error', 'Vượt hạn mức giữ túi', `${shop.shopName} đã đạt giới hạn túi giữ đồng thời.`);
      return;
    }
    const selectedCodes = availBags.slice(0, dispatchCount).map((b) => b.bagCode);
    setBags((prev) =>
      prev.map((b) =>
        selectedCodes.includes(b.bagCode)
          ? { ...b, status: 'AT_SHOP', holdingShopId: shop.id, holdingShopName: shop.shopName, currentLocation: `${shop.shopName} (${shop.district})`, updatedAt: 'Vừa xong' }
          : b
      )
    );
    setShops((prev) => prev.map((s) => (s.id === shop.id ? { ...s, currentBagsHeld: s.currentBagsHeld + dispatchCount } : s)));
    setAllocations((prev) => prev.map((a) => (a.id === allocationId ? { ...a, status: 'CONFIRMED' } : a)));
    addAuditLog('Duyệt cấp phát túi', alloc.allocationCode, `Xuất ${dispatchCount} túi (${selectedCodes.join(', ')}) cho ${shop.shopName}.`);
    triggerToast('success', 'Đã duyệt & xuất kho', `Đã cấp ${dispatchCount} túi cho ${shop.shopName} theo phiếu ${alloc.allocationCode}.`);
  };

  const handleExportCsv = () => {
    const headers = ['Ma_Tui', 'Kich_Thuoc', 'Lo_SX', 'Trang_Thai', 'Vi_Tri', 'Luot_Da_Dung', 'Chat_Luong'];
    const rows = bags.map((b) => [b.bagCode, b.size, b.batchCode, BAG_STATUS_META[b.status].label, `"${b.currentLocation}"`, b.cyclesUsed, b.qualityGrade]);
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `returnpack_bags_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('success', 'Đã xuất dữ liệu', 'Tệp CSV danh sách túi đã được tải xuống.');
  };

  // ==========================================================================
  // CHARTS DATA
  // ==========================================================================
  const usageTrendData = useMemo(
    () => [
      { month: 'Th06', luot: 420, thuHoi: 380, doanhThu: 6.8 },
      { month: 'Th07', luot: 690, thuHoi: 625, doanhThu: 9.4 },
      { month: 'Th08', luot: 1050, thuHoi: 960, doanhThu: 14.2 },
      { month: 'Th09', luot: 1480, thuHoi: 1365, doanhThu: 19.5 },
      { month: 'Th10', luot: 1820, thuHoi: 1690, doanhThu: 24.8 },
      {
        month: 'Th11 (Live)',
        luot: shops.reduce((s, sh) => s + sh.usedTurns, 0),
        thuHoi: returnRequests.filter((r) => r.status === 'PICKED_UP' || r.status === 'COMPLETED_AT_WAREHOUSE').length,
        doanhThu: Number((kpiMetrics.totalSubscriptionRevenue / 1000000).toFixed(2))
      }
    ],
    [shops, returnRequests, kpiMetrics.totalSubscriptionRevenue]
  );

  const bagStatusPieData = useMemo(
    () => [
      { name: 'Sẵn sàng', value: kpiMetrics.availableBags, color: '#155C3B' },
      { name: 'Tại Shop', value: kpiMetrics.bagsAtShop, color: '#48B86C' },
      { name: 'Đang giao', value: kpiMetrics.bagsInTransit, color: '#61C6EC' },
      { name: 'Thu hồi', value: kpiMetrics.bagsWaitingReturn + kpiMetrics.bagsRecovered, color: '#FFD866' },
      { name: 'Vệ sinh / Khác', value: kpiMetrics.bagsCleaning + 2, color: '#F97316' }
    ],
    [kpiMetrics]
  );

  // ==========================================================================
  // LOGIN SCREEN FOR 3 STAKEHOLDERS
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex items-center justify-center p-4 md:p-8 font-sans">
        <div className="max-w-5xl w-full bg-white rounded-[28px] shadow-[0_24px_60px_-15px_rgba(15,61,40,0.18)] border border-[#17382B]/10 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left Brand Panel - Deep Forest & Champagne Luxury */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0D3523] via-[#155C3B] to-[#1D734B] p-8 md:p-10 text-white flex flex-col justify-between">
            <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#A9E65A]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#FFD866]/10 blur-3xl" />
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white text-[#155C3B] flex items-center justify-center font-extrabold text-xl shadow">
                  R
                </div>
                <div>
                  <div className="font-extrabold text-xl tracking-tight">RETURNPACK</div>
                  <div className="text-xs text-[#B8EF8B]">Giao hàng xanh – Bao bì tuần hoàn</div>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold mt-8 leading-snug">
                Hệ thống Quản trị Vòng đời Bao bì Tuần hoàn
              </h1>
              <p className="text-sm text-[#E5F7ED] mt-2">
                Chuẩn hóa vận hành cấp phát, đối soát định danh QR, kiểm định kho và tối ưu chi phí bao bì cho doanh nghiệp thương mại điện tử.
              </p>
            </div>

            <div className="relative z-10 my-6 flex items-center justify-center">
              <div className="p-5 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 shadow-inner">
                <EarthMascot3D pose="wave" size={116} />
              </div>
            </div>

            <div className="text-xs text-[#E5F7ED]/90 flex items-center justify-between border-t border-white/15 pt-4">
              <span>app.returnpack.id.vn</span>
              <span>© 2026 RETURNPACK</span>
            </div>
          </div>

          {/* Right Login Form with 3 Stakeholder Tabs */}
          <div className="p-8 flex flex-col justify-center space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0B1F17]">Đăng nhập hệ thống</h2>
              <p className="text-xs text-[#3D554B] mt-1">Xác thực tài khoản theo phân quyền hệ thống</p>
            </div>

            {/* 3 Stakeholder Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#F7FBF8] border border-emerald-900/10">
              <button
                type="button"
                onClick={() => handleSelectAuthTab('CUSTOMER')}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition flex flex-col items-center gap-1 ${
                  authTab === 'CUSTOMER' ? 'bg-[#155C3B] text-white shadow' : 'text-[#3D554B] hover:text-[#0B1F17]'
                }`}
              >
                <QrCode className="w-4 h-4" />
                Khách hàng
              </button>
              <button
                type="button"
                onClick={() => handleSelectAuthTab('SHOP')}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition flex flex-col items-center gap-1 ${
                  authTab === 'SHOP' ? 'bg-[#155C3B] text-white shadow' : 'text-[#3D554B] hover:text-[#0B1F17]'
                }`}
              >
                <Store className="w-4 h-4" />
                Shop Đối tác
              </button>
              <button
                type="button"
                onClick={() => handleSelectAuthTab('ADMIN')}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition flex flex-col items-center gap-1 ${
                  authTab === 'ADMIN' ? 'bg-[#155C3B] text-white shadow' : 'text-[#3D554B] hover:text-[#0B1F17]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {authTab === 'SHOP' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-end text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsShopRegisterMode(!isShopRegisterMode);
                        setLoginError(null);
                      }}
                      className="font-bold text-[#155C3B] hover:underline"
                    >
                      {isShopRegisterMode ? '← Quay lại đăng nhập' : '+ Đăng ký Shop mới'}
                    </button>
                  </div>
                  {isShopRegisterMode && (
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="Tên Shop (VD: Bloom Eco Store)"
                        value={regShopName}
                        onChange={(e) => setRegShopName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-emerald-900/20 text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Họ tên chủ shop"
                          value={regShopOwner}
                          onChange={(e) => setRegShopOwner(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-emerald-900/20 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Số điện thoại"
                          value={regShopPhone}
                          onChange={(e) => setRegShopPhone(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-emerald-900/20 text-sm"
                        />
                      </div>
                      <select
                        value={regShopDistrict}
                        onChange={(e) => setRegShopDistrict(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-900/20 text-sm bg-white"
                      >
                        <option value="Quận 1">Quận 1, TP.HCM</option>
                        <option value="Quận Bình Thạnh">Quận Bình Thạnh, TP.HCM</option>
                        <option value="Quận 3">Quận 3, TP.HCM</option>
                        <option value="Quận 7">Quận 7, TP.HCM</option>
                        <option value="TP. Thủ Đức">TP. Thủ Đức, TP.HCM</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0B1F17] mb-1">
                  {authTab === 'CUSTOMER' ? 'Số điện thoại hoặc Email' : 'Email đăng nhập'}
                </label>
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-900/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#48B86C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F17] mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-900/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#48B86C]"
                />
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#155C3B] text-white font-extrabold text-sm shadow-lg hover:bg-[#10462C] transition flex items-center justify-center gap-2"
              >
                Đăng nhập vào {authTab === 'ADMIN' ? 'Cổng Quản trị' : authTab === 'SHOP' ? 'Cổng Shop Đối tác' : 'Cổng Khách hàng'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-click access to all 3 portals */}
            <div className="pt-4 border-t border-emerald-900/10 space-y-2">
              <div className="text-[11px] font-bold text-[#3D554B] text-center">Chuyển nhanh môi trường làm việc:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleLoginSubmit(undefined, 'CUSTOMER')}
                  className="py-2 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-bold hover:bg-[#B8EF8B]/60"
                >
                  Vào Khách hàng
                </button>
                <button
                  type="button"
                  onClick={() => handleLoginSubmit(undefined, 'SHOP')}
                  className="py-2 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-bold hover:bg-[#B8EF8B]/60"
                >
                  Vào Shop B2B
                </button>
                <button
                  type="button"
                  onClick={() => handleLoginSubmit(undefined, 'ADMIN')}
                  className="py-2 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-bold hover:bg-[#B8EF8B]/60"
                >
                  Vào Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // NAVIGATION MENU PER STAKEHOLDER (CLEAN & CONCISE)
  // ==========================================================================
  const adminNav = [
    { path: '/admin/dashboard', label: 'Tổng quan', icon: BarChart3 },
    { path: '/admin/bags', label: 'Túi & Mã QR', icon: Package },
    { path: '/admin/shops', label: 'Shop & Cấp phát', icon: Store },
    { path: '/admin/subscriptions', label: 'Gói dịch vụ', icon: CreditCard },
    { path: '/admin/returns', label: 'Thu hồi & Shipper', icon: RefreshCw },
    { path: '/warehouse', label: 'Kho & Kiểm định', icon: Warehouse },
    { path: '/admin/rewards', label: 'Green Rewards', icon: Award },
    { path: '/admin/reports', label: 'Báo cáo', icon: TrendingUp },
    { path: '/admin/settings', label: 'Cài đặt', icon: Settings }
  ];

  const shopNav = [
    { path: '/shop/dashboard', label: 'Tổng quan Shop', icon: BarChart3 },
    { path: '/shop/scan', label: 'Quét QR Đóng gói', icon: ScanLine },
    { path: '/shop/bags', label: 'Túi đang giữ', icon: Package },
    { path: '/shop/orders', label: 'Đơn đã đóng gói', icon: FileSpreadsheet },
    { path: '/shop/subscription', label: 'Gói & Thanh toán', icon: CreditCard },
    { path: '/shop/requests', label: 'Yêu cầu cấp túi', icon: Truck }
  ];

  const customerNav = [
    { path: `/return/${returnPortalToken}`, label: 'Hoàn trả túi QR', icon: QrCode },
    { path: `/track/${trackingRequestCode}`, label: 'Theo dõi thu hồi', icon: MapPin },
    { path: '/rewards', label: 'Green Rewards & Quà', icon: Award }
  ];

  const activeNav = activeRole === 'ADMIN' ? adminNav : activeRole === 'SHOP' ? shopNav : customerNav;

  // ==========================================================================
  // VIEWS: ADMIN PORTAL
  // ==========================================================================
  const renderAdminDashboard = () => {
    const alerts = [
      ...returnRequests
        .filter((r) => r.isOverdue || r.status === 'RECEIVED')
        .map((r) => ({
          id: r.id,
          badge: r.isOverdue ? 'Quá hạn thu hồi' : 'Chờ điều phối',
          badgeColor: r.isOverdue ? 'bg-[#FF957B]/20 text-[#9A2E1A] border border-[#FF957B]/50' : 'bg-[#FFD866]/35 text-[#7A5400] border border-[#FFD866]',
          title: `${r.requestCode} – Túi ${r.bagCode} (${r.areaDistrict})`,
          sub: `Khách: ${r.customerName} • Khung ${r.preferredTimeSlot}`,
          action: () => setCurrentRoute('/admin/returns')
        })),
      ...bags
        .filter((b) => b.status === 'LOST')
        .map((b) => ({
          id: b.id,
          badge: 'Nghi thất lạc',
          badgeColor: 'bg-[#FF957B]/25 text-[#9A2E1A] border border-[#FF957B]/60',
          title: `Túi ${b.bagCode} chưa phản hồi quá 14 ngày`,
          sub: b.currentLocation,
          action: () => {
            setSelectedBagCode(b.bagCode);
            setCurrentRoute(`/admin/bags/${b.bagCode}`);
          }
        })),
      ...shops
        .filter((s) => s.monthlyQuotaTurns - s.usedTurns <= 50)
        .map((s) => ({
          id: s.id,
          badge: 'Sắp hết lượt',
          badgeColor: 'bg-[#FFD866]/35 text-[#7A5400] border border-[#FFD866]',
          title: `${s.shopName} còn ${s.monthlyQuotaTurns - s.usedTurns}/${s.monthlyQuotaTurns} lượt`,
          sub: `Gói hiện tại: ${s.planName}`,
          action: () => setCurrentRoute('/admin/subscriptions')
        }))
    ];

    const kpis = [
      { label: 'Tổng số túi', value: kpiMetrics.totalBags, note: 'Đang quản lý QR', icon: Package, bg: 'bg-[#E5F7ED]', color: 'text-[#155C3B]' },
      { label: 'Túi đang ở shop', value: kpiMetrics.bagsAtShop, note: 'Lưu kho đối tác', icon: Store, bg: 'bg-[#69C9F0]/20', color: 'text-[#0E648A]' },
      { label: 'Túi đang vận chuyển', value: kpiMetrics.bagsInTransit, note: 'Đang giao tới khách', icon: Truck, bg: 'bg-[#69C9F0]/15', color: 'text-[#175778]' },
      { label: 'Túi chờ thu hồi', value: kpiMetrics.bagsWaitingReturn, note: 'Đã hẹn lịch trả', icon: Clock, bg: 'bg-[#FFD866]/35', color: 'text-[#7A5400]' },
      { label: 'Túi đã thu hồi', value: kpiMetrics.bagsRecovered, note: 'Shipper / Chờ QC', icon: RefreshCw, bg: 'bg-[#E5F7ED]', color: 'text-[#2DAF73]' },
      { label: 'Túi đang vệ sinh', value: kpiMetrics.bagsCleaning, note: 'Xử lý bảo trì B', icon: Wrench, bg: 'bg-[#FF957B]/20', color: 'text-[#9A2E1A]' },
      { label: 'Tổng lượt sử dụng', value: kpiMetrics.totalUsageCycles, note: 'Chu kỳ xanh tích lũy', icon: Recycle, bg: 'bg-[#A9E65A]/30', color: 'text-[#155C3B]' },
      { label: 'Tỷ lệ thu hồi', value: `${kpiMetrics.recoveryRate}%`, note: 'Tính từ giao dịch', icon: TrendingUp, bg: 'bg-[#E5F7ED]', color: 'text-[#155C3B]' },
      { label: 'Shop hoạt động', value: kpiMetrics.activeShopsCount, note: 'Đối tác đang dùng', icon: Users, bg: 'bg-[#69C9F0]/20', color: 'text-[#0E648A]' },
      { label: 'Doanh thu gói', value: `${(kpiMetrics.totalSubscriptionRevenue / 1000).toLocaleString('vi-VN')}k đ`, note: 'Chu kỳ tháng hiện tại', icon: CreditCard, bg: 'bg-[#FFD866]/35', color: 'text-[#7A5400]' }
    ];

    const recentActivities = bagEvents.slice(0, 5);

    return (
      <div className="space-y-6">
        {/* A. Executive Hero Banner (Deep Forest Obsidian & Champagne Gold Accent) */}
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-[#0B2418] via-[#123E29] to-[#155C3B] border border-[#D4AF37]/30 p-7 md:p-8 text-white shadow-[0_20px_50px_-15px_rgba(11,36,24,0.35)]">
          <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#2DAF73]/20 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#D4AF37]/40 text-[11px] font-bold uppercase tracking-widest text-[#F3E5AB]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                RETURNPACK ENTERPRISE OPERATIONS
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Trung tâm Điều hành Vòng đời Bao bì Tuần hoàn
              </h1>
              <p className="text-sm text-[#D1E7DD] font-normal leading-relaxed">
                Giám sát định danh QR, kiểm soát tồn kho đối tác và tối ưu hiệu suất thu hồi theo thời gian thực.
              </p>
              <div className="pt-3 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setCurrentRoute('/admin/bags');
                    setShowAddBagModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#0B1F17] text-xs font-extrabold shadow-sm hover:bg-[#e0be4c] transition-all duration-200"
                >
                  <Plus className="w-4 h-4" /> Khởi tạo lô túi mới
                </button>
                <button
                  onClick={() => setCurrentRoute('/admin/returns')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4 text-[#A9E65A]" /> Điều phối thu hồi
                </button>
                <button
                  onClick={() => setCurrentRoute('/admin/reports')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-all duration-200"
                >
                  <BarChart3 className="w-4 h-4 text-[#A9E65A]" /> Báo cáo điều hành
                </button>
              </div>
            </div>
            <div className="self-center md:self-auto flex items-center gap-4 bg-white/8 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15">
              <EarthMascot3D pose="wave" size={76} />
              <div className="text-left border-l border-white/15 pl-4">
                <div className="text-[11px] uppercase tracking-wider text-[#F3E5AB] font-bold">Hiệu suất thu hồi</div>
                <div className="text-2xl font-extrabold text-white tabular-nums mt-0.5">{kpiMetrics.recoveryRate}%</div>
                <div className="text-[11px] text-[#D1E7DD]">Chuẩn tối đa {maxAllowedCycles} chu kỳ/túi</div>
              </div>
            </div>
          </div>
        </div>

        {/* B. Executive KPI Cards (High-Contrast Typography & Architectural Borders) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpis.map((k, idx) => {
            const IconComp = k.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-[#0B1F17]/12 shadow-[0_2px_12px_-4px_rgba(11,31,23,0.08)] hover:border-[#155C3B]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#334E43]">{k.label}</span>
                  <div className="p-2 rounded-xl bg-[#0B2418]/6 text-[#155C3B]">
                    <IconComp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-extrabold tracking-tight text-[#0B1F17] tabular-nums">
                  {k.value}
                </div>
                <div className="mt-1.5 pt-2 border-t border-[#0B1F17]/6 text-[11px] text-[#4A6358] font-medium">
                  {k.note}
                </div>
              </div>
            );
          })}
        </div>

        {/* C. Charts Section (Emerald, Lime, Sky Blue, Sunshine Yellow) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-[18px] p-5 border border-[#17382B]/10 shadow-xs">
            <div className="mb-3">
              <h3 className="text-base font-extrabold text-[#0B1F17]">Lượt sử dụng theo tháng</h3>
              <p className="text-xs text-[#3D554B]">Tổng hợp chu kỳ đóng gói bàn giao hợp lệ</p>
            </div>
            <div className="relative h-60">
              {usageTrendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#3D554B]">Chưa có dữ liệu biểu đồ</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#63776C' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#63776C' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="luot" name="Lượt sử dụng" stroke="#155C3B" strokeWidth={3} dot={{ r: 4, fill: '#2DAF73' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[18px] p-5 border border-[#17382B]/10 shadow-xs">
            <div className="mb-3">
              <h3 className="text-base font-extrabold text-[#0B1F17]">Thu hồi thành công</h3>
              <p className="text-xs text-[#3D554B]">Số lượng túi thu hồi qua các tháng</p>
            </div>
            <div className="relative h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#63776C' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#63776C' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="thuHoi" name="Đã thu hồi" fill="#2DAF73" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[18px] p-5 border border-[#17382B]/10 shadow-xs">
            <div className="mb-3">
              <h3 className="text-base font-extrabold text-[#0B1F17]">Phân bổ trạng thái túi</h3>
              <p className="text-xs text-[#3D554B]">Tỷ lệ theo tình trạng hiện tại trong hệ thống</p>
            </div>
            <div className="relative h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bagStatusPieData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={46} outerRadius={74} paddingAngle={3}>
                    {bagStatusPieData.map((entry, idx) => (
                      <Cell key={idx} fill={['#155C3B', '#2DAF73', '#69C9F0', '#FFD866', '#FF957B'][idx % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* D. Activity Timeline & Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Activity Timeline */}
          <div className="bg-white rounded-[18px] p-6 border border-[#17382B]/10 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-[#0B1F17] flex items-center gap-2">
                <History className="w-5 h-5 text-[#2DAF73]" />
                Hoạt động gần đây
              </h2>
              <button
                onClick={() => setCurrentRoute('/admin/bags')}
                className="text-xs font-bold text-[#155C3B] hover:underline"
              >
                Xem tất cả
              </button>
            </div>
            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#3D554B]">Chưa có hoạt động nào được ghi nhận.</div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#E5F7ED] text-[#155C3B] shrink-0 mt-0.5">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#0B1F17] truncate">{ev.title}</span>
                        <span className="text-[11px] text-[#3D554B] shrink-0">{ev.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#3D554B] mt-0.5">{ev.bagCode} • {ev.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Alerts */}
          <div className="bg-white rounded-[18px] p-6 border border-[#17382B]/10 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-[#0B1F17] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#FF957B]" />
                Cần xử lý ({alerts.length})
              </h2>
            </div>
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#3D554B]">Mọi chỉ số vận hành đều ổn định.</div>
            ) : (
              <div className="space-y-3">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    className="p-3.5 rounded-2xl bg-[#FFFDF6] border border-[#17382B]/10 flex items-center justify-between gap-3 hover:border-[#2DAF73]/40 transition-colors duration-200"
                  >
                    <div className="min-w-0">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${al.badgeColor}`}>
                        {al.badge}
                      </span>
                      <div className="text-sm font-bold text-[#0B1F17] mt-1 truncate">{al.title}</div>
                      <div className="text-xs text-[#3D554B] truncate">{al.sub}</div>
                    </div>
                    <button
                      onClick={al.action}
                      className="px-3.5 py-2 rounded-xl bg-[#155C3B] text-white text-xs font-bold hover:bg-[#10462C] shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DAF73]"
                    >
                      Xử lý
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAdminBags = () => {
    const filtered = bags.filter((b) => {
      const q = bagSearchQuery.toLowerCase();
      return (b.bagCode.toLowerCase().includes(q) || b.currentLocation.toLowerCase().includes(q)) && (bagStatusFilter === 'ALL' || b.status === bagStatusFilter);
    });
    const pageSize = 8;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(bagPage, totalPages);
    const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-[20px] p-6 border border-[#17382B]/10 shadow-[0_4px_24px_-6px_rgba(21,92,59,0.08)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="p-2 rounded-2xl bg-[#FFFDF6] border border-[#17382B]/10">
              <ReturnpackBagIllustration bagCode="RP-000001" compact />
            </div>
            <div>
              <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#E5F7ED] text-[#155C3B] text-[11px] font-bold">
                Định danh QR chuẩn PP dệt
              </span>
              <h1 className="text-2xl font-extrabold text-[#0B1F17] tracking-tight mt-1">
                Quản lý Túi & Mã QR
              </h1>
              <p className="text-sm text-[#3D554B] mt-0.5">
                {bags.length} túi đang quản lý • Giới hạn tối đa {maxAllowedCycles} lượt luân chuyển
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={() => setShowAddBagModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#155C3B] text-white text-xs font-extrabold shadow-xs hover:bg-[#10462C] transition-all">
              <Plus className="w-4 h-4" /> Thêm túi
            </button>
            <button onClick={() => setShowPrintQrModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-extrabold hover:bg-[#A9E65A]/40 transition-all">
              <Printer className="w-4 h-4" /> In tem QR hàng loạt
            </button>
            <button onClick={handleExportCsv} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#17382B]/15 text-[#0B1F17] text-xs font-bold hover:bg-[#FFFDF6] transition-all">
              <Download className="w-4 h-4" /> Xuất CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[18px] p-4 border border-[#17382B]/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#3D554B] absolute left-3.5 top-3" />
            <input
              type="text"
              value={bagSearchQuery}
              onChange={(e) => {
                setBagSearchQuery(e.target.value);
                setBagPage(1);
              }}
              placeholder="Tìm mã túi (RP-000001), vị trí..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFDF6] border border-[#17382B]/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#2DAF73]"
            />
          </div>
          <select
            value={bagStatusFilter}
            onChange={(e) => {
              setBagStatusFilter(e.target.value);
              setBagPage(1);
            }}
            className="px-4 py-2.5 rounded-xl border border-[#17382B]/15 text-xs font-bold bg-white text-[#0B1F17]"
          >
            <option value="ALL">Tất cả trạng thái ({bags.length})</option>
            {Object.entries(BAG_STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-[20px] border border-[#17382B]/10 shadow-[0_4px_24px_-6px_rgba(21,92,59,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFFDF6] border-b border-[#17382B]/10 text-xs uppercase tracking-wider text-[#3D554B]">
                  <th className="py-3.5 px-5 font-bold">Mã túi & QR</th>
                  <th className="py-3.5 px-4 font-bold">Kích thước / Lô</th>
                  <th className="py-3.5 px-4 font-bold">Vị trí hiện tại</th>
                  <th className="py-3.5 px-4 font-bold">Trạng thái</th>
                  <th className="py-3.5 px-4 font-bold">Vòng đời</th>
                  <th className="py-3.5 px-4 font-bold">Loại</th>
                  <th className="py-3.5 px-5 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17382B]/5 text-sm">
                {paged.map((b) => {
                  const meta = BAG_STATUS_META[b.status];
                  const pct = Math.min(100, Math.round((b.cyclesUsed / b.maxCycles) * 100));
                  return (
                    <tr key={b.id} className="hover:bg-[#F7FBF8] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <QrMatrixSvg value={b.bagCode} size={34} />
                          <button
                            onClick={() => {
                              setSelectedBagCode(b.bagCode);
                              setCurrentRoute(`/admin/bags/${b.bagCode}`);
                            }}
                            className="font-mono font-extrabold text-[#155C3B] hover:underline tabular-nums"
                          >
                            {b.bagCode}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-bold text-[#0B1F17]">{b.size}</div>
                        <div className="text-[#3D554B]">{b.batchCode}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#0B1F17] font-medium">{b.currentLocation}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.text}`}>
                          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 h-2 rounded-full bg-[#17382B]/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${b.cyclesUsed >= b.maxCycles ? 'bg-[#FF957B]' : 'bg-[#2DAF73]'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-extrabold tabular-nums text-[#0B1F17]">
                            {b.cyclesUsed}/{b.maxCycles}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold ${
                          b.qualityGrade === 'A' ? 'bg-[#E5F7ED] text-[#155C3B]' : b.qualityGrade === 'B' ? 'bg-[#FFD866]/40 text-[#7A5400]' : 'bg-[#FF957B]/30 text-[#9A2E1A]'
                        }`}>
                          {b.qualityGrade}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedBagCode(b.bagCode);
                            setCurrentRoute(`/admin/bags/${b.bagCode}`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-bold hover:bg-[#A9E65A]/40 transition-colors"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() =>
                            setBags((prev) =>
                              prev.map((item) =>
                                item.bagCode === b.bagCode
                                  ? { ...item, status: item.status === 'LOCKED_DEFECTIVE' ? 'AVAILABLE_AT_WAREHOUSE' : 'LOCKED_DEFECTIVE' }
                                  : item
                              )
                            )
                          }
                          className="p-2 rounded-xl border border-[#17382B]/15 text-[#3D554B] hover:text-rose-700 transition-colors"
                          title="Khóa / Mở"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-5 py-3.5 bg-[#FFFDF6] border-t border-[#17382B]/10 flex items-center justify-between text-xs text-[#3D554B]">
            <span>
              Hiển thị {paged.length} / {filtered.length} túi • Trang {safePage}/{totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={safePage <= 1}
                onClick={() => setBagPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-[#17382B]/15 bg-white font-bold disabled:opacity-40 hover:bg-[#E5F7ED]"
              >
                Trước
              </button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setBagPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-[#17382B]/15 bg-white font-bold disabled:opacity-40 hover:bg-[#E5F7ED]"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminBagDetail = () => {
    const bag = bags.find((b) => b.bagCode === selectedBagCode) || bags[0];
    const events = bagEvents.filter((ev) => ev.bagCode === bag.bagCode);
    const meta = BAG_STATUS_META[bag.status];

    return (
      <div className="space-y-5">
        <button onClick={() => setCurrentRoute('/admin/bags')} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#155C3B] hover:underline">
          <ChevronLeft className="w-4 h-4" /> Quay lại danh sách túi
        </button>

        <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex justify-center bg-[#F7FBF8] rounded-2xl p-4">
            <ReturnpackBagIllustration bagCode={bag.bagCode} sizeLabel={bag.size} />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-900/10 pb-3">
              <h1 className="text-2xl font-extrabold font-mono text-[#0B1F17]">{bag.bagCode}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.text}`}>{meta.label}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F7FBF8]">
                <div className="text-[#3D554B]">Số lượt sử dụng</div>
                <div className="text-lg font-extrabold text-[#155C3B]">{bag.cyclesUsed} / {bag.maxCycles}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F7FBF8]">
                <div className="text-[#3D554B]">Chất lượng</div>
                <div className="text-lg font-extrabold">Loại {bag.qualityGrade}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F7FBF8]">
                <div className="text-[#3D554B]">Kích thước</div>
                <div className="font-bold mt-0.5">{bag.size}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F7FBF8] col-span-2 sm:col-span-3">
                <div className="text-[#3D554B]">Vị trí hiện tại</div>
                <div className="font-bold mt-0.5">{bag.currentLocation}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs">
          <h2 className="text-base font-extrabold text-[#0B1F17] mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-[#155C3B]" /> Lịch sử vòng đời túi
          </h2>
          <div className="pl-5 border-l-2 border-[#48B86C] space-y-4">
            {events.map((ev) => (
              <div key={ev.id} className="relative bg-[#F7FBF8] p-3.5 rounded-2xl text-xs">
                <span className="absolute -left-[27px] top-4 w-3 h-3 rounded-full bg-[#155C3B] border-2 border-white" />
                <div className="flex justify-between text-[#3D554B] mb-1">
                  <span className="font-bold text-[#155C3B]">{ev.timestamp} • Vòng #{ev.cycleNumber}</span>
                  <span>{ev.actor}</span>
                </div>
                <div className="font-bold text-[#0B1F17] text-sm">{ev.title}</div>
                <div className="text-[#3D554B] mt-0.5">{ev.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAdminShops = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#0B1F17]">Quản lý Shop & Cấp phát túi</h1>
          <p className="text-xs text-[#3D554B]">{shops.length} đối tác đang hoạt động</p>
        </div>
        <button onClick={() => setShowAddShopModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#155C3B] text-white text-xs font-bold">
          <Plus className="w-4 h-4" /> Thêm Shop
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {shops.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-mono text-[#3D554B]">{s.shopCode}</div>
                  <h3 className="text-base font-extrabold text-[#0B1F17]">{s.shopName}</h3>
                  <div className="text-xs text-[#3D554B]">{s.ownerName} • {s.phone}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${s.status === 'ACTIVE' ? 'bg-[#E5F7ED] text-[#155C3B]' : 'bg-rose-100 text-rose-800'}`}>
                  {s.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F7FBF8] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#3D554B]">Gói {s.planName}:</span>
                  <span className="font-bold text-[#155C3B]">Còn {s.monthlyQuotaTurns - s.usedTurns}/{s.monthlyQuotaTurns} lượt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3D554B]">Túi đang giữ:</span>
                  <span className="font-bold">{s.currentBagsHeld}/{s.concurrentBagLimit} túi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3D554B]">Công nợ:</span>
                  <span className="font-bold text-rose-700">{s.outstandingDebtVnd.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const avail = bags.find((b) => b.status === 'AVAILABLE_AT_WAREHOUSE');
                  if (!avail) {
                    triggerToast('warning', 'Kho hết túi sẵn sàng', 'Vui lòng kiểm định túi tại kho trước.');
                    return;
                  }
                  handleAllocateToShop(avail.bagCode, s.id);
                }}
                className="flex-1 py-2 rounded-xl bg-[#155C3B] text-white text-xs font-bold hover:bg-[#10462C]"
              >
                + Cấp 1 túi từ Kho
              </button>
              <button
                onClick={() =>
                  setShops((prev) => prev.map((item) => (item.id === s.id ? { ...item, status: item.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' } : item)))
                }
                className="p-2 rounded-xl border border-gray-200 text-[#3D554B]"
              >
                {s.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Allocations Approval Section */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
        <h2 className="text-base font-extrabold text-[#0B1F17]">Phiếu yêu cầu cấp túi từ Shop</h2>
        <div className="divide-y divide-emerald-900/5 text-xs">
          {allocations.map((al) => (
            <div key={al.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-[#155C3B]">{al.allocationCode}</span>
                <span className="ml-2 font-bold text-[#0B1F17]">{al.shopName}</span>
                <span className="ml-2 text-[#3D554B]">• {al.quantity} túi {al.size} ({al.createdAt})</span>
              </div>
              {al.status === 'PENDING' ? (
                <button
                  onClick={() => handleApproveAllocation(al.id)}
                  className="px-3 py-1.5 rounded-xl bg-[#155C3B] text-white font-bold hover:bg-[#10462C]"
                >
                  Duyệt & Xuất kho
                </button>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-[#E5F7ED] text-[#155C3B] font-bold">{al.status}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdminReturns = () => {
    const filtered = returnRequests.filter(
      (r) => (returnDistrictFilter === 'ALL' || r.areaDistrict === returnDistrictFilter) && (returnStatusFilter === 'ALL' || r.status === returnStatusFilter)
    );
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-[#0B1F17]">Điều phối Thu hồi & Shipper</h1>
            <p className="text-xs text-[#3D554B]">Quản lý yêu cầu hoàn trả và xác nhận thu hồi thực tế</p>
          </div>
          <div className="flex gap-2">
            <select value={returnDistrictFilter} onChange={(e) => setReturnDistrictFilter(e.target.value)} className="px-3 py-2 rounded-xl border text-xs font-semibold bg-white">
              <option value="ALL">Tất cả khu vực</option>
              <option value="Quận Bình Thạnh">Quận Bình Thạnh</option>
              <option value="Quận 10">Quận 10</option>
              <option value="Quận 3">Quận 3</option>
            </select>
            <select value={returnStatusFilter} onChange={(e) => setReturnStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border text-xs font-semibold bg-white">
              <option value="ALL">Tất cả trạng thái</option>
              {Object.entries(RETURN_STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7FBF8] border-b border-emerald-900/10 text-xs text-[#3D554B]">
                <th className="py-3 px-4 font-bold">Mã YC / Túi</th>
                <th className="py-3 px-4 font-bold">Khách hàng & Địa chỉ</th>
                <th className="py-3 px-4 font-bold">Khung giờ</th>
                <th className="py-3 px-4 font-bold">Trạng thái</th>
                <th className="py-3 px-4 font-bold">Shipper</th>
                <th className="py-3 px-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/5 text-xs">
              {filtered.map((r) => {
                const meta = RETURN_STATUS_META[r.status];
                return (
                  <tr key={r.id} className="hover:bg-[#F7FBF8]">
                    <td className="py-3 px-4 font-mono font-bold">
                      <div>{r.requestCode}</div>
                      <div className="text-[#155C3B]">{r.bagCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold">{r.customerName} • {r.customerPhone}</div>
                      <div className="text-[#3D554B]">{r.pickupAddress}</div>
                    </td>
                    <td className="py-3 px-4">{r.preferredTimeSlot}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border ${meta.badge}`}>{meta.label}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{r.assignedShipperName || 'Chưa gán'}</td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {r.status !== 'ASSIGNED_SHIPPER' && r.status !== 'PICKED_UP' && r.status !== 'COMPLETED_AT_WAREHOUSE' && (
                        <button onClick={() => handleAssignShipper(r.requestCode)} className="px-3 py-1.5 rounded-xl bg-[#155C3B] text-white font-bold">
                          Gán Shipper
                        </button>
                      )}
                      {r.status === 'ASSIGNED_SHIPPER' && (
                        <button onClick={() => setShowQrScannerModal({ open: true, target: 'SHIPPER', reqCode: r.requestCode })} className="px-3 py-1.5 rounded-xl bg-[#48B86C] text-white font-bold inline-flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" /> Quét QR xác nhận thu hồi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderWarehouse = () => {
    const waitingInspect = bags.filter((b) => b.status === 'PENDING_INSPECTION' || b.status === 'PICKED_UP_BY_SHIPPER');
    const gradeA = bags.filter((b) => b.status === 'AVAILABLE_AT_WAREHOUSE');

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs">
          <h1 className="text-xl font-extrabold text-[#0B1F17]">Quản lý Kho & Kiểm định A/B/C</h1>
          <p className="text-xs text-[#3D554B]">Nhập kho, phân loại chất lượng, vệ sinh và tái phân phối</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Station 1 */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-[#0B1F17]">1. Nhập kho & Phân loại A/B/C</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={warehouseScanInput}
                onChange={(e) => setWarehouseScanInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border text-xs font-mono font-bold"
              />
              <button onClick={() => setShowQrScannerModal({ open: true, target: 'WAREHOUSE' })} className="px-3 py-2 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-bold inline-flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Quét QR
              </button>
            </div>
            {waitingInspect.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {waitingInspect.map((b) => (
                  <button key={b.id} onClick={() => setWarehouseScanInput(b.bagCode)} className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 text-xs font-mono font-bold">
                    {b.bagCode}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => handleWarehouseReceive(warehouseScanInput)} className="w-full py-2 rounded-xl bg-sky-700 text-white text-xs font-bold">
              Xác nhận nhập kho
            </button>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              {(['A', 'B', 'C'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedInspectGrade(g)}
                  className={`py-2 rounded-xl text-xs font-extrabold border ${selectedInspectGrade === g ? 'bg-[#155C3B] text-white' : 'bg-[#F7FBF8]'}`}
                >
                  Loại {g}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={inspectNoteInput}
              onChange={(e) => setInspectNoteInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-xs"
              placeholder="Ghi chú kiểm định..."
            />
            <button
              onClick={() => handleWarehouseInspect(warehouseScanInput, selectedInspectGrade, inspectNoteInput)}
              className="w-full py-2.5 rounded-xl bg-[#155C3B] text-white text-xs font-bold"
            >
              Lưu phân loại ({selectedInspectGrade})
            </button>
          </div>

          {/* Station 2 */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-[#0B1F17]">2. Vệ sinh & Kiểm tra lại (Loại B)</h3>
            <div className="space-y-2.5">
              {maintenanceJobs.map((j) => (
                <div key={j.id} className="p-3 rounded-xl bg-[#F7FBF8] text-xs space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="font-mono text-[#155C3B]">{j.bagCode}</span>
                    <span>{j.status === 'COMPLETED' ? 'Đã đạt A' : 'Đang vệ sinh'}</span>
                  </div>
                  <div className="text-[#3D554B]">{j.jobType} • {j.assignedStaff}</div>
                  {j.status !== 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setMaintenanceJobs((prev) => prev.map((m) => (m.id === j.id ? { ...m, status: 'COMPLETED' } : m)));
                        setBags((prev) => prev.map((b) => (b.bagCode === j.bagCode ? { ...b, status: 'AVAILABLE_AT_WAREHOUSE', qualityGrade: 'A', currentLocation: 'Kho Thủ Đức - Kệ A1' } : b)));
                        triggerToast('success', 'Đã kiểm tra lại đạt A', `Túi ${j.bagCode} đã sẵn sàng tái phân phối.`);
                      }}
                      className="w-full py-2 rounded-xl bg-cyan-700 text-white font-bold"
                    >
                      Hoàn tất & Đạt Loại A
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Station 3 */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-[#0B1F17]">3. Tái phân phối & Tái chế</h3>
            <div className="space-y-2">
              {gradeA.map((b) => (
                <div key={b.id} className="p-2.5 rounded-xl bg-[#E5F7ED]/60 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#155C3B]">{b.bagCode} ({b.cyclesUsed}/{b.maxCycles})</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleAllocateToShop(b.bagCode, 'SHOP-A')} className="px-2 py-1 rounded bg-[#155C3B] text-white font-bold">
                      Shop A
                    </button>
                    <button onClick={() => handleAllocateToShop(b.bagCode, 'SHOP-B')} className="px-2 py-1 rounded bg-sky-700 text-white font-bold">
                      Shop B
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t space-y-2">
              <div className="text-xs font-bold text-[#3D554B]">Túi Loại C bàn giao tái chế:</div>
              {recyclingHandoffs.map((rc) => (
                <div key={rc.id} className="p-2.5 rounded-xl bg-orange-50 text-xs flex items-center justify-between">
                  <span className="font-mono font-bold">{rc.bagCode}</span>
                  {rc.status === 'WAITING_HANDOVER' ? (
                    <button
                      onClick={() => {
                        setRecyclingHandoffs((prev) => prev.map((r) => (r.id === rc.id ? { ...r, status: 'HANDED_OVER' } : r)));
                        setBags((prev) => prev.map((b) => (b.bagCode === rc.bagCode ? { ...b, status: 'HANDED_OVER_RECYCLE' } : b)));
                      }}
                      className="px-2.5 py-1 rounded bg-orange-600 text-white font-bold"
                    >
                      Bàn giao đối tác
                    </button>
                  ) : (
                    <span className="font-bold text-orange-900">Đã bàn giao</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // VIEWS: SHOP B2B PORTAL (5 DEDICATED ROUTES)
  // ==========================================================================
  const renderShopViews = () => {
    const shopBags = bags.filter((b) => b.holdingShopId === currentShop.id && b.status === 'AT_SHOP');
    const remainingTurns = currentShop.monthlyQuotaTurns - currentShop.usedTurns;

    // 1. /shop/dashboard
    if (currentRoute === '/shop/dashboard') {
      return (
        <div className="space-y-6">
          <div className="rounded-[22px] bg-gradient-to-r from-[#0B2418] via-[#123E29] to-[#155C3B] border border-[#D4AF37]/30 p-7 text-white shadow-[0_18px_40px_-15px_rgba(11,36,24,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex px-2.5 py-0.5 rounded-full bg-white/10 border border-[#D4AF37]/40 text-[11px] font-mono font-bold text-[#F3E5AB]">
                ĐỐI TÁC DOANH NGHIỆP • {currentShop.shopCode}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1.5">
                {currentShop.shopName}
              </h1>
              <p className="text-sm text-[#D1E7DD] mt-0.5">{currentShop.address}, {currentShop.district}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button onClick={() => setCurrentRoute('/shop/scan')} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D4AF37] text-[#0B1F17] text-xs font-extrabold shadow-sm hover:bg-[#e0be4c] transition-all">
                <ScanLine className="w-4 h-4" /> Quét QR đóng gói đơn
              </button>
              <button onClick={() => setCurrentRoute('/shop/subscription')} className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-all">
                Quản lý gói thuê bao
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-xs text-[#3D554B] font-bold">Gói hiện tại</div>
              <div className="text-base font-extrabold text-[#155C3B] mt-1">{currentShop.planName}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-xs text-[#3D554B] font-bold">Lượt còn lại</div>
              <div className="text-2xl font-extrabold text-[#0B1F17] mt-1">{remainingTurns}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-xs text-[#3D554B] font-bold">Túi đang giữ</div>
              <div className="text-2xl font-extrabold text-sky-700 mt-1">{shopBags.length}/{currentShop.concurrentBagLimit}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-xs text-[#3D554B] font-bold">Đơn đã đóng</div>
              <div className="text-2xl font-extrabold mt-1">{currentShop.packedOrdersCount}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-xs text-[#3D554B] font-bold">Cần bổ sung</div>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">{Math.max(0, 10 - shopBags.length)}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-xs text-[#3D554B] font-bold">Hạn gói</div>
              <div className="text-base font-extrabold mt-1">{currentShop.subscriptionEnd}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs">
            <h2 className="text-base font-extrabold text-[#0B1F17] mb-3">Đơn hàng đóng gói gần đây</h2>
            <div className="divide-y divide-emerald-900/5 text-xs">
              {shopOrders.filter((o) => o.shopId === currentShop.id).length === 0 ? (
                <div className="py-4 text-center text-[#3D554B]">Chưa có đơn hàng nào được đóng gói.</div>
              ) : (
                shopOrders.filter((o) => o.shopId === currentShop.id).map((o) => (
                <div key={o.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-extrabold text-[#0B1F17]">{o.orderCode}</span>
                    <span className="text-[#3D554B] ml-3">Túi: {o.bagCode}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#3D554B]">{o.packedAt}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold">{o.status}</span>
                  </div>
                </div>
              )))}
            </div>
          </div>
        </div>
      );
    }

    // 2. /shop/scan
    if (currentRoute === '/shop/scan') {
      return (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-[#0B1F17] flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-[#155C3B]" /> Quét QR Đóng gói & Bàn giao
            </h1>
            <button
              onClick={() => setShowQrScannerModal({ open: true, target: 'SHOP' })}
              className="px-3.5 py-2 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-extrabold inline-flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" /> Mở Camera QR
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold mb-1">Mã túi</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scanBagCodeInput}
                  onChange={(e) => setScanBagCodeInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold"
                />
                <button onClick={() => handleShopVerifyQrOnly()} className="px-4 py-2.5 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-bold">
                  Kiểm tra túi
                </button>
              </div>
              {shopBags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {shopBags.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setScanBagCodeInput(b.bagCode);
                        handleShopVerifyQrOnly(b.bagCode);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#F7FBF8] border text-xs font-mono font-bold text-[#155C3B]"
                    >
                      {b.bagCode}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {scanVerifiedBag && (
              <div className="p-3 rounded-xl bg-[#E5F7ED] border border-[#48B86C] text-xs font-bold text-[#155C3B]">
                ✓ Túi {scanVerifiedBag.bagCode} ({scanVerifiedBag.size}) sẵn sàng đóng gói.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1">Mã đơn hàng TMĐT</label>
              <input
                type="text"
                value={packingOrderCodeInput}
                onChange={(e) => setPackingOrderCodeInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold"
              />
            </div>

            <button
              onClick={handleShopConfirmPacking}
              className="w-full py-3.5 rounded-2xl bg-[#155C3B] text-white font-extrabold text-sm hover:bg-[#10462C]"
            >
              Xác nhận bàn giao vận chuyển (-1 lượt)
            </button>
          </div>
        </div>
      );
    }

    // 3. /shop/bags
    if (currentRoute === '/shop/bags') {
      return (
        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-[#0B1F17]">Túi đang giữ tại {currentShop.shopName} ({shopBags.length})</h1>
            <button onClick={() => setCurrentRoute('/shop/requests')} className="px-3.5 py-2 rounded-xl bg-[#155C3B] text-white text-xs font-bold">
              + Yêu cầu cấp thêm
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopBags.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl bg-[#F7FBF8] border border-emerald-900/10 flex items-center justify-between">
                <div>
                  <div className="font-mono font-extrabold text-[#155C3B]">{b.bagCode}</div>
                  <div className="text-xs text-[#3D554B]">{b.size} • {b.cyclesUsed}/{b.maxCycles} vòng</div>
                </div>
                <button
                  onClick={() => {
                    setScanBagCodeInput(b.bagCode);
                    setScanVerifiedBag(b);
                    setCurrentRoute('/shop/scan');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#155C3B] text-white text-xs font-bold"
                >
                  Đóng gói
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4. /shop/orders
    if (currentRoute === '/shop/orders') {
      return (
        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <h1 className="text-xl font-extrabold text-[#0B1F17]">Lịch sử đơn hàng đã đóng gói</h1>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7FBF8] border-b text-[#3D554B]">
                <th className="py-3 px-4">Mã đơn hàng</th>
                <th className="py-3 px-4">Mã túi sử dụng</th>
                <th className="py-3 px-4">Thời gian bàn giao</th>
                <th className="py-3 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shopOrders.filter((o) => o.shopId === currentShop.id).map((o) => (
                <tr key={o.id}>
                  <td className="py-3 px-4 font-mono font-bold">{o.orderCode}</td>
                  <td className="py-3 px-4 font-mono text-[#155C3B] font-bold">{o.bagCode}</td>
                  <td className="py-3 px-4 text-[#3D554B]">{o.packedAt}</td>
                  <td className="py-3 px-4 font-bold">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // 5. /shop/requests
    if (currentRoute === '/shop/requests') {
      return (
        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-[#0B1F17]">Yêu cầu cấp bổ sung túi</h1>
            <button
              onClick={() => {
                const req: AllocationRecord = {
                  id: `AL-${Date.now()}`,
                  allocationCode: `AL-2026-0${91 + allocations.length}`,
                  shopId: currentShop.id,
                  shopName: currentShop.shopName,
                  size: 'M (32x43cm)',
                  quantity: 20,
                  status: 'PENDING',
                  createdAt: 'Vừa xong'
                };
                setAllocations((prev) => [req, ...prev]);
                triggerToast('success', 'Đã gửi yêu cầu', `Phiếu ${req.allocationCode} (+20 túi Size M) đã chuyển tới Kho.`);
              }}
              className="px-4 py-2 rounded-xl bg-[#155C3B] text-white text-xs font-bold"
            >
              + Gửi yêu cầu 20 túi Size M
            </button>
          </div>
          <div className="space-y-2.5">
            {allocations.filter((a) => a.shopId === currentShop.id).map((al) => (
              <div key={al.id} className="p-3.5 rounded-xl bg-[#F7FBF8] flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-[#155C3B]">{al.allocationCode}</span>
                  <span className="ml-3 font-semibold">{al.quantity} túi {al.size}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E5F7ED] text-[#155C3B] font-bold">{al.status}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 6. /shop/subscription (shared pricing view with VietQR)
    return renderSubscriptions();
  };

  // ==========================================================================
  // SHARED SUBSCRIPTIONS & VIETQR PAYMENT VIEW
  // ==========================================================================
  const renderSubscriptions = () => {
    const plans = [
      { id: 'PLAN_BASIC' as const, name: 'Gói Cơ bản', turns: 500, price: 235000, popular: false },
      { id: 'PLAN_STANDARD' as const, name: 'Gói Tiêu chuẩn', turns: 1000, price: 460000, popular: true },
      { id: 'PLAN_ENTERPRISE' as const, name: 'Gói Mở rộng', turns: 2000, price: 900000, popular: false }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#0B1F17]">Gói dịch vụ Bao bì Tuần hoàn</h1>
            <p className="text-xs text-[#3D554B]">Đang áp dụng cho: <strong>{currentShop.shopName}</strong></p>
          </div>
          <div className="text-right text-xs">
            <div className="text-[#3D554B]">Lượt còn lại</div>
            <div className="text-lg font-extrabold text-[#155C3B]">{currentShop.monthlyQuotaTurns - currentShop.usedTurns}/{currentShop.monthlyQuotaTurns}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isCurrent = currentShop.planId === p.id;
            return (
              <div key={p.id} className={`relative rounded-3xl p-6 flex flex-col justify-between ${p.popular ? 'bg-[#155C3B] text-white shadow-xl ring-4 ring-[#B8EF8B]' : 'bg-white border border-emerald-900/10 shadow-xs'}`}>
                {p.popular && <span className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-[#FFD866] text-[#0B1F17] text-xs font-extrabold">Phổ biến</span>}
                <div className="space-y-3">
                  <h3 className="text-lg font-extrabold">{p.name}</h3>
                  <div className="text-3xl font-extrabold">{p.price.toLocaleString('vi-VN')}đ<span className="text-xs font-normal opacity-80">/tháng</span></div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${p.popular ? 'bg-white/15 text-[#B8EF8B]' : 'bg-[#E5F7ED] text-[#155C3B]'}`}>
                    {p.turns.toLocaleString('vi-VN')} lượt sử dụng/tháng
                  </div>
                </div>
                <button
                  onClick={() => setShowVietQrModal({ open: true, planName: p.name, price: p.price, turns: p.turns, planId: p.id })}
                  className={`mt-6 w-full py-2.5 rounded-xl font-extrabold text-xs ${p.popular ? 'bg-[#B8EF8B] text-[#0B1F17]' : 'bg-[#155C3B] text-white'}`}
                >
                  {isCurrent ? 'Gia hạn qua VietQR' : `Đăng ký ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ==========================================================================
  // VIEWS: CUSTOMER B2C PORTAL (RETURN QR, TRACKING, REWARDS & VOUCHERS)
  // ==========================================================================
  const renderCustomerReturnPortal = () => (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="rounded-[24px] bg-gradient-to-br from-[#0B2418] via-[#123E29] to-[#155C3B] border border-[#D4AF37]/30 p-7 text-white text-center shadow-[0_18px_40px_-15px_rgba(11,36,24,0.3)]">
        <div className="flex justify-center mb-3">
          <EarthMascot3D pose={submittedReturnCode ? 'thumb' : 'wave'} size={84} />
        </div>
        <div className="inline-flex px-3 py-0.5 rounded-full bg-white/10 border border-[#D4AF37]/40 text-[11px] font-bold uppercase tracking-widest text-[#F3E5AB] mb-2">
          CỔNG TIẾP NHẬN HOÀN TRẢ BAO BÌ
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Đăng ký Thu hồi Bao bì Tuần hoàn</h1>
        <p className="text-xs text-[#D1E7DD] mt-1">Xác thực mã định danh QR, đặt lịch thu hồi tận nơi và tích lũy điểm thưởng thành viên.</p>
        <div className="mt-5 grid grid-cols-3 gap-2.5 text-[11px] font-semibold text-white">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">1. Xác thực mã QR</div>
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">2. Đặt lịch thu hồi</div>
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">3. Tích điểm thưởng</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#0B1F17]">Đăng ký hoàn trả túi</h2>
          <select value={returnPortalToken} onChange={(e) => setReturnPortalToken(e.target.value)} className="px-2.5 py-1 rounded-lg border text-xs font-mono font-bold bg-[#F7FBF8]">
            {bags.map((b) => (
              <option key={b.id} value={b.bagCode}>
                {b.bagCode}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Mã túi</label>
            <input type="text" readOnly value={returnPortalToken} className="w-full px-3 py-2 rounded-xl bg-[#F7FBF8] border font-mono font-extrabold text-[#155C3B]" />
          </div>
          <div>
            <label className="block font-bold mb-1">Họ và tên</label>
            <input type="text" value={custReturnName} onChange={(e) => setCustReturnName(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
          </div>
          <div>
            <label className="block font-bold mb-1">Số điện thoại</label>
            <input type="text" value={custReturnPhone} onChange={(e) => setCustReturnPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
          </div>
          <div>
            <label className="block font-bold mb-1">Khu vực</label>
            <select value={custReturnDistrict} onChange={(e) => setCustReturnDistrict(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-white">
              <option value="Quận 10">Quận 10</option>
              <option value="Quận Bình Thạnh">Quận Bình Thạnh</option>
              <option value="Quận 1">Quận 1</option>
              <option value="Quận 3">Quận 3</option>
              <option value="TP. Thủ Đức">TP. Thủ Đức</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block font-bold mb-1">Địa chỉ thu hồi</label>
            <input type="text" value={custReturnAddress} onChange={(e) => setCustReturnAddress(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
          </div>
          <div>
            <label className="block font-bold mb-1">Khung giờ thuận tiện</label>
            <select value={custReturnTimeSlot} onChange={(e) => setCustReturnTimeSlot(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-white">
              <option value="09:00 - 12:00">09:00 - 12:00</option>
              <option value="14:00 - 17:00">14:00 - 17:00</option>
              <option value="18:00 - 20:30">18:00 - 20:30</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">Ghi chú</label>
            <input type="text" value={custReturnNote} onChange={(e) => setCustReturnNote(e.target.value)} className="w-full px-3 py-2 rounded-xl border" placeholder="Tùy chọn" />
          </div>
        </div>
        <button onClick={handleCustomerSubmitReturn} className="w-full py-3.5 rounded-2xl bg-[#155C3B] text-white font-extrabold text-sm hover:bg-[#10462C]">
          ĐĂNG KÝ HOÀN TRẢ TÚI
        </button>

        {submittedReturnCode && (
          <div className="p-4 rounded-2xl bg-[#E5F7ED] border border-[#48B86C] text-center space-y-2 text-xs">
            <div className="font-extrabold text-[#155C3B]">Đã tiếp nhận yêu cầu {submittedReturnCode}</div>
            <div>Trạng thái: <strong>Đang chờ điều phối</strong></div>
            <button onClick={() => setCurrentRoute(`/track/${submittedReturnCode}`)} className="px-4 py-1.5 rounded-xl bg-[#155C3B] text-white font-bold">
              Theo dõi tiến độ →
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCustomerTrack = () => {
    const req = returnRequests.find((r) => r.requestCode === trackingRequestCode) || returnRequests[0];
    const stepIdx = req ? RETURN_STATUS_META[req.status].stepIndex : 1;
    const steps = ['Đã tiếp nhận yêu cầu', 'Đang tìm chuyến phù hợp', 'Đã phân công Shipper', 'Đã thu hồi', 'Hoàn tất'];

    return (
      <div className="max-w-lg mx-auto bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold text-[#0B1F17]">Theo dõi thu hồi</h1>
          <select value={trackingRequestCode} onChange={(e) => setTrackingRequestCode(e.target.value)} className="px-3 py-1.5 rounded-xl border text-xs font-mono font-bold bg-[#F7FBF8]">
            {returnRequests.map((r) => (
              <option key={r.id} value={r.requestCode}>
                {r.requestCode} ({r.bagCode})
              </option>
            ))}
          </select>
        </div>

        {req && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#F7FBF8] text-xs space-y-1">
              <div className="flex justify-between"><span>Mã túi:</span><strong className="font-mono">{req.bagCode}</strong></div>
              <div className="flex justify-between"><span>Khung giờ:</span><strong>{req.scheduledWindow}</strong></div>
              <div className="flex justify-between"><span>Shipper:</span><strong>{req.assignedShipperName || 'Đang điều phối'}</strong></div>
            </div>
            <div className="space-y-2.5">
              {steps.map((label, i) => {
                const done = stepIdx >= i + 1;
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold ${done ? 'bg-[#E5F7ED] border-[#48B86C] text-[#155C3B]' : 'bg-gray-50 text-gray-400'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? 'bg-[#155C3B] text-white' : 'bg-gray-200'}`}>
                      {done ? '✓' : i + 1}
                    </span>
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRewards = () => {
    const offers = [
      { id: 'OF-1', title: 'Giảm 15.000đ tại GreenStyle Fashion', points: 100, sponsor: 'GreenStyle Fashion' },
      { id: 'OF-2', title: 'Giảm 25.000đ tại EcoCosmetics VN', points: 200, sponsor: 'EcoCosmetics VN' },
      { id: 'OF-3', title: 'Bộ hạt giống cây trồng bàn làm việc', points: 300, sponsor: 'RETURNPACK' }
    ];

    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0F3D28] via-[#155C3B] to-[#1F7A4F] p-6 md:p-8 text-white shadow-[0_18px_40px_-12px_rgba(15,61,40,0.35)] border border-[#FFD866]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-md w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#FFD866]/40 text-[#FFD866] text-xs font-extrabold tracking-wide">
              <Award className="w-3.5 h-3.5" /> GREEN REWARDS • THẺ THÀNH VIÊN XANH
            </div>
            <div className="text-4xl font-extrabold tracking-tight tabular-nums">
              {customerRewardPoints} <span className="text-base font-semibold text-[#A9E65A]">điểm khả dụng</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#E5F7ED]">
                <span>Tiến độ hạng Eco Platinum (500 điểm)</span>
                <span className="font-bold text-[#FFD866]">{Math.min(100, Math.round((customerTotalEarned / 500) * 100))}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#A9E65A] to-[#FFD866]" style={{ width: `${Math.min(100, Math.round((customerTotalEarned / 500) * 100))}%` }} />
              </div>
            </div>
            <div className="text-xs text-[#E5F7ED]/90">
              Tổng tích lũy: <strong>{customerTotalEarned} điểm</strong> • <strong>{customerSuccessfulReturns} lượt</strong> hoàn trả thành công
            </div>
          </div>
          <div className="p-3 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15">
            <EarthMascot3D pose="thumb" size={92} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Offers */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
            <h2 className="text-base font-extrabold text-[#0B1F17]">Ưu đãi có thể đổi</h2>
            {offers.map((of) => (
              <div key={of.id} className="p-3.5 rounded-xl bg-[#F7FBF8] flex items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-[#0B1F17]">{of.title}</div>
                  <div className="text-amber-700 font-bold">{of.points} điểm</div>
                </div>
                <button
                  onClick={() => {
                    if (customerRewardPoints < of.points) {
                      triggerToast('error', 'Chưa đủ điểm', `Bạn cần ${of.points} điểm.`);
                      return;
                    }
                    const vCode = `RP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                    setCustomerRewardPoints((p) => p - of.points);
                    setCustomerVouchers((prev) => [
                      { id: `VC-${Date.now()}`, code: vCode, title: of.title, sponsor: of.sponsor, redeemedAt: 'Hôm nay', status: 'Sẵn sàng dùng' },
                      ...prev
                    ]);
                    setRewardTransactions((prev) => [
                      { id: `RTX-${Date.now()}`, txCode: `GR-${Date.now().toString().slice(-3)}`, customerName: loggedInUserName, bagCode: 'VOUCHER', usageCycleKey: vCode, txType: 'REDEEM_OFFER', pointsDelta: -of.points, description: of.title, createdAt: 'Vừa xong' },
                      ...prev
                    ]);
                    triggerToast('success', 'Đổi quà thành công', `Mã ưu đãi ${vCode} đã được lưu vào Ví Voucher.`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#155C3B] text-white font-bold shrink-0"
                >
                  Đổi quà
                </button>
              </div>
            ))}
          </div>

          {/* My Vouchers */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
            <h2 className="text-base font-extrabold text-[#0B1F17] flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#155C3B]" /> Ví Voucher của tôi ({customerVouchers.length})
            </h2>
            {customerVouchers.map((v) => (
              <div key={v.id} className="p-3.5 rounded-xl bg-[#E5F7ED]/60 border border-[#B8EF8B] text-xs space-y-1.5">
                <div className="font-bold text-[#0B1F17]">{v.title}</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-[#155C3B] bg-white px-2 py-0.5 rounded border">{v.code}</span>
                  <button
                    onClick={async () => {
                      const ok = await copyTextWithFallback(v.code);
                      if (ok) {
                        triggerToast('info', 'Đã sao chép mã', v.code);
                      } else {
                        triggerToast('warning', 'Không thể sao chép tự động', `Vui lòng sao chép thủ công: ${v.code}`);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[#155C3B] font-bold hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" /> Sao chép
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
            <h2 className="text-base font-extrabold text-[#0B1F17]">Lịch sử điểm</h2>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {rewardTransactions.map((tx) => (
                <div key={tx.id} className="p-3 rounded-xl bg-[#F7FBF8] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#0B1F17]">{tx.description}</div>
                    <div className="text-[#3D554B]">{tx.createdAt}</div>
                  </div>
                  <span className={`font-extrabold ${tx.pointsDelta > 0 ? 'text-[#155C3B]' : 'text-rose-700'}`}>
                    {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // REPORTS & SETTINGS VIEWS
  // ==========================================================================
  const renderAdminReports = () => (
    <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-[#0B1F17]">Báo cáo Vận hành & Tác động Môi trường</h1>
        <button onClick={handleExportCsv} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#155C3B] text-white text-xs font-bold">
          <Download className="w-4 h-4" /> Xuất CSV
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-[#F7FBF8]">
          <div className="text-[#3D554B]">Tổng lượt luân chuyển</div>
          <div className="text-2xl font-extrabold text-[#155C3B] mt-1">{kpiMetrics.totalUsageCycles}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#F7FBF8]">
          <div className="text-[#3D554B]">Nhựa dùng 1 lần đã thay thế</div>
          <div className="text-2xl font-extrabold text-[#155C3B] mt-1">{((kpiMetrics.totalUsageCycles * 28) / 1000).toFixed(2)} kg</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#F7FBF8]">
          <div className="text-[#3D554B]">Tỷ lệ thu hồi thực tế</div>
          <div className="text-2xl font-extrabold text-[#0B1F17] mt-1">{kpiMetrics.recoveryRate}%</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#F7FBF8]">
          <div className="text-[#3D554B]">Doanh thu gói tháng</div>
          <div className="text-2xl font-extrabold text-[#0B1F17] mt-1">{kpiMetrics.totalSubscriptionRevenue.toLocaleString('vi-VN')}đ</div>
        </div>
      </div>
    </div>
  );

  const renderAdminSettings = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-[#0B1F17]">Cấu hình vận hành</h2>
          <div>
            <label className="block text-xs font-bold mb-1">Giới hạn vòng đời tối đa mỗi túi</label>
            <input type="number" value={maxAllowedCycles} onChange={(e) => setMaxAllowedCycles(Number(e.target.value) || 15)} className="w-32 px-3 py-2 rounded-xl border text-sm font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Điểm thưởng mỗi lần hoàn trả</label>
            <input type="number" value={pointsPerReturn} onChange={(e) => setPointsPerReturn(Number(e.target.value) || 100)} className="w-32 px-3 py-2 rounded-xl border text-sm font-bold" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-[#0B1F17]">Quản lý dữ liệu hệ thống</h2>
          <p className="text-xs text-[#3D554B]">Dữ liệu thao tác được lưu tự động trên trình duyệt. Bạn có thể khôi phục về trạng thái ban đầu bất kỳ lúc nào.</p>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setBags(DEFAULT_BAGS);
              setShops(DEFAULT_SHOPS);
              setReturnRequests(DEFAULT_RETURN_REQUESTS);
              setBagEvents(DEFAULT_BAG_EVENTS);
              triggerToast('info', 'Đã khôi phục dữ liệu mặc định', 'Hệ thống đã quay về trạng thái ban đầu.');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold hover:bg-rose-100"
          >
            <RotateCcw className="w-4 h-4" /> Khôi phục dữ liệu mặc định
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs">
        <h2 className="text-base font-extrabold text-[#0B1F17] mb-3">Nhật ký hệ thống (Audit Logs)</h2>
        <div className="space-y-2 text-xs">
          {auditLogs.map((l) => (
            <div key={l.id} className="p-3 rounded-xl bg-[#F7FBF8] flex justify-between">
              <div><strong>{l.action}</strong> • {l.entity} — <span className="text-[#3D554B]">{l.detail}</span></div>
              <span className="text-[#3D554B]">{l.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ==========================================================================
  // ROUTE RENDERER
  // ==========================================================================
  const renderContent = () => {
    if (activeRole === 'SHOP') return renderShopViews();
    if (activeRole === 'CUSTOMER') {
      if (currentRoute.startsWith('/track/')) return renderCustomerTrack();
      if (currentRoute === '/rewards') return renderRewards();
      return renderCustomerReturnPortal();
    }
    if (currentRoute === '/admin/bags') return renderAdminBags();
    if (currentRoute.startsWith('/admin/bags/')) return renderAdminBagDetail();
    if (currentRoute === '/admin/shops') return renderAdminShops();
    if (currentRoute === '/admin/subscriptions') return renderSubscriptions();
    if (currentRoute === '/admin/returns') return renderAdminReturns();
    if (currentRoute === '/warehouse') return renderWarehouse();
    if (currentRoute === '/admin/rewards') return renderRewards();
    if (currentRoute === '/admin/reports') return renderAdminReports();
    if (currentRoute === '/admin/settings') return renderAdminSettings();
    return renderAdminDashboard();
  };

  const currentPageTitle =
    activeNav.find((n) => n.path === currentRoute)?.label ||
    (currentRoute.startsWith('/admin/bags/') ? `Chi tiết túi ${selectedBagCode}` : 'RETURNPACK');

  const roleDisplayLabel =
    activeRole === 'ADMIN' ? 'Quản trị viên' : activeRole === 'SHOP' ? 'Đối tác Shop' : 'Khách hàng';

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim().toUpperCase();
    if (!q) return;
    if (q.startsWith('RP-') && activeRole === 'ADMIN') {
      const found = bags.find((b) => b.bagCode === q);
      if (found) {
        setSelectedBagCode(found.bagCode);
        setCurrentRoute(`/admin/bags/${found.bagCode}`);
        setGlobalSearch('');
        return;
      }
    }
    if (activeRole === 'ADMIN') {
      setBagSearchQuery(globalSearch);
      setCurrentRoute('/admin/bags');
    } else if (activeRole === 'SHOP') {
      setScanBagCodeInput(q);
      setCurrentRoute('/shop/scan');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-[#0B1F17] flex flex-col lg:flex-row font-sans antialiased">
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Collapsible Sidebar (Executive Deep Forest #0B2418) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static bg-[#0B2418] text-white border-r border-white/10 shadow-xl p-4 flex flex-col justify-between shrink-0 transition-all duration-200 ${
          mobileDrawerOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-68'}`}
      >
        <div className="space-y-6">
          {/* Brand Header + Collapse Toggle */}
          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B89020] text-[#0B1F17] flex items-center justify-center font-extrabold text-lg shrink-0 shadow">
                R
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="font-extrabold text-base text-white tracking-wider leading-none">
                    RETURNPACK
                  </div>
                  <div className="text-[11px] text-[#A9E65A] font-semibold mt-1 truncate">
                    {roleDisplayLabel}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:inline-flex p-1.5 rounded-xl text-[#D1E7DD]/70 hover:bg-white/10 hover:text-white transition-colors duration-150"
              title={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-[#D1E7DD] hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D1E7DD]/50">
                Phân hệ điều hành
              </div>
            )}
            {activeNav.map((item) => {
              const IconComp = item.icon;
              const isActive =
                currentRoute === item.path ||
                (item.path === '/admin/bags' && currentRoute.startsWith('/admin/bags/'));
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setCurrentRoute(item.path);
                    setMobileDrawerOpen(false);
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#155C3B] text-white border-l-4 border-[#D4AF37] shadow-xs'
                      : 'text-[#D1E7DD]/80 hover:bg-white/8 hover:text-white'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <IconComp
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-[#D1E7DD]/70'}`}
                  />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Switcher (Admin Only) & Logout */}
        <div className="pt-4 mt-4 border-t border-white/10 space-y-2.5">
          {activeRole === 'ADMIN' && !sidebarCollapsed && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#D1E7DD]/50 px-1">
                Chuyển cổng làm việc
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['CUSTOMER', 'SHOP', 'ADMIN'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleLoginSubmit(undefined, r)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      activeRole === r
                        ? 'bg-[#D4AF37] text-[#0B1F17]'
                        : 'bg-white/8 text-[#D1E7DD] hover:bg-white/15'
                    }`}
                  >
                    {r === 'CUSTOMER' ? 'Khách' : r === 'SHOP' ? 'Shop' : 'Admin'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="w-full py-2.5 px-3 rounded-xl border border-white/15 text-xs font-semibold text-[#D1E7DD] hover:text-white hover:bg-rose-500/20 hover:border-rose-400/40 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={sidebarCollapsed ? 'sr-only' : ''}>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F4F7F5]">
        {/* Clean SaaS Topbar (Breadcrumb, Page Title, Search, Notifications, Avatar & Role) */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#17382B]/10 px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#F7FBF8] border border-[#17382B]/10 text-[#0B1F17]"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-[#3D554B]">
                <span>RETURNPACK</span>
                <ChevronRight className="w-3 h-3" />
                <span>{roleDisplayLabel}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#155C3B]">{currentPageTitle}</span>
              </div>
              <div className="text-base md:text-lg font-extrabold text-[#0B1F17] truncate">
                {currentPageTitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <form onSubmit={handleGlobalSearchSubmit} className="hidden md:block relative w-64">
              <Search className="w-4 h-4 text-[#3D554B] absolute left-3 top-2.5" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Tìm nhanh mã túi (RP-...)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7FBF8] border border-[#17382B]/10 text-xs font-medium text-[#0B1F17] focus:outline-none focus:ring-2 focus:ring-[#2DAF73]"
              />
            </form>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifPopover(!showNotifPopover);
                  setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                }}
                className="relative p-2.5 rounded-xl bg-[#F7FBF8] hover:bg-[#E5F7ED] border border-[#17382B]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DAF73]"
                aria-label="Thông báo"
              >
                <Bell className="w-4 h-4 text-[#155C3B]" />
                {notifications.some((n) => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF957B]" />
                )}
              </button>
              {showNotifPopover && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#17382B]/10 p-4 space-y-2.5 z-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0B1F17]">Thông báo hệ thống</span>
                    <button onClick={() => setShowNotifPopover(false)} className="text-[#3D554B] hover:text-[#0B1F17]">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="divide-y divide-[#17382B]/5 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="py-2 text-xs">
                        <div className="font-bold text-[#0B1F17]">{n.title}</div>
                        <div className="text-[#3D554B] mt-0.5">{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Role */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#17382B]/10">
              <div className="w-9 h-9 rounded-full bg-[#155C3B] text-[#A9E65A] flex items-center justify-center font-extrabold text-xs shrink-0">
                {loggedInUserName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-extrabold text-[#0B1F17] leading-tight">{loggedInUserName}</div>
                <div className="text-[11px] text-[#2DAF73] font-bold">{roleDisplayLabel}</div>
              </div>
            </div>
          </div>
        </header>

        {toast && (
          <div className="mx-4 md:mx-6 mt-4 p-3.5 rounded-2xl bg-white border border-[#2DAF73] shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#155C3B] shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#FFD866] shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#FF957B] shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-[#69C9F0] shrink-0" />}
              <div className="text-xs">
                <strong className="text-[#0B1F17]">{toast.title}:</strong> <span className="text-[#3D554B]">{toast.message}</span>
              </div>
            </div>
            <button onClick={() => setToast(null)}><X className="w-4 h-4 text-[#3D554B]" /></button>
          </div>
        )}

        <main className="p-4 md:p-6 flex-1">{renderContent()}</main>
      </div>

      {/* ====================================================================
          MODALS: CAMERA QR SCANNER, PRINT PREVIEW, VIETQR, ADD BAG/SHOP
         ==================================================================== */}
      {showQrScannerModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#0B1F17]">Quét mã QR túi</h3>
              <button onClick={() => setShowQrScannerModal({ ...showQrScannerModal, open: false })}><X className="w-5 h-5" /></button>
            </div>
            <div className="relative h-48 rounded-2xl bg-[#183A2A] flex items-center justify-center overflow-hidden border-4 border-[#48B86C]">
              <QrCode className="w-20 h-20 text-white/30" />
              <div className="absolute inset-x-4 h-0.5 bg-[#B8EF8B] shadow-[0_0_12px_#B8EF8B] animate-pulse" />
            </div>
            <div className="text-xs text-[#3D554B]">Chọn mã túi cần quét nhanh:</div>
            <div className="flex flex-wrap justify-center gap-2">
              {bags.slice(0, 6).map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    if (showQrScannerModal.target === 'SHOP') {
                      setScanBagCodeInput(b.bagCode);
                      handleShopVerifyQrOnly(b.bagCode);
                    } else if (showQrScannerModal.target === 'SHIPPER' && showQrScannerModal.reqCode) {
                      handleConfirmPickup(showQrScannerModal.reqCode, b.bagCode);
                    } else {
                      setWarehouseScanInput(b.bagCode);
                    }
                    setShowQrScannerModal({ ...showQrScannerModal, open: false });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-mono font-bold"
                >
                  {b.bagCode}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPrintQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#0B1F17]">Bản xem trước In tem QR hàng loạt</h3>
              <button onClick={() => setShowPrintQrModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {bags.map((b) => (
                <div key={b.id} className="p-3 rounded-xl border border-dashed border-[#155C3B] flex flex-col items-center text-center bg-[#F7FBF8]">
                  <QrMatrixSvg value={b.bagCode} size={56} />
                  <div className="font-mono font-extrabold text-xs text-[#155C3B] mt-1">{b.bagCode}</div>
                  <div className="text-[10px] text-[#3D554B]">app.returnpack.id.vn/return/{b.bagCode}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPrintQrModal(false)} className="px-4 py-2 rounded-xl border text-xs font-bold">Đóng</button>
              <button
                onClick={() => {
                  window.print?.();
                  setShowPrintQrModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#155C3B] text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> In ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {showVietQrModal?.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#0B1F17]">Thanh toán VietQR</h3>
              <button onClick={() => setShowVietQrModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 rounded-2xl bg-[#F7FBF8] border border-emerald-900/10 space-y-2">
              <div className="text-xs text-[#3D554B]">{showVietQrModal.planName} ({showVietQrModal.turns} lượt)</div>
              <div className="text-2xl font-extrabold text-[#155C3B]">{showVietQrModal.price.toLocaleString('vi-VN')}đ</div>
              <div className="mx-auto w-36 h-36 bg-white rounded-xl border flex items-center justify-center">
                <QrCode className="w-28 h-28 text-[#0B1F17]" />
              </div>
              <div className="text-[11px] font-mono text-[#3D554B]">ND: RP {currentShop.shopCode}</div>
            </div>
            <button
              onClick={() => {
                setShops((prev) =>
                  prev.map((s) =>
                    s.id === currentShop.id
                      ? { ...s, planId: showVietQrModal.planId, planName: showVietQrModal.planName, monthlyQuotaTurns: showVietQrModal.turns, subscriptionEnd: '30/12/2026' }
                      : s
                  )
                );
                triggerToast('success', 'Thanh toán thành công', `Đã kích hoạt ${showVietQrModal.planName} cho ${currentShop.shopName}.`);
                setShowVietQrModal(null);
              }}
              className="w-full py-3 rounded-xl bg-[#155C3B] text-white text-xs font-extrabold"
            >
              Xác nhận đã chuyển khoản
            </button>
          </div>
        </div>
      )}

      {showAddBagModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#0B1F17]">Thêm túi mới</h3>
              <button onClick={() => setShowAddBagModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Mã túi</label>
                <input type="text" value={newBagCodeInput} onChange={(e) => setNewBagCodeInput(e.target.value)} className="w-full px-3 py-2 rounded-xl border font-mono font-bold" />
              </div>
              <div>
                <label className="block font-bold mb-1">Kích thước</label>
                <select value={newBagSizeInput} onChange={(e) => setNewBagSizeInput(e.target.value as any)} className="w-full px-3 py-2 rounded-xl border bg-white">
                  <option value="S (25x35cm)">S (25x35cm)</option>
                  <option value="M (32x43cm)">M (32x43cm)</option>
                  <option value="L (40x55cm)">L (40x55cm)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Lô sản xuất</label>
                <input type="text" value={newBagBatchInput} onChange={(e) => setNewBagBatchInput(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              </div>
            </div>
            <div className="flex justify-between items-center gap-2 pt-1">
              <button
                onClick={() => {
                  const baseNum = bags.length + 1;
                  const batch: BagRecord[] = [0, 1, 2, 3, 4].map((offset) => {
                    const code = `RP-${String(baseNum + offset).padStart(6, '0')}`;
                    return {
                      id: `BAG-${Date.now()}-${offset}`,
                      bagCode: code,
                      size: newBagSizeInput,
                      batchCode: newBagBatchInput,
                      currentLocation: 'Kho Thủ Đức - Kệ A1',
                      holdingShopId: null,
                      holdingShopName: null,
                      status: 'AVAILABLE_AT_WAREHOUSE',
                      cyclesUsed: 0,
                      maxCycles: maxAllowedCycles,
                      qualityGrade: 'A',
                      lastInspectionResult: 'Túi mới - Đạt chuẩn A',
                      updatedAt: 'Vừa xong'
                    };
                  });
                  setBags((prev) => [...batch, ...prev]);
                  setShowAddBagModal(false);
                  triggerToast('success', 'Đã tạo lô 5 túi mới', `${batch[0].bagCode} đến ${batch[4].bagCode}`);
                }}
                className="px-3 py-2 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-extrabold hover:bg-[#B8EF8B]/60"
              >
                + Tạo nhanh lô 5 túi
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShowAddBagModal(false)} className="px-4 py-2 rounded-xl border text-xs font-bold">Hủy</button>
                <button onClick={handleCreateSingleBag} className="px-4 py-2 rounded-xl bg-[#155C3B] text-white text-xs font-bold">Tạo túi</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddShopModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#0B1F17]">Thêm Shop đối tác</h3>
              <button onClick={() => setShowAddShopModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <input type="text" placeholder="Tên Shop" value={newShopName} onChange={(e) => setNewShopName(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              <input type="text" placeholder="Chủ Shop" value={newShopOwner} onChange={(e) => setNewShopOwner(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              <input type="text" placeholder="Số điện thoại" value={newShopPhone} onChange={(e) => setNewShopPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              <input type="number" placeholder="Hạn mức giữ túi" value={newShopLimit} onChange={(e) => setNewShopLimit(Number(e.target.value) || 200)} className="w-full px-3 py-2 rounded-xl border" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddShopModal(false)} className="px-4 py-2 rounded-xl border text-xs font-bold">Hủy</button>
              <button
                onClick={() => {
                  if (!newShopName.trim()) return;
                  const created: ShopRecord = {
                    id: `SHOP-${Date.now()}`,
                    shopCode: `SH-${newShopName.slice(0, 6).toUpperCase().replace(/\s+/g, '')}`,
                    shopName: newShopName.trim(),
                    ownerName: newShopOwner.trim() || 'Chủ Shop',
                    phone: newShopPhone.trim() || '0901112222',
                    email: 'contact@shop.vn',
                    address: 'TP. Hồ Chí Minh',
                    district: 'Quận 1',
                    planId: 'PLAN_BASIC',
                    planName: 'Gói Cơ bản',
                    monthlyQuotaTurns: 500,
                    usedTurns: 0,
                    concurrentBagLimit: newShopLimit,
                    currentBagsHeld: 0,
                    packedOrdersCount: 0,
                    outstandingDebtVnd: 0,
                    subscriptionEnd: '30/12/2026',
                    status: 'ACTIVE'
                  };
                  setShops((prev) => [...prev, created]);
                  setShowAddShopModal(false);
                  setNewShopName('');
                  triggerToast('success', 'Đã thêm Shop', created.shopName);
                }}
                className="px-4 py-2 rounded-xl bg-[#155C3B] text-white text-xs font-bold"
              >
                Lưu Shop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
