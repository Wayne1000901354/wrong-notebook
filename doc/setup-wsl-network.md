# WSL 區域網路訪問配置指南

## 問題說明
WSL 的 IP 位址（172.30.x.x）是虛擬網路 IP，區域網路內其他設備無法直接訪問。需要通過 Windows 宿主機的 IP 訪問。

## 解決方案

### 方法一：使用連接埠轉發（推薦）

#### 1. 獲取 Windows 宿主機的真實 IP
在 **Windows PowerShell**（管理員權限）中運行：
```powershell
ipconfig
```
找到 "無線區域網路適配器 WLAN" 或 "乙太網路適配器" 的 IPv4 位址，例如：`192.168.1.100`

#### 2. 配置連接埠轉發
在 **Windows PowerShell（管理員權限）** 中運行：
```powershell
# 添加連接埠轉發規則
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=172.30.108.211

# 查看轉發規則
netsh interface portproxy show all

# 允許防火牆連接埠（如果需要）
New-NetFirewallRule -DisplayName "WSL Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

#### 3. 訪問測試
- **本機訪問：** `http://localhost:3000`
- **區域網路訪問：** `http://192.168.1.100:3000` （使用您的 Windows IP）

#### 4. 刪除轉發規則（如果不需要了）
```powershell
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
```

---

### 方法二：使用 WSL 映像網路模式（Windows 11 22H2+）

#### 1. 創建或編輯 `.wslconfig`
在 Windows 用戶目錄（`C:\Users\YourUsername\`）創建 `.wslconfig` 文件：
```ini
[wsl2]
networkingMode=mirrored
dnsTunneling=true
firewall=true
autoProxy=true
```

#### 2. 重啟 WSL
在 **Windows PowerShell** 中運行：
```powershell
wsl --shutdown
```
然後重新啟動 WSL

#### 3. 驗證
映像模式下，WSL 和 Windows 共享網路介面，可以直接使用 Windows IP 訪問

---

### 方法三：臨時連接埠轉發（快速測試）

在 **Windows PowerShell（管理員權限）** 中運行：
```powershell
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$(wsl hostname -I | cut -d' ' -f1)
```

---

## 故障排除

### 1. 檢查 Windows 防火牆
- 打開 "Windows Defender 防火牆"
- 點擊 "進階設定"
- 檢查入站規則中是否有連接埠 3000 的規則
- 或者臨時關閉防火牆測試

### 2. 檢查連接埠佔用
在 Windows PowerShell 中：
```powershell
Get-NetTCPConnection -LocalPort 3000
```

### 3. 檢查 WSL IP 是否變化
WSL IP 可能在重啟後改變，需要重新配置連接埠轉發：
```bash
# 在 WSL 中查看 IP
hostname -I
```

### 4. 使用 Windows 的 localhost 轉發
Windows 訪問 `localhost:3000` 會自動轉發到 WSL，但區域網路設備需要使用 Windows IP

---

## 推薦配置

**最簡單的方法：**
1. 在 Windows PowerShell（管理員）運行連接埠轉發命令
2. 獲取 Windows IP 位址
3. 在其他設備上使用 `http://Windows-IP:3000` 訪問

**一勞永逸的方法：**
- 如果您使用 Windows 11，啟用映像網路模式
- 如果是 Windows 10，創建啟動腳本自動配置連接埠轉發
