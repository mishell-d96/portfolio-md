---
title: "Cloud Techniques"
category: commands
order: 50
description: "Cloud / AWS penetration testing techniques."
tags: [cloud, aws]
---

## 1. AWS

### Interacting with AWS bucket # aws cli

Use 'aws cli' to interact with AWS buckets

{% raw %}
```bash
##### REQUIREMENTS:
# An AWS bucket is approachble
# AWS CLI installed and is configured with credentials

##### REFERENCE:
# - 

##### DESCRIPTION:
# interact with an AWS bucket using AWS CLI, for example to list the content of a bucket, or copy files between environments

##### START INTERACTION
# config for S3 bucket
Access key 		: AKIA609281A5B336D055
Secret key 		: ZPfjUt79HN+hcA+VY0TlaAWC5Uw+0iJw/y2Xt3r4
Bucket name 	: randomfacts
region 			: us-east-1
bucket endpoint 	: http://localhost:54321
cloudfront url. 	: http://facts.htb/randomfacts

# 1. configure the aws CLI
aws configure (# example)

- Access Key ID: AKIA609281A5B336D055
- Secret Access Key: ZPfjUt79HN+hcA+VY0TlaAWC5Uw+0iJw/y2Xt3r4
- Region: us-east-1
- Output format: json

# 2. interacting with the bucket (displays all buckets)
aws s3 ls --endpoint-url http://facts.htb:54321 

# list content of the randomFacts bucket
aws s3 ls s3://randomfacts --endpoint-url http://facts.htb:54321

# download everything on the bucket (loot = local folder)
aws s3 sync s3://randomfacts ./loot --endpoint-url http://facts.htb:54321

# download a specific file from the bucket
aws s3 cp s3://randomfacts/somefile.txt . --endpoint-url http://facts.htb:54321

##### END INTERACTION
```
{% endraw %}

## 2. Azure

### Interact with Azure CLI

Use 'Azure CLI' to interact with a remote azure instance

{% raw %}
```powershell
##### REQUIREMENTS:
N/A

##### REFERENCE:
https://portal.offsec.com/learning-modules/introduction-to-azure-209991

##### DESCRIPTION:
Interact with a remote cloud instance through the azure CLI

##### START INTERACTION
# 1. go into powershell from kali & download az cli tools, then connect your account
pwsh
Install-Module Az -Scope CurrentUser -Force
Connect-AzAccount

# 2. multiple commands
# general information about tenant and the account
Get-AzContext | Format-List

# resources
Get-AzResource # if output = none, no resources. use "Format-List" if list to long

##### END INTERACTION
```
{% endraw %}
