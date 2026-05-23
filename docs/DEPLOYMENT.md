# Deployment Notes

This project can be hosted as a split full-stack demo: an ASP.NET Core API plus a React/Vite static frontend.

## Suggested Repository

```powershell
git remote add origin https://github.com/pancakebaker/dotnet-react-ecommerce-demo.git
git push -u origin main
```

## API

Deploy `src/EcommerceDemo.Api` as either a .NET app or Docker container.

Set production secrets in the hosting provider:

- `Database__Provider`
- `ConnectionStrings__Postgres` or `ConnectionStrings__SqlServer`
- `Jwt__Issuer=EcommerceDemo`
- `Jwt__Audience=EcommerceDemo.Client`
- `Jwt__Secret`
- `Cors__AllowedOrigins__0`

## Frontend

Deploy `client` as a static Vite app. Set `VITE_API_URL` to the public API base URL and `VITE_GOOGLE_MAPS_API_KEY` to a browser-restricted Google Maps JavaScript API key before building.

```powershell
cd client
npm ci
npm run build
```

## Docker

```powershell
docker build -f src/EcommerceDemo.Api/Dockerfile -t ecommerce-demo-api .
docker build -f client/Dockerfile --build-arg VITE_API_URL=https://your-api.example.com -t ecommerce-demo-client .
```
