import React, { useState } from 'react';
import { Lead } from '../types';
import { findLeads } from '../services/geminiService';

type JobType = 'Todos' | 'Presencial' | 'Home Office' | 'Híbrido';
type SearchSource = 'empresas' | 'sociais';

const LeadFinder: React.FC = () => {
    const [jobTitle, setJobTitle] = useState('');
    const [location, setLocation] = useState('');
    const [jobType, setJobType] = useState<JobType>('Todos');
    const [searchSource, setSearchSource] = useState<SearchSource>('empresas');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!jobTitle) {
            setError('Por favor, insira um cargo desejado.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setLeads([]);

        try {
            const results = await findLeads(jobTitle, location, jobType, searchSource);
            setLeads(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadCsv = () => {
        if (leads.length === 0) return;

        const header = ['Fonte', 'Informação de Contato', 'Notas'];
        const rows = leads.map(lead => [
            `"${lead.companyName.replace(/"/g, '""')}"`,
            `"${lead.contactInfo.replace(/"/g, '""')}"`,
            `"${lead.notes.replace(/"/g, '""')}"`
        ]);

        const csvContent = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_${jobTitle.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEmail = (lead: Lead) => {
        if (!lead.contactInfo.includes('@')) return; // Not an email

        const subject = encodeURIComponent(`Candidatura para ${jobTitle} - [Seu Nome]`);
        const body = encodeURIComponent(`Prezados recrutadores da ${lead.companyName},

Escrevo para expressar meu grande interesse em oportunidades na área de ${jobTitle}.

Encontrei o contato de sua empresa através de uma pesquisa e acredito que minhas habilidades e experiências são compatíveis com o perfil que buscam.

Segue em anexo o meu currículo para sua apreciação.

Agradeço a atenção e coloco-me à disposição.

Atenciosamente,

[Seu Nome]
`);
        window.location.href = `mailto:${lead.contactInfo}?subject=${subject}&body=${body}`;
    };

    const jobTitlePlaceholder = searchSource === 'empresas' 
        ? "Cargo Desejado (ex: Desenvolvedor Frontend)" 
        : "Cargo ou Hashtag (ex: Vagas Desenvolvedor, #vagasti)";

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Buscador de Leads</h1>
            <p style={styles.description}>
                Encontre contatos públicos de empresas, posts em redes sociais ou hashtags para prospecção ativa. A IA buscará e-mails de RH, páginas de carreira ou links relevantes, respeitando a privacidade (LGPD).
            </p>

            <div style={styles.form}>
                <div style={styles.inputGroup}>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder={jobTitlePlaceholder}
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                    />
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Localização (ex: São Paulo) (Opcional)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>
                
                <div style={styles.filterContainer}>
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Tipo de Vaga:</label>
                        {(['Todos', 'Presencial', 'Home Office', 'Híbrido'] as JobType[]).map(type => (
                            <label key={type} style={styles.radioLabel}>
                                <input type="radio" value={type} name="jobType" checked={jobType === type} onChange={e => setJobType(e.target.value as JobType)} />
                                {type}
                            </label>
                        ))}
                    </div>
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Buscar em:</label>
                        <label style={styles.radioLabel}>
                            <input type="radio" value="empresas" name="searchSource" checked={searchSource === 'empresas'} onChange={e => setSearchSource(e.target.value as SearchSource)} />
                            Empresas e Sites
                        </label>
                        <label style={styles.radioLabel}>
                            <input type="radio" value="sociais" name="searchSource" checked={searchSource === 'sociais'} onChange={e => setSearchSource(e.target.value as SearchSource)} />
                            Redes Sociais
                        </label>
                    </div>
                </div>

                <button style={styles.button} onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? 'Buscando...' : 'Buscar Leads'}
                </button>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            {leads.length > 0 && (
                <div style={styles.resultsContainer}>
                    <div style={styles.resultsHeader}>
                        <h2 style={styles.subHeader}>Resultados Encontrados</h2>
                        <button style={styles.downloadButton} onClick={handleDownloadCsv}>
                            Baixar Lista (CSV)
                        </button>
                    </div>
                    <ul style={styles.list}>
                        {leads.map((lead, index) => (
                            <li key={index} style={styles.listItem}>
                                <div style={styles.leadInfo}>
                                    <strong>{lead.companyName}</strong>
                                    <p style={styles.contactInfo}>
                                        <a href={lead.contactInfo.startsWith('http') ? lead.contactInfo : `mailto:${lead.contactInfo}`} target="_blank" rel="noopener noreferrer">{lead.contactInfo}</a>
                                    </p>
                                    <p style={styles.notes}><em>{lead.notes}</em></p>
                                </div>
                                {lead.contactInfo.includes('@') && (
                                    <button style={styles.emailButton} onClick={() => handleEmail(lead)}>Enviar E-mail</button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '800px' },
    header: { color: '#333' },
    description: { color: '#555', marginBottom: '20px', lineHeight: 1.5 },
    subHeader: { color: '#555', margin: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' },
    filterContainer: { display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    filterLabel: { fontWeight: 'bold', color: '#555', marginBottom: '5px' },
    radioLabel: { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' },
    button: { padding: '12px 20px', fontSize: '16px', color: '#fff', backgroundColor: '#1967d2', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    error: { color: 'red', textAlign: 'center', marginTop: '10px' },
    resultsContainer: { marginTop: '30px' },
    resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    downloadButton: { padding: '10px 15px', fontSize: '14px', color: '#fff', backgroundColor: '#34a853', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    list: { listStyle: 'none', padding: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' },
    leadInfo: { flex: '1 1 300px' },
    contactInfo: { margin: '5px 0', color: '#333', wordBreak: 'break-all' },
    notes: { margin: '5px 0', color: '#666', fontSize: '14px' },
    emailButton: { padding: '8px 12px', fontSize: '14px', color: '#1967d2', backgroundColor: '#e8f0fe', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
};

export default LeadFinder;