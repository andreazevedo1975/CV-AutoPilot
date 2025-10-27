// FIX: Implement the CreativeStudio component as an AI-powered chat for interview preparation.
import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ChatMessage } from '../types';
import { chat } from '../services/geminiService';

const CreativeStudio: React.FC = () => {
    const [messages, setMessages] = useLocalStorage<ChatMessage[]>('chatMessages', [
        { role: 'model', text: 'Olá! Sou seu assistente de carreira, atuando como um especialista de RH. Estou aqui para ajudar você a se destacar. Pergunte-me sobre como se portar em entrevistas, preencher formulários, ou se preparar para testes profissionais.' }
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
            <h1 style={styles.header}>Orientador de RH</h1>
            <div style={styles.chatWindow}>
                {messages.map((msg, index) => (
                    <div key={index} style={msg.role === 'user' ? styles.userMessage : styles.modelMessage}>
                        <p style={styles.messageText}>{msg.text}</p>
                        {msg.sources && msg.sources.length > 0 && (
                            <div style={styles.sourcesContainer}>
                                <strong>Fontes:</strong>
                                <ul>
                                    {msg.sources.map((source, i) => (
                                        <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer">{source.title}</a></li>
                                    ))}
                                </ul>
                            </div>
                        )}
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
                    placeholder="Faça uma pergunta..."
                />
                <button style={styles.button} onClick={handleSend} disabled={isLoading}>
                    {isLoading ? 'Pensando...' : 'Enviar'}
                </button>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' },
    header: { color: '#333', marginBottom: '20px' },
    chatWindow: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        marginBottom: '20px',
    },
    userMessage: { textAlign: 'right', marginBottom: '10px' },
    modelMessage: { textAlign: 'left', marginBottom: '10px' },
    messageText: {
        display: 'inline-block',
        padding: '10px 15px',
        borderRadius: '18px',
        backgroundColor: '#e8f0fe',
        color: '#333',
        maxWidth: '80%',
    },
    sourcesContainer: {
        fontSize: '12px',
        marginTop: '5px',
        paddingLeft: '15px'
    },
    inputArea: { display: 'flex', gap: '10px' },
    input: { flex: 1, padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc' },
    button: { padding: '12px 20px', fontSize: '16px', color: '#fff', backgroundColor: '#1967d2', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};

export default CreativeStudio;