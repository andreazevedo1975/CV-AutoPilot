// FIX: Implement the CreativeStudio component as an AI-powered chat for interview preparation.
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ChatMessage } from '../types';
import { chat } from '../services/geminiService';
import { AdvisorIcon } from './icons';
import { ThemeContext } from '../App';

const CreativeStudio: React.FC = () => {
    const { colors, theme } = useContext(ThemeContext);
    const styles = getStyles(colors, theme);

    const [messages, setMessages] = useLocalStorage<ChatMessage[]>('chatMessages', [
        { role: 'model', text: 'Olá! Sou Sofia Ribeiro, sua orientadora de carreira. Estou aqui para ajudar você a se destacar. Como posso auxiliar na sua preparação hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chat(newMessages);
            const modelMessage: ChatMessage = { role: 'model', text: response.text, sources: response.sources };
            setMessages([...newMessages, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', text: 'Desculpe, encontrei um erro. Por favor, tente novamente.' };
            setMessages([...newMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div style={styles.container}>
             <div style={styles.headerContainer}>
                <AdvisorIcon style={styles.headerIcon} />
                <div>
                    <h1 style={styles.header}>Orientador de RH</h1>
                    <p style={styles.subHeader}>Conversando com Sofia Ribeiro</p>
                </div>
            </div>
            <div style={styles.chatWindow}>
                {messages.map((msg, index) => (
                    <div key={index} style={msg.role === 'user' ? styles.userMessageContainer : styles.modelMessageContainer}>
                       {msg.role === 'model' && <AdvisorIcon style={styles.avatar} />}
                       <div style={msg.role === 'user' ? styles.userMessageBubble : styles.modelMessageBubble}>
                           {msg.role === 'model' && <strong style={styles.modelName}>Sofia Ribeiro</strong>}
                           <p style={styles.messageText}>{msg.text}</p>
                           {msg.sources && msg.sources.length > 0 && (
                               <div style={styles.sourcesContainer}>
                                   <strong>Fontes:</strong>
                                   <ul>
                                       {msg.sources.map((source, i) => (
                                           <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" style={styles.sourceLink}>{source.title}</a></li>
                                       ))}
                                   </ul>
                               </div>
                           )}
                       </div>
                   </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div style={styles.inputArea}>
                <input
                    style={styles.input}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Faça uma pergunta para Sofia..."
                />
                <button style={styles.button} onClick={handleSend} disabled={isLoading}>
                    {isLoading ? 'Pensando...' : 'Enviar'}
                </button>
            </div>
            <footer style={styles.footer}>
                Copyright by André Azevedo
            </footer>
        </div>
    );
};

const getStyles = (colors, theme): { [key: string]: React.CSSProperties } => ({
    container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' },
    headerContainer: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
    },
    headerIcon: {
        width: '40px',
        height: '40px',
        marginRight: '15px',
    },
    header: { color: colors.primary, marginBottom: '0', fontSize: '24px' },
    subHeader: {
        color: colors.textSecondary,
        marginTop: '0',
        fontSize: '16px',
    },
    chatWindow: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        marginBottom: '20px',
    },
    userMessageContainer: { 
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '10px' 
    },
    modelMessageContainer: { 
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: '10px',
        gap: '10px',
    },
    avatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        flexShrink: 0,
    },
    userMessageBubble: {
        padding: '10px 15px',
        borderRadius: '18px',
        backgroundColor: colors.primary,
        color: colors.textOnPrimary,
        maxWidth: '80%',
        textAlign: 'left',
    },
    modelMessageBubble: {
        padding: '10px 15px',
        borderRadius: '18px',
        backgroundColor: theme === 'dark' ? '#4a5568' : '#e2e8f0',
        color: colors.textPrimary,
        maxWidth: '80%',
    },
    modelName: {
        display: 'block',
        color: colors.primary,
        fontWeight: 'bold',
        marginBottom: '5px',
        fontSize: '14px',
    },
    messageText: {
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
    },
    sourcesContainer: {
        fontSize: '12px',
        marginTop: '8px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: '8px',
    },
    sourceLink: {
        color: theme === 'dark' ? '#90caf9' : '#1967d2',
    },
    inputArea: { display: 'flex', gap: '10px' },
    input: { flex: 1, padding: '12px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText },
    button: { padding: '12px 20px', fontSize: '16px', color: colors.textOnPrimary, backgroundColor: colors.primary, border: 'none', borderRadius: '8px', cursor: 'pointer' },
    footer: {
        marginTop: '20px',
        textAlign: 'center',
        fontSize: '14px',
        color: colors.textSecondary,
    }
});

export default CreativeStudio;