# AcademicChain n8n Workflows

This directory contains the JSON exports of the n8n workflows used by the AcademicChain platform.

## Workflow Mapping

| Endpoint | Workflow File | Description |
|----------|---------------|-------------|
| `check-institution` | `check-accounts.json` | Checks if institution account exists |
| `check-creator` | `check-accounts.json` | Checks if creator account exists |
| `check-employer` | `check-accounts.json` | Checks if employer account exists |
| `password-reset` | `password-reset.json` | Handles password reset requests |
| `employer-verify` | `employer-verify.json` | Verifies single talent credential |
| `employer-verify-batch` | `employer-verify-batch.json` | Verifies batch of credentials |
| `employer-verify-image` | `employer-verify-identity.json` | Verifies student identity via image |
| `verify-identity-image` | `employer-verify-identity.json` | KYC Identity Verification |
| `generate-employer-report` | `employer-report.json` | Generates PDF reports |
| `create-payment` | `create-payment.json` | Creates payment intent |
| `verify-payment` | `verify-payment.json` | Verifies payment status |
| `batch-issue` | `batch-issue.json` | Issues credentials in batch (Triple Shield) |
| `generate-smart-cv` | `smart-cv-gen.json` | Generates Smart CV using AI |
| `search-talent` | `smart-cv-gen.json` | Searches for talent using AI |
| `process-canva` | `template-management.json` | Processes Canva designs |
| `save-template` | `template-management.json` | Saves certificate templates |
| `submit-document` | `submit-document.json` | Generic document submission |
| `api/auth/*` | `auth-production.json` | Production Authentication Flow |
| `api/auth/*` | `auth-mock.json` | Mock Authentication Flow (Dev) |

## Import Instructions

1. Open your n8n instance.
2. Go to **Workflows**.
3. Click **Import from File**.
4. Select the `.json` files from this directory.
5. Activate the workflows.

## Environment Variables

Ensure your n8n instance has the following environment variables or credentials configured if required by the specific workflow (e.g., SMTP for email, Hedera keys for issuance).
