# GitHub Pages Custom Domain Setup for sevad.com

## 🎯 Status: CNAME File Created ✅

Your repository now has a `CNAME` file pointing to `sevad.com`

---

## 📋 DNS Configuration Required

**You MUST update your DNS records at your domain provider to complete setup.**

### For `sevad.com` (Apex Domain) - RECOMMENDED

Add these **A Records** in your DNS provider:

```
Host: @
Type: A
Value 1: 185.199.108.153
Value 2: 185.199.109.153
Value 3: 185.199.110.153
Value 4: 185.199.111.153
TTL: 3600
```

**OR** use these **ALIAS/ANAME Records** (if your DNS provider supports it):

```
Host: @
Type: ALIAS/ANAME
Value: shubhamsinghrajpurohit.github.io
TTL: 3600
```

### For `www.sevad.com` (Subdomain)

```
Host: www
Type: CNAME
Value: shubhamsinghrajpurohit.github.io
TTL: 3600
```

---

## 🔧 Where to Configure DNS

**Popular Domain Providers:**

### GoDaddy
1. Log in to GoDaddy
2. Go to **My Products** → **Domains**
3. Click **Manage** on `sevad.com`
4. Go to **DNS** tab
5. Add the A records above

### Namecheap
1. Log in to Namecheap
2. Go to **My Domains**
3. Click **Manage** on `sevad.com`
4. Click **Advanced DNS**
5. Add the A records above

### AWS Route 53
1. Log in to AWS Console
2. Go to **Route 53**
3. Click **Hosted Zones**
4. Select `sevad.com`
5. Create A records with the values above

### Other Providers
Search: "[Your Provider] how to add A records DNS"

---

## ✅ GitHub Pages Configuration

### Already Done:
- ✅ CNAME file created with `sevad.com`
- ✅ Workflow configured for auto-deployment

### Still Need to Do:
1. **Update DNS records** (see above)
2. **Wait 24-48 hours** for DNS to propagate
3. **Verify in GitHub Settings** → Pages

---

## 📊 Verification Steps

After configuring DNS:

### Step 1: Verify CNAME Record
```bash
nslookup sevad.com
# OR
dig sevad.com
```

Should return GitHub's IP addresses.

### Step 2: Test DNS Propagation
Visit: https://dnschecker.org/
- Enter: `sevad.com`
- Select: A record
- Should show GitHub IPs from multiple locations

### Step 3: Check GitHub Pages Settings
1. Go to: https://github.com/shubhamsinghrajpurohit/e-in-voice-bi-ll-ing-/settings/pages
2. Under **Custom domain** field
3. Should show: `sevad.com` ✅
4. SSL certificate should be **Enforced** ✅

---

## 🌐 Expected Timeline

| Step | Timeline |
|------|----------|
| Configure DNS | Immediate (within 1 hour) |
| DNS Propagation | 24-48 hours |
| GitHub SSL Certificate | 24 hours after DNS propagation |
| Full Site Access | 48-72 hours |

---

## 🔒 HTTPS/SSL Certificate

Once DNS propagates, GitHub will automatically:
- ✅ Detect the custom domain
- ✅ Issue FREE SSL certificate
- ✅ Enable HTTPS
- ✅ Redirect HTTP → HTTPS

---

## 📝 Your Custom Domain Details

- **Domain:** sevad.com
- **CNAME Target:** shubhamsinghrajpurohit.github.io
- **Repository:** shubhamsinghrajpurohit/e-in-voice-bi-ll-ing-
- **Expected URL:** https://sevad.com

---

## ⚠️ Important Notes

1. **CNAME file is already committed** ✅
2. **You MUST update DNS records** at your domain provider
3. **GitHub Pages will verify ownership** automatically
4. **SSL certificate is FREE** - fully managed by GitHub

---

## 🆘 Troubleshooting

### DNS Not Working After 48 Hours?
1. **Verify A records are added** correctly
2. **Check TTL value** (should be low, like 3600)
3. **Use `nslookup sevad.com`** to test
4. **Contact your domain provider support**

### GitHub Pages Shows Error?
1. Go to Settings → Pages
2. **Custom domain field** should show `sevad.com`
3. Wait 24 hours for SSL certificate
4. Check repository is PUBLIC

### Mixed Content Warning?
- Ensure **Enforce HTTPS** is enabled in GitHub Pages settings
- Wait for SSL certificate to be issued

---

## ✨ Next Steps

1. **Copy the DNS A records** from this file
2. **Log in to your domain provider** (GoDaddy, Namecheap, etc.)
3. **Add the A records** to DNS settings
4. **Wait 24-48 hours** for propagation
5. **Visit https://sevad.com** - Your site will be live! 🎉

---

**Your GitHub Pages setup is ready! Now configure your DNS records.** 🚀
