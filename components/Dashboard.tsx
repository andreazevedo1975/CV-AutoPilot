// FIX: Implement the Dashboard component to display and manage job applications.
import React, { useState, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Application, ApplicationStatus } from '../types';
import { ThemeContext } from '../App';
import { Phone, Mail } from './icons';

const Dashboard: React.FC = () => {
    const { colors } = useContext(ThemeContext);
    const styles = getStyles(colors);

    const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [jobUrl, setJobUrl] = useState('');
    const [dateApplied, setDateApplied] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<ApplicationStatus>(ApplicationStatus.Aplicou);

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
        };
        setApplications([...applications, newApplication]);
        setJobTitle('');
        setCompanyName('');
        setPhone('');
        setEmail('');
        setJobUrl('');
    };
    
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Painel de Candidaturas</h1>
            
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
                <button style={styles.button} type="submit">Adicionar Candidatura</button>
            </form>

            <div style={styles.listContainer}>
                <h2 style={styles.subHeader}>Candidaturas Atuais</h2>
                {applications.length === 0 ? <p>Nenhuma candidatura ainda.</p> : (
                    <ul style={styles.list}>
                        {applications.map(app => (
                             <li key={app.id} style={styles.listItem}>
                                <div style={{ flex: 1 }}>
                                    <strong>{app.jobTitle}</strong> em {app.companyName}
                                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                                        <span>Candidatou-se em: {app.dateApplied}</span>
                                        <span style={{ marginLeft: '12px' }}>Status: {app.status}</span>
                                    </div>
                                    {(app.phone || app.email) && (
                                        <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
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
                                </div>
                                <div>
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
    list: { listStyle: 'none', padding: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: colors.surface, borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '10px' },
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
    footer: {
        marginTop: '40px',
        textAlign: 'center',
        fontSize: '14px',
        color: colors.textSecondary,
        paddingTop: '20px',
        borderTop: `1px solid ${colors.border}`
    }
});

export default Dashboard;