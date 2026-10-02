// Senior Frontend Architecture - Modernized Executive Icon System
// Fully typed, responsive, and backed by Lucide React with backwards compatibility
import React from 'react';
import {
  Briefcase as LucideBriefcase,
  Wand2 as LucideWand,
  FileText as LucideFileText,
  Clock as LucideClock,
  Sparkles as LucideSparkles,
  Target as LucideTarget,
  Download as LucideDownload,
  Upload as LucideUpload,
  Phone as LucidePhone,
  Mail as LucideMail,
  Copy as LucideCopy,
  Bell as LucideBell,
  Sun as LucideSun,
  Moon as LucideMoon,
  Pencil as LucidePencil,
  Trash2 as LucideTrash,
  Search as LucideSearch,
  MapPin as LucideMapPin,
  Database as LucideDatabase,
  UserCheck as LucideUserCheck,
  ExternalLink as LucideExternalLink,
  Building2 as LucideBuilding,
  CheckCircle2 as LucideCheckCircle,
  Eye as LucideEye,
  Send as LucideSend,
  RefreshCw as LucideRefreshCw,
  Award as LucideAward,
  Mic as LucideMic,
  MicOff as LucideMicOff,
  Volume2 as LucideVolume2,
  VolumeX as LucideVolumeX,
  Square as LucideSquare,
  Play as LucidePlay,
  TrendingUp as LucideTrendingUp,
  SlidersHorizontal as LucideSliders,
  BarChart3 as LucideBarChart,
  ChevronRight as LucideChevronRight,
  ChevronDown as LucideChevronDown,
  Layers as LucideLayers,
  ShieldCheck as LucideShieldCheck,
  Zap as LucideZap,
  Filter as LucideFilter,
  ArrowUpRight as LucideArrowUpRight,
  Activity as LucideActivity,
  Cpu as LucideCpu,
  Check as LucideCheck,
  X as LucideX,
  Bot as LucideBot,
  Menu as LucideMenu,
  ArrowLeft as LucideArrowLeft,
  ArrowRight as LucideArrowRight,
  AlertTriangle as LucideAlertTriangle,
  Contact as LucideContact,
  Globe as LucideGlobe,
  FileSpreadsheet as LucideFileSpreadsheet,
  Table as LucideTable,
  Plus as LucidePlus,
  Camera as LucideCamera,
  Image as LucideImage,
} from 'lucide-react';

export interface IconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

const createIcon = (Component: React.ComponentType<any>, defaultSize = 18, defaultMargin = '8px') => {
  return ({ size = defaultSize, color, strokeWidth = 2, className, style }: IconProps) => (
    <Component
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      style={{
        marginRight: defaultMargin,
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
};

// Core Navigation & Management Icons
export const Briefcase = createIcon(LucideBriefcase, 18, '10px');
export const Wand = createIcon(LucideWand, 18, '10px');
export const FileText = createIcon(LucideFileText, 18, '10px');
export const Clock = createIcon(LucideClock, 18, '10px');
export const Sparkles = createIcon(LucideSparkles, 18, '10px');
export const Target = createIcon(LucideTarget, 18, '10px');
export const Download = createIcon(LucideDownload, 16, '6px');
export const Upload = createIcon(LucideUpload, 16, '6px');
export const Phone = createIcon(LucidePhone, 14, '4px');
export const Mail = createIcon(LucideMail, 14, '4px');
export const Copy = createIcon(LucideCopy, 14, '4px');
export const Bell = createIcon(LucideBell, 18, '0px');
export const SunIcon = createIcon(LucideSun, 18, '8px');
export const MoonIcon = createIcon(LucideMoon, 18, '8px');
export const Pencil = createIcon(LucidePencil, 15, '0px');
export const Trash = createIcon(LucideTrash, 15, '0px');
export const SearchIcon = createIcon(LucideSearch, 16, '0px');
export const MapPinIcon = createIcon(LucideMapPin, 16, '6px');
export const DatabaseIcon = createIcon(LucideDatabase, 16, '6px');
export const UserCheckIcon = createIcon(LucideUserCheck, 16, '6px');
export const ExternalLinkIcon = createIcon(LucideExternalLink, 14, '4px');
export const BuildingIcon = createIcon(LucideBuilding, 16, '6px');
export const CheckCircleIcon = createIcon(LucideCheckCircle, 16, '6px');
export const EyeIcon = createIcon(LucideEye, 15, '4px');
export const SendIcon = createIcon(LucideSend, 16, '0px');
export const RefreshCwIcon = createIcon(LucideRefreshCw, 15, '6px');
export const RefreshCw = createIcon(LucideRefreshCw, 15, '6px');
export const DownloadIcon = createIcon(LucideDownload, 16, '6px');
export const CopyIcon = createIcon(LucideCopy, 14, '4px');
export const AwardIcon = createIcon(LucideAward, 18, '6px');
export const MicIcon = createIcon(LucideMic, 18, '6px');
export const MicOffIcon = createIcon(LucideMicOff, 18, '6px');
export const Volume2Icon = createIcon(LucideVolume2, 18, '6px');
export const VolumeXIcon = createIcon(LucideVolumeX, 18, '6px');
export const SquareIcon = createIcon(LucideSquare, 16, '6px');
export const PlayIcon = createIcon(LucidePlay, 18, '6px');
export const Play = createIcon(LucidePlay, 18, '6px');
export const TrendingUpIcon = createIcon(LucideTrendingUp, 16, '6px');
export const SlidersIcon = createIcon(LucideSliders, 16, '6px');
export const BarChartIcon = createIcon(LucideBarChart, 16, '6px');

// Extended Modern Icons
export const ChevronRight = createIcon(LucideChevronRight, 16, '0px');
export const ChevronDown = createIcon(LucideChevronDown, 16, '0px');
export const Layers = createIcon(LucideLayers, 18, '8px');
export const ShieldCheck = createIcon(LucideShieldCheck, 18, '8px');
export const Zap = createIcon(LucideZap, 18, '8px');
export const Filter = createIcon(LucideFilter, 16, '6px');
export const ArrowUpRight = createIcon(LucideArrowUpRight, 14, '0px');
export const Activity = createIcon(LucideActivity, 16, '6px');
export const Cpu = createIcon(LucideCpu, 16, '6px');
export const Check = createIcon(LucideCheck, 16, '0px');
export const X = createIcon(LucideX, 16, '0px');
export const Bot = createIcon(LucideBot, 18, '8px');
export const Menu = createIcon(LucideMenu, 18, '0px');
export const ArrowLeft = createIcon(LucideArrowLeft, 18, '0px');
export const ArrowRight = createIcon(LucideArrowRight, 18, '0px');
export const AlertTriangle = createIcon(LucideAlertTriangle, 16, '6px');
export const ContactIcon = createIcon(LucideContact, 18, '8px');
export const GlobeIcon = createIcon(LucideGlobe, 16, '6px');
export const FileSpreadsheet = createIcon(LucideFileSpreadsheet, 16, '6px');
export const TableIcon = createIcon(LucideTable, 16, '6px');
export const PlusIcon = createIcon(LucidePlus, 16, '6px');
export const CameraIcon = createIcon(LucideCamera, 16, '6px');
export const ImageIcon = createIcon(LucideImage, 16, '6px');

// Autopilot & Corporate Brand Icons
export const AutopilotIcon = ({ size = 26, style }: IconProps) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
      marginRight: '8px',
      flexShrink: 0,
      ...style,
    }}
  >
    <LucideSparkles size={typeof size === 'number' ? size * 0.65 : 16} strokeWidth={2.2} />
  </div>
);

// High-fidelity Dra. Valéria Silveira Advisor Avatar SVG for HR Mentorship
export const AdvisorIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style={{ width: '42px', height: '42px', flexShrink: 0, ...style }}>
    <defs>
      <clipPath id="avatarClipRealisticModern">
        <circle cx="50" cy="50" r="48" />
      </clipPath>
      <linearGradient id="officeBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <radialGradient id="faceShadingModern" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f7d4c0" />
        <stop offset="85%" stopColor="#e5a98a" />
        <stop offset="100%" stopColor="#d38b69" />
      </radialGradient>
      <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>
    <g clipPath="url(#avatarClipRealisticModern)">
      <rect width="100" height="100" fill="url(#officeBgGrad)" />
      <circle cx="50" cy="45" r="23" fill="url(#faceShadingModern)" />
      <path fill="#2e1065" d="M26,45 C15,20 85,20 74,45 Q90,70 70,75 C65,55 35,55 30,75 Q10,70 26,45 Z" />
      <path d="M15,100 C25,74 75,74 85,100 Z" fill="url(#suitGrad)" />
      <path d="M40,78 C44,68 56,68 60,78 L50,96 Z" fill="#e2e8f0" />
      <circle cx="38" cy="45" r="2.5" fill="#3b2d26" />
      <circle cx="62" cy="45" r="2.5" fill="#3b2d26" />
      <path d="M44,61 Q50,64 56,61" stroke="#b91c1c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <g transform="translate(64, 76) rotate(10)">
        <rect x="-5" y="-4" width="11" height="8" fill="#fbbf24" rx="2" />
        <text x="0.5" y="2" fontFamily="sans-serif" fontSize="4.5" fill="#0f172a" textAnchor="middle" fontWeight="bold">HR</text>
      </g>
    </g>
    <circle cx="50" cy="50" r="48" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
  </svg>
);
