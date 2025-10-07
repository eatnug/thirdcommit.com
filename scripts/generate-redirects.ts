import fs from 'fs'
import path from 'path'

const redirectTemplate = (destination: string, title: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${destination}">
  <link rel="canonical" href="https://thirdcommit.com${destination}" />
  <script>window.location.replace('${destination}');</script>
  <title>Redirecting to ${title}...</title>
</head>
<body>
  <p>Redirecting to <a href="${destination}">${title}</a>...</p>
</body>
</html>
`

// Generate /blog → /?tab=blog redirect
const outDir = path.join(process.cwd(), 'out')
const blogDir = path.join(outDir, 'blog')

fs.mkdirSync(blogDir, { recursive: true })
fs.writeFileSync(
  path.join(blogDir, 'index.html'),
  redirectTemplate('/?tab=blog', 'Blog')
)

console.log('✅ Static redirects generated')
