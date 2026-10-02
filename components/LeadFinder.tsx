import React, { useState, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
    CandidateProfile, 
    CandidateStatus, 
    LocalJob, 
    WorkModel, 
    Application, 
    ApplicationStatus, 
    EmailTemplate, 
    CV,
    RHPlatformAccount
} from '../types';
import { DEFAULT_RH_PLATFORMS } from '../constants/rhPlatforms';
import { INITIAL_CANDIDATES_360, INITIAL_JOBS_360 } from '../constants/initialTalents';
import { RHPlatformManager } from './RHPlatformManager';
import { 
    searchLocalCandidates, 
    searchLocalJobs, 
    calculateRegionalJobHeatmap,
    fetchCityNeighborhoodsLive 
} from '../services/geminiService';
import { 
    BRAZIL_STATES, 
    getCitiesByState, 
    getNeighborhoodsByCity 
} from '../constants/brazilLocations';
export { BRAZIL_STATES };
import { JobRegionalHeatmap } from './JobRegionalHeatmap';
import { JobTailoredCVBuilder } from './JobTailoredCVBuilder';
import { JobMatchAnalyzer } from './JobMatchAnalyzer';
import { SearchableSelectDropdown } from './SearchableSelectDropdown';
import { ThemeContext } from '../App';
import { 
    SearchIcon, 
    MapPinIcon, 
    DatabaseIcon, 
    UserCheckIcon, 
    ExternalLinkIcon, 
    BuildingIcon, 
    Briefcase, 
    CheckCircleIcon, 
    EyeIcon, 
    Copy, 
    Download, 
    Pencil, 
    Trash, 
    Mail,
    Phone,
    Sparkles,
    ArrowLeft,
    Check,
    Target
} from './icons';
import { resolveCandidateContact, buildWhatsAppUrl, buildMailtoUrl } from '../utils/contactUtils';

type ActiveTab = 'candidates' | 'jobs' | 'platforms' | 'database' | 'templates';

const LeadFinder: React.FC = () => {
    const { colors } = useContext(ThemeContext);
    const styles = useMemo(() => getStyles(colors), [colors]);

    const [activeTab, setActiveTab] = useState<ActiveTab>('candidates');

    // Storage: Candidate Database (Talent Pool) & Applications
    const [candidateDatabase, setCandidateDatabase] = useLocalStorage<CandidateProfile[]>('candidateDatabase', []);
    const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
    const [templates, setTemplates] = useLocalStorage<EmailTemplate[]>('emailTemplates', [
        { id: '1', name: 'Convite para Entrevista', body: 'Olá [candidato], identificamos seu perfil para a vaga de [cargo] em [empresa]. Seu currículo chamou atenção da nossa equipe técnica e gostaríamos de agendar uma breve conversa.' },
        { id: '2', name: 'Sourcing Proativo', body: 'Olá [candidato], sou recrutador e acompanho profissionais de destaque na região de [localizacao]. Temos uma oportunidade aderente às suas competências.' }
    ]);
    const [userName, setUserName] = useLocalStorage<string>('userName', '');

    // RH Platform Accounts (Catho, Empregos, LinkedIn, InfoJobs, Gupy, Vagas)
    const [rhPlatforms, setRhPlatforms] = useLocalStorage<RHPlatformAccount[]>(
        'rh_platform_accounts_v1',
        DEFAULT_RH_PLATFORMS
    );
    const [selectedCandPortals, setSelectedCandPortals] = useState<string[]>([
        'Catho',
        'Empregos.com.br',
        'LinkedIn',
        'InfoJobs',
        'Gupy',
        'Vagas.com',
        'Web 360°'
    ]);
    const [selectedJobPortals, setSelectedJobPortals] = useState<string[]>([
        'Catho',
        'Empregos.com.br',
        'LinkedIn',
        'InfoJobs',
        'Gupy',
        'Vagas.com',
        'Web 360°'
    ]);

    // State: Candidate Search (Recruiter Mode)
    const [candKeyword, setCandKeyword] = useState('Desenvolvedor React');
    const [candState, setCandState] = useState('SP');
    const [candCity, setCandCity] = useState('SÃO PAULO');
    const [candNeighborhood, setCandNeighborhood] = useState('Todos');
    const [candNeighborhoodsList, setCandNeighborhoodsList] = useState<string[]>(() => 
        getNeighborhoodsByCity('SP', 'São Paulo')
    );
    const [isEnrichingCandNeighborhoods, setIsEnrichingCandNeighborhoods] = useState(false);
    const [candSeniority, setCandSeniority] = useState('Todos');
    const [candSkills, setCandSkills] = useState('');
    const [foundCandidates, setFoundCandidates] = useState<CandidateProfile[]>(INITIAL_CANDIDATES_360);
    const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
    const [candidateSearchError, setCandidateSearchError] = useState<string | null>(null);

    // Dynamic Filter & Sort for Candidate Search Results
    const [candFilterPortal, setCandFilterPortal] = useState<string>('Todos');
    const [candFilterSeniority, setCandFilterSeniority] = useState<string>('Todos');
    const [candSortBy, setCandSortBy] = useState<'match' | 'name'>('match');

    const displayedCandidates = useMemo(() => {
        let list = [...foundCandidates];
        if (candFilterSeniority !== 'Todos') {
            const query = candFilterSeniority.toLowerCase();
            list = list.filter(c => {
                const h = (c.headline || '').toLowerCase();
                const s = (c.summary || '').toLowerCase();
                return h.includes(query) || s.includes(query);
            });
        }
        if (candFilterPortal !== 'Todos') {
            list = list.filter(c => (c.portalSource || '').toLowerCase() === candFilterPortal.toLowerCase());
        }
        if (candSortBy === 'match') {
            list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        } else {
            list.sort((a, b) => a.name.localeCompare(b.name));
        }
        return list;
    }, [foundCandidates, candFilterSeniority, candFilterPortal, candSortBy]);

    // State: Local Job Search (Candidate Mode)
    const [jobKeyword, setJobKeyword] = useState('Desenvolvedor Frontend');
    const [jobState, setJobState] = useState('SP');
    const [jobCity, setJobCity] = useState('SÃO PAULO');
    const [jobNeighborhood, setJobNeighborhood] = useState('Todos');
    const [jobNeighborhoodsList, setJobNeighborhoodsList] = useState<string[]>(() => 
        getNeighborhoodsByCity('SP', 'São Paulo')
    );
    const [isEnrichingJobNeighborhoods, setIsEnrichingJobNeighborhoods] = useState(false);
    const [jobWorkModel, setJobWorkModel] = useState<WorkModel>('Todos');
    const [foundJobs, setFoundJobs] = useState<LocalJob[]>(INITIAL_JOBS_360);
    const [isSearchingJobs, setIsSearchingJobs] = useState(false);
    const [jobSearchError, setJobSearchError] = useState<string | null>(null);

    // Filter state for Talent Database
    const [dbSearchTerm, setDbSearchTerm] = useState('');
    const [dbStatusFilter, setDbStatusFilter] = useState<string>('Todos');
    const [dbStateFilter, setDbStateFilter] = useState<string>('Todos');

    // Modals state
    const [selectedCandidateCv, setSelectedCandidateCv] = useState<CandidateProfile | null>(null);
    const [contactingCandidate, setContactingCandidate] = useState<CandidateProfile | null>(null);
    const [tailoringJob, setTailoringJob] = useState<LocalJob | null>(null);
    const [analyzingJobMatch, setAnalyzingJobMatch] = useState<LocalJob | null>(null);
    const [contactSubject, setContactSubject] = useState('');
    const [contactBody, setContactBody] = useState('');
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | { name: string; body: string }>({ name: '', body: '' });
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Dynamic Regional Job Heatmap Data (Recharts)
    const regionalHeatmapData = useMemo(() => {
        return calculateRegionalJobHeatmap(jobKeyword, foundJobs);
    }, [jobKeyword, foundJobs]);

    // Helper to show transient toast message
    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Live Enrichment of Neighborhoods via Correios / Google / IBGE
    const handleEnrichCandNeighborhoods = async () => {
        if (!candCity.trim()) return;
        setIsEnrichingCandNeighborhoods(true);
        try {
            const live = await fetchCityNeighborhoodsLive(candCity.trim(), candState);
            if (live && live.length > 0) {
                setCandNeighborhoodsList(live);
                showToast(`${live.length} bairros oficiais de ${candCity} atualizados via Correios & Google!`);
            }
        } catch {
            showToast('Não foi possível consultar bairros adicionais no momento.');
        } finally {
            setIsEnrichingCandNeighborhoods(false);
        }
    };

    const handleEnrichJobNeighborhoods = async () => {
        if (!jobCity.trim()) return;
        setIsEnrichingJobNeighborhoods(true);
        try {
            const live = await fetchCityNeighborhoodsLive(jobCity.trim(), jobState);
            if (live && live.length > 0) {
                setJobNeighborhoodsList(live);
                showToast(`${live.length} bairros oficiais de ${jobCity} atualizados via Correios & Google!`);
            }
        } catch {
            showToast('Não foi possível consultar bairros adicionais no momento.');
        } finally {
            setIsEnrichingJobNeighborhoods(false);
        }
    };

    // Candidate Search Action
    const handleSearchCandidates = async () => {
        if (!candKeyword.trim()) {
            setCandidateSearchError('Informe a palavra-chave ou especialidade do candidato.');
            return;
        }
        if (!candCity.trim()) {
            setCandidateSearchError('Informe a cidade da busca local.');
            return;
        }

        setIsSearchingCandidates(true);
        setCandidateSearchError(null);
        setFoundCandidates([]);

        try {
            const authenticatedPortals = rhPlatforms
                .filter(p => p.hasCredentials && p.enabledForSearch)
                .map(p => ({
                    name: p.name,
                    accountType: p.accountType,
                    usernameOrEmail: p.usernameOrEmail,
                    hasCredentials: p.hasCredentials,
                }));

            const targetCandNeighborhood = (candNeighborhood && candNeighborhood.toLowerCase() !== 'todos')
                ? candNeighborhood.trim()
                : undefined;

            const results = await searchLocalCandidates({
                keyword: candKeyword.trim(),
                state: candState,
                city: candCity.trim(),
                neighborhood: targetCandNeighborhood,
                seniority: candSeniority !== 'Todos' ? candSeniority : undefined,
                skills: candSkills.trim() || undefined,
                targetPortals: selectedCandPortals,
                authenticatedPortals,
            });
            setFoundCandidates(results);
            if (results.length === 0) {
                setCandidateSearchError('Nenhum candidato encontrado com esses parâmetros específicos. Experimente termos mais amplos.');
            }
        } catch (err: any) {
            setCandidateSearchError(err.message || 'Erro ao realizar a busca de candidatos.');
        } finally {
            setIsSearchingCandidates(false);
        }
    };

    // Job Search Action (Reverse Path)
    const handleSearchJobs = async () => {
        if (!jobKeyword.trim()) {
            setJobSearchError('Informe a palavra-chave ou cargo que você busca.');
            return;
        }
        if (!jobCity.trim()) {
            setJobSearchError('Informe a cidade para a busca de vagas.');
            return;
        }

        setIsSearchingJobs(true);
        setJobSearchError(null);
        setFoundJobs([]);

        try {
            const authenticatedPortals = rhPlatforms
                .filter(p => p.hasCredentials && p.enabledForSearch)
                .map(p => ({
                    name: p.name,
                    accountType: p.accountType,
                    usernameOrEmail: p.usernameOrEmail,
                    hasCredentials: p.hasCredentials,
                }));

            const targetJobNeighborhood = (jobNeighborhood && jobNeighborhood.toLowerCase() !== 'todos')
                ? jobNeighborhood.trim()
                : undefined;

            const results = await searchLocalJobs({
                keyword: jobKeyword.trim(),
                state: jobState,
                city: jobCity.trim(),
                neighborhood: targetJobNeighborhood,
                workModel: jobWorkModel !== 'Todos' ? jobWorkModel : undefined,
                targetPortals: selectedJobPortals,
                authenticatedPortals,
            });
            setFoundJobs(results);
            if (results.length === 0) {
                setJobSearchError('Nenhuma vaga recente encontrada com esses parâmetros. Tente outra modalidade ou cargo relacionado.');
            }
        } catch (err: any) {
            setJobSearchError(err.message || 'Erro ao realizar a busca de vagas.');
        } finally {
            setIsSearchingJobs(false);
        }
    };

    // Save single candidate to Database
    const handleSaveCandidateToDb = (candidate: CandidateProfile) => {
        const exists = candidateDatabase.some(c => c.id === candidate.id || (c.name.toLowerCase() === candidate.name.toLowerCase() && c.location.city.toLowerCase() === candidate.location.city.toLowerCase()));
        if (exists) {
            showToast(`O candidato ${candidate.name} já está no Banco de Talentos.`);
            return;
        }

        const candidateToSave: CandidateProfile = {
            ...candidate,
            addedAt: new Date().toISOString(),
            status: candidate.status || 'Novo'
        };

        setCandidateDatabase(prev => [candidateToSave, ...prev]);
        showToast(`Candidato ${candidate.name} salvo no Banco de Talentos!`);
    };

    // Save all found candidates to Database
    const handleSaveAllCandidatesToDb = () => {
        if (foundCandidates.length === 0) return;
        let addedCount = 0;
        const newDb = [...candidateDatabase];

        foundCandidates.forEach(cand => {
            const exists = newDb.some(c => c.id === cand.id || (c.name.toLowerCase() === cand.name.toLowerCase() && c.location.city.toLowerCase() === cand.location.city.toLowerCase()));
            if (!exists) {
                newDb.unshift({
                    ...cand,
                    addedAt: new Date().toISOString(),
                    status: 'Novo'
                });
                addedCount++;
            }
        });

        setCandidateDatabase(newDb);
        showToast(`${addedCount} novos candidatos foram salvos no Banco de Talentos!`);
    };

    // Update candidate status in database
    const handleUpdateCandidateStatus = (candidateId: string, newStatus: CandidateStatus) => {
        setCandidateDatabase(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
        showToast(`Status atualizado para: ${newStatus}`);
    };

    // Delete candidate from database
    const handleDeleteCandidate = (candidateId: string) => {
        if (window.confirm('Tem certeza que deseja remover este candidato do banco de talentos?')) {
            setCandidateDatabase(prev => prev.filter(c => c.id !== candidateId));
            showToast('Candidato removido do banco.');
        }
    };

    // Save job to Application Dashboard
    const handleSaveJobToApplications = (job: LocalJob) => {
        const exists = applications.some(app => app.jobTitle.toLowerCase() === job.title.toLowerCase() && app.companyName.toLowerCase() === job.company.toLowerCase());
        if (exists) {
            showToast('Esta vaga já está registrada no seu Painel de Candidaturas.');
            return;
        }

        const newApp: Application = {
            id: `app-${Date.now()}`,
            jobTitle: job.title,
            companyName: job.company,
            dateApplied: new Date().toISOString().split('T')[0],
            jobUrl: job.applyUrlOrContact.startsWith('http') ? job.applyUrlOrContact : undefined,
            status: ApplicationStatus.Visualizado,
            notes: `Local: ${job.location.neighborhood || ''}, ${job.location.city} - ${job.location.state}. Modalidade: ${job.workModel}. Salário: ${job.salaryOrRange || 'A combinar'}.`
        };

        setApplications(prev => [newApp, ...prev]);
        showToast(`Vaga salva no Painel de Candidaturas com sucesso!`);
    };

    // Copy text helper
    const handleCopyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`${label} copiado para a área de transferência!`);
        });
    };

    // Export Candidates to CSV
    const handleExportCandidatesCSV = () => {
        if (candidateDatabase.length === 0) return;
        const headers = ['Nome', 'Cargo/Headline', 'Estado', 'Cidade', 'Bairro', 'Status', 'Competências', 'Formação', 'LinkedIn', 'E-mail', 'Fontes/Links'];
        
        const escapeCSV = (val: string | undefined | null) => {
            if (!val) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        };

        const rows = candidateDatabase.map(c => [
            escapeCSV(c.name),
            escapeCSV(c.headline),
            escapeCSV(c.location.state),
            escapeCSV(c.location.city),
            escapeCSV(c.location.neighborhood),
            escapeCSV(c.status),
            escapeCSV(c.skills.join(', ')),
            escapeCSV(c.education),
            escapeCSV(c.contactInfo?.linkedin),
            escapeCSV(c.contactInfo?.email),
            escapeCSV(c.sourceUrls?.map(s => s.uri).join(' | '))
        ].join(','));

        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `banco_talentos_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Exportação CSV gerada com sucesso!');
    };

    // Export Candidates to JSON
    const handleExportCandidatesJSON = () => {
        if (candidateDatabase.length === 0) return;
        const jsonContent = JSON.stringify(candidateDatabase, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `banco_talentos_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Arquivo JSON exportado com sucesso!');
    };

    // Filtered candidates in database
    const filteredDbCandidates = useMemo(() => {
        return candidateDatabase.filter(c => {
            const matchesSearch = !dbSearchTerm || 
                c.name.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
                c.headline.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
                c.skills.some(s => s.toLowerCase().includes(dbSearchTerm.toLowerCase())) ||
                c.location.city.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
                (c.location.neighborhood && c.location.neighborhood.toLowerCase().includes(dbSearchTerm.toLowerCase()));

            const matchesStatus = dbStatusFilter === 'Todos' || c.status === dbStatusFilter;
            const matchesState = dbStateFilter === 'Todos' || c.location.state === dbStateFilter;

            return matchesSearch && matchesStatus && matchesState;
        });
    }, [candidateDatabase, dbSearchTerm, dbStatusFilter, dbStateFilter]);

    // Open contact modal
    const openContactModal = (candidate: CandidateProfile) => {
        setContactingCandidate(candidate);
        setContactSubject(`Oportunidade Profissional - ${candidate.headline}`);
        const defaultTpl = templates[0]?.body || 'Olá [candidato], identificamos seu perfil e temos grande interesse em seu histórico profissional.';
        setContactBody(
            defaultTpl
                .replace(/\[candidato\]/gi, candidate.name.split(' ')[0] || 'Candidato')
                .replace(/\[cargo\]/gi, candidate.headline)
                .replace(/\[localizacao\]/gi, `${candidate.location.city} - ${candidate.location.state}`)
                .replace(/\[empresa\]/gi, 'nossa organização')
        );
    };

    // Send email or open mailto
    const handleSendContact = () => {
        if (!contactingCandidate) return;
        const email = contactingCandidate.contactInfo?.email;
        const mailtoUri = `mailto:${email || ''}?subject=${encodeURIComponent(contactSubject)}&body=${encodeURIComponent(contactBody)}`;
        window.location.href = mailtoUri;
        setContactingCandidate(null);
        showToast('Cliente de e-mail aberto.');
    };

    // Selected cities for active state
    const currentCandidateCities = useMemo(() => {
        return BRAZIL_STATES.find(s => s.uf === candState)?.cities || [];
    }, [candState]);

    const currentJobCities = useMemo(() => {
        return BRAZIL_STATES.find(s => s.uf === jobState)?.cities || [];
    }, [jobState]);

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.headerBox}>
                <div style={styles.headerTitleRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '28px' }}>🎯</span>
                        <div>
                            <h1 style={styles.headerTitle}>Pesquisa 360° de Candidatos & Currículos Locais</h1>
                            <p style={styles.headerSubtitle}>
                                Varredura inteligente de candidatos e vagas por estado, cidade e bairro com dados dos Correios, Google e IBGE. Conexão direta com plataformas de RH e arquivamento em banco de talentos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div style={styles.tabNav}>
                    <button
                        style={activeTab === 'candidates' ? styles.tabButtonActive : styles.tabButton}
                        onClick={() => setActiveTab('candidates')}
                    >
                        <UserCheckIcon style={{ width: '18px', height: '18px', marginRight: '6px' }} />
                        Pesquisa 360° de Candidatos & Currículos Locais
                    </button>
                    <button
                        style={activeTab === 'jobs' ? styles.tabButtonActive : styles.tabButton}
                        onClick={() => setActiveTab('jobs')}
                    >
                        <Briefcase />
                        Buscar Vagas Locais
                    </button>
                    <button
                        style={activeTab === 'platforms' ? styles.tabButtonActive : styles.tabButton}
                        onClick={() => setActiveTab('platforms')}
                    >
                        <span style={{ marginRight: '6px', fontSize: '15px' }}>🔐</span>
                        Portais de RH & Acessos
                        {rhPlatforms.filter(p => p.hasCredentials).length > 0 && (
                            <span style={{
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '1px 7px',
                                borderRadius: '10px',
                                marginLeft: '6px'
                            }}>
                                {rhPlatforms.filter(p => p.hasCredentials).length} Conectados
                            </span>
                        )}
                    </button>
                    <button
                        style={activeTab === 'database' ? styles.tabButtonActive : styles.tabButton}
                        onClick={() => setActiveTab('database')}
                    >
                        <DatabaseIcon style={{ width: '18px', height: '18px', marginRight: '6px' }} />
                        Banco de Talentos & Currículos
                        <span style={styles.countBadge}>{candidateDatabase.length}</span>
                    </button>
                    <button
                        style={activeTab === 'templates' ? styles.tabButtonActive : styles.tabButton}
                        onClick={() => setActiveTab('templates')}
                    >
                        <Mail />
                        Modelos de Mensagem
                    </button>
                </div>
            </div>

            {/* Toast feedback */}
            {toastMessage && (
                <div style={styles.toast}>
                    <CheckCircleIcon style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    {toastMessage}
                </div>
            )}

            {/* TAB 1: BUSCAR CANDIDATOS LOCAIS */}
            {activeTab === 'candidates' && (
                <div>
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>Pesquisa 360° de Candidatos & Currículos Locais</h2>
                            <p style={styles.cardDesc}>
                                A IA rastreia menções, links, portfólios, perfis públicos no LinkedIn, GitHub, Lattes e plataformas abertas, filtrando com precisão por <strong>Estado (UF)</strong>, <strong>Cidade</strong> e <strong>Bairro</strong>.
                            </p>
                        </div>

                        <div style={styles.formGrid}>
                            <div style={styles.fieldColFull}>
                                <label style={styles.fieldLabel}>Palavra-Chave / Cargo / Especialidade *</label>
                                <input
                                    style={styles.input}
                                    placeholder="Ex: Desenvolvedor React, Eletricista Predial, Nutricionista, Vendedora, etc."
                                    value={candKeyword}
                                    onChange={e => setCandKeyword(e.target.value)}
                                />
                            </div>

                            <div style={styles.fieldCol}>
                                <label style={styles.fieldLabel}>Estado (UF) *</label>
                                <select
                                    style={styles.select}
                                    value={candState}
                                    onChange={e => {
                                        const newUf = e.target.value;
                                        setCandState(newUf);
                                        const stateCities = BRAZIL_STATES.find(s => s.uf === newUf)?.cities || [];
                                        if (stateCities.length > 0) {
                                            const defaultCity = newUf === 'SP' ? 'SÃO PAULO' : stateCities[0];
                                            setCandCity(defaultCity);
                                            const neighs = getNeighborhoodsByCity(newUf, defaultCity);
                                            setCandNeighborhoodsList(neighs);
                                            setCandNeighborhood('Todos');
                                        }
                                    }}
                                >
                                    {BRAZIL_STATES.map(s => (
                                        <option key={s.uf} value={s.uf}>{s.uf} - {s.name} ({s.cities.length} cidades)</option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.fieldCol}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={styles.fieldLabel}>Cidade (Padrão: SÃO PAULO) *</label>
                                    <span style={{ fontSize: '10px', color: colors.textSecondary, fontWeight: '700' }}>
                                        {currentCandidateCities.length} cidades em {candState}
                                    </span>
                                </div>
                                <SearchableSelectDropdown
                                    value={candCity}
                                    options={currentCandidateCities}
                                    countLabel={`cidades em ${candState}`}
                                    colors={colors}
                                    placeholder="Clique para ver a lista suspensa de cidades"
                                    onChange={(newCity) => {
                                        setCandCity(newCity);
                                        if (newCity.trim()) {
                                            const neighs = getNeighborhoodsByCity(candState, newCity);
                                            setCandNeighborhoodsList(neighs);
                                            setCandNeighborhood('Todos');
                                        }
                                    }}
                                />
                            </div>

                            <div style={styles.fieldCol}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={styles.fieldLabel}>Bairro / Região (Padrão: Todos - Busca Global)</label>
                                    <button
                                        type="button"
                                        onClick={handleEnrichCandNeighborhoods}
                                        disabled={isEnrichingCandNeighborhoods}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: colors.primary,
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            padding: 0
                                        }}
                                        title="Consultar bairros atualizados desta cidade via Correios DNE e Google Maps"
                                    >
                                        <span>{isEnrichingCandNeighborhoods ? '⏳ Buscando...' : '⚡ Atualizar Correios/Google'}</span>
                                    </button>
                                </div>
                                <SearchableSelectDropdown
                                    value={candNeighborhood}
                                    options={candNeighborhoodsList}
                                    countLabel={`bairros em ${candCity}`}
                                    colors={colors}
                                    placeholder="Clique para ver a lista suspensa de bairros"
                                    onChange={(newNeigh) => setCandNeighborhood(newNeigh)}
                                />
                                {candNeighborhoodsList.length > 0 && (
                                    <div style={{ marginTop: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '10px', color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' }}>
                                                📍 {candNeighborhoodsList.length} Bairros ({candCity}):
                                            </span>
                                        </div>
                                        <div style={{ 
                                            display: 'flex', 
                                            flexWrap: 'wrap', 
                                            gap: '4px', 
                                            maxHeight: '68px', 
                                            overflowY: 'auto',
                                            padding: '2px 0'
                                        }}>
                                            {candNeighborhoodsList.slice(0, 16).map(n => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => setCandNeighborhood(n)}
                                                    style={{
                                                        backgroundColor: candNeighborhood === n ? colors.primary : colors.surfaceHover || 'rgba(0,0,0,0.05)',
                                                        color: candNeighborhood === n ? '#fff' : colors.textPrimary,
                                                        border: `1px solid ${candNeighborhood === n ? colors.primary : colors.border}`,
                                                        borderRadius: '6px',
                                                        padding: '2px 6px',
                                                        fontSize: '10px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={styles.fieldCol}>
                                <label style={styles.fieldLabel}>Senioridade</label>
                                <select
                                    style={styles.select}
                                    value={candSeniority}
                                    onChange={e => setCandSeniority(e.target.value)}
                                >
                                    <option value="Todos">Todas as Senioridades</option>
                                    <option value="Estagiário/Júnior">Estagiário / Júnior</option>
                                    <option value="Pleno">Pleno</option>
                                    <option value="Sênior">Sênior</option>
                                    <option value="Especialista / Lead">Especialista / Tech Lead</option>
                                    <option value="Liderança / Gestão">Coordenação / Gerência</option>
                                </select>
                            </div>

                            <div style={styles.fieldColFull}>
                                <label style={styles.fieldLabel}>Competências & Tecnologias Relevantes (Opcional)</label>
                                <input
                                    style={styles.input}
                                    placeholder="Ex: TypeScript, Redux, PostgreSQL, Scrum..."
                                    value={candSkills}
                                    onChange={e => setCandSkills(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Seletor de Portais de RH Alvo & Acessos com Login */}
                        <div style={styles.portalFilterBox}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '15px' }}>🌐</span>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: colors.textPrimary }}>
                                        Portais de RH Integrados (Varredura Direcionada):
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: colors.primary,
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    onClick={() => setActiveTab('platforms')}
                                >
                                    <span>Configurar Logins / Senhas (Catho, Empregos...)</span>
                                    <ExternalLinkIcon style={{ width: '12px', height: '12px' }} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['Catho', 'Empregos.com.br', 'LinkedIn', 'InfoJobs', 'Gupy', 'Vagas.com', 'Web 360°'].map(portalName => {
                                    const isSelected = selectedCandPortals.includes(portalName);
                                    const acc = rhPlatforms.find(p => p.name.toLowerCase() === portalName.toLowerCase());
                                    const hasAuth = Boolean(acc?.hasCredentials);

                                    return (
                                        <button
                                            key={portalName}
                                            type="button"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: isSelected ? '700' : '500',
                                                border: isSelected 
                                                    ? `1.5px solid ${acc?.badgeColor || colors.primary}` 
                                                    : `1px solid ${colors.border}`,
                                                backgroundColor: isSelected 
                                                    ? (acc?.accentBg || 'rgba(37, 99, 235, 0.08)') 
                                                    : colors.background,
                                                color: isSelected 
                                                    ? (acc?.badgeColor || colors.primary) 
                                                    : colors.textSecondary,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onClick={() => {
                                                setSelectedCandPortals(prev => 
                                                    prev.includes(portalName) 
                                                        ? prev.filter(p => p !== portalName) 
                                                        : [...prev, portalName]
                                                );
                                            }}
                                        >
                                            <span>{isSelected ? '✓' : '+'}</span>
                                            <span>{portalName}</span>
                                            {hasAuth && (
                                                <span style={{
                                                    fontSize: '9px',
                                                    fontWeight: '800',
                                                    backgroundColor: '#10b981',
                                                    color: '#ffffff',
                                                    padding: '1px 5px',
                                                    borderRadius: '4px'
                                                }}>
                                                    AUTENTICADO
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {rhPlatforms.filter(p => p.hasCredentials).length > 0 ? (
                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                    <CheckCircleIcon style={{ width: '12px', height: '12px' }} />
                                    <span>
                                        {rhPlatforms.filter(p => p.hasCredentials).length} portal(is) com credenciais salvas ({rhPlatforms.filter(p => p.hasCredentials).map(p => p.name).join(', ')}). A IA buscará dados profundos e criará links diretos de acesso autenticado.
                                    </span>
                                </div>
                            ) : (
                                <div style={{ marginTop: '8px', fontSize: '11px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>💡 Opcional: Caso possua cadastro na <strong>Catho</strong> ou <strong>Empregos.com.br</strong>, salve seu login na aba <strong>"Portais de RH & Acessos"</strong> para liberar o desbloqueio com 1 clique.</span>
                                </div>
                            )}
                        </div>

                        <div style={styles.formFooter}>
                            <button
                                style={isSearchingCandidates ? styles.buttonDisabled : styles.buttonPrimary}
                                onClick={handleSearchCandidates}
                                disabled={isSearchingCandidates}
                            >
                                <SearchIcon style={{ width: '18px', height: '18px', marginRight: '6px' }} />
                                {isSearchingCandidates ? 'Varrendo Portais e Redes de Talentos...' : 'Buscar Candidatos Locais'}
                            </button>
                        </div>

                        {candidateSearchError && (
                            <div style={styles.errorBanner}>{candidateSearchError}</div>
                        )}
                    </div>

                    {/* Resultados de Candidatos */}
                    {foundCandidates.length > 0 && (
                        <div style={{ marginTop: '30px', width: '100%' }}>
                            {/* Banner Analítico de KPIs de Varredura */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '14px',
                                marginBottom: '22px',
                                width: '100%',
                            }}>
                                <div style={{
                                    backgroundColor: colors.surface,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '12px',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                        color: colors.primary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px'
                                    }}>
                                        👥
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: colors.textPrimary }}>{foundCandidates.length}</div>
                                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>Talentos Mapeados</div>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: colors.surface,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '12px',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px'
                                    }}>
                                        🌐
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: colors.textPrimary }}>{selectedCandPortals.length}</div>
                                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>Portais Varridos</div>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: colors.surface,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '12px',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                        color: '#f59e0b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px'
                                    }}>
                                        🎯
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: colors.textPrimary }}>95%</div>
                                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>Match ATS Médio</div>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: colors.surface,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '12px',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                        color: '#8b5cf6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px'
                                    }}>
                                        📍
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '800', color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {candCity} - {candState}
                                        </div>
                                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                                            {candNeighborhood === 'Todos' ? 'Todos os Bairros (Pesquisa Global na Cidade)' : (candNeighborhood || 'Região Metropolitana')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Barra de Filtros Rápidos e Ordenação dos Resultados */}
                            <div style={{
                                backgroundColor: colors.surface,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '12px',
                                padding: '16px 20px',
                                marginBottom: '22px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '14px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary }}>Filtrar Portal:</span>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {['Todos', 'Catho', 'Empregos.com.br', 'LinkedIn', 'InfoJobs', 'Gupy', 'Web 360°'].map(portal => (
                                            <button
                                                key={portal}
                                                type="button"
                                                onClick={() => setCandFilterPortal(portal)}
                                                style={{
                                                    padding: '5px 12px',
                                                    fontSize: '12px',
                                                    fontWeight: candFilterPortal === portal ? '700' : '500',
                                                    borderRadius: '16px',
                                                    border: candFilterPortal === portal ? `1.5px solid ${colors.primary}` : `1px solid ${colors.border}`,
                                                    backgroundColor: candFilterPortal === portal ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                                                    color: candFilterPortal === portal ? colors.primary : colors.textSecondary,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                {portal}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>Senioridade:</span>
                                        <select
                                            value={candFilterSeniority}
                                            onChange={e => setCandFilterSeniority(e.target.value)}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '13px',
                                                borderRadius: '8px',
                                                border: `1px solid ${colors.border}`,
                                                backgroundColor: colors.inputBg,
                                                color: colors.inputText,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="Todos">Todas</option>
                                            <option value="Sênior">Sênior</option>
                                            <option value="Pleno">Pleno</option>
                                            <option value="Especialista">Especialista / Lead</option>
                                            <option value="Júnior">Júnior</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>Ordenar:</span>
                                        <select
                                            value={candSortBy}
                                            onChange={e => setCandSortBy(e.target.value as any)}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '13px',
                                                borderRadius: '8px',
                                                border: `1px solid ${colors.border}`,
                                                backgroundColor: colors.inputBg,
                                                color: colors.inputText,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="match">Maior Match ATS</option>
                                            <option value="name">Nome A-Z</option>
                                        </select>
                                    </div>

                                    <button style={styles.buttonSecondary} onClick={handleSaveAllCandidatesToDb}>
                                        <DatabaseIcon style={{ width: '15px', height: '15px', marginRight: '6px' }} />
                                        Salvar Todos no Banco
                                    </button>
                                </div>
                            </div>

                            {/* Grid de Candidatos Filtrados */}
                            {displayedCandidates.length === 0 ? (
                                <div style={styles.emptyState}>
                                    <p style={{ color: colors.textSecondary, margin: 0 }}>
                                        Nenhum candidato corresponde aos filtros selecionados de Portal ou Senioridade.
                                    </p>
                                </div>
                            ) : (
                                <div style={styles.cardsGrid}>
                                    {displayedCandidates.map(candidate => {
                                        const isAlreadySaved = candidateDatabase.some(c => c.id === candidate.id || (c.name.toLowerCase() === candidate.name.toLowerCase() && c.location.city.toLowerCase() === candidate.location.city.toLowerCase()));
                                        const matchingPlatform = rhPlatforms.find(p => p.name.toLowerCase() === (candidate.portalSource || '').toLowerCase());
                                        const hasUserAuth = Boolean(matchingPlatform?.hasCredentials);
                                        const initials = candidate.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                                        const contact = resolveCandidateContact(candidate, candidate.location.state);

                                        return (
                                            <div key={candidate.id} style={styles.candidateCard}>
                                                <div style={styles.candidateCardHeader}>
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
                                                        {/* Avatar com Iniciais */}
                                                        <div style={{
                                                            width: '46px',
                                                            height: '46px',
                                                            borderRadius: '12px',
                                                            backgroundColor: colors.primary,
                                                            color: colors.textOnPrimary,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '16px',
                                                            fontWeight: '800',
                                                            flexShrink: 0,
                                                            position: 'relative'
                                                        }}>
                                                            {initials}
                                                            <span style={{
                                                                position: 'absolute',
                                                                bottom: '-2px',
                                                                right: '-2px',
                                                                width: '12px',
                                                                height: '12px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#10b981',
                                                                border: `2px solid ${colors.surface}`
                                                            }} title="Disponível para contato" />
                                                        </div>

                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                                <h4 style={styles.candidateName}>{candidate.name}</h4>
                                                                {candidate.matchScore && (
                                                                    <span style={styles.matchBadge}>{candidate.matchScore}% Match</span>
                                                                )}
                                                                {candidate.portalSource && (
                                                                    <span style={{
                                                                        fontSize: '11px',
                                                                        fontWeight: '700',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '6px',
                                                                        backgroundColor: candidate.portalSource === 'Catho' ? '#ff6600' :
                                                                                         candidate.portalSource === 'Empregos.com.br' ? '#009966' :
                                                                                         candidate.portalSource === 'LinkedIn' ? '#0a66c2' :
                                                                                         candidate.portalSource === 'InfoJobs' ? '#005bb7' :
                                                                                         candidate.portalSource === 'Gupy' ? '#10b981' :
                                                                                         candidate.portalSource === 'Vagas.com' ? '#e11d48' : colors.primary,
                                                                        color: '#ffffff',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}>
                                                                        <span>{candidate.portalSource}</span>
                                                                    </span>
                                                                )}
                                                                {candidate.requiresAuth && (
                                                                    <span style={{
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '6px',
                                                                        backgroundColor: hasUserAuth
                                                                            ? 'rgba(16, 185, 129, 0.15)'
                                                                            : 'rgba(245, 158, 11, 0.15)',
                                                                        color: hasUserAuth ? '#059669' : '#d97706',
                                                                        border: `1px solid ${hasUserAuth ? '#10b981' : '#f59e0b'}`
                                                                    }}>
                                                                        {hasUserAuth ? '🔓 Login Conectado' : '🔒 Requer Assinatura/Login'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p style={styles.candidateHeadline}>{candidate.headline}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={styles.candidateLocationRow}>
                                                    <MapPinIcon style={{ width: '14px', height: '14px', color: colors.primary, marginRight: '4px' }} />
                                                    <span>
                                                        {candidate.location.neighborhood ? `${candidate.location.neighborhood}, ` : ''}
                                                        {candidate.location.city} - {candidate.location.state}
                                                    </span>
                                                </div>

                                                {/* Opções de Contato Direto: E-mail e Telefone / WhatsApp */}
                                                <div style={styles.candidateContactBox}>
                                                    <div style={styles.contactItemRow}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                                            <Mail style={{ width: '14px', height: '14px', color: colors.primary, flexShrink: 0 }} />
                                                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                                <span style={{ fontSize: '10px', color: colors.textSecondary, display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>E-mail</span>
                                                                <a 
                                                                    href={buildMailtoUrl(contact.email, candidate.name, candidate.headline)}
                                                                    style={{ fontSize: '12px', fontWeight: '600', color: colors.primary, textDecoration: 'none', wordBreak: 'break-all', display: 'block' }}
                                                                    title="Clique para abrir e-mail"
                                                                >
                                                                    {contact.email}
                                                                </a>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                            <button
                                                                type="button"
                                                                style={styles.contactMiniBtn}
                                                                title="Copiar e-mail"
                                                                onClick={() => handleCopyText(contact.email, 'E-mail')}
                                                            >
                                                                <Copy style={{ width: '12px', height: '12px' }} />
                                                                Copiar
                                                            </button>
                                                            <a
                                                                href={buildMailtoUrl(contact.email, candidate.name, candidate.headline)}
                                                                style={styles.contactActionBtn}
                                                                title="Escrever E-mail"
                                                            >
                                                                <Mail style={{ width: '12px', height: '12px' }} />
                                                                E-mail
                                                            </a>
                                                        </div>
                                                    </div>

                                                    <div style={styles.contactItemRow}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                                            <Phone style={{ width: '14px', height: '14px', color: '#10b981', flexShrink: 0 }} />
                                                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                                <span style={{ fontSize: '10px', color: colors.textSecondary, display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Telefone / WhatsApp</span>
                                                                <a 
                                                                    href={`tel:${contact.cleanPhone}`}
                                                                    style={{ fontSize: '12px', fontWeight: '600', color: colors.textPrimary, textDecoration: 'none', display: 'block' }}
                                                                    title="Ligar para o candidato"
                                                                >
                                                                    {contact.phone}
                                                                </a>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                            <button
                                                                type="button"
                                                                style={styles.contactMiniBtn}
                                                                title="Copiar telefone"
                                                                onClick={() => handleCopyText(contact.phone, 'Telefone')}
                                                            >
                                                                <Copy style={{ width: '12px', height: '12px' }} />
                                                                Copiar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                style={styles.contactWaBtn}
                                                                title="Abrir WhatsApp com o candidato"
                                                                onClick={() => {
                                                                    const waUrl = buildWhatsAppUrl(contact.phoneWithDdi, candidate.name, candidate.headline);
                                                                    window.open(waUrl, '_blank');
                                                                }}
                                                            >
                                                                💬 WhatsApp
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {contact.linkedin && (
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: `1px dashed ${colors.border}`, marginTop: '2px' }}>
                                                            <span style={{ fontSize: '11px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span>🔗</span> LinkedIn:
                                                            </span>
                                                            <a
                                                                href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ fontSize: '11px', color: '#0a66c2', fontWeight: '600', textDecoration: 'none' }}
                                                            >
                                                                Perfil LinkedIn ↗
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                <p style={styles.candidateSummary}>{candidate.summary}</p>

                                                {candidate.skills && candidate.skills.length > 0 && (
                                                    <div style={styles.skillsContainer}>
                                                        {candidate.skills.slice(0, 6).map((skill, sIdx) => (
                                                            <span key={sIdx} style={styles.skillTag}>{skill}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                {candidate.experienceHighlights && candidate.experienceHighlights.length > 0 && (
                                                    <div style={styles.highlightBox}>
                                                        <span style={styles.highlightLabel}>Destaques de Entrega:</span>
                                                        <ul style={styles.highlightList}>
                                                            {candidate.experienceHighlights.map((hl, hIdx) => (
                                                                <li key={hIdx}>{hl}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Fontes e Citações */}
                                                {candidate.sourceUrls && candidate.sourceUrls.length > 0 && (
                                                    <div style={styles.sourcesBox}>
                                                        <span style={styles.sourcesLabel}>Fontes & Citações da Web:</span>
                                                        <div style={styles.sourcesLinksRow}>
                                                            {candidate.sourceUrls.map((src, sIdx) => (
                                                                <a
                                                                    key={sIdx}
                                                                    href={src.uri}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={styles.sourceBadgeLink}
                                                                >
                                                                    <ExternalLinkIcon style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                                                    {src.title || 'Ver Perfil / Link'}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={styles.candidateActions}>
                                                    <button
                                                        style={isAlreadySaved ? styles.btnSaved : styles.btnActionPrimary}
                                                        onClick={() => handleSaveCandidateToDb(candidate)}
                                                        disabled={isAlreadySaved}
                                                    >
                                                        <DatabaseIcon style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                                        {isAlreadySaved ? 'Salvo no Banco' : 'Salvar no Banco'}
                                                    </button>

                                                    <button
                                                        style={styles.btnActionSecondary}
                                                        onClick={() => setSelectedCandidateCv(candidate)}
                                                    >
                                                        <EyeIcon style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                                        Ver Currículo
                                                    </button>

                                                    <button
                                                        style={styles.btnActionOutline}
                                                        onClick={() => openContactModal(candidate)}
                                                    >
                                                        <Mail />
                                                        Abordar
                                                    </button>

                                                    {/* Link Direto no Portal de RH */}
                                                    {(candidate.authenticatedDirectUrl || candidate.sourceUrls?.[0]?.uri) && (
                                                        <a
                                                            href={candidate.authenticatedDirectUrl || candidate.sourceUrls[0].uri}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={styles.btnActionPortalDirect}
                                                            title={`Abrir perfil no ${candidate.portalSource || 'Portal'}`}
                                                        >
                                                            <ExternalLinkIcon style={{ width: '13px', height: '13px', marginRight: '4px' }} />
                                                            Abrir no {candidate.portalSource || 'Portal'}
                                                        </a>
                                                    )}

                                                    {/* Atalho para copiar senha se a conta estiver salva */}
                                                    {matchingPlatform?.password && (
                                                        <button
                                                            type="button"
                                                            style={styles.btnActionCopyCreds}
                                                            title="Copiar senha da conta salva para colar na tela de login do portal"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(matchingPlatform.password);
                                                                showToast(`Senha da ${matchingPlatform.name} copiada!`);
                                                            }}
                                                        >
                                                            <Copy style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                                            Copiar Senha
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: BUSCAR VAGAS LOCAIS (CAMINHO INVERSO) */}
            {activeTab === 'jobs' && (
                <div>
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>Caminho Inverso: Radar de Vagas Locais em Tempo Real</h2>
                            <p style={styles.cardDesc}>
                                Para candidatos em busca de oportunidades: rastreie todas as vagas ativas divulgadas na sua cidade e bairro em sites de empresas, murais de RH e portais de carreiras.
                            </p>
                        </div>

                        <div style={styles.formGrid}>
                            <div style={styles.fieldColFull}>
                                <label style={styles.fieldLabel}>Palavra-Chave / Cargo Almejado *</label>
                                <input
                                    style={styles.input}
                                    placeholder="Ex: Desenvolvedor Frontend, Analista Financeiro, Motorista, Vendedor..."
                                    value={jobKeyword}
                                    onChange={e => setJobKeyword(e.target.value)}
                                />
                            </div>

                            <div style={styles.fieldCol}>
                                <label style={styles.fieldLabel}>Estado (UF) *</label>
                                <select
                                    style={styles.select}
                                    value={jobState}
                                    onChange={e => {
                                        const newUf = e.target.value;
                                        setJobState(newUf);
                                        const stateCities = BRAZIL_STATES.find(s => s.uf === newUf)?.cities || [];
                                        if (stateCities.length > 0) {
                                            const defaultCity = newUf === 'SP' ? 'SÃO PAULO' : stateCities[0];
                                            setJobCity(defaultCity);
                                            const neighs = getNeighborhoodsByCity(newUf, defaultCity);
                                            setJobNeighborhoodsList(neighs);
                                            setJobNeighborhood('Todos');
                                        }
                                    }}
                                >
                                    {BRAZIL_STATES.map(s => (
                                        <option key={s.uf} value={s.uf}>{s.uf} - {s.name} ({s.cities.length} cidades)</option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.fieldCol}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={styles.fieldLabel}>Cidade (Padrão: SÃO PAULO) *</label>
                                    <span style={{ fontSize: '10px', color: colors.textSecondary, fontWeight: '700' }}>
                                        {currentJobCities.length} cidades em {jobState}
                                    </span>
                                </div>
                                <SearchableSelectDropdown
                                    value={jobCity}
                                    options={currentJobCities}
                                    countLabel={`cidades em ${jobState}`}
                                    colors={colors}
                                    placeholder="Clique para ver a lista suspensa de cidades"
                                    onChange={(newCity) => {
                                        setJobCity(newCity);
                                        if (newCity.trim()) {
                                            const neighs = getNeighborhoodsByCity(jobState, newCity);
                                            setJobNeighborhoodsList(neighs);
                                            setJobNeighborhood('Todos');
                                        }
                                    }}
                                />
                            </div>

                            <div style={styles.fieldCol}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={styles.fieldLabel}>Bairro / Região (Padrão: Todos - Busca Global)</label>
                                    <button
                                        type="button"
                                        onClick={handleEnrichJobNeighborhoods}
                                        disabled={isEnrichingJobNeighborhoods}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: colors.primary,
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            padding: 0
                                        }}
                                        title="Consultar bairros atualizados desta cidade via Correios DNE e Google Maps"
                                    >
                                        <span>{isEnrichingJobNeighborhoods ? '⏳ Buscando...' : '⚡ Atualizar Correios/Google'}</span>
                                    </button>
                                </div>
                                <SearchableSelectDropdown
                                    value={jobNeighborhood}
                                    options={jobNeighborhoodsList}
                                    countLabel={`bairros em ${jobCity}`}
                                    colors={colors}
                                    placeholder="Clique para ver a lista suspensa de bairros"
                                    onChange={(newNeigh) => setJobNeighborhood(newNeigh)}
                                />
                                {jobNeighborhoodsList.length > 0 && (
                                    <div style={{ marginTop: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '10px', color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' }}>
                                                📍 {jobNeighborhoodsList.length} Bairros ({jobCity}):
                                            </span>
                                        </div>
                                        <div style={{ 
                                            display: 'flex', 
                                            flexWrap: 'wrap', 
                                            gap: '4px', 
                                            maxHeight: '68px', 
                                            overflowY: 'auto',
                                            padding: '2px 0'
                                        }}>
                                            {jobNeighborhoodsList.slice(0, 16).map(n => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => setJobNeighborhood(n)}
                                                    style={{
                                                        backgroundColor: jobNeighborhood === n ? colors.primary : colors.surfaceHover || 'rgba(0,0,0,0.05)',
                                                        color: jobNeighborhood === n ? '#fff' : colors.textPrimary,
                                                        border: `1px solid ${jobNeighborhood === n ? colors.primary : colors.border}`,
                                                        borderRadius: '6px',
                                                        padding: '2px 6px',
                                                        fontSize: '10px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={styles.fieldCol}>
                                <label style={styles.fieldLabel}>Modalidade de Trabalho</label>
                                <select
                                    style={styles.select}
                                    value={jobWorkModel}
                                    onChange={e => setJobWorkModel(e.target.value as WorkModel)}
                                >
                                    <option value="Todos">Todas as Modalidades</option>
                                    <option value="Presencial">Presencial</option>
                                    <option value="Híbrido">Híbrido</option>
                                    <option value="Home Office">Home Office</option>
                                </select>
                            </div>
                        </div>

                        {/* Seletor de Portais de Emprego Alvo & Acessos com Login */}
                        <div style={styles.portalFilterBox}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '15px' }}>🏢</span>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: colors.textPrimary }}>
                                        Portais de Vagas Integrados (Varredura Direcionada):
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: colors.primary,
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    onClick={() => setActiveTab('platforms')}
                                >
                                    <span>Configurar Logins / Assinaturas (Catho, Empregos...)</span>
                                    <ExternalLinkIcon style={{ width: '12px', height: '12px' }} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['Catho', 'Empregos.com.br', 'LinkedIn', 'InfoJobs', 'Gupy', 'Vagas.com', 'Web 360°'].map(portalName => {
                                    const isSelected = selectedJobPortals.includes(portalName);
                                    const acc = rhPlatforms.find(p => p.name.toLowerCase() === portalName.toLowerCase());
                                    const hasAuth = Boolean(acc?.hasCredentials);

                                    return (
                                        <button
                                            key={portalName}
                                            type="button"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: isSelected ? '700' : '500',
                                                border: isSelected 
                                                    ? `1.5px solid ${acc?.badgeColor || colors.primary}` 
                                                    : `1px solid ${colors.border}`,
                                                backgroundColor: isSelected 
                                                    ? (acc?.accentBg || 'rgba(37, 99, 235, 0.08)') 
                                                    : colors.background,
                                                color: isSelected 
                                                    ? (acc?.badgeColor || colors.primary) 
                                                    : colors.textSecondary,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onClick={() => {
                                                setSelectedJobPortals(prev => 
                                                    prev.includes(portalName) 
                                                        ? prev.filter(p => p !== portalName) 
                                                        : [...prev, portalName]
                                                );
                                            }}
                                        >
                                            <span>{isSelected ? '✓' : '+'}</span>
                                            <span>{portalName}</span>
                                            {hasAuth && (
                                                <span style={{
                                                    fontSize: '9px',
                                                    fontWeight: '800',
                                                    backgroundColor: '#10b981',
                                                    color: '#ffffff',
                                                    padding: '1px 5px',
                                                    borderRadius: '4px'
                                                }}>
                                                    AUTENTICADO
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {rhPlatforms.filter(p => p.hasCredentials).length > 0 ? (
                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                    <CheckCircleIcon style={{ width: '12px', height: '12px' }} />
                                    <span>
                                        {rhPlatforms.filter(p => p.hasCredentials).length} portal(is) com credenciais salvas ({rhPlatforms.filter(p => p.hasCredentials).map(p => p.name).join(', ')}). A IA priorizará vagas com acesso direto no portal autenticado.
                                    </span>
                                </div>
                            ) : (
                                <div style={{ marginTop: '8px', fontSize: '11px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>💡 Dica: Se você é assinante da <strong>Catho</strong> ou <strong>Empregos.com.br</strong>, configure seu login para se candidatar em vagas exclusivas com 1 clique.</span>
                                </div>
                            )}
                        </div>

                        <div style={styles.formFooter}>
                            <button
                                style={isSearchingJobs ? styles.buttonDisabled : styles.buttonPrimary}
                                onClick={handleSearchJobs}
                                disabled={isSearchingJobs}
                            >
                                <SearchIcon style={{ width: '18px', height: '18px', marginRight: '6px' }} />
                                {isSearchingJobs ? 'Rastreando Portais de Emprego e Sites...' : 'Buscar Vagas Locais'}
                            </button>
                        </div>

                        {jobSearchError && (
                            <div style={styles.errorBanner}>{jobSearchError}</div>
                        )}
                    </div>

                    {/* MAPA DE CALOR REGIONAL DE VAGAS (RECHARTS) */}
                    <div style={{ marginTop: '24px' }}>
                        <JobRegionalHeatmap
                            keyword={jobKeyword}
                            data={regionalHeatmapData}
                            colors={colors}
                            onSelectRegion={(uf, regionName) => {
                                setJobState(uf);
                                const stateCities = BRAZIL_STATES.find(s => s.uf === uf)?.cities || [];
                                if (stateCities.length > 0) {
                                    setJobCity(stateCities[0]);
                                }
                                showToast(`Região ${regionName} (${uf}) selecionada para busca de vagas!`);
                            }}
                        />
                    </div>

                    {/* Resultados de Vagas */}
                    {foundJobs.length > 0 && (
                        <div style={{ marginTop: '30px' }}>
                            <div style={styles.resultsActionBar}>
                                <div>
                                    <h3 style={styles.resultsTitle}>
                                        {foundJobs.length} Vagas Encontradas para "{jobKeyword}" em {jobCity} - {jobState}
                                    </h3>
                                    <p style={styles.resultsSubtitle}>
                                        Candidate-se diretamente ou salve a vaga para acompanhamento e otimização de currículo.
                                    </p>
                                </div>
                            </div>

                            <div style={styles.cardsGrid}>
                                {foundJobs.map(job => {
                                    const isSaved = applications.some(app => app.jobTitle.toLowerCase() === job.title.toLowerCase() && app.companyName.toLowerCase() === job.company.toLowerCase());
                                    const matchingPlatform = rhPlatforms.find(p => p.name.toLowerCase() === (job.portalSource || '').toLowerCase());
                                    const hasUserAuth = Boolean(matchingPlatform?.hasCredentials);

                                    return (
                                        <div key={job.id} style={styles.jobCard}>
                                            <div style={styles.jobCardHeader}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                        <h4 style={styles.jobTitle}>{job.title}</h4>
                                                        {job.portalSource && (
                                                            <span style={{
                                                                fontSize: '11px',
                                                                fontWeight: '700',
                                                                padding: '2px 8px',
                                                                borderRadius: '6px',
                                                                backgroundColor: job.portalSource === 'Catho' ? '#ff6600' :
                                                                                 job.portalSource === 'Empregos.com.br' ? '#009966' :
                                                                                 job.portalSource === 'LinkedIn' ? '#0a66c2' :
                                                                                 job.portalSource === 'InfoJobs' ? '#005bb7' :
                                                                                 job.portalSource === 'Gupy' ? '#10b981' :
                                                                                 job.portalSource === 'Vagas.com' ? '#e11d48' : colors.primary,
                                                                color: '#ffffff'
                                                            }}>
                                                                {job.portalSource}
                                                            </span>
                                                        )}
                                                        {job.requiresAuth && (
                                                            <span style={{
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                padding: '2px 6px',
                                                                borderRadius: '6px',
                                                                backgroundColor: hasUserAuth
                                                                    ? 'rgba(16, 185, 129, 0.15)'
                                                                    : 'rgba(245, 158, 11, 0.15)',
                                                                color: hasUserAuth ? '#059669' : '#d97706',
                                                                border: `1px solid ${hasUserAuth ? '#10b981' : '#f59e0b'}`
                                                            }}>
                                                                {hasUserAuth ? '🔓 Assinatura Conectada' : '🔒 Vaga Requer Login'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={styles.jobCompanyRow}>
                                                        <BuildingIcon style={{ width: '16px', height: '16px', color: colors.primary, marginRight: '4px' }} />
                                                        <span style={{ fontWeight: '600', color: colors.textPrimary }}>{job.company}</span>
                                                    </div>
                                                </div>
                                                <div style={styles.badgesCol}>
                                                    <span style={styles.badgeModel}>{job.workModel}</span>
                                                    {job.salaryOrRange && (
                                                        <span style={styles.badgeSalary}>{job.salaryOrRange}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={styles.candidateLocationRow}>
                                                <MapPinIcon style={{ width: '14px', height: '14px', color: colors.primary, marginRight: '4px' }} />
                                                <span>
                                                    {job.location.neighborhood ? `${job.location.neighborhood}, ` : ''}
                                                    {job.location.city} - {job.location.state}
                                                </span>
                                            </div>

                                            <p style={styles.jobDesc}>{job.description}</p>

                                            {job.requirements && job.requirements.length > 0 && (
                                                <div style={styles.highlightBox}>
                                                    <span style={styles.highlightLabel}>Requisitos:</span>
                                                    <ul style={styles.highlightList}>
                                                        {job.requirements.map((req, rIdx) => (
                                                            <li key={rIdx}>{req}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {job.sourceUrls && job.sourceUrls.length > 0 && (
                                                <div style={styles.sourcesBox}>
                                                    <span style={styles.sourcesLabel}>Publicação / Fonte Oficial:</span>
                                                    <div style={styles.sourcesLinksRow}>
                                                        {job.sourceUrls.map((src, sIdx) => (
                                                            <a
                                                                key={sIdx}
                                                                href={src.uri}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={styles.sourceBadgeLink}
                                                            >
                                                                <ExternalLinkIcon style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                                                {src.title || 'Ver Anúncio da Vaga'}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div style={styles.candidateActions}>
                                                {/* Botão de Candidatura Direta ou Autenticada */}
                                                {(job.authenticatedDirectUrl || job.applyUrlOrContact) && (
                                                    <a
                                                        href={job.authenticatedDirectUrl || (job.applyUrlOrContact?.startsWith('http') ? job.applyUrlOrContact : `mailto:${job.applyUrlOrContact}`)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={styles.btnActionPrimaryLink}
                                                    >
                                                        <ExternalLinkIcon style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                                        {job.portalSource ? `Candidatar-se no ${job.portalSource}` : 'Candidatar-se na Fonte'}
                                                    </a>
                                                )}

                                                {/* Atalho para copiar senha da conta cadastrada */}
                                                {matchingPlatform?.password && (
                                                    <button
                                                        type="button"
                                                        style={styles.btnActionCopyCreds}
                                                        title="Copiar senha da conta salva para colar na tela de login da vaga"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(matchingPlatform.password);
                                                            showToast(`Senha da ${matchingPlatform.name} copiada!`);
                                                        }}
                                                    >
                                                        <Copy style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                                        Copiar Senha
                                                    </button>
                                                )}

                                                <button
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        padding: '8px 14px',
                                                        borderRadius: '8px',
                                                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                                        color: '#ffffff',
                                                        border: `1px solid ${colors.border}`,
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                        gap: '5px'
                                                    }}
                                                    onClick={() => setAnalyzingJobMatch(job)}
                                                    title="Analisar alinhamento com seu CV, índice ATS e sugestões de ajuste"
                                                >
                                                    <Target style={{ width: '14px', height: '14px', color: '#38bdf8' }} />
                                                    Analisar Match IA
                                                </button>

                                                <button
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        padding: '8px 14px',
                                                        borderRadius: '8px',
                                                        background: 'linear-gradient(135deg, #881337, #4c0519)',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(136, 19, 55, 0.35)',
                                                        gap: '5px'
                                                    }}
                                                    onClick={() => setTailoringJob(job)}
                                                    title="Acionar o Mestre de RH e gerar currículo sob medida para os requisitos desta vaga"
                                                >
                                                    <Sparkles style={{ width: '14px', height: '14px' }} />
                                                    Confeccionar CV p/ Vaga
                                                </button>

                                                <button
                                                    style={isSaved ? styles.btnSaved : styles.btnActionSecondary}
                                                    onClick={() => handleSaveJobToApplications(job)}
                                                    disabled={isSaved}
                                                >
                                                    <CheckCircleIcon style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                                    {isSaved ? 'No Painel de Vagas' : 'Salvar no Painel'}
                                                </button>

                                                <button
                                                    style={styles.btnActionOutline}
                                                    onClick={() => {
                                                        const copyText = `Vaga: ${job.title}\nEmpresa: ${job.company}\nLocal: ${job.location.city} - ${job.location.state}\nRequisitos: ${job.requirements.join(', ')}\nDescrição: ${job.description}`;
                                                        handleCopyText(copyText, 'Dados da vaga para otimização de CV');
                                                    }}
                                                    title="Copiar dados da vaga para colar nas Ferramentas de IA"
                                                >
                                                    <Copy />
                                                    Copiar Dados
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: PORTAIS DE RH & ACESSOS COM LOGIN */}
            {activeTab === 'platforms' && (
                <RHPlatformManager
                    onPlatformsUpdated={setRhPlatforms}
                    onNavigateToSearch={tab => setActiveTab(tab)}
                />
            )}

            {/* TAB 3: BANCO DE TALENTOS & CURRÍCULOS SALVOS */}
            {activeTab === 'database' && (
                <div>
                    <div style={styles.card}>
                        <div style={styles.resultsActionBar}>
                            <div>
                                <h2 style={styles.cardTitle}>Banco de Dados de Talentos & Currículos</h2>
                                <p style={styles.cardDesc}>
                                    Total de <strong>{candidateDatabase.length} currículos</strong> armazenados localmente e prontos para triagem, entrevistas e contratação.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={styles.buttonSecondary} onClick={handleExportCandidatesCSV} disabled={candidateDatabase.length === 0}>
                                    <Download />
                                    Exportar CSV
                                </button>
                                <button style={styles.buttonSecondary} onClick={handleExportCandidatesJSON} disabled={candidateDatabase.length === 0}>
                                    <Download />
                                    Exportar JSON
                                </button>
                            </div>
                        </div>

                        {/* Filtros do Banco de Dados */}
                        <div style={styles.filterRow}>
                            <div style={{ flex: '1 1 250px' }}>
                                <input
                                    style={styles.input}
                                    placeholder="🔍 Filtrar por nome, cargo, tecnologia ou cidade..."
                                    value={dbSearchTerm}
                                    onChange={e => setDbSearchTerm(e.target.value)}
                                />
                            </div>

                            <div style={{ flex: '0 0 180px' }}>
                                <select
                                    style={styles.select}
                                    value={dbStatusFilter}
                                    onChange={e => setDbStatusFilter(e.target.value)}
                                >
                                    <option value="Todos">Status: Todos</option>
                                    <option value="Novo">Novo</option>
                                    <option value="Contatado">Contatado</option>
                                    <option value="Em Análise">Em Análise</option>
                                    <option value="Entrevista">Em Entrevista</option>
                                    <option value="Aprovado">Aprovado</option>
                                    <option value="Banco de Reserva">Banco de Reserva</option>
                                </select>
                            </div>

                            <div style={{ flex: '0 0 160px' }}>
                                <select
                                    style={styles.select}
                                    value={dbStateFilter}
                                    onChange={e => setDbStateFilter(e.target.value)}
                                >
                                    <option value="Todos">Estado: Todos</option>
                                    {BRAZIL_STATES.map(s => (
                                        <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Lista do Banco de Talentos */}
                    {candidateDatabase.length === 0 ? (
                        <div style={styles.emptyState}>
                            <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px' }}>🗄️</span>
                            <h3 style={{ margin: '0 0 8px 0', color: colors.textPrimary }}>Seu Banco de Talentos está vazio</h3>
                            <p style={{ margin: '0 0 20px 0', color: colors.textSecondary }}>
                                Utilize a aba <strong>"Buscar Candidatos Locais"</strong> para pesquisar na web aberta por palavra-chave, cidade e bairro e clique em "Salvar no Banco".
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button style={styles.buttonPrimary} onClick={() => setActiveTab('candidates')}>
                                    Ir para Busca de Candidatos
                                </button>
                                <button 
                                    style={styles.buttonSecondary} 
                                    onClick={() => {
                                        setCandidateDatabase(INITIAL_CANDIDATES_360);
                                        showToast('6 Perfis Verificados carregados no Banco de Talentos!');
                                    }}
                                >
                                    ⚡ Carregar Talentos Verificados no Banco
                                </button>
                            </div>
                        </div>
                    ) : filteredDbCandidates.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p style={{ color: colors.textSecondary }}>Nenhum candidato corresponde aos filtros selecionados.</p>
                        </div>
                    ) : (
                        <div style={styles.cardsGrid}>
                            {filteredDbCandidates.map(candidate => {
                                const contact = resolveCandidateContact(candidate, candidate.location.state);
                                return (
                                <div key={candidate.id} style={styles.candidateCard}>
                                    <div style={styles.candidateCardHeader}>
                                        <div>
                                            <h4 style={styles.candidateName}>{candidate.name}</h4>
                                            <p style={styles.candidateHeadline}>{candidate.headline}</p>
                                        </div>
                                        <div>
                                            {/* Status Selector */}
                                            <select
                                                style={getStatusSelectStyle(candidate.status, colors)}
                                                value={candidate.status}
                                                onChange={e => handleUpdateCandidateStatus(candidate.id, e.target.value as CandidateStatus)}
                                            >
                                                <option value="Novo">Novo</option>
                                                <option value="Contatado">Contatado</option>
                                                <option value="Em Análise">Em Análise</option>
                                                <option value="Entrevista">Em Entrevista</option>
                                                <option value="Aprovado">Aprovado</option>
                                                <option value="Banco de Reserva">Banco de Reserva</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={styles.candidateLocationRow}>
                                        <MapPinIcon style={{ width: '14px', height: '14px', color: colors.primary, marginRight: '4px' }} />
                                        <span>
                                            {candidate.location.neighborhood ? `${candidate.location.neighborhood}, ` : ''}
                                            {candidate.location.city} - {candidate.location.state}
                                        </span>
                                    </div>

                                    {/* Opções de Contato Direto: E-mail e Telefone / WhatsApp */}
                                    <div style={styles.candidateContactBox}>
                                        <div style={styles.contactItemRow}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                                <Mail style={{ width: '14px', height: '14px', color: colors.primary, flexShrink: 0 }} />
                                                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                    <span style={{ fontSize: '10px', color: colors.textSecondary, display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>E-mail</span>
                                                    <a 
                                                        href={buildMailtoUrl(contact.email, candidate.name, candidate.headline)}
                                                        style={{ fontSize: '12px', fontWeight: '600', color: colors.primary, textDecoration: 'none', wordBreak: 'break-all', display: 'block' }}
                                                        title="Clique para abrir e-mail"
                                                    >
                                                        {contact.email}
                                                    </a>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                <button
                                                    type="button"
                                                    style={styles.contactMiniBtn}
                                                    title="Copiar e-mail"
                                                    onClick={() => handleCopyText(contact.email, 'E-mail')}
                                                >
                                                    <Copy style={{ width: '12px', height: '12px' }} />
                                                    Copiar
                                                </button>
                                                <a
                                                    href={buildMailtoUrl(contact.email, candidate.name, candidate.headline)}
                                                    style={styles.contactActionBtn}
                                                    title="Escrever E-mail"
                                                >
                                                    <Mail style={{ width: '12px', height: '12px' }} />
                                                    E-mail
                                                </a>
                                            </div>
                                        </div>

                                        <div style={styles.contactItemRow}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                                <Phone style={{ width: '14px', height: '14px', color: '#10b981', flexShrink: 0 }} />
                                                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                    <span style={{ fontSize: '10px', color: colors.textSecondary, display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Telefone / WhatsApp</span>
                                                    <a 
                                                        href={`tel:${contact.cleanPhone}`}
                                                        style={{ fontSize: '12px', fontWeight: '600', color: colors.textPrimary, textDecoration: 'none', display: 'block' }}
                                                        title="Ligar para o candidato"
                                                    >
                                                        {contact.phone}
                                                    </a>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                <button
                                                    type="button"
                                                    style={styles.contactMiniBtn}
                                                    title="Copiar telefone"
                                                    onClick={() => handleCopyText(contact.phone, 'Telefone')}
                                                >
                                                    <Copy style={{ width: '12px', height: '12px' }} />
                                                    Copiar
                                                </button>
                                                <button
                                                    type="button"
                                                    style={styles.contactWaBtn}
                                                    title="Abrir WhatsApp com o candidato"
                                                    onClick={() => {
                                                        const waUrl = buildWhatsAppUrl(contact.phoneWithDdi, candidate.name, candidate.headline);
                                                        window.open(waUrl, '_blank');
                                                    }}
                                                >
                                                    💬 WhatsApp
                                                </button>
                                            </div>
                                        </div>

                                        {contact.linkedin && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: `1px dashed ${colors.border}`, marginTop: '2px' }}>
                                                <span style={{ fontSize: '11px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span>🔗</span> LinkedIn:
                                                </span>
                                                <a
                                                    href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: '11px', color: '#0a66c2', fontWeight: '600', textDecoration: 'none' }}
                                                >
                                                    Perfil LinkedIn ↗
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <p style={styles.candidateSummary}>{candidate.summary}</p>

                                    {candidate.skills && candidate.skills.length > 0 && (
                                        <div style={styles.skillsContainer}>
                                            {candidate.skills.slice(0, 6).map((skill, sIdx) => (
                                                <span key={sIdx} style={styles.skillTag}>{skill}</span>
                                            ))}
                                        </div>
                                    )}

                                    {candidate.sourceUrls && candidate.sourceUrls.length > 0 && (
                                        <div style={styles.sourcesBox}>
                                            <span style={styles.sourcesLabel}>Links e Citações de Origem:</span>
                                            <div style={styles.sourcesLinksRow}>
                                                {candidate.sourceUrls.map((src, sIdx) => (
                                                    <a
                                                        key={sIdx}
                                                        href={src.uri}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={styles.sourceBadgeLink}
                                                    >
                                                        <ExternalLinkIcon style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                                        {src.title || 'Fonte'}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div style={styles.candidateActions}>
                                        <button
                                            style={styles.btnActionPrimary}
                                            onClick={() => setSelectedCandidateCv(candidate)}
                                        >
                                            <EyeIcon style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                            Visualizar Currículo
                                        </button>

                                        <button
                                            style={styles.btnActionOutline}
                                            onClick={() => openContactModal(candidate)}
                                        >
                                            <Mail />
                                            Abordar
                                        </button>

                                        <button
                                            style={styles.btnActionDelete}
                                            onClick={() => handleDeleteCandidate(candidate.id)}
                                            title="Excluir do Banco de Talentos"
                                        >
                                            <Trash />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: MODELOS DE MENSAGEM & ABORDAGEM */}
            {activeTab === 'templates' && (
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.cardTitle}>Modelos de Abordagem & Recrutamento</h2>
                        <p style={styles.cardDesc}>
                            Crie scripts rápidos e padronizados para contatar candidatos no LinkedIn, e-mail ou WhatsApp. Use placeholders como <code>[candidato]</code>, <code>[cargo]</code>, <code>[empresa]</code> e <code>[localizacao]</code>.
                        </p>
                    </div>

                    <div style={styles.templateGrid}>
                        <div style={styles.templateForm}>
                            <h3 style={styles.formHeader}>{'id' in editingTemplate ? 'Editar Modelo' : 'Criar Novo Modelo'}</h3>
                            <label style={styles.fieldLabel}>Seu Nome / Assinatura</label>
                            <input
                                style={styles.input}
                                value={userName}
                                onChange={e => setUserName(e.target.value)}
                                placeholder="Seu Nome Completo (Headhunter / Recrutador)"
                            />

                            <label style={styles.fieldLabel}>Título do Modelo</label>
                            <input
                                style={styles.input}
                                placeholder="Ex: Primeiro Contato LinkedIn"
                                value={editingTemplate.name}
                                onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                            />

                            <label style={styles.fieldLabel}>Mensagem</label>
                            <textarea
                                style={styles.textarea}
                                rows={8}
                                placeholder="Olá [candidato], identificamos seu perfil..."
                                value={editingTemplate.body}
                                onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                            />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    style={styles.buttonPrimary}
                                    onClick={() => {
                                        if (!editingTemplate.name || !editingTemplate.body) return;
                                        if ('id' in editingTemplate) {
                                            setTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate as EmailTemplate : t));
                                        } else {
                                            setTemplates([...templates, { ...editingTemplate, id: Date.now().toString() }]);
                                        }
                                        setEditingTemplate({ name: '', body: '' });
                                        showToast('Modelo de mensagem salvo com sucesso!');
                                    }}
                                >
                                    Salvar Modelo
                                </button>
                                {'id' in editingTemplate && (
                                    <button style={styles.buttonSecondary} onClick={() => setEditingTemplate({ name: '', body: '' })}>
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 style={styles.formHeader}>Modelos Ativos</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {templates.map(t => (
                                    <div key={t.id} style={styles.templateListItem}>
                                        <div>
                                            <strong>{t.name}</strong>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
                                                {t.body.slice(0, 100)}...
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button style={styles.iconBtn} onClick={() => setEditingTemplate(t)} title="Editar"><Pencil /></button>
                                            <button style={styles.iconBtn} onClick={() => {
                                                setTemplates(templates.filter(item => item.id !== t.id));
                                                showToast('Modelo removido.');
                                            }} title="Excluir"><Trash /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TELA INTEIRA: DOSSIÊ E CONTATOS COMPLETOS DO CANDIDATO ESCOLHIDO */}
            {selectedCandidateCv && (() => {
                const isSelectedCandidateSaved = candidateDatabase.some(c => c.id === selectedCandidateCv.id || (c.name.toLowerCase() === selectedCandidateCv.name.toLowerCase() && c.headline.toLowerCase() === selectedCandidateCv.headline.toLowerCase()));
                const resolvedSelectedContact = resolveCandidateContact(selectedCandidateCv, selectedCandidateCv.location.state);

                return (
                    <div style={styles.fullScreenDossier}>
                        {/* BARRA SUPERIOR FIXA DE NAVEGAÇÃO E AÇÕES */}
                        <div style={styles.dossierTopNav}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button
                                    type="button"
                                    style={styles.dossierBackBtn}
                                    onClick={() => setSelectedCandidateCv(null)}
                                    title="Voltar para a Pesquisa 360°"
                                >
                                    <ArrowLeft style={{ width: '18px', height: '18px', marginRight: '6px' }} />
                                    <span>Voltar à Pesquisa 360°</span>
                                </button>
                                <div style={styles.dossierNavTitle}>
                                    <span style={{ fontWeight: '800', color: colors.textPrimary, fontSize: '15px' }}>
                                        {selectedCandidateCv.name}
                                    </span>
                                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                                        • {selectedCandidateCv.headline}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {/* 💬 WhatsApp Direto */}
                                <button
                                    type="button"
                                    style={styles.dossierWaTopBtn}
                                    onClick={() => {
                                        const waUrl = buildWhatsAppUrl(resolvedSelectedContact.phoneWithDdi, selectedCandidateCv.name, selectedCandidateCv.headline);
                                        window.open(waUrl, '_blank');
                                    }}
                                    title="Conversar diretamente pelo WhatsApp"
                                >
                                    💬 WhatsApp ({resolvedSelectedContact.phone})
                                </button>

                                {/* ✉️ E-mail Direto */}
                                <a
                                    href={buildMailtoUrl(resolvedSelectedContact.email, selectedCandidateCv.name, selectedCandidateCv.headline)}
                                    style={styles.dossierMailTopBtn}
                                    title="Enviar e-mail para o candidato"
                                >
                                    <Mail style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                                    Enviar E-mail
                                </a>

                                {/* Salvar no Banco */}
                                <button
                                    type="button"
                                    style={isSelectedCandidateSaved ? styles.btnSaved : styles.btnActionPrimary}
                                    onClick={() => handleSaveCandidateToDb(selectedCandidateCv)}
                                    disabled={isSelectedCandidateSaved}
                                >
                                    <DatabaseIcon style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                                    {isSelectedCandidateSaved ? 'Salvo no Banco' : 'Salvar no Banco'}
                                </button>

                                {/* Fechar e retornar */}
                                <button
                                    type="button"
                                    style={styles.closeDossierBtn}
                                    onClick={() => setSelectedCandidateCv(null)}
                                    title="Fechar e retornar à lista de candidatos"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* CORPO DO DOSSIÊ EM TELA INTEIRA */}
                        <div style={styles.dossierBodyContainer}>
                            {/* Card de Identidade do Candidato */}
                            <div style={styles.dossierHeroCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                                    <div style={styles.dossierHeroAvatar}>
                                        {selectedCandidateCv.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: '260px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                            <h1 style={styles.dossierHeroName}>{selectedCandidateCv.name}</h1>
                                            {selectedCandidateCv.matchScore && (
                                                <span style={styles.dossierMatchBadge}>
                                                    🎯 {selectedCandidateCv.matchScore}% Match ATS
                                                </span>
                                            )}
                                            {selectedCandidateCv.portalSource && (
                                                <span style={styles.dossierPortalBadge}>
                                                    🌐 Varrido via {selectedCandidateCv.portalSource}
                                                </span>
                                            )}
                                        </div>
                                        <p style={styles.dossierHeroHeadline}>{selectedCandidateCv.headline}</p>
                                        <div style={styles.dossierLocationMeta}>
                                            <MapPinIcon style={{ width: '15px', height: '15px', color: colors.primary, marginRight: '6px' }} />
                                            <span>
                                                {selectedCandidateCv.location.neighborhood ? `${selectedCandidateCv.location.neighborhood}, ` : ''}
                                                {selectedCandidateCv.location.city} - {selectedCandidateCv.location.state}
                                            </span>
                                            <span style={{ margin: '0 8px', color: colors.border }}>•</span>
                                            <span>Senioridade: <strong>{selectedCandidateCv.seniority || 'Pleno / Sênior'}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BARRA EXECUTIVA DE CONTATO DIRETO (E-MAIL E TELEFONE) */}
                            <div style={styles.dossierContactBanner}>
                                <div style={styles.contactBannerHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '20px' }}>📱</span>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: colors.textPrimary }}>
                                                Canais Oficiais de Contato do Candidato
                                            </h3>
                                            <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                                                Opções de contato direto via E-mail e Telefone / Celular (WhatsApp) com 1 clique
                                            </span>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                        color: '#10b981',
                                        border: '1px solid rgba(16, 185, 129, 0.3)'
                                    }}>
                                        ✓ Canais Ativos e Verificados
                                    </span>
                                </div>

                                <div style={styles.contactCardsGrid}>
                                    {/* Canal E-mail */}
                                    <div style={styles.contactMethodCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <div style={styles.contactMethodIconBox}>
                                                <Mail style={{ width: '18px', height: '18px', color: colors.primary }} />
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <span style={styles.contactMethodLabel}>E-mail Oficial</span>
                                                <h4 style={styles.contactMethodValue}>{resolvedSelectedContact.email}</h4>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                            <button
                                                type="button"
                                                style={styles.contactBannerBtnSecondary}
                                                onClick={() => handleCopyText(resolvedSelectedContact.email, 'E-mail')}
                                            >
                                                <Copy style={{ width: '13px', height: '13px', marginRight: '6px' }} />
                                                Copiar E-mail
                                            </button>
                                            <a
                                                href={buildMailtoUrl(resolvedSelectedContact.email, selectedCandidateCv.name, selectedCandidateCv.headline)}
                                                style={styles.contactBannerBtnPrimary}
                                            >
                                                <Mail style={{ width: '13px', height: '13px', marginRight: '6px' }} />
                                                Escrever E-mail
                                            </a>
                                        </div>
                                    </div>

                                    {/* Canal Telefone / WhatsApp */}
                                    <div style={styles.contactMethodCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <div style={{ ...styles.contactMethodIconBox, backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
                                                <Phone style={{ width: '18px', height: '18px', color: '#10b981' }} />
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <span style={styles.contactMethodLabel}>Telefone / Celular (WhatsApp)</span>
                                                <h4 style={styles.contactMethodValue}>{resolvedSelectedContact.phone}</h4>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                style={styles.contactBannerBtnSecondary}
                                                onClick={() => handleCopyText(resolvedSelectedContact.phone, 'Telefone')}
                                            >
                                                <Copy style={{ width: '13px', height: '13px', marginRight: '6px' }} />
                                                Copiar
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.contactBannerBtnWhatsApp}
                                                onClick={() => {
                                                    const waUrl = buildWhatsAppUrl(resolvedSelectedContact.phoneWithDdi, selectedCandidateCv.name, selectedCandidateCv.headline);
                                                    window.open(waUrl, '_blank');
                                                }}
                                            >
                                                💬 WhatsApp
                                            </button>
                                            <a
                                                href={`tel:${resolvedSelectedContact.cleanPhone}`}
                                                style={styles.contactBannerBtnCall}
                                                title="Fazer ligação telefônica"
                                            >
                                                📞 Ligar
                                            </a>
                                        </div>
                                    </div>

                                    {/* Canal Redes & Abordagem */}
                                    <div style={styles.contactMethodCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <div style={{ ...styles.contactMethodIconBox, backgroundColor: 'rgba(59, 130, 246, 0.12)' }}>
                                                <ExternalLinkIcon style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <span style={styles.contactMethodLabel}>Perfil na Web & Abordagem</span>
                                                <h4 style={styles.contactMethodValue}>
                                                    {selectedCandidateCv.portalSource || 'Varredura Local 360°'}
                                                </h4>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                            {resolvedSelectedContact.linkedin && (
                                                <a
                                                    href={resolvedSelectedContact.linkedin.startsWith('http') ? resolvedSelectedContact.linkedin : `https://${resolvedSelectedContact.linkedin}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={styles.contactBannerBtnLinkedIn}
                                                >
                                                    🔗 LinkedIn
                                                </a>
                                            )}
                                            <button
                                                type="button"
                                                style={styles.contactBannerBtnAbordar}
                                                onClick={() => {
                                                    const cand = selectedCandidateCv;
                                                    openContactModal(cand);
                                                }}
                                            >
                                                ✨ Mensagem de Abordagem
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CURRÍCULO COMPLETO ATS: DUAS COLUNAS EQUILIBRADAS */}
                            <div style={styles.dossierContentGrid}>
                                {/* Coluna Esquerda: Competências, Formação, Fontes */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Competências Técnicas */}
                                    <div style={styles.dossierSectionCard}>
                                        <h3 style={styles.dossierSectionHeader}>Competências & Tecnologias</h3>
                                        <div style={styles.skillsContainer}>
                                            {selectedCandidateCv.skills.map((skill, idx) => (
                                                <span key={idx} style={styles.skillTagLarge}>{skill}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Formação Acadêmica */}
                                    {selectedCandidateCv.education && (
                                        <div style={styles.dossierSectionCard}>
                                            <h3 style={styles.dossierSectionHeader}>Formação Acadêmica & Qualificações</h3>
                                            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: colors.textPrimary }}>
                                                {selectedCandidateCv.education}
                                            </p>
                                        </div>
                                    )}

                                    {/* Fontes Verificadas da Web */}
                                    {selectedCandidateCv.sourceUrls && selectedCandidateCv.sourceUrls.length > 0 && (
                                        <div style={styles.dossierSectionCard}>
                                            <h3 style={styles.dossierSectionHeader}>Fontes & Perfis Verificados</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {selectedCandidateCv.sourceUrls.map((s, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={s.uri}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={styles.sourceBadgeLink}
                                                    >
                                                        <ExternalLinkIcon style={{ width: '13px', height: '13px', marginRight: '6px' }} />
                                                        {s.title || s.uri}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Coluna Direita: Resumo Executivo e Experiência Profissional */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Resumo Executivo */}
                                    <div style={styles.dossierSectionCard}>
                                        <h3 style={styles.dossierSectionHeader}>Resumo Executivo do Candidato</h3>
                                        <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.7, color: colors.textPrimary }}>
                                            {selectedCandidateCv.summary}
                                        </p>
                                    </div>

                                    {/* Histórico e Destaques */}
                                    {selectedCandidateCv.experienceHighlights && selectedCandidateCv.experienceHighlights.length > 0 && (
                                        <div style={styles.dossierSectionCard}>
                                            <h3 style={styles.dossierSectionHeader}>Histórico de Entregas & Experiência</h3>
                                            <ul style={{ margin: 0, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {selectedCandidateCv.experienceHighlights.map((hl, idx) => (
                                                    <li key={idx} style={{ fontSize: '14px', lineHeight: 1.6, color: colors.textPrimary }}>
                                                        {hl}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Texto Integral do Currículo (para ATS e cópia rápida) */}
                                    {selectedCandidateCv.fullCvText && (
                                        <div style={styles.dossierSectionCard}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <h3 style={styles.dossierSectionHeader}>Dossiê Integral Formatado ATS</h3>
                                                <button
                                                    type="button"
                                                    style={styles.contactMiniBtn}
                                                    onClick={() => handleCopyText(selectedCandidateCv.fullCvText || '', 'Currículo Integral')}
                                                >
                                                    <Copy style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                                    Copiar Tudo
                                                </button>
                                            </div>
                                            <pre style={styles.dossierCvPreBlock}>
                                                {selectedCandidateCv.fullCvText}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Barra de Ações Inferior */}
                            <div style={styles.dossierBottomBar}>
                                <button
                                    type="button"
                                    style={styles.buttonSecondary}
                                    onClick={() => setSelectedCandidateCv(null)}
                                >
                                    <ArrowLeft style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                                    Voltar para a Lista de Candidatos
                                </button>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        style={styles.buttonSecondary}
                                        onClick={() => handleCopyText(selectedCandidateCv.fullCvText || selectedCandidateCv.summary, 'Currículo')}
                                    >
                                        <Copy style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                                        Copiar Currículo
                                    </button>
                                    <button
                                        type="button"
                                        style={isSelectedCandidateSaved ? styles.btnSaved : styles.buttonPrimary}
                                        onClick={() => handleSaveCandidateToDb(selectedCandidateCv)}
                                        disabled={isSelectedCandidateSaved}
                                    >
                                        <DatabaseIcon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                                        {isSelectedCandidateSaved ? 'Salvo no Banco' : 'Salvar no Banco de Talentos'}
                                    </button>
                                    <button
                                        type="button"
                                        style={{
                                            backgroundColor: '#10b981',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 18px',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        onClick={() => {
                                            const waUrl = buildWhatsAppUrl(resolvedSelectedContact.phoneWithDdi, selectedCandidateCv.name, selectedCandidateCv.headline);
                                            window.open(waUrl, '_blank');
                                        }}
                                    >
                                        💬 Iniciar Conversa no WhatsApp
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* MODAL: ABORDAR CANDIDATO */}
            {contactingCandidate && (() => {
                const candContact = resolveCandidateContact(contactingCandidate, contactingCandidate.location.state);
                return (
                    <div style={styles.modalBackdrop} onClick={() => setContactingCandidate(null)}>
                        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <div style={styles.modalHeader}>
                                <div>
                                    <h2 style={{ margin: 0, color: colors.primary }}>Abordar {contactingCandidate.name}</h2>
                                    <p style={{ margin: '4px 0 0 0', color: colors.textSecondary }}>
                                        Envie uma mensagem de contato profissional direto via WhatsApp ou E-mail.
                                    </p>
                                </div>
                                <button style={styles.closeBtn} onClick={() => setContactingCandidate(null)}>✕</button>
                            </div>

                            {/* CANAIS DIRETOS DE CONTATO EM DESTAQUE NO TOPO DO MODAL */}
                            <div style={{
                                backgroundColor: colors.background,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '10px',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '10px',
                                margin: '14px 0 6px 0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Mail style={{ width: '14px', height: '14px', color: colors.primary }} />
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: colors.textPrimary }}>{candContact.email}</span>
                                        <button
                                            type="button"
                                            style={styles.contactMiniBtn}
                                            onClick={() => handleCopyText(candContact.email, 'E-mail')}
                                            title="Copiar e-mail"
                                        >
                                            <Copy style={{ width: '12px', height: '12px' }} />
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Phone style={{ width: '14px', height: '14px', color: '#10b981' }} />
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: colors.textPrimary }}>{candContact.phone}</span>
                                        <button
                                            type="button"
                                            style={styles.contactMiniBtn}
                                            onClick={() => handleCopyText(candContact.phone, 'Telefone')}
                                            title="Copiar telefone"
                                        >
                                            <Copy style={{ width: '12px', height: '12px' }} />
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    style={styles.contactWaBtn}
                                    onClick={() => {
                                        const waUrl = buildWhatsAppUrl(candContact.phoneWithDdi, contactingCandidate.name, contactingCandidate.headline, contactBody);
                                        window.open(waUrl, '_blank');
                                    }}
                                >
                                    💬 Chamar no WhatsApp
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '16px 0' }}>
                                <div>
                                    <label style={styles.fieldLabel}>Carregar Modelo</label>
                                    <select
                                        style={styles.select}
                                        onChange={e => {
                                            const t = templates.find(item => item.id === e.target.value);
                                            if (t) {
                                                setContactBody(
                                                    t.body
                                                        .replace(/\[candidato\]/gi, contactingCandidate.name.split(' ')[0])
                                                        .replace(/\[cargo\]/gi, contactingCandidate.headline)
                                                        .replace(/\[localizacao\]/gi, `${contactingCandidate.location.city} - ${contactingCandidate.location.state}`)
                                                        .replace(/\[empresa\]/gi, 'nossa empresa')
                                                );
                                            }
                                        }}
                                    >
                                        <option value="">Selecionar Modelo Salvo...</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={styles.fieldLabel}>Assunto</label>
                                    <input
                                        style={styles.input}
                                        value={contactSubject}
                                        onChange={e => setContactSubject(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label style={styles.fieldLabel}>Mensagem de Abordagem</label>
                                    <textarea
                                        style={styles.textarea}
                                        rows={7}
                                        value={contactBody}
                                        onChange={e => setContactBody(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={styles.modalFooter}>
                                <button
                                    type="button"
                                    style={{
                                        backgroundColor: '#10b981',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                    onClick={() => {
                                        const waUrl = buildWhatsAppUrl(candContact.phoneWithDdi, contactingCandidate.name, contactingCandidate.headline, contactBody);
                                        window.open(waUrl, '_blank');
                                    }}
                                >
                                    💬 Enviar via WhatsApp Direto
                                </button>
                                <button
                                    type="button"
                                    style={styles.buttonPrimary}
                                    onClick={handleSendContact}
                                >
                                    <Mail />
                                    Abrir no E-mail
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* MODAL: ANALISTA DE VAGAS & COMPATIBILIDADE IA */}
            {analyzingJobMatch && (
                <div style={styles.modalBackdrop} onClick={() => setAnalyzingJobMatch(null)}>
                    <div 
                        style={{
                            ...styles.modalContent,
                            maxWidth: '1200px',
                            width: '96%',
                            maxHeight: '94vh',
                            overflowY: 'auto',
                            padding: '0'
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ ...styles.modalHeader, padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10, backgroundColor: colors.surface }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>🎯</span>
                                <div>
                                    <h2 style={{ margin: 0, color: colors.primary, fontSize: '18px' }}>
                                        Analista de Vagas & Compatibilidade IA
                                    </h2>
                                    <p style={{ margin: '2px 0 0 0', color: colors.textSecondary, fontSize: '13px' }}>
                                        Auditoria de Job Description: <strong>{analyzingJobMatch.title}</strong> • {analyzingJobMatch.company}
                                    </p>
                                </div>
                            </div>
                            <button style={styles.closeBtn} onClick={() => setAnalyzingJobMatch(null)}>✕</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <JobMatchAnalyzer
                                initialJobTitle={analyzingJobMatch.title}
                                initialCompany={analyzingJobMatch.company}
                                initialJobDescription={`VAGA: ${analyzingJobMatch.title}\nEMPRESA: ${analyzingJobMatch.company}\nLOCALIDADE: ${analyzingJobMatch.location.city} - ${analyzingJobMatch.location.state} (${analyzingJobMatch.workModel})\nSALÁRIO: ${analyzingJobMatch.salaryOrRange || 'A combinar'}\n\nDESCRIÇÃO:\n${analyzingJobMatch.description}\n\nREQUISITOS & QUALIFICAÇÕES:\n${(analyzingJobMatch.requirements || []).join('\n')}`}
                                onNavigateToTailoredCV={() => {
                                    const j = analyzingJobMatch;
                                    setAnalyzingJobMatch(null);
                                    setTailoringJob(j);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: MESTRE DE RH & CONFECÇÃO DE CV SOB MEDIDA PARA A VAGA */}
            {tailoringJob && (
                <div style={styles.modalBackdrop} onClick={() => setTailoringJob(null)}>
                    <div 
                        style={{
                            ...styles.modalContent,
                            maxWidth: '1150px',
                            width: '95%',
                            maxHeight: '92vh',
                            overflowY: 'auto',
                            padding: '0'
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ ...styles.modalHeader, padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10, backgroundColor: colors.surface }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>✨</span>
                                <div>
                                    <h2 style={{ margin: 0, color: colors.primary, fontSize: '18px' }}>
                                        Mestre de RH: Currículo Sob Medida para a Vaga
                                    </h2>
                                    <p style={{ margin: '2px 0 0 0', color: colors.textSecondary, fontSize: '13px' }}>
                                        Oportunidade: <strong>{tailoringJob.title}</strong> • {tailoringJob.company} ({tailoringJob.location.city} - {tailoringJob.location.state})
                                    </p>
                                </div>
                            </div>
                            <button style={styles.closeBtn} onClick={() => setTailoringJob(null)}>✕</button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <JobTailoredCVBuilder
                                initialJobTitle={tailoringJob.title}
                                initialCompany={tailoringJob.company}
                                initialJobDescription={`VAGA: ${tailoringJob.title}\nEMPRESA: ${tailoringJob.company}\nLOCALIDADE: ${tailoringJob.location.city} - ${tailoringJob.location.state} (${tailoringJob.workModel})\nSALÁRIO: ${tailoringJob.salaryOrRange || 'A combinar'}\n\nDESCRIÇÃO:\n${tailoringJob.description}\n\nREQUISITOS & QUALIFICAÇÕES:\n${(tailoringJob.requirements || []).join('\n')}`}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getStatusSelectStyle = (status: CandidateStatus, colors: any): React.CSSProperties => {
    let bg = colors.surface;
    let color = colors.textPrimary;
    let borderColor = colors.border;

    switch (status) {
        case 'Novo':
            borderColor = colors.primary;
            color = colors.primary;
            break;
        case 'Contatado':
            borderColor = '#3b82f6';
            color = '#3b82f6';
            break;
        case 'Em Análise':
            borderColor = '#f59e0b';
            color = '#f59e0b';
            break;
        case 'Entrevista':
            borderColor = '#8b5cf6';
            color = '#8b5cf6';
            break;
        case 'Aprovado':
            borderColor = colors.success;
            color = colors.success;
            break;
        case 'Banco de Reserva':
            borderColor = colors.textSecondary;
            color = colors.textSecondary;
            break;
    }

    return {
        padding: '6px 10px',
        fontSize: '13px',
        fontWeight: '600',
        borderRadius: '6px',
        border: `1.5px solid ${borderColor}`,
        backgroundColor: bg,
        color: color,
        cursor: 'pointer',
    };
};

const getStyles = (colors: any): { [key: string]: React.CSSProperties } => ({
    container: { 
        width: '100%', 
        maxWidth: '100%', 
        margin: '0', 
        paddingBottom: '40px',
        boxSizing: 'border-box'
    },
    headerBox: { marginBottom: '25px', width: '100%' },
    headerTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
    headerTitle: { fontSize: '26px', fontWeight: 'bold', color: colors.textPrimary, margin: 0 },
    headerSubtitle: { fontSize: '15px', color: colors.textSecondary, margin: '6px 0 0 0', lineHeight: 1.5 },
    tabNav: {
        display: 'flex',
        gap: '10px',
        borderBottom: `2px solid ${colors.border}`,
        paddingBottom: '2px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        width: '100%',
    },
    tabButton: {
        padding: '12px 18px',
        fontSize: '15px',
        fontWeight: '500',
        color: colors.textSecondary,
        backgroundColor: 'transparent',
        border: 'none',
        borderBottom: '3px solid transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
    },
    tabButtonActive: {
        padding: '12px 18px',
        fontSize: '15px',
        fontWeight: '700',
        color: colors.primary,
        backgroundColor: 'transparent',
        border: 'none',
        borderBottom: `3px solid ${colors.primary}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    countBadge: {
        backgroundColor: colors.primary,
        color: colors.textOnPrimary,
        borderRadius: '12px',
        padding: '2px 8px',
        fontSize: '12px',
        fontWeight: 'bold',
        marginLeft: '4px',
    },
    toast: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        backgroundColor: '#10b981',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 2000,
        fontWeight: '600',
        fontSize: '14px',
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    cardHeader: { marginBottom: '20px' },
    cardTitle: { fontSize: '20px', fontWeight: 'bold', color: colors.textPrimary, margin: '0 0 6px 0' },
    cardDesc: { fontSize: '14px', color: colors.textSecondary, margin: 0, lineHeight: 1.5 },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
    fieldColFull: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' },
    fieldCol: { display: 'flex', flexDirection: 'column', gap: '6px' },
    fieldLabel: { fontSize: '13px', fontWeight: '600', color: colors.textSecondary },
    input: {
        padding: '11px 14px',
        fontSize: '15px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.inputBg,
        color: colors.inputText,
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    select: {
        padding: '11px 14px',
        fontSize: '15px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.inputBg,
        color: colors.inputText,
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
    },
    textarea: {
        padding: '11px 14px',
        fontSize: '14px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.inputBg,
        color: colors.inputText,
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        resize: 'vertical',
    },
    formFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: `1px solid ${colors.border}`,
    },
    buttonPrimary: {
        padding: '12px 24px',
        fontSize: '15px',
        fontWeight: '600',
        color: colors.textOnPrimary,
        backgroundColor: colors.primary,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    buttonSecondary: {
        padding: '11px 18px',
        fontSize: '14px',
        fontWeight: '600',
        color: colors.textPrimary,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    buttonDisabled: {
        padding: '12px 24px',
        fontSize: '15px',
        fontWeight: '600',
        color: colors.buttonDisabledText,
        backgroundColor: colors.buttonDisabledBg,
        border: 'none',
        borderRadius: '8px',
        cursor: 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    errorBanner: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid #ef4444',
        color: '#ef4444',
        padding: '12px 16px',
        borderRadius: '8px',
        marginTop: '16px',
        fontSize: '14px',
    },
    resultsActionBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        marginBottom: '20px',
    },
    resultsTitle: { fontSize: '18px', fontWeight: 'bold', color: colors.textPrimary, margin: 0 },
    resultsSubtitle: { fontSize: '13px', color: colors.textSecondary, margin: '4px 0 0 0' },
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
        gap: '20px',
    },
    candidateCard: {
        backgroundColor: colors.surface,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    },
    candidateCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '10px',
    },
    candidateName: { fontSize: '18px', fontWeight: 'bold', color: colors.textPrimary, margin: 0 },
    candidateHeadline: { fontSize: '14px', color: colors.primary, margin: '4px 0 0 0', fontWeight: '500' },
    matchBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        color: '#10b981',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '2px 8px',
        borderRadius: '12px',
    },
    candidateLocationRow: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '13px',
        color: colors.textSecondary,
        fontWeight: '500',
    },
    candidateSummary: {
        fontSize: '14px',
        color: colors.textPrimary,
        lineHeight: 1.5,
        margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    },
    skillsContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    skillTag: {
        backgroundColor: colors.background,
        color: colors.textSecondary,
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '6px',
        border: `1px solid ${colors.border}`,
        fontWeight: '500',
    },
    skillTagLarge: {
        backgroundColor: colors.background,
        color: colors.primary,
        fontSize: '13px',
        padding: '6px 12px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        fontWeight: '600',
    },
    highlightBox: {
        backgroundColor: colors.background,
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
    },
    highlightLabel: { fontWeight: 'bold', color: colors.textPrimary, display: 'block', marginBottom: '4px' },
    highlightList: { margin: 0, paddingLeft: '18px', color: colors.textSecondary, lineHeight: 1.4 },
    candidateContactBox: {
        backgroundColor: colors.background,
        borderRadius: '8px',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        border: `1px solid ${colors.border}`,
    },
    contactItemRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
    },
    contactMiniBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '5px',
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor: colors.surface,
        color: colors.textSecondary,
        border: `1px solid ${colors.border}`,
        cursor: 'pointer',
    },
    contactActionBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 9px',
        borderRadius: '5px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: colors.primary,
        color: colors.textOnPrimary,
        border: 'none',
        textDecoration: 'none',
        cursor: 'pointer',
    },
    contactWaBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 9px',
        borderRadius: '5px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: '#10b981',
        color: '#ffffff',
        border: 'none',
        textDecoration: 'none',
        cursor: 'pointer',
    },
    sourcesBox: {
        fontSize: '12px',
        borderTop: `1px dashed ${colors.border}`,
        paddingTop: '10px',
    },
    sourcesLabel: { fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '6px' },
    sourcesLinksRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    sourceBadgeLink: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: '4px',
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        color: colors.primary,
        textDecoration: 'none',
        fontSize: '11px',
        fontWeight: '500',
    },
    candidateActions: {
        display: 'flex',
        gap: '8px',
        marginTop: 'auto',
        paddingTop: '14px',
        borderTop: `1px solid ${colors.border}`,
        flexWrap: 'wrap',
    },
    btnActionPrimary: {
        padding: '8px 12px',
        fontSize: '13px',
        fontWeight: '600',
        backgroundColor: colors.primary,
        color: colors.textOnPrimary,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        flex: '1 1 auto',
        justifyContent: 'center',
    },
    btnActionPrimaryLink: {
        padding: '8px 12px',
        fontSize: '13px',
        fontWeight: '600',
        backgroundColor: colors.primary,
        color: colors.textOnPrimary,
        borderRadius: '6px',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        flex: '1 1 auto',
        justifyContent: 'center',
    },
    btnActionSecondary: {
        padding: '8px 12px',
        fontSize: '13px',
        fontWeight: '600',
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        flex: '1 1 auto',
        justifyContent: 'center',
    },
    btnActionOutline: {
        padding: '8px 12px',
        fontSize: '13px',
        fontWeight: '600',
        backgroundColor: 'transparent',
        color: colors.primary,
        border: `1px solid ${colors.primary}`,
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        flex: '1 1 auto',
        justifyContent: 'center',
    },
    btnActionDelete: {
        padding: '8px 10px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnSaved: {
        padding: '8px 12px',
        fontSize: '13px',
        fontWeight: '600',
        backgroundColor: colors.buttonDisabledBg,
        color: colors.buttonDisabledText,
        border: 'none',
        borderRadius: '6px',
        cursor: 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        flex: '1 1 auto',
        justifyContent: 'center',
    },
    jobCard: {
        backgroundColor: colors.surface,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    },
    jobCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '12px',
    },
    jobTitle: { fontSize: '18px', fontWeight: 'bold', color: colors.textPrimary, margin: 0 },
    jobCompanyRow: { display: 'flex', alignItems: 'center', fontSize: '14px', marginTop: '4px' },
    badgesCol: { display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' },
    badgeModel: {
        backgroundColor: 'rgba(25, 103, 210, 0.1)',
        color: colors.primary,
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '2px 8px',
        borderRadius: '6px',
    },
    badgeSalary: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '2px 8px',
        borderRadius: '6px',
    },
    jobDesc: {
        fontSize: '14px',
        color: colors.textPrimary,
        lineHeight: 1.5,
        margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    },
    filterRow: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: `1px solid ${colors.border}`,
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        backgroundColor: colors.surface,
        borderRadius: '12px',
        border: `1px dashed ${colors.border}`,
        marginTop: '20px',
    },
    modalBackdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1500,
        padding: '20px',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: '16px',
        width: '96%',
        maxWidth: '1150px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        padding: '26px',
        overflowY: 'auto',
        boxSizing: 'border-box',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '16px',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        color: colors.textSecondary,
    },
    cvModalBody: {
        margin: '20px 0',
    },
    cvPaper: {
        backgroundColor: colors.background,
        borderRadius: '12px',
        padding: '26px',
        border: `1px solid ${colors.border}`,
        boxSizing: 'border-box',
        lineHeight: 1.6,
    },
    cvSectionTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: colors.primary,
        margin: '0 0 8px 0',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '4px',
    },
    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        borderTop: `1px solid ${colors.border}`,
        paddingTop: '16px',
    },
    templateGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: '24px',
        marginTop: '20px',
    },
    templateForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    formHeader: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: colors.primary,
        margin: '0 0 8px 0',
    },
    templateListItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: colors.background,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: colors.textSecondary,
        padding: '4px',
    },
    portalFilterBox: {
        marginTop: '16px',
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
    },
    btnActionPortalDirect: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: '8px',
        backgroundColor: 'transparent',
        border: `1px solid ${colors.border}`,
        color: colors.primary,
        fontSize: '12px',
        fontWeight: '700',
        textDecoration: 'none',
        cursor: 'pointer',
    },
    btnActionCopyCreds: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: '8px',
        backgroundColor: 'transparent',
        border: `1px solid ${colors.border}`,
        color: colors.textSecondary,
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    fullScreenDossier: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: colors.background,
        color: colors.textPrimary,
        zIndex: 2500,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
    },
    dossierTopNav: {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    },
    dossierBackBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: colors.hoverBg,
        border: `1px solid ${colors.border}`,
        color: colors.textPrimary,
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    dossierNavTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
    },
    dossierWaTopBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#10b981',
        color: '#ffffff',
        border: 'none',
        padding: '8px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        textDecoration: 'none',
    },
    dossierMailTopBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: colors.primary,
        color: '#ffffff',
        border: 'none',
        padding: '8px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        textDecoration: 'none',
    },
    closeDossierBtn: {
        background: 'none',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '700',
        padding: '6px 12px',
        cursor: 'pointer',
        color: colors.textSecondary,
        marginLeft: '4px',
    },
    dossierBodyContainer: {
        width: '100%',
        maxWidth: '1380px',
        margin: '0 auto',
        padding: '24px 24px 60px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    dossierHeroCard: {
        backgroundColor: colors.surface,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        padding: '24px 28px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
    },
    dossierHeroAvatar: {
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        backgroundColor: colors.primary,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: '800',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    dossierHeroName: {
        fontSize: '26px',
        fontWeight: '800',
        color: colors.textPrimary,
        margin: 0,
        letterSpacing: '-0.02em',
    },
    dossierHeroHeadline: {
        fontSize: '16px',
        fontWeight: '600',
        color: colors.primary,
        margin: '6px 0 10px 0',
    },
    dossierMatchBadge: {
        padding: '4px 12px',
        fontSize: '12px',
        fontWeight: '800',
        borderRadius: '16px',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        color: '#10b981',
        border: '1px solid rgba(16, 185, 129, 0.3)',
    },
    dossierPortalBadge: {
        padding: '4px 12px',
        fontSize: '12px',
        fontWeight: '700',
        borderRadius: '16px',
        backgroundColor: colors.hoverBg,
        color: colors.textSecondary,
        border: `1px solid ${colors.border}`,
    },
    dossierLocationMeta: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px',
        color: colors.textSecondary,
        flexWrap: 'wrap',
    },
    dossierContactBanner: {
        backgroundColor: colors.surface,
        borderRadius: '16px',
        border: `1.5px solid ${colors.primary}`,
        padding: '22px 24px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    contactBannerHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '12px',
    },
    contactCardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
    },
    contactMethodCard: {
        backgroundColor: colors.background,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    contactMethodIconBox: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        backgroundColor: 'rgba(159, 18, 57, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    contactMethodLabel: {
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: colors.textSecondary,
        display: 'block',
    },
    contactMethodValue: {
        fontSize: '14px',
        fontWeight: '700',
        color: colors.textPrimary,
        margin: '2px 0 0 0',
        wordBreak: 'break-all',
    },
    contactBannerBtnPrimary: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '7px 12px',
        borderRadius: '6px',
        backgroundColor: colors.primary,
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: '700',
        textDecoration: 'none',
        cursor: 'pointer',
        border: 'none',
    },
    contactBannerBtnSecondary: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '7px 12px',
        borderRadius: '6px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        color: colors.textPrimary,
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    contactBannerBtnWhatsApp: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '7px 12px',
        borderRadius: '6px',
        backgroundColor: '#10b981',
        color: '#ffffff',
        border: 'none',
        fontSize: '12px',
        fontWeight: '700',
        cursor: 'pointer',
    },
    contactBannerBtnCall: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '7px 10px',
        borderRadius: '6px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        color: colors.textPrimary,
        fontSize: '12px',
        fontWeight: '600',
        textDecoration: 'none',
        cursor: 'pointer',
    },
    contactBannerBtnLinkedIn: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '7px 12px',
        borderRadius: '6px',
        backgroundColor: '#0a66c2',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: '700',
        textDecoration: 'none',
        cursor: 'pointer',
    },
    contactBannerBtnAbordar: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '7px 12px',
        borderRadius: '6px',
        backgroundColor: colors.hoverBg,
        border: `1px solid ${colors.border}`,
        color: colors.primary,
        fontSize: '12px',
        fontWeight: '700',
        cursor: 'pointer',
    },
    dossierContentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
    },
    dossierSectionCard: {
        backgroundColor: colors.surface,
        borderRadius: '14px',
        border: `1px solid ${colors.border}`,
        padding: '22px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    },
    dossierSectionHeader: {
        fontSize: '16px',
        fontWeight: '800',
        color: colors.primary,
        margin: '0 0 14px 0',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '8px',
        letterSpacing: '-0.01em',
    },
    dossierCvPreBlock: {
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '16px',
        fontSize: '12px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.5,
        color: colors.textPrimary,
        maxHeight: '340px',
        overflowY: 'auto',
    },
    dossierBottomBar: {
        backgroundColor: colors.surface,
        borderRadius: '14px',
        border: `1px solid ${colors.border}`,
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    },
});

export default LeadFinder;
