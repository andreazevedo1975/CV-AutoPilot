// FIX: Implement the Dashboard component to display and manage job applications.
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Application, ApplicationStatus } from '../types';

const Dashboard: React.FC = () => {
    const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
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
        };
        setApplications([...applications, newApplication]);
        setJobTitle('');
        setCompanyName('');
        setJobUrl('');
    };
    
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Painel de Candidaturas</h1>
            
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.subHeader}>Adicionar Nova Candidatura</h2>
                <input style={styles.input} type="text" placeholder="Cargo" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
                <input style={styles.input} type="text" placeholder="Nome da Empresa" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
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
                                    <div style={{ fontSize: '14px', color: '#777', marginTop: '4px' }}>
                                        <span>Candidatou-se em: {app.dateApplied}</span>
                                        <span style={{ marginLeft: '12px' }}>Status: {app.status}</span>
                                    </div>
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
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '800px' },
    header: { color: '#333' },
    subHeader: { color: '#555', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginTop: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', },
    input: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' },
    select: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' },
    button: { padding: '10px 20px', fontSize: '16px', color: '#fff', backgroundColor: '#1967d2', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    listContainer: { marginTop: '30px' },
    list: { listStyle: 'none', padding: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '10px' },
    linkButton: {
        padding: '8px 12px',
        backgroundColor: '#e8f0fe',
        color: '#1967d2',
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 500,
        fontSize: '14px',
        whiteSpace: 'nowrap',
    }
};

export default Dashboard;