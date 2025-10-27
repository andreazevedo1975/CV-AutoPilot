// FIX: Implement the CVManager component to allow users to add and manage their CVs.
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CV } from '../types';

const CVManager: React.FC = () => {
    const [cvs, setCvs] = useLocalStorage<CV[]>('cvs', []);
    const [cvName, setCvName] = useState('');
    const [cvContent, setCvContent] = useState('');

    const handleAddCv = () => {
        if (!cvName || !cvContent) return;
        const newCv: CV = {
            id: new Date().toISOString(),
            name: cvName,
            content: cvContent,
        };
        setCvs([...cvs, newCv]);
        setCvName('');
        setCvContent('');
    };
    
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Gerenciador de Currículos</h1>
            
            <div style={styles.form}>
                <h2 style={styles.subHeader}>Adicionar Novo Currículo</h2>
                <input style={styles.input} type="text" placeholder="Nome do Currículo (ex: 'Currículo de Engenheiro de Software')" value={cvName} onChange={(e) => setCvName(e.target.value)} />
                <textarea style={styles.textarea} placeholder="Cole o conteúdo do seu currículo aqui..." value={cvContent} onChange={(e) => setCvContent(e.target.value)} rows={15}></textarea>
                <button style={styles.button} onClick={handleAddCv}>Salvar Currículo</button>
            </div>

            <div style={styles.listContainer}>
                <h2 style={styles.subHeader}>Currículos Salvos</h2>
                {cvs.length === 0 ? <p>Nenhum currículo salvo ainda.</p> : (
                    <ul style={styles.list}>
                        {cvs.map(cv => (
                            <li key={cv.id} style={styles.listItem}>
                                <strong>{cv.name}</strong>
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
    textarea: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '200px' },
    button: { padding: '10px 20px', fontSize: '16px', color: '#fff', backgroundColor: '#1967d2', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    listContainer: { marginTop: '30px' },
    list: { listStyle: 'none', padding: 0 },
    listItem: { padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '10px' },
};

export default CVManager;