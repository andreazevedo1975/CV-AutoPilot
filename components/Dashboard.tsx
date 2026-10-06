
// FIX: Implement the Dashboard component to display and manage job applications.
import React, { useState, useContext, useCallback } from 'react';
import { Application, ApplicationStatus } from '../types';
import { ThemeContext } from '../ThemeContext';
import { Phone, Mail, Bell, Download } from './icons';
import { RefreshCw, Zap, CheckCircle2, CloudSync, Clock, Target, ChevronRight, Send } from 'lucide-react';
import WeeklyApplicationsChart from './WeeklyApplicationsChart';
import DashboardComparativeCharts from './DashboardComparativeCharts';
import CareerInsights from './CareerInsights';
import { useBackgroundSync } from '../hooks/useBackgroundSync';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { BackgroundSyncModal } from './BackgroundSyncModal';

interface DashboardProps {
    applications: Application[];
    setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
    onNavigateToSWOT?: () => void;
    onNavigateToDispatcher?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ applications, setApplications, onNavigateToSWOT, onNavigateToDispatcher }) => {
    const { colors } = useContext(ThemeContext);
    const styles = getStyles(colors);
    const isOnline = useOnlineStatus();
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

    const handleSyncCompleted = useCallback((summary: any) => {
        setSyncToastMessage(`Background Sync (Workbox): ${summary.syncedCount} alteração(ões) sincronizada(s) com sucesso!`);
        setTimeout(() => setSyncToastMessage(null), 5000);
    }, []);

    const { pendingCount, pendingMutations, isSyncing, recordOfflineChange, syncNow } = useBackgroundSync(handleSyncCompleted);
    
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [jobUrl, setJobUrl] = useState('');
    const [dateApplied, setDateApplied] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<ApplicationStatus>(ApplicationStatus.Aplicou);
    const [reminderDate, setReminderDate] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!jobTitle || !companyName) return;
        const newApplication: Application = {
            id: new Date().toISOString(),
            jobTitle,
            companyName,
            dateApplied,
            status,
            jobUrl: jobUrl || undefined,
            phone: phone || undefined,
            email: email || undefined,
            reminderDate: reminderDate || undefined,
            notes: notes || undefined,
        };
        setApplications([...applications, newApplication]);

        // Registrar mutação no Background Sync se estiver sem conexão
        if (!isOnline) {
            recordOfflineChange(
                'APPLICATION_CREATE',
                newApplication.id,
                newApplication,
                `Nova candidatura "${newApplication.jobTitle}" em ${newApplication.companyName} gravada offline`
            );
        }

        setJobTitle('');
        setCompanyName('');
        setPhone('');
        setEmail('');
        setJobUrl('');
        setReminderDate('');
        setNotes('');
        setStatus(ApplicationStatus.Aplicou);
    };

    const updateApplication = (id: string, updates: Partial<Application>) => {
        const existing = applications.find(a => a.id === id);
        setApplications(prev => prev.map(app => app.id === id ? { ...app, ...updates } : app));

        // Registrar atualização no Background Sync do Workbox se estiver offline
        if (!isOnline && existing) {
            const desc = updates.status 
                ? `Status de "${existing.companyName} (${existing.jobTitle})" alterado para "${updates.status}"` 
                : `Candidatura "${existing.companyName}" atualizada offline`;
            recordOfflineChange(
                'APPLICATION_STATUS_UPDATE',
                id,
                updates,
                desc
            );
        }
    };

    const handleDismissReminder = (appId: string) => {
        setApplications(
            applications.map(app => 
                app.id === appId 
                ? { ...app, reminderDate: undefined, notes: undefined } 
                : app
            )
        );
    };

    const handleExportCSV = () => {
        if (applications.length === 0) return;
    
        const headers = [
            'ID', 'Cargo', 'Empresa', 'Data da Candidatura', 'URL da Vaga',
            'Status', 'Telefone', 'E-mail', 'Data do Lembrete', 'Anotações'
        ];
    
        const escapeCSV = (field: string | undefined | null): string => {
            if (field === undefined || field === null) return '';
            const str = String(field);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
    
        const csvRows = [
            headers.join(','),
            ...applications.map(app => [
                escapeCSV(app.id),
                escapeCSV(app.jobTitle),
                escapeCSV(app.companyName),
                escapeCSV(app.dateApplied),
                escapeCSV(app.jobUrl),
                escapeCSV(app.status),
                escapeCSV(app.phone),
                escapeCSV(app.email),
                escapeCSV(app.reminderDate),
                escapeCSV(app.notes)
            ].join(','))
        ];
    
        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `candidaturas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const today = new Date().toISOString().split('T')[0];
    
    // Sort reminders by date
    const reminders = applications
        .filter(app => app.reminderDate)
        .sort((a, b) => new Date(a.reminderDate!).getTime() - new Date(b.reminderDate!).getTime());

    // Data for the summary chart
    const statusCounts = Object.values(ApplicationStatus).reduce((acc, status) => {
        acc[status] = 0;
        return acc;
    }, {} as Record<ApplicationStatus, number>);

    applications.forEach(app => {
        if (statusCounts[app.status] !== undefined) {
            statusCounts[app.status]++;
        }
    });

    const totalApplications = applications.length;
    const maxCount = totalApplications > 0 ? Math.max(...Object.values(statusCounts)) : 1;

    const statusColors: Record<ApplicationStatus, string> = {
        [ApplicationStatus.Aplicou]: '#3b82f6',
        [ApplicationStatus.Visualizado]: '#a855f7',
        [ApplicationStatus.Entrevistando]: '#22c55e',
        [ApplicationStatus.Oferta]: '#f97316',
        [ApplicationStatus.Rejeitado]: '#ef4444',
        [ApplicationStatus.Ignorado]: '#718096',
    };

    const handleSeedSampleApplications = () => {
        const now = Date.now();
        const DAY = 86400000;
        const sampleApps: Application[] = [
            {
                id: 'sample-app-1',
                jobTitle: 'Senior Frontend Engineer',
                companyName: 'Nubank',
                dateApplied: new Date(now - 24 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Entrevistando,
                reminderDate: new Date(now + 2 * DAY).toISOString().split('T')[0],
                notes: 'Entrevista técnica de arquitetura React & System Design às 15h via Meet',
                email: 'tech-talent@nubank.com.br'
            },
            {
                id: 'sample-app-2',
                jobTitle: 'Tech Lead Full Stack',
                companyName: 'Mercado Livre',
                dateApplied: new Date(now - 20 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Entrevistando,
                reminderDate: new Date(now + 4 * DAY).toISOString().split('T')[0],
                notes: 'Conversa com Engineering Manager sobre liderança de squads',
                email: 'carreiras@mercadolivre.com'
            },
            {
                id: 'sample-app-3',
                jobTitle: 'Especialista React / TypeScript',
                companyName: 'Stone Co.',
                dateApplied: new Date(now - 14 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Entrevistando,
                reminderDate: new Date(now - 1 * DAY).toISOString().split('T')[0],
                notes: 'Desafio prático de código aprovado com nota máxima!',
                phone: '(11) 98765-4321'
            },
            {
                id: 'sample-app-4',
                jobTitle: 'Staff Software Engineer',
                companyName: 'PicPay',
                dateApplied: new Date(now - 11 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Entrevistando,
                reminderDate: new Date(now + 6 * DAY).toISOString().split('T')[0],
                notes: 'Apresentação de case técnico sobre escalabilidade financeira'
            },
            {
                id: 'sample-app-5',
                jobTitle: 'Arquiteto Cloud & Soluções',
                companyName: 'Itaú Unibanco',
                dateApplied: new Date(now - 18 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Visualizado,
                email: 'recrutamento@itau.com.br'
            },
            {
                id: 'sample-app-6',
                jobTitle: 'Engenheiro de Software Sênior',
                companyName: 'TOTVS',
                dateApplied: new Date(now - 9 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Aplicou
            },
            {
                id: 'sample-app-7',
                jobTitle: 'Líder Técnico de Front-End',
                companyName: 'XP Inc.',
                dateApplied: new Date(now - 5 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Aplicou
            },
            {
                id: 'sample-app-8',
                jobTitle: 'Product Engineer',
                companyName: 'QuintoAndar',
                dateApplied: new Date(now - 2 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Aplicou
            },
            {
                id: 'sample-app-9',
                jobTitle: 'Principal Software Engineer',
                companyName: 'Amazon Web Services',
                dateApplied: new Date(now - 28 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Oferta,
                reminderDate: new Date(now - 10 * DAY).toISOString().split('T')[0],
                notes: 'Oferta recebida para L6 Software Development Engineer!'
            },
            {
                id: 'sample-app-10',
                jobTitle: 'Desenvolvedor Frontend Sênior',
                companyName: 'B3 - Brasil, Bolsa, Balcão',
                dateApplied: new Date(now - 16 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Aplicou
            },
            {
                id: 'sample-app-11',
                jobTitle: 'Tech Lead React Native',
                companyName: 'Ambev Tech',
                dateApplied: new Date(now - 62 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Rejeitado,
                notes: 'Feedback educado: buscaram perfil mais voltado a iOS nativo.'
            },
            {
                id: 'sample-app-12',
                jobTitle: 'Staff Frontend Engineer',
                companyName: 'Localiza Labs',
                dateApplied: new Date(now - 55 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Rejeitado,
                notes: 'Processo pausado internamente pelo comitê executivo.'
            },
            {
                id: 'sample-app-13',
                jobTitle: 'Engineering Manager',
                companyName: 'BTG Pactual',
                dateApplied: new Date(now - 45 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Entrevistando,
                reminderDate: new Date(now - 35 * DAY).toISOString().split('T')[0],
                notes: 'Primeira fase com RH e liderança de engenharia concluída.'
            },
            {
                id: 'sample-app-14',
                jobTitle: 'Senior Software Engineer',
                companyName: 'Google Brasil',
                dateApplied: new Date(now - 40 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Rejeitado,
                notes: 'Posição sênior congelada para o trimestre.'
            },
            {
                id: 'sample-app-15',
                jobTitle: 'Arquiteto de Soluções Cloud',
                companyName: 'Microsoft Brasil',
                dateApplied: new Date(now - 34 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Entrevistando,
                reminderDate: new Date(now - 22 * DAY).toISOString().split('T')[0],
                notes: 'Entrevista técnica sobre Azure e microsserviços.'
            },
            {
                id: 'sample-app-16',
                jobTitle: 'Lead Frontend Developer',
                companyName: 'Loggi',
                dateApplied: new Date(now - 22 * DAY).toISOString().split('T')[0],
                status: ApplicationStatus.Rejeitado,
                notes: 'Processo finalizado com escolha de candidato interno.'
            }
        ];
        setApplications(sampleApps);
    };

    return (
        <div style={styles.container}>
            <div style={{ marginBottom: '20px' }}>
                <h1 style={styles.header}>Painel de Candidaturas</h1>
                <p style={{ color: colors.textSecondary, fontSize: '14px', margin: '4px 0 0 0' }}>
                    Gestão analítica de oportunidades, métricas de conversão de RH e agendamento de entrevistas.
                </p>
            </div>

            {/* Banner de Inteligência Estratégica: Análise SWOT Pessoal */}
            <div style={{
                backgroundColor: colors.surfaceElevated,
                border: `1px solid ${colors.primary}35`,
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: `${colors.primary}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.primary,
                        flexShrink: 0
                    }}>
                        <Target size={22} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: colors.textPrimary }}>
                                Análise SWOT Pessoal de Carreira (IA)
                            </h3>
                            <span style={{
                                padding: '2px 8px',
                                borderRadius: '100px',
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: `${colors.primary}20`,
                                color: colors.primary,
                                textTransform: 'uppercase'
                            }}>
                                Novo Módulo
                            </span>
                        </div>
                        <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
                            Diagnóstico estratégico de <strong>Forças, Fraquezas, Oportunidades e Ameaças</strong> cruzando suas {totalApplications} candidaturas e currículos cadastrados.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {onNavigateToDispatcher && (
                        <button
                            onClick={onNavigateToDispatcher}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '9px 16px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: colors.success,
                                border: '1px solid #10b981',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Send size={15} />
                            <span>Disparador de Currículo</span>
                        </button>
                    )}

                    {onNavigateToSWOT && (
                        <button
                            onClick={onNavigateToSWOT}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '9px 16px',
                                borderRadius: '8px',
                                backgroundColor: colors.primary,
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 10px rgba(136, 19, 55, 0.25)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span>Abrir Matriz SWOT</span>
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Insights de Carreira: Recharts - Evolução de Entrevistas Agendadas vs Negativas Recebidas por Mês */}
            <CareerInsights 
                applications={applications}
                onAddSampleData={handleSeedSampleApplications}
            />

            {/* Gráfico de Barras: Candidaturas Enviadas vs. Entrevistas Agendadas por Semana */}
            <WeeklyApplicationsChart 
                applications={applications} 
                onAddSampleData={handleSeedSampleApplications}
            />

            {/* Gráficos Comparativos: Taxa de Sucesso ao Longo dos Meses e Distribuição de Status com Recharts */}
            <DashboardComparativeCharts 
                applications={applications}
                onAddSampleData={handleSeedSampleApplications}
            />

            <div style={styles.summaryContainer}>
                <h2 style={{...styles.subHeader, marginTop: 0}}>Resumo das Candidaturas</h2>
                <div style={styles.chartContainer}>
                    {totalApplications > 0 ? (
                        Object.entries(statusCounts).map(([status, count]) => {
                            const barHeight = (count / maxCount) * 100;
                            return (
                                <div key={status} style={styles.barWrapper} title={`${count} candidatura(s)`}>
                                    <div style={styles.barCount}>{count}</div>
                                    <div style={{
                                        ...styles.bar,
                                        height: `${barHeight}%`,
                                        backgroundColor: statusColors[status as ApplicationStatus]
                                    }}></div>
                                    <div style={styles.barLabel}>{status}</div>
                                </div>
                            )
                        })
                    ) : (
                        <p style={{ color: colors.textSecondary }}>Nenhuma candidatura para exibir no resumo.</p>
                    )}
                </div>
            </div>

            {reminders.length > 0 && (
                <div style={styles.remindersContainer}>
                    <h2 style={styles.subHeader}>Próximas Entrevistas e Lembretes</h2>
                    <ul style={styles.list}>
                        {reminders.map(app => {
                            const isOverdue = app.reminderDate! < today;
                            const isToday = app.reminderDate! === today;
                            return (
                                <li key={`reminder-${app.id}`} style={styles.reminderItem}>
                                    <div style={{ flex: 1 }}>
                                        <strong>{app.jobTitle}</strong> em {app.companyName}
                                        <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                                            Data: {new Date(app.reminderDate!).toLocaleDateString()}
                                            {isOverdue && <span style={styles.overdueLabel}> (Atrasado)</span>}
                                            {isToday && <span style={{color: colors.primary, fontWeight: 'bold'}}> (Hoje)</span>}
                                        </div>
                                        {app.notes && <p style={styles.notesText}>{app.notes}</p>}
                                    </div>
                                    <button onClick={() => handleDismissReminder(app.id)} style={styles.dismissButton}>
                                        Concluir
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
            
            {/* Toast Feedback de Sincronização em Segundo Plano Concluída */}
            {syncToastMessage && (
                <div style={{
                    backgroundColor: '#065f46',
                    color: '#ffffff',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <span style={{ flex: 1 }}>{syncToastMessage}</span>
                    <button onClick={() => setSyncToastMessage(null)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '14px' }}>&times;</button>
                </div>
            )}

            {/* Banner de Sincronização em Segundo Plano (Workbox) se houver mutações pendentes */}
            {pendingCount > 0 && (
                <div style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#f59e0b',
                            flexShrink: 0
                        }}>
                            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '13.5px', color: colors.textPrimary }}>
                                    Background Sync (Workbox): {pendingCount} alteração{pendingCount > 1 ? 'ões' : ''} offline gravada{pendingCount > 1 ? 's' : ''}
                                </strong>
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                    color: isOnline ? '#10b981' : '#f59e0b'
                                }}>
                                    {isOnline ? 'Pronto para sincronizar' : 'Aguardando rede'}
                                </span>
                            </div>
                            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: colors.textSecondary, lineHeight: 1.4 }}>
                                {isOnline 
                                    ? 'A conexão com a internet foi restabelecida. O Workbox está reconciliando as candidaturas automaticamente.' 
                                    : 'Você está navegando offline. Todas as alterações de status e novas vagas estão seguras e serão enviadas quando a internet voltar.'}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isOnline && (
                            <button
                                type="button"
                                onClick={() => syncNow()}
                                disabled={isSyncing}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '7px 14px',
                                    borderRadius: '8px',
                                    backgroundColor: '#10b981',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: isSyncing ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsSyncModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 14px',
                                borderRadius: '8px',
                                backgroundColor: colors.surface,
                                color: colors.textPrimary,
                                border: `1px solid ${colors.border}`,
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <span>Ver Fila ({pendingCount})</span>
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.subHeader}>Adicionar Nova Candidatura</h2>
                <input style={styles.input} type="text" placeholder="Cargo" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
                <input style={styles.input} type="text" placeholder="Nome da Empresa" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                <input style={styles.input} type="tel" placeholder="Telefone (Opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <input style={styles.input} type="email" placeholder="E-mail de Contato (Opcional)" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input style={styles.input} type="url" placeholder="URL da Vaga (Opcional)" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
                <input style={styles.input} type="date" value={dateApplied} onChange={(e) => setDateApplied(e.target.value)} required />
                <select style={styles.select} value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>
                    {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {status === ApplicationStatus.Entrevistando && (
                    <div style={styles.reminderFields}>
                        <input style={styles.input} type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
                        <input style={styles.input} type="text" placeholder="Anotações (ex: Entrevista às 14h)" value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                )}
                <button style={styles.button} type="submit">Adicionar Candidatura</button>
            </form>

            <div style={styles.listContainer}>
                 <div style={styles.listHeader}>
                    <h2 style={{...styles.subHeader, border: 'none', marginTop: 0, paddingBottom: 0}}>Candidaturas Atuais</h2>
                    <button
                        onClick={handleExportCSV}
                        style={applications.length === 0 ? styles.exportButtonDisabled : styles.exportButton}
                        disabled={applications.length === 0}
                    >
                        <Download />
                        Exportar para CSV
                    </button>
                </div>
                {applications.length === 0 ? <p>Nenhuma candidatura ainda.</p> : (
                    <ul style={styles.list}>
                        {applications.map(app => {
                            const isPendingSync = pendingMutations.some(m => m.entityId === app.id);
                            return (
                             <li key={app.id} style={styles.listItem}>
                                <div style={{ flex: 1 }}>
                                    <strong style={{ display: 'flex', alignItems: 'center' }}>
                                        {app.jobTitle}
                                        {app.reminderDate && <Bell style={{ width: '16px', height: '16px', marginLeft: '8px', marginRight: '4px', color: colors.primary }} />}
                                    </strong> em {app.companyName}
                                    
                                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '8px' }}>
                                        <div style={{ marginBottom: '8px' }}>Candidatou-se em: {new Date(app.dateApplied).toLocaleDateString()}</div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                            <span>Status:</span>
                                            <select 
                                                value={app.status} 
                                                onChange={(e) => updateApplication(app.id, { status: e.target.value as ApplicationStatus })}
                                                style={styles.statusSelect}
                                            >
                                                {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            {isPendingSync && (
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                                    color: '#f59e0b',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <Clock size={12} /> Sync Pendente (Workbox)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {(app.phone || app.email) && (
                                        <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                            {app.phone && (
                                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                                    <Phone /> {app.phone}
                                                </span>
                                            )}
                                            {app.email && (
                                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                                    <Mail /> {app.email}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {app.status === ApplicationStatus.Entrevistando && (
                                        <div style={styles.inlineReminderForm}>
                                            <div style={{display:'flex', alignItems:'center', gap: '5px', marginBottom: '8px'}}>
                                                <Bell style={{ width: '14px', height: '14px', color: colors.primary }} />
                                                <span style={styles.miniLabel}>Agendar Entrevista:</span>
                                            </div>
                                            <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                                                <input 
                                                    type="date" 
                                                    value={app.reminderDate || ''} 
                                                    onChange={(e) => updateApplication(app.id, { reminderDate: e.target.value })}
                                                    style={styles.miniInput}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Detalhes (Link, Horário...)" 
                                                    value={app.notes || ''} 
                                                    onChange={(e) => updateApplication(app.id, { notes: e.target.value })}
                                                    style={{...styles.miniInput, flex: 1, minWidth: '150px'}}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginLeft: '15px' }}>
                                    {app.jobUrl && (
                                        <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" style={styles.linkButton}>
                                            Ver Vaga
                                        </a>
                                    )}
                                </div>
                            </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Modal de Gestão de Fila do Background Sync (Workbox) */}
            <BackgroundSyncModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                colors={colors}
            />

            <footer style={styles.footer}>
                Copyright by André Azevedo
            </footer>
        </div>
    );
};

const getStyles = (colors): { [key: string]: React.CSSProperties } => ({
    container: { maxWidth: '1200px', margin: '0 auto' },
    header: { color: colors.textPrimary, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' },
    subHeader: { color: colors.textPrimary, fontSize: '20px', fontWeight: '700', borderBottom: `1px solid ${colors.border}`, paddingBottom: '12px', marginTop: '36px', letterSpacing: '-0.01em' },
    form: { display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px', backgroundColor: colors.surface, borderRadius: '14px', border: `1px solid ${colors.border}`, boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.06)' },
    input: { padding: '12px 14px', fontSize: '15px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText, outline: 'none' },
    select: { padding: '12px 14px', fontSize: '15px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText, outline: 'none' },
    button: { padding: '12px 24px', fontSize: '15px', fontWeight: 600, color: colors.textOnPrimary, backgroundColor: colors.primary, border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.25)', transition: 'opacity 0.2s' },
    listContainer: { marginTop: '36px' },
    listHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
    },
    exportButton: {
        padding: '9px 16px',
        fontSize: '13px',
        fontWeight: 600,
        color: colors.textOnPrimary,
        backgroundColor: colors.primary,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    exportButtonDisabled: {
        padding: '9px 16px',
        fontSize: '13px',
        fontWeight: 600,
        color: colors.buttonDisabledText,
        backgroundColor: colors.buttonDisabledBg,
        border: 'none',
        borderRadius: '8px',
        cursor: 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    list: { listStyle: 'none', padding: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', padding: '18px', backgroundColor: colors.surface, borderRadius: '14px', border: `1px solid ${colors.border}`, marginBottom: '14px', boxShadow: colors.shadow || '0 2px 12px rgba(0,0,0,0.04)' },
    linkButton: {
        padding: '9px 14px',
        backgroundColor: colors.primary,
        color: colors.textOnPrimary,
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '13px',
        whiteSpace: 'nowrap',
    },
    reminderFields: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '10px',
        border: `1px solid ${colors.border}`,
        borderRadius: '4px',
        backgroundColor: colors.background,
    },
    remindersContainer: {
        padding: '20px',
        backgroundColor: colors.surface,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        marginBottom: '30px',
    },
    reminderItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: colors.background,
        borderRadius: '8px',
        borderLeft: `4px solid ${colors.primary}`,
        marginBottom: '10px',
    },
    overdueLabel: {
        color: colors.notification,
        fontWeight: 'bold',
    },
    notesText: {
        margin: '5px 0 0',
        color: colors.textPrimary,
        fontSize: '14px',
    },
    dismissButton: {
        padding: '8px 12px',
        backgroundColor: colors.success,
        color: colors.textOnPrimary,
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 500,
        fontSize: '14px',
        whiteSpace: 'nowrap',
        border: 'none',
        cursor: 'pointer',
    },
    summaryContainer: {
        padding: '20px',
        backgroundColor: colors.surface,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        marginBottom: '30px',
    },
    chartContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: '150px',
        width: '100%',
        padding: '10px 0',
    },
    barWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        textAlign: 'center',
    },
    barCount: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    bar: {
        width: '35px',
        borderRadius: '4px 4px 0 0',
        transition: 'height 0.3s ease-in-out',
        marginTop: '5px',
    },
    barLabel: {
        fontSize: '11px',
        color: colors.textSecondary,
        marginTop: '5px',
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        transform: 'rotate(180deg)',
        whiteSpace: 'nowrap',
    },
    footer: {
        marginTop: '40px',
        textAlign: 'center',
        fontSize: '14px',
        color: colors.textSecondary,
        paddingTop: '20px',
        borderTop: `1px solid ${colors.border}`
    },
    statusSelect: {
        padding: '6px',
        borderRadius: '4px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.inputBg,
        color: colors.inputText,
        fontSize: '14px',
        cursor: 'pointer'
    },
    inlineReminderForm: {
        marginTop: '12px',
        padding: '12px',
        backgroundColor: colors.background,
        borderRadius: '6px',
        border: `1px dashed ${colors.border}`,
    },
    miniInput: {
        padding: '6px',
        borderRadius: '4px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.inputBg,
        color: colors.inputText,
        fontSize: '14px'
    },
    miniLabel: {
        fontSize: '13px',
        fontWeight: '600',
        color: colors.textSecondary
    }
});

export default Dashboard;