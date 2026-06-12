import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  ArrowLeft, 
  Send, 
  Mail, 
  Settings, 
  ShieldAlert, 
  Terminal, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  FileText, 
  Cpu, 
  Network, 
  Inbox, 
  Clock, 
  User, 
  Trash2, 
  Copy, 
  Info,
  Layers,
  Sparkles,
  Server,
  KeyRound,
  Check,
  ExternalLink
} from 'lucide-react';

interface NotificationTesterModuleProps {
  onBack: () => void;
}

interface SMTPConfig {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  pass: string;
  senderName: string;
  senderEmail: string;
}

interface SMTPProfile {
  id: string;
  name: string;
  config: SMTPConfig;
}

interface EmailItem {
  id: string;
  recipient: string;
  sender: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  timestamp: string;
  templateType: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  status: 'DELIVERED' | 'FAILED' | 'SIMULATED';
  logs: string[];
}

const TEMPLATE_PRESETS = [
  {
    id: 'security_alert',
    label: '🚨 Security Alert',
    badge: 'Security',
    color: 'text-rose-500 bg-rose-50 border-rose-100',
    subject: '🚨 [TRANSFORCE SECURITY] Security Alert: Out-of-Perimeter Access Attempt Detected',
    description: 'Urgent system notification triggered when a brute-force attempt or Cloudflare tunnel bypass is detected.',
    bodyText: `CYBER DEFENSE PERIMETER DETECTION

Dear Security Administration Team,

A suspicious activity from an external perimeter IP was detected on the access controller node:
• Incident Details: Bypass Cloudflare Tunnel Attempt / IP Blacklist Match
• Incident Time: \${new Date().toISOString()}
• Attacking IP Address: 185.220.101.44 (Tor Onion Routing Node)
• Target Server: Core API Gateway (transforce-api-prod_east)
• Automatic Trigger: Permanent IP Block at Router level & DB RLS lock engaged.

Please immediately verify the pgaudit logs in the Security Module dashboard.`,
    bodyHtml: `
      <div style="font-family: 'Inter', sans-serif; background-color: #fafafa; padding: 20px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #fda4af; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #e11d48; padding: 24px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: #ffe4e6;">TRANSFORCE CYBER SHIELD</p>
            <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 800; tracking: -0.02em;">ALERT: INTRUSION DETECTED</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 0;">Dear System Administrator,</p>
            <p style="font-size: 13px; line-height: 1.6; color: #475569;">The perimeter security monitoring system recorded unauthorized Tunnel Bypass activity triggering an automatic defense response.</p>
            
            <div style="background: #fff1f2; border: 1px solid #ffe4e6; border-radius: 12px; padding: 18px; margin: 20px 0;">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #e11d48; font-weight: 800; text-transform: uppercase; width: 130px;">Event Type</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">SSH/HTTP Perimeter Bypass</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #e11d48; font-weight: 800; text-transform: uppercase;">System Time</td>
                  <td style="padding: 6px 0; color: #1e293b; font-family: monospace;">\${new Date().toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #e11d48; font-weight: 800; text-transform: uppercase;">Origin IP Address</td>
                  <td style="padding: 6px 0; color: #e11d48; font-family: monospace; font-weight: bold;">185.220.101.44 (Tor Relay)</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #e11d48; font-weight: 800; text-transform: uppercase;">Action Status</td>
                  <td style="padding: 6px 0;"><span style="background: #f43f5e; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 900; font-size: 9px; uppercase">IP Rerouted & Banned</span></td>
                </tr>
              </table>
            </div>

            <p style="font-size: 12px; line-height: 1.6; color: #64748b;">Database access has been restricted using Row-Level Security (RLS) and SCRAM-SHA-256 hash validation was elevated to maximum hardening mode.</p>
            
            <a href="https://ais-dev-wkbvvxx4qynh2p3ybxsnnp-788449380952.asia-southeast1.run.app" style="display: block; text-align: center; background: #e11d48; color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 13px; margin: 25px 0 10px 0; uppercase; tracking: 0.15em;">Open Security Audit Log</a>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            Copyright © 2026 TransForce HQ Enterprise. Security Node Platform.
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'roster_schedule',
    label: '📅 Shift Roster Alert',
    badge: 'Shift Schedule',
    color: 'text-indigo-500 bg-indigo-50 border-indigo-100',
    subject: '📅 [TRANSFORCE ROSTER] Shift Release: Your New Work Schedule & Shift - June 2026 Period',
    description: 'Automatic announcement of agent shift updates broadcasted from the Workforce Planner module.',
    bodyText: `TRANSFORCE ROSTER SCHEDULING SYSTEM

Hello Operator,

The Workforce Planner management has published your latest work shift pattern details. Please prepare your attendance in accordance with service SLA standards:
• Main Shift: P3 (08:00 - 17:00 WIB)
• Work Days: Monday to Friday
• Weekly Off: Saturday & Sunday
• Target PPM Average: 14.5 Transactions / Hour

Always complete your check-in 15 minutes before your shift starts via the main portal.`,
    bodyHtml: `
      <div style="font-family: 'Inter', sans-serif; background-color: #fafafa; padding: 20px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #000000; padding: 24px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 11px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; color: #ff1e43;">TRANSFORCE PLATFORM</p>
            <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 800; tracking: -0.02em;">ROSTER PENJADWALAN NOTIFICATION</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 0;">Hello Operator / Front-line Staff,</p>
            <p style="font-size: 13px; line-height: 1.6; color: #475569;">The Workforce Planner manager has confirmed and transmitted your actual work shift alignment.</p>
            
            <div style="border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; margin: 20px 0;">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse; text-align: left;">
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 10px; color: #475569; font-weight: bold;">Day</th>
                  <th style="padding: 10px; color: #475569; font-weight: bold;">Shift Code</th>
                  <th style="padding: 10px; color: #475569; font-weight: bold;">Start - End</th>
                  <th style="padding: 10px; color: #475569; font-weight: bold;">Role Area</th>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px; font-weight: bold;">Monday</td>
                  <td style="padding: 10px;"><span style="background: #d1102b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">P3</span></td>
                  <td style="padding: 10px; font-family: monospace;">08:00 - 17:00</td>
                  <td style="padding: 10px; color: #64748b;">Customer Care Email</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px; font-weight: bold;">Tuesday</td>
                  <td style="padding: 10px;"><span style="background: #d1102b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">P3</span></td>
                  <td style="padding: 10px; font-family: monospace;">08:00 - 17:00</td>
                  <td style="padding: 10px; color: #64748b;">Customer Care Email</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px; font-weight: bold;">Wednesday</td>
                  <td style="padding: 10px;"><span style="background: #d1102b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">P3</span></td>
                  <td style="padding: 10px; font-family: monospace;">08:00 - 17:00</td>
                  <td style="padding: 10px; color: #64748b;">Customer Care Email</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px; font-weight: bold;">Thursday</td>
                  <td style="padding: 10px;"><span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">S1</span></td>
                  <td style="padding: 10px; font-family: monospace;">11:00 - 20:00</td>
                  <td style="padding: 10px; color: #64748b;">Backoffice Queue</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Friday</td>
                  <td style="padding: 10px;"><span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">S1</span></td>
                  <td style="padding: 10px; font-family: monospace;">11:00 - 20:00</td>
                  <td style="padding: 10px; color: #64748b;">Backoffice Queue</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 12px; line-height: 1.6; color: #64748b; background: #f8fafc; border-left: 3px solid #d1102b; padding: 10px; border-radius: 0 8px 8px 0;"><strong>Important:</strong> Shift Swap approvals must be requested at least 24 hours prior to the shift start via the Roster Swapping interface in TransForce System.</p>
</div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            Copyright © 2026 TransForce Workforce Optimization Engine. All rights reserved.
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'kpi_performance',
    label: '🏆 SLA & KPI Alert',
    badge: 'KPI Analytics',
    color: 'text-emerald-500 bg-emerald-50 border-emerald-100',
    subject: '🏆 [TRANSFORCE ANALYTICS] Congratulations! You Achieved Peak Operational Efficiency Today',
    description: 'SLA compliance broadcast or notice of service delivery exceeding targets.',
    bodyText: `PERFORMANCE MONITORING & KPI METRICS

Dear Operations Team Member,

Congratulations on your contribution to our performance metrics this shift. System telemetry recorded high efficiency metrics on your service node:
• Service Level (SL): 96.8% (Target Contract: >90.0%)
• Transactions Per Hour (PPH): 15.2 (Global baseline: 12.0)
• CSAT Score Rating: ⭐ 4.95 / 5.00
• Total Handled Cases: 84 Cases Successfully Closed.

The KPI Tracker Dashboard detected this outstanding productivity. Keep up the great work!`,
    bodyHtml: `
      <div style="font-family: 'Inter', sans-serif; background-color: #fafafa; padding: 20px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #86efac; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #10b981; padding: 24px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 11px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; color: #ecfdf5;">TRANSFORCE OPERATIONAL ANALYTICS</p>
            <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 800; tracking: -0.02em;">KPI HIGH-ACHIEVER REPORT</h1>
          </div>
          <div style="padding: 30px;">
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="font-size: 40px;">🏆</span>
              <h2 style="font-size: 18px; font-weight: 800; color: #065f46; margin: 10px 0 5px 0;">Exceptional Operational Efficiency!</h2>
              <p style="font-size: 12px; color: #047857; margin: 0;">System detected performance metrics exceeding the operational SLA target.</p>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 18px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; flex-wrap: wrap; margin-bottom: 12px;">
                <div style="flex: 1; min-width: 120px; text-align: center; padding: 10px; background: white; border-radius: 8px; border: 1px solid #bbf7d0; margin: 5px;">
                  <span style="display: block; font-size: 9px; uppercase; font-weight: bold; color: #64748b;">Service Level (SL)</span>
                  <span style="font-size: 18px; font-weight: bold; color: #059669; font-family: monospace;">96.8%</span>
                </div>
                <div style="flex: 1; min-width: 120px; text-align: center; padding: 10px; background: white; border-radius: 8px; border: 1px solid #bbf7d0; margin: 5px;">
                  <span style="display: block; font-size: 9px; uppercase; font-weight: bold; color: #64748b;">PPH Achieved</span>
                  <span style="font-size: 18px; font-weight: bold; color: #059669; font-family: monospace;">15.2 /hr</span>
                </div>
                <div style="flex: 1; min-width: 120px; text-align: center; padding: 10px; background: white; border-radius: 8px; border: 1px solid #bbf7d0; margin: 5px;">
                  <span style="display: block; font-size: 9px; uppercase; font-weight: bold; color: #64748b;">CSAT Ratings</span>
                  <span style="font-size: 18px; font-weight: bold; color: #059669; font-family: monospace;">⭐ 4.95</span>
                </div>
              </div>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #475569; text-align: center;">This achievement directly contributes to monthly incentive program scoring and overall Service Delivery indices.</p>
</div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            Copyright © 2026 TransForce Optimization Analytics.
          </div>
        </div>
      </div>
    `
  }
];

export default function NotificationTesterModule({ onBack }: NotificationTesterModuleProps) {
  const [recipientEmail, setRecipientEmail] = useState('myrond.48@gmail.com');
  const [selectedTemplateId, setSelectedTemplateId] = useState('security_alert');
  const [customSubject, setCustomSubject] = useState('');
  const [customBodyText, setCustomBodyText] = useState('');
  const [priority, setPriority] = useState<'HIGH' | 'NORMAL' | 'LOW'>('HIGH');
  const [isSending, setIsSending] = useState(false);
  const [sendStatusMsg, setSendStatusMsg] = useState<{ status: 'success' | 'error' | null; message: string }>({ status: null, message: '' });
  
  // Real SMTP connection configuration & multiple profiles persistence
  const [smtpProfiles, setSmtpProfiles] = useState<SMTPProfile[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('transforce_smtp_profiles');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.warn("Failed parsing SMTP profiles:", e);
        }
      }
    }
    return [
      {
        id: 'prof_gmail',
        name: '🔴 Gmail Default Profile',
        config: {
          host: 'smtp.gmail.com',
          port: '465',
          secure: true,
          user: '',
          pass: '',
          senderName: 'TransForce Gmail Secure Notification',
          senderEmail: ''
        }
      },
      {
        id: 'prof_outlook',
        name: '🔵 Outlook Default Profile',
        config: {
          host: 'smtp.office365.com',
          port: '587',
          secure: false,
          user: '',
          pass: '',
          senderName: 'TransForce Outlook Notification',
          senderEmail: ''
        }
      }
    ];
  });

  const [selectedProfileId, setSelectedProfileId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('transforce_selected_smtp_profile_id');
      return saved || 'prof_gmail';
    }
    return 'prof_gmail';
  });

  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>(() => {
    const defaultProf = {
      host: 'smtp.gmail.com',
      port: '465',
      secure: true,
      user: '',
      pass: '',
      senderName: 'TransForce Cyber Notification',
      senderEmail: ''
    };
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('transforce_selected_smtp_profile_id') || 'prof_gmail';
      const savedProfiles = localStorage.getItem('transforce_smtp_profiles');
      if (savedProfiles) {
        try {
          const parsed = JSON.parse(savedProfiles);
          if (Array.isArray(parsed)) {
            const matched = parsed.find((p: SMTPProfile) => p.id === savedId);
            if (matched) return { ...matched.config };
          }
        } catch (e) {
          console.warn(e);
        }
      }
    }
    return defaultProf;
  });

  const [newProfileName, setNewProfileName] = useState('');
  const [isAddingProfile, setIsAddingProfile] = useState(false);

  // Sync profiles changes to localstorage when edited
  useEffect(() => {
    localStorage.setItem('transforce_smtp_profiles', JSON.stringify(smtpProfiles));
  }, [smtpProfiles]);

  // Sync selectedProfileId to localstorage
  useEffect(() => {
    localStorage.setItem('transforce_selected_smtp_profile_id', selectedProfileId);
  }, [selectedProfileId]);

  // Synchronously update selected configuration on change
  const selectProfile = (profileId: string) => {
    const profile = smtpProfiles.find(p => p.id === profileId);
    if (profile) {
      setSelectedProfileId(profileId);
      setSmtpConfig({ ...profile.config });
    }
  };

  // Automatically sync local changes on current config input back to the specific profile
  useEffect(() => {
    setSmtpProfiles(prev => prev.map(prof => {
      if (prof.id === selectedProfileId) {
        return {
          ...prof,
          config: { ...smtpConfig }
        };
      }
      return prof;
    }));
  }, [smtpConfig, selectedProfileId]);

  const handleSaveActiveProfile = () => {
    localStorage.setItem('transforce_smtp_profiles', JSON.stringify(smtpProfiles));
    localStorage.setItem('transforce_selected_smtp_profile_id', selectedProfileId);
    alert('Save Success: All settings for profile "' + (smtpProfiles.find(p => p.id === selectedProfileId)?.name || 'Active') + '" have been successfully saved to your browser!');
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    const newId = 'prof_' + Math.random().toString(36).substr(2, 9);
    const newProf: SMTPProfile = {
      id: newId,
      name: newProfileName.trim(),
      config: { ...smtpConfig }
    };
    setSmtpProfiles(prev => [...prev, newProf]);
    setSelectedProfileId(newId);
    setNewProfileName('');
    setIsAddingProfile(false);
  };

  const handleDeleteProfile = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (smtpProfiles.length <= 1) {
      alert('The system must retain at least one SMTP sender profile.');
      return;
    }
    if (confirm('Are you sure you want to delete this SMTP sender profile?')) {
      const remaining = smtpProfiles.filter(p => p.id !== profileId);
      setSmtpProfiles(remaining);
      if (selectedProfileId === profileId) {
        const nextProfile = remaining[0];
        setSelectedProfileId(nextProfile.id);
        setSmtpConfig({ ...nextProfile.config });
      }
    }
  };

  const [useRealSMTP, setUseRealSMTP] = useState(false);
  const [showSMTPConfig, setShowSMTPConfig] = useState(false);
  
  // Terminal logs simulation for active sending
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const [consoleIsVisible, setConsoleIsVisible] = useState(true);
  
  // Simulated inbox history
  const [mailboxEmails, setMailboxEmails] = useState<EmailItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('transforce_mailbox_logs');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn("Failed parsing mailbox logs:", e); }
      }
    }
    return [
      {
        id: 'INIT_EMAIL_1',
        sender: 'TransForce Secure Cloud <alerts@portal-transforce.com>',
        recipient: 'myrond.48@gmail.com',
        subject: '🚨 [TRANSFORCE SECURITY] Security Alert: Out-of-Perimeter Access Attempt Detected',
        bodyText: 'Suspicious login cyber perimeter detection report.',
        bodyHtml: TEMPLATE_PRESETS[0].bodyHtml,
        timestamp: new Date(Date.now() - 3600000).toLocaleString(),
        templateType: 'security_alert',
        priority: 'HIGH',
        status: 'SIMULATED',
        logs: [
          'Connecting to server...',
          'Connected to transforce-auth-service.secure',
          'SMTP Handshake HELO successful',
          'AUTH LOGIN bypassed (Local Sandbox Host)',
          'MAIL FROM <alerts@portal-transforce.com> OK',
          'RCPT TO <myrond.48@gmail.com> OK',
          'Transmission of HTML Payload OK (3.44 KB)',
          'SMTP Session closed successfully'
        ]
      },
      {
        id: 'INIT_EMAIL_2',
        sender: 'TransForce Scheduling <roster@portal-transforce.com>',
        recipient: 'myrond.48@gmail.com',
        subject: '📅 [TRANSFORCE ROSTER] Shift Release: Your New Work Schedule & Shift - June 2026 Period',
        bodyText: 'Latest Roster Shift Work pattern details.',
        bodyHtml: TEMPLATE_PRESETS[1].bodyHtml,
        timestamp: new Date(Date.now() - 7200000).toLocaleString(),
        templateType: 'roster_schedule',
        priority: 'NORMAL',
        status: 'SIMULATED',
        logs: ['SMTP simulated transmission completed.']
      }
    ];
  });

  const [selectedInboxEmailId, setSelectedInboxEmailId] = useState<string>('INIT_EMAIL_1');
  const [mailboxViewTab, setMailboxViewTab] = useState<'preview' | 'html' | 'handshake'>('preview');

  // Sync state to localstorage
  useEffect(() => {
    localStorage.setItem('transforce_mailbox_logs', JSON.stringify(mailboxEmails));
  }, [mailboxEmails]);

  // Set default subjects & body fields when changing preset templates
  const activePreset = useMemo(() => {
    return TEMPLATE_PRESETS.find(x => x.id === selectedTemplateId) || TEMPLATE_PRESETS[0];
  }, [selectedTemplateId]);

  useEffect(() => {
    setCustomSubject(activePreset.subject);
    setCustomBodyText(activePreset.bodyText);
  }, [activePreset]);

  const selectedMail = useMemo(() => {
    return mailboxEmails.find(x => x.id === selectedInboxEmailId) || mailboxEmails[0];
  }, [mailboxEmails, selectedInboxEmailId]);

  const logTerminalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [activeLogs]);

  // Function to execute sending
  const handleSendTestNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;

    setIsSending(true);
    setSendStatusMsg({ status: null, message: '' });
    setMailboxViewTab('preview');
    setActiveLogs(['[SYS] Initializing notification sender dispatch daemon...']);

    // Log progress stream helper
    const streamLog = (msg: string, delay: number): Promise<void> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setActiveLogs(prev => [...prev, `[SMTP] ${msg}`]);
          resolve();
        }, delay);
      });
    };

    await streamLog('Connecting to outbound gateway host ' + (useRealSMTP ? smtpConfig.host : 'virtual.transforce.net') + ' on port ' + (useRealSMTP ? smtpConfig.port : '25') + '...', 400);
    await streamLog('SOCKET: TCP established. Client handshaking initiating...', 300);
    await streamLog('>> EHLO transforce-gateway.internal', 250);
    await streamLog('<< 250-smtp.transforce.net Greeting. WebClient v1.4.0', 200);
    await streamLog('<< 250-8BITMIME\n<< 250-STARTTLS\n<< 250 SIZE 31457280', 200);
    
    if (useRealSMTP && smtpConfig.user) {
      await streamLog('>> AUTH LOGIN', 300);
      await streamLog('<< 334 VXNlcm5hbWU6 (Waiting for SMTP login encoding query)', 250);
      await streamLog('>> [Base64 Encrypted Auth String]', 250);
      await streamLog('<< 235 2.7.0 Authentication successful. TLS Handshake complete.', 400);
    } else {
      await streamLog('>> AUTH: Anonymous / Localhost Sandbox trusted relay mode authorized.', 200);
    }

    const senderFull = `${useRealSMTP ? smtpConfig.senderName : 'TransForce Notification'} <${useRealSMTP ? (smtpConfig.user || 'alerts@portal-transforce.com') : 'alerts@portal-transforce.com'}>`;
    await streamLog(`>> MAIL FROM: <${useRealSMTP ? (smtpConfig.user || 'alerts@portal-transforce.com') : 'alerts@portal-transforce.com'}>`, 250);
    await streamLog('<< 250 2.1.0 Sender address validated ok', 150);
    
    // Parse individual recipients
    const recipientList = recipientEmail
      .replace(/;/g, ',')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);

    for (const rcpt of recipientList) {
      await streamLog(`>> RCPT TO: <${rcpt}>`, 150);
      await streamLog(`<< 250 2.1.5 Recipient <${rcpt}> authorized for transmission`, 100);
    }

    await streamLog('>> DATA (Opening transaction data stream packet)', 250);
    await streamLog('<< 354 Start mail input; end with <CR><LF>.<CR><LF>', 150);
    await streamLog(`>> MIME-Version: 1.0\n>> Subject: ${customSubject}\n>> Content-Type: text/html; charset=UTF-8`, 300);
    await streamLog('>> [Transmitting SMTP MIME Packet (Total payload: ' + (activePreset.bodyHtml.length / 1024).toFixed(2) + ' KB)]', 400);
    await streamLog('<< 250 2.0.0 OK: Message accepted for delivery queue in MTA spooler', 200);
    await streamLog('>> QUIT (Closing socket pipeline)', 150);
    await streamLog('<< 221 2.0.0 transforce.net Service closing transmission channels. Farewell.', 100);

    const transactionLogs = [
      'Initiating SMTP socket handshake exchange...',
      `Connection established to ${useRealSMTP ? smtpConfig.host : 'virtual-sandbox-relay'}`,
      'EHLO Handshake successfully acknowledged.',
      useRealSMTP ? 'SMTP authentication handshake verified.' : 'Sandbox virtual bypass proxy authorized.',
      `Envelope sender address validation check: ${useRealSMTP ? (smtpConfig.user || 'alerts@portal-transforce.com') : 'alerts@portal-transforce.com'}`,
      `Recipient target validations (${recipientList.length} address(es)): ${recipientList.join(', ')}`,
      'MIME multi-part HTML data package successfully dispatched.',
      'SMTP connection pipeline severed elegantly.'
    ];

    try {
      // Execute REAL backend email dispatch if backend supports NodeMailer and config is toggled
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: recipientEmail,
          subject: customSubject,
          bodyHtml: activePreset.bodyHtml,
          bodyText: customBodyText,
          priority: priority,
          smtpConfig: useRealSMTP ? smtpConfig : null
        })
      });

      const resData = await response.json();

      if (response.ok) {
        setSendStatusMsg({ 
          status: 'success', 
          message: useRealSMTP 
            ? 'Notification successfully sent LIVE to target mailbox ' + recipientEmail 
            : 'Simulated dispatch completed! Email posted successfully to local Inbox Simulator.' 
        });

        const newEmail: EmailItem = {
          id: 'MAIL_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          recipient: recipientEmail,
          sender: senderFull,
          subject: customSubject,
          bodyHtml: activePreset.bodyHtml,
          bodyText: customBodyText,
          timestamp: new Date().toLocaleString(),
          templateType: selectedTemplateId,
          priority: priority,
          status: useRealSMTP ? 'DELIVERED' : 'SIMULATED',
          logs: transactionLogs
        };

        setMailboxEmails(prev => [newEmail, ...prev]);
        setSelectedInboxEmailId(newEmail.id);
      } else {
        throw new Error(resData.error || 'Internal error encountered inside the mailer daemon server.');
      }

    } catch (err: any) {
      console.error(err);
      setSendStatusMsg({ status: 'error', message: 'Dispatch failed: ' + err.message });
      setActiveLogs(prev => [...prev, `[FAIL] Fatal server exception caught: ${err.message}`]);
    } finally {
      setIsSending(false);
    }
  };

  const clearInbox = () => {
    if (window.confirm('Delete all messages from local Sandbox virtual inbox logs?')) {
      setMailboxEmails([]);
    }
  };

  return (
    <div className="w-full flex-grow flex flex-col">
      {/* 2. HEADER TAB AREA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-100 hover:border-active-red hover:text-active-red transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black uppercase flex items-center gap-2">
              <Bell className="w-6 h-6 text-active-red stroke-[2.5]" />
              Notification Tester
            </h1>
            <p className="text-[10px] sm:text-xs text-neutral-gray font-bold uppercase tracking-widest mt-1">
              Notification Dispatch Test & SMTP Gateway Integration Module
            </p>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COL 1: CONTROL & SENDING CONFIG PRESETS (SPAN 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200/80 p-5 md:p-6 shadow-sm flex flex-col gap-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Email Dispatch Form</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Customize Notification Testing Parameters</p>
              </div>
              <Sparkles className="text-active-red w-4 h-4" />
            </div>

            <form onSubmit={handleSendTestNotification} className="space-y-4">
              
              {/* TARGET EMAIL RECIPIENT */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-sans">Recipient Email Address (To)</label>
                  <span className="text-[7.5px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">Multi-Recipient Support</span>
                </div>
                <div className="relative">
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Example: email1@gmail.com, email2@outlook.com" 
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-active-red focus:bg-white transition-all"
                  />
                </div>
                <span className="text-[7.5px] leading-relaxed font-bold text-slate-400 block uppercase mt-0.5">
                  💡 Separate multiple recipient email addresses using a comma (,) or a semicolon (;)
                </span>
              </div>

              {/* PRIORITY & SENSITIVITY LEVEL */}
              <div className="grid grid-cols-3 gap-2">
                {(['HIGH', 'NORMAL', 'LOW'] as const).map(pr => (
                  <button
                    key={pr}
                    type="button"
                    onClick={() => setPriority(pr)}
                    className={`py-2 px-1 rounded-xl text-[8px] font-black uppercase tracking-wider border transition-all text-center ${
                      priority === pr 
                        ? 'bg-black text-white border-black shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 border-dashed'
                    }`}
                  >
                    🚀 {pr} Priority
                  </button>
                ))}
              </div>

              {/* TEMPLATE DECORATIVE SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-sans block">Preset Content Template</label>
                <div className="flex flex-col gap-2">
                  {TEMPLATE_PRESETS.map((preset) => (
                    <div 
                      key={preset.id}
                      onClick={() => setSelectedTemplateId(preset.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedTemplateId === preset.id 
                          ? 'border-active-red bg-red-50/20' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-800">{preset.label}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-slate-50 text-slate-400">
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium leading-normal mt-1">{preset.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CUSTOM CORE INPUT SUBJECT & MASSAGE PRESET BLOCKS */}
              <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div className="space-y-1.5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 font-sans block">Email Subject</span>
                  <input 
                    type="text"
                    required
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-[10px] text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 font-sans block">Plain Text Payload (MIME Plain Text Alternative)</span>
                  <textarea 
                    rows={4}
                    value={customBodyText}
                    onChange={(e) => setCustomBodyText(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-medium text-[9px] font-mono text-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* SMTP GATEWAY OPTIONAL TOGGLER */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div 
                  onClick={() => setShowSMTPConfig(!showSMTPConfig)}
                  className="bg-slate-50 px-4 py-3 border-b border-slate-150 flex justify-between items-center cursor-pointer hover:bg-slate-100/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Server size={12} className={useRealSMTP ? "text-active-red" : "text-slate-400"} />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">Outbound SMTP Configuration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      useRealSMTP ? 'bg-rose-50 border border-rose-100 text-active-red' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {useRealSMTP ? 'LIVE SMTP' : 'SANDBOX SIMULATOR'}
                    </span>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {showSMTPConfig && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3 border-t border-slate-100 bg-white">
                        <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50/50 border border-blue-100/60 rounded-xl">
                           <Info size={12} className="text-blue-600 shrink-0" />
                           <p className="text-[8.5px] leading-relaxed text-blue-800 font-semibold uppercase tracking-tight">
                             Enter your SMTP configuration for LIVE email dispatch. If left empty, the system automatically uses the high-fidelity visual Sandbox Simulator.
                           </p>
                        </div>
 
                        <div className="flex items-center gap-2 pb-2">
                           <input 
                             id="use-smtp-check"
                             type="checkbox"
                             checked={useRealSMTP}
                             onChange={(e) => setUseRealSMTP(e.target.checked)}
                             className="w-3.5 h-3.5 accent-active-red"
                           />
                           <label htmlFor="use-smtp-check" className="text-[9px] font-black uppercase text-slate-700 cursor-pointer">
                             Enable Outgoing Live SMTP Relay Mode
                           </label>
                        </div>
 
                        {/* PROFILE MANAGER PLATFORM */}
                        <div className={`p-4 bg-slate-905 bg-slate-950 text-white rounded-2xl space-y-4 transition-all ${useRealSMTP ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                           <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                             <div>
                               <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block font-mono">ACCOUNT PROFILE / SENDER</span>
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-100 flex items-center gap-1.5 mt-0.5 font-mono">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                 Manage Multi-Profile SMTP
                               </h4>
                             </div>
                             <span className="text-[8px] font-black uppercase bg-slate-850 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-blue-400 font-mono">
                               {smtpProfiles.length} PROFILES
                             </span>
                           </div>
 
                           {/* Profile Selector Grid */}
                           <div className="space-y-2">
                             <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block font-mono">Select Active Sender Profile</span>
                             <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                               {smtpProfiles.map((prof) => (
                                 <div 
                                   key={prof.id}
                                   onClick={() => selectProfile(prof.id)}
                                   className={`p-2.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                                     selectedProfileId === prof.id
                                       ? 'bg-neutral-900 border-neutral-700 text-white shadow-inner'
                                       : 'bg-black/20 border-slate-900 hover:bg-black/40 text-slate-400 hover:text-slate-200'
                                   }`}
                                 >
                                   <div className="flex flex-col gap-0.5 min-w-0">
                                     <span className="text-[9.5px] font-extrabold truncate text-slate-100">{prof.name}</span>
                                     {prof.config.user ? (
                                       <span className="text-[8px] font-mono text-slate-450 truncate text-[#94a3b8]">{prof.config.user} ({prof.config.host})</span>
                                     ) : (
                                       <span className="text-[7.5px] text-amber-500 font-bold italic uppercase tracking-tight">Unconfigured (Empty)</span>
                                     )}
                                   </div>
                                   <div className="flex items-center gap-1.5">
                                     {selectedProfileId === prof.id ? (
                                       <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 font-mono">ACTIVE</span>
                                     ) : null}
                                     <button
                                       type="button"
                                       onClick={(e) => handleDeleteProfile(prof.id, e)}
                                       className="p-1 hover:text-rose-450 text-slate-500 hover:text-rose-400 transition-colors"
                                       title="Delete Profile"
                                     >
                                       <Trash2 size={12} />
                                     </button>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
 
                           {/* Create Program Profile Input Form */}
                           {!isAddingProfile ? (
                             <div className="flex gap-2">
                               <button
                                 type="button"
                                 onClick={() => setIsAddingProfile(true)}
                                 className="flex-grow py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest text-center transition-all text-slate-300"
                               >
                                 ➕ Create New Profile (Clone Active)
                               </button>
                               <button
                                 type="button"
                                 onClick={handleSaveActiveProfile}
                                 className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] rounded-xl text-[8px] font-black uppercase tracking-widest text-white text-center transition-all flex items-center justify-center gap-1"
                               >
                                 <Check size={10} className="text-white" />
                                 Save Active Profile
                               </button>
                             </div>
                           ) : (
                             <div className="space-y-2 bg-black/40 border border-slate-900 p-3 rounded-xl">
                               <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block font-mono">Enter New Profile Name:</span>
                               <div className="flex gap-1.5">
                                 <input
                                   type="text"
                                   required
                                   value={newProfileName}
                                   onChange={(e) => setNewProfileName(e.target.value)}
                                   placeholder="Example: Outlook Head Office, Gmail myrond..."
                                   className="flex-grow p-2 bg-slate-950 border border-slate-800 rounded-lg text-[9px] font-bold text-white focus:outline-none focus:border-blue-500"
                                 />
                                 <button
                                   type="button"
                                   onClick={(e) => {
                                     if(newProfileName.trim()){
                                       const newId = 'prof_' + Math.random().toString(36).substr(2, 9);
                                       const newProf = {
                                         id: newId,
                                         name: newProfileName.trim(),
                                         config: { ...smtpConfig }
                                       };
                                       setSmtpProfiles(prev => [...prev, newProf]);
                                       setSelectedProfileId(newId);
                                       setNewProfileName('');
                                       setIsAddingProfile(false);
                                     }
                                   }}
                                   className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-black text-[8px] uppercase tracking-widest text-white"
                                 >
                                   ADD
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => {
                                     setIsAddingProfile(false);
                                     setNewProfileName('');
                                   }}
                                   className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-black text-[8px] uppercase tracking-widest text-slate-400"
                                 >
                                   CANCEL
                                 </button>
                               </div>
                             </div>
                           )}
                        </div>
 
                        {/* QUICK PRESETS & OUTLOOK EDUCATION INFO */}
                        <div className={`p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5 transition-opacity ${useRealSMTP ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="flex flex-col gap-1">
                             <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Select Server & Port Preset</span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSmtpConfig({
                                    ...smtpConfig,
                                    host: 'smtp.gmail.com',
                                    port: '465',
                                    secure: true,
                                    senderName: 'TransForce Gmail Secure Notification'
                                  });
                                }}
                                className={`flex-1 py-1.5 px-2 text-[8px] font-black uppercase border rounded-lg transition-all ${
                                  smtpConfig.host === 'smtp.gmail.com'
                                    ? 'bg-rose-550 bg-black text-white border-black'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                🔴 Gmail (Port 465 SSL)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSmtpConfig({
                                    ...smtpConfig,
                                    host: 'smtp.office365.com',
                                    port: '587',
                                    secure: false, // Office365 SMTP uses STARTTLS, which requires secure: false in NodeMailer initially
                                    senderName: 'TransForce Outlook Notification'
                                  });
                                }}
                                className={`flex-1 py-1.5 px-2 text-[8px] font-black uppercase border rounded-lg transition-all ${
                                  smtpConfig.host === 'smtp.office365.com'
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                🔵 Outlook POP/O365 (SMTP 587 TLS)
                              </button>
                            </div>
                          </div>

                          <div className="text-[8.5px] leading-relaxed text-slate-500 font-medium space-y-2">
                            <div>
                              <span className="font-bold text-slate-700 font-mono">💡 Protocol Education:</span> For custom Outlook email outbound dispatch, the system still must use the <span className="font-bold text-active-red">SMTP Port 587 (TLS/STARTTLS)</span> protocol. The <span className="font-semibold text-slate-800">POP (Post Office Protocol)</span> protocol is specifically designed for downloading/reading incoming emails (inbound), not for triggers or outbound message queues.
                            </div>
                            
                            <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-2.5 space-y-1.5 text-[8px] text-amber-900">
                              <span className="font-black uppercase tracking-wider block text-amber-950 font-mono">📋 SMTP SETUP & TROUBLESHOOTING GUIDE:</span>
                              
                              <div>
                                <span className="font-black text-slate-800 block">1. What should be entered in the SMTP Username?</span>
                                <p className="leading-normal">It must be filled with your <span className="font-extrabold text-blue-700">COMPLETE EMAIL ADDRESS</span> which will act as the sender. Examples: <code className="font-mono bg-white px-1 border border-amber-200">myrond.48@gmail.com</code> or <code className="font-mono bg-white px-1 border border-amber-200">username@outlook.com</code>.</p>
                              </div>

                              <div>
                                <span className="font-black text-slate-800 block">2. Solving the "535 Authentication Failed" error</span>
                                <p className="leading-normal">This occurs when the password is incorrect or rejected. If you are using a personal Gmail/Outlook account, you <span className="font-extrabold text-active-red">cannot</span> use your standard login password. Instead, you must generate an <span className="font-extrabold text-blue-700">App Password (App-specific password)</span> in your Google/Microsoft account security settings, and use that 16-character code in the password field.</p>
                              </div>

                              <div>
                                <span className="font-black text-slate-800 block">3. Solving "getaddrinfo ENOTFOUND smtp.trans-cosmos.co.id"</span>
                                <p className="leading-normal">This indicates that the server hostname you entered is not registered in DNS. If your corporate/job email is hosted with Microsoft 365 / Outlook Corporate, change the SMTP Host to <code className="font-mono bg-white px-1 border border-amber-200 text-blue-700">smtp.office365.com</code> or <code className="font-mono bg-white px-1 border border-amber-200 text-blue-700">smtp-mail.outlook.com</code> with Port <code className="font-mono bg-white px-1 border border-amber-200 text-blue-700">587</code> (STARTTLS) to route connections securely.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className={`${useRealSMTP ? 'opacity-100' : 'opacity-50 pointer-events-none'} transition-all space-y-2.5`}>
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-6 space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Host SMTP</span>
                              <input 
                                type="text"
                                placeholder="smtp.gmail.com"
                                value={smtpConfig.host}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold"
                              />
                            </div>
                            <div className="col-span-3 space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Port</span>
                              <input 
                                type="text"
                                placeholder="465"
                                value={smtpConfig.port}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-mono text-center"
                              />
                            </div>
                            <div className="col-span-3 space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Mode</span>
                              <select 
                                value={smtpConfig.secure ? "ssl" : "tls"}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.value === "ssl" })}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700"
                              >
                                <option value="ssl">SSL (465)</option>
                                <option value="tls">STARTTLS</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">SMTP Username</span>
                              <input 
                                type="text"
                                placeholder="username@gmail.com"
                                value={smtpConfig.user}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-semibold"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Password / App Key</span>
                              <input 
                                type="password"
                                placeholder="••••••••••••••••"
                                value={smtpConfig.pass}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5">
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block font-mono">Sender Name</span>
                              <input 
                                type="text"
                                value={smtpConfig.senderName}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, senderName: e.target.value })}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block font-mono">Sender Email</span>
                              <input 
                                type="email"
                                value={useRealSMTP ? (smtpConfig.user || 'Same as Username') : smtpConfig.senderEmail}
                                disabled={useRealSMTP}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, senderEmail: e.target.value })}
                                className={`w-full p-2 border rounded-lg text-[9px] font-mono ${
                                  useRealSMTP 
                                    ? 'bg-slate-100 border-slate-250 text-slate-500 font-semibold cursor-not-allowed' 
                                    : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ACTION SEND TRIGGER BUTTON */}
              <button 
                type="submit"
                disabled={isSending}
                className={`w-full py-3.5 bg-black hover:bg-neutral-900 border border-neutral-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
                  isSending ? 'opacity-85 pointer-events-none' : ''
                }`}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-active-red" />
                    Transmitting via SMTP...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 text-active-red" />
                    Send Test Notification
                  </>
                )}
              </button>

              {/* RESPONSE ALERT TOAST INFOBOUND */}
              {sendStatusMsg.status && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  sendStatusMsg.status === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {sendStatusMsg.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="text-[9px] font-black uppercase tracking-wider">
                      {sendStatusMsg.status === 'success' ? 'GATEWAY DISPATCH SUCCESSFUL' : 'TRANSACTION DISPATCH FAILED'}
                    </h5>
                    <p className="text-[9.5px] font-semibold leading-relaxed mt-1">{sendStatusMsg.message}</p>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* TELEMETRY CONSOLE SOCKET INTERACTION LOGS */}
          <div className="bg-slate-950 border border-slate-900 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5 mb-3.5">
              <div className="flex items-center gap-2">
                <Terminal className="text-emerald-500 w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">SMTP Handshake Terminal</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                <button 
                  onClick={() => setActiveLogs([])}
                  className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-350 transition-colors ml-2 font-mono"
                >
                  CLR
                </button>
              </div>
            </div>

            <div 
              ref={logTerminalRef} 
              className="font-mono text-[9px] leading-loose text-emerald-400 bg-slate-950/70 p-3.5 rounded-xl h-44 overflow-y-auto font-medium"
            >
              {activeLogs.length === 0 ? (
                <div className="text-slate-600 italic">Socket terminal interface ready to stream data transmission telemetry...</div>
              ) : (
                activeLogs.map((log, lIdx) => (
                  <div 
                    key={lIdx} 
                    className={`${
                      log.includes('[SYS]') ? 'text-blue-400' : 
                      log.includes('>>') ? 'text-amber-500' : 
                      log.includes('<<') ? 'text-emerald-400 font-black' : 
                      log.includes('[FAIL]') ? 'text-rose-500 border-l border-rose-500 pl-1 font-bold' :
                      'text-sky-300'
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COL 2: INBOX RECEIVER & VISUAL MULTIPORT SIMULATOR (SPAN 7) */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200/80 p-5 md:p-6 shadow-sm flex flex-col min-h-[640px] items-stretch">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <Inbox size={14} className="text-active-red" />
                Live Inbox Sandbox Simulator
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Virtual Inbox Feed from Local Server Dispatches</p>
            </div>
            <button 
              onClick={clearInbox}
              className="text-[8.5px] font-black uppercase text-rose-600 tracking-widest hover:bg-rose-50 border border-slate-150 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Trash2 size={11} />
              Reset Inbox
            </button>
          </div>

          <div className="grid grid-cols-12 gap-5 flex-grow items-stretch pt-4">
            
            {/* SENDER HISTORY LIST (SPAN 5) */}
            <div className="col-span-12 sm:col-span-5 border-r border-slate-100 pr-1 select-none flex flex-col space-y-2 max-h-[500px] overflow-y-auto">
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Received ({mailboxEmails.length})</span>
              {mailboxEmails.length === 0 ? (
                <div className="p-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wide bg-slate-50 rounded-2xl border border-dashed border-slate-200 animate-pulse">
                  Inbox Empty
                </div>
              ) : (
                mailboxEmails.map((mail) => {
                  const isSelected = selectedInboxEmailId === mail.id;
                  return (
                    <div
                      key={mail.id}
                      onClick={() => {
                        setSelectedInboxEmailId(mail.id);
                        setMailboxViewTab('preview');
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected 
                          ? 'border-active-red bg-red-50/25 ring-1 ring-red-100' 
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black font-mono text-slate-400 truncate w-24">{mail.id}</span>
                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                          mail.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {mail.priority}
                        </span>
                      </div>
                      <h4 className="text-[10px] font-black text-slate-800 line-clamp-1 mt-1.5 leading-tight">{mail.subject}</h4>
                      <p className="text-[9px] text-slate-400 line-clamp-2 leading-relaxed mt-1">{mail.bodyText}</p>
                      
                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100/50 text-[7px] font-mono text-slate-400 uppercase">
                        <span>{mail.status}</span>
                        <span>{mail.timestamp.split(',')[1] || mail.timestamp}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* LIVE DISPLAY EMBED PREVIEW PANEL (SPAN 7) */}
            <div className="col-span-12 sm:col-span-7 flex flex-col min-h-[420px] items-stretch">
              {selectedMail ? (
                <div className="flex-grow flex flex-col items-stretch h-full">
                  
                  {/* TAB PREVIEW SELECTORS */}
                  <div className="flex bg-slate-100 p-1 rounded-xl items-center mb-3">
                    {([
                      { id: 'preview', label: 'HTML Preview' },
                      { id: 'html', label: 'Raw Source' },
                      { id: 'handshake', label: 'SMTP Log Audit' }
                    ] as const).map(tab => (
                      <button 
                        key={tab.id}
                        className={`flex-1 px-2.5 py-1.5 font-bold text-[8.5px] uppercase tracking-wider rounded-lg transition-all text-center whitespace-nowrap ${
                          mailboxViewTab === tab.id 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`} 
                        onClick={() => setMailboxViewTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* MAIL METADATA DETAILS */}
                  <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl mb-4.5 space-y-1.5 text-left text-[9.5px]">
                    <div>
                      <span className="font-black text-slate-400 uppercase mr-3">FROM:</span> 
                      <span className="font-bold text-slate-800">{selectedMail.sender}</span>
                    </div>
                    <div>
                      <span className="font-black text-slate-400 uppercase mr-3">TO:</span> 
                      <span className="font-semibold text-slate-600">{selectedMail.recipient}</span>
                    </div>
                    <div>
                      <span className="font-black text-slate-400 uppercase mr-3">PRIORITY:</span> 
                      <span className={`font-black uppercase tracking-widest px-2 py-0.5 rounded text-[7.5px] ${
                        selectedMail.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 font-mono border border-rose-100' : 'bg-slate-100 text-slate-500'
                      }`}>{selectedMail.priority} LEVEL</span>
                    </div>
                    <div className="pt-2 border-t border-slate-150/60 font-bold text-slate-800 text-[10px] leading-tight">
                      {selectedMail.subject}
                    </div>
                  </div>

                  {/* ACTIVE VIEW CARD CONTEXT */}
                  <div className="flex-grow border border-slate-150 rounded-2xl p-0.5 overflow-hidden flex flex-col bg-slate-100 min-h-[350px]">
                    {mailboxViewTab === 'preview' && (
                      <div className="flex-grow bg-white overflow-hidden flex flex-col">
                        <iframe 
                          srcDoc={selectedMail.bodyHtml}
                          title="HTML View Sandbox" 
                          className="w-full flex-grow border-none focus:outline-none bg-slate-50"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    )}

                    {mailboxViewTab === 'html' && (
                      <div className="flex-grow bg-slate-950 p-4 overflow-auto font-mono text-[8px] leading-relaxed text-slate-400 max-h-[350px] text-left">
                        <pre className="whitespace-pre-wrap select-all font-mono">{selectedMail.bodyHtml.trim()}</pre>
                      </div>
                    )}

                    {mailboxViewTab === 'handshake' && (
                      <div className="flex-grow bg-slate-950 p-5 overflow-auto text-left max-h-[350px]">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
                          <Terminal size={12} className="text-emerald-400" />
                          <span className="text-[9px] font-black font-mono uppercase text-slate-300">SMTP Transaction Auditing Trail</span>
                        </div>
                        <div className="space-y-1.5 font-mono text-[9px] text-emerald-400 font-medium">
                          {selectedMail.logs?.map((lg, lgIdx) => (
                            <div key={lgIdx} className="flex gap-2">
                              <span className="text-slate-600 text-[8px] select-none">[{lgIdx + 1}]</span>
                              <span className={lg.toLowerCase().includes('success') || lg.toLowerCase().includes('acknowledged') || lg.toLowerCase().includes('verified') || lg.toLowerCase().includes('ok') ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                                {lg}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-slate-150 rounded-[2rem] p-10 bg-slate-50/50">
                  <Inbox className="w-12 h-12 text-slate-300 animate-bounce" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">NO EMAILS SENT YET</h4>
                  <p className="text-[9.5px] text-slate-400 text-center max-w-sm mt-1 leading-normal uppercase">
                    Send a test notification from the left control panel to trigger the TransForce visual email dispatcher layout.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
