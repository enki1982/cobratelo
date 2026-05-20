# cobratelo.es

Frontend de Cobratelo — descubre las ayudas públicas que te corresponden.

## Stack
- Next.js 14
- Tailwind CSS
- Supabase (base de datos)
- Vercel (hosting)

## Despliegue en Vercel

### Opción A — GitHub (recomendado)

1. Sube este proyecto a un repo GitHub:
```bash
git init
git add .
git commit -m "feat: cobratelo.es inicial"
git remote add origin https://github.com/TU_USUARIO/cobratelo
git push -u origin main
```

2. En Vercel: **Add New Project** → importa el repo de GitHub

3. En **Environment Variables** añade:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://pcuomumijpzgatpfgtyo.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (tu anon key de Supabase)

4. Deploy → en 2 minutos está online

### Conectar cobratelo.es

En Vercel → Settings → Domains → Add `cobratelo.es`
Apunta los nameservers de Namecheap a Vercel o añade el registro CNAME.

## Desarrollo local
```bash
npm install
npm run dev
```
Abre http://localhost:3000
