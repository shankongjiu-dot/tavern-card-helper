Set ws = CreateObject("WScript.Shell")
desktopPath = ws.SpecialFolders("Desktop")
Set sc = ws.CreateShortcut(desktopPath & "\Tavern Card Helper.lnk")
sc.TargetPath = "d:\叶\Documents\AI work\tavern-card-helper\启动.bat"
sc.WorkingDirectory = "d:\叶\Documents\AI work\tavern-card-helper"
sc.Description = "Tavern Card Helper"
sc.Save
WScript.Echo "Desktop shortcut created!"
