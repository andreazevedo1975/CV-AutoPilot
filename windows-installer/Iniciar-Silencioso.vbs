' CV-AutoPilot Enterprise - Inicializador Silencioso (Zero Janela Preta)
' Executa o servidor Vite local em background e abre a janela do aplicativo

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

strScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Identificar pasta raiz do projeto onde package.json reside
If fso.FileExists(fso.BuildPath(strScriptDir, "package.json")) Then
    WshShell.CurrentDirectory = strScriptDir
ElseIf fso.FileExists(fso.BuildPath(fso.GetParentFolderName(strScriptDir), "package.json")) Then
    WshShell.CurrentDirectory = fso.GetParentFolderName(strScriptDir)
Else
    WshShell.CurrentDirectory = strScriptDir
End If

' Iniciar o npm run dev silenciosamente (janela oculta com flag 0)
WshShell.Run "cmd /c npm run dev", 0, False

' Aguardar 3 segundos para o servidor Vite inicializar completamente na porta 3000
WScript.Sleep 3000

' Tentar abrir como aplicativo nativo do Microsoft Edge ou Chrome se disponível
strEdge = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")
strChrome = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe")
strEdge64 = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")
strLocalEdge = WshShell.ExpandEnvironmentStrings("%LocalAppData%\Microsoft\Edge\Application\msedge.exe")

If fso.FileExists(strEdge) Then
    WshShell.Run """" & strEdge & """ --app=http://localhost:3000/ --window-size=1440,920", 1, False
ElseIf fso.FileExists(strEdge64) Then
    WshShell.Run """" & strEdge64 & """ --app=http://localhost:3000/ --window-size=1440,920", 1, False
ElseIf fso.FileExists(strLocalEdge) Then
    WshShell.Run """" & strLocalEdge & """ --app=http://localhost:3000/ --window-size=1440,920", 1, False
ElseIf fso.FileExists(strChrome) Then
    WshShell.Run """" & strChrome & """ --app=http://localhost:3000/ --window-size=1440,920", 1, False
Else
    ' Abre no navegador padrao
    WshShell.Run "http://localhost:3000/", 1, False
End If
