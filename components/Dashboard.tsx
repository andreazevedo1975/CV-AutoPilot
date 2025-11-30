
// FIX: Implement the Dashboard component to display and manage job applications.
import React, { useState, useContext } from 'react';
import { Application, ApplicationStatus } from '../types';
import { ThemeContext } from '../App';
import { Phone, Mail, Bell, Download } from './icons';

interface DashboardProps {
    applications: Application[];
    setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ applications, setApplications }) => {
    const { colors } = useContext(ThemeContext);
    const styles = getStyles(colors);
    
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
        setApplications(prev => prev.map(app => app.id === id ? { ...app, ...updates } : app));
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

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Painel de Candidaturas</h1>

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
                        {applications.map(app => (
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
                        ))}
                    </ul>
                )}
            </div>
            <footer style={styles.footer}>
                Copyright by André Azevedo
            </footer>
        </div>
    );
};

const getStyles = (colors): { [key: string]: React.CSSProperties } => ({
    container: { maxWidth: '800px' },
    header: { color: colors.primary },
    subHeader: { color: colors.primary, borderBottom: `1px solid ${colors.border}`, paddingBottom: '10px', marginTop: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', backgroundColor: colors.surface, borderRadius: '8px', border: `1px solid ${colors.border}`, },
    input: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText },
    select: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText },
    button: { padding: '10px 20px', fontSize: '16px', color: colors.textOnPrimary, backgroundColor: colors.primary, border: 'none', borderRadius: '4px', cursor: 'pointer' },
    listContainer: { marginTop: '30px' },
    listHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
    },
    exportButton: {
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 500,
        color: colors.textOnPrimary,
        backgroundColor: colors.primary,
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    exportButtonDisabled: {
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 500,
        color: colors.buttonDisabledText,
        backgroundColor: colors.buttonDisabledBg,
        border: 'none',
        borderRadius: '4px',
        cursor: 'not-allowed',
        display: 'flex',
        alignItems: 'center',
    },
    list: { listStyle: 'none', padding: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '15px', backgroundColor: colors.surface, borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '10px' },
    linkButton: {
        padding: '8px 12px',
        backgroundColor: colors.primary,
        color: colors.textOnPrimary,
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 500,
        fontSize: '14px',
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
