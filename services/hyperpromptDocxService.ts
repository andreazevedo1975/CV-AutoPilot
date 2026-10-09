// services/hyperpromptDocxService.ts
// Serviço para download do Hiperprompt Completo em formato Microsoft Word (.docx)

export const downloadHyperpromptWord = async (): Promise<boolean> => {
  try {
    const fileUrl = '/Hiperprompt-CV-AutoPilot-Enterprise.docx';
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Falha ao obter arquivo .docx: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'Hiperprompt-CV-AutoPilot-Enterprise.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (err) {
    console.error('Erro ao baixar Hiperprompt em Word:', err);
    // Fallback: abrir em nova aba
    window.open('/Hiperprompt-CV-AutoPilot-Enterprise.docx', '_blank');
    return false;
  }
};
