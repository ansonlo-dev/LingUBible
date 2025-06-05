# Development Mode Setup Guide

[![English](https://img.shields.io/badge/Language-English-blue)](DEV_MODE_SETUP.md)
[![繁體中文](https://img.shields.io/badge/Language-繁體中文-red)](../zh-TW/setup/DEV_MODE_SETUP.md)
[![简体中文](https://img.shields.io/badge/Language-简体中文-green)](../zh-CN/setup/DEV_MODE_SETUP.md)

## Overview

Development mode allows you to bypass normal registration restrictions during development and testing, including:
- Register with any email domain (not limited to school emails)
- Bypass password strength requirements
- Automatically pass email verification

## 🚀 Quick Setup

### 1. Environment Variables Configuration

Ensure your `.env` file contains the following settings:

```bash
# Development mode configuration
VITE_DEV_MODE=true
# When set to true, allows registration with any email address (for development testing only)

# Development mode password bypass
VITE_DEV_BYPASS_PASSWORD=true
# When set to true, bypasses password strength requirements (for development testing only)
```

### 2. Restart Development Server

```bash
npm run dev
```

### 3. Verify Setup

If configured correctly, you should see:
- Yellow development mode indicator in the top right corner
- Registration page allows any email domain
- Password strength check shows "bypassed" status

## 📧 Test Email Addresses

In development mode, you can use any valid email format:

### Common Email Services
```
test@gmail.com
user@example.com
demo@outlook.com
admin@test.com
student@yahoo.com
```

### Temporary Email Services
```
temp@10minutemail.com
test@tempmail.org
user@guerrillamail.com
```

## 🔓 Password Testing

In development mode, any password will be accepted, including:
```
123
password
test
a
any simple password
```

## 🧪 Testing Process

### 1. Registration Test
1. Visit the `/register` page
2. Enter any email address (e.g., `test@gmail.com`)
3. Enter any password (e.g., `123`)
4. Click "Send Verification Code" (automatically passes)
5. Enter any 6-digit number as verification code
6. Complete registration

### 2. Login Test
1. Login with the newly registered account
2. Verify that features work normally

## ⚠️ Important Security Reminders

### Production Environment Settings
Before deploying to production, you **must** set the following to `false`:

```bash
VITE_DEV_MODE=false
VITE_DEV_BYPASS_PASSWORD=false
```

### Security Checklist
- [ ] Disable development mode in production
- [ ] Ensure only school emails can register
- [ ] Enable full password strength checking
- [ ] Enable real email verification
- [ ] Remove development mode indicator

## 🛠️ Troubleshooting

### Development Mode Indicator Not Showing
1. Check if `.env` file exists
2. Confirm `VITE_DEV_MODE=true`
3. Restart development server

### Still Requiring Password Strength
1. Confirm `VITE_DEV_BYPASS_PASSWORD=true`
2. Check browser console for errors
3. Clear browser cache

### Email Verification Still Failing
1. Check browser console logs
2. Confirm development mode is properly enabled
3. Check network connection

## 📞 Support

If you encounter issues setting up development mode, please check:
1. Environment variables are correctly set
2. Development server has been restarted
3. Browser console for error messages

---

**Note: Development mode is for development and testing purposes only. Using development mode in production poses serious security risks.** 