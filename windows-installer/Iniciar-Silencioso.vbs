' CV-AutoPilot Enterprise - Inicializador Silencioso (Zero Janela Preta)
' Executa o servidor Vite local em background e abre a janela do aplicativo

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

strScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strScriptDir

' Iniciar o npm run dev silenciosamente (janela oculta com flag 0)
WshShell.Run "cmd /c npm run dev", 0, False

' Aguardar 2.5 segundos para o Vite subir na porta 3000
WScript.Sleep 2500

' Tentar abrir como aplicativo nativo do Microsoft Edge ou Chrome se disponível
strEdge = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")
strChrome = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe")

If fso.FileExists(strEdge) Then
    ' Abre em janela de aplicativo limpa (sem barra de URL de navegador)
    WshShell.Run """" & strEdge & """ --app=http://localhost:3000 --window-size=1400,900", 1, False
ElseIf fso.FileExists(strChrome) Then
    WshShell.Run """" & strChrome & """ --app=http://localhost:3000 --window-size=1400,900", 1, False
Else
    ' Abre no navegador padrao
    WshShell.Run "http://localhost:3000", 1, False
End If
