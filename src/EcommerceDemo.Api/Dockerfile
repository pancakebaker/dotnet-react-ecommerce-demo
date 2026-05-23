FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY EcommerceDemo.sln ./
COPY src/EcommerceDemo.Api/EcommerceDemo.Api.csproj src/EcommerceDemo.Api/
RUN dotnet restore src/EcommerceDemo.Api/EcommerceDemo.Api.csproj

COPY src/EcommerceDemo.Api src/EcommerceDemo.Api
RUN dotnet publish src/EcommerceDemo.Api/EcommerceDemo.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "EcommerceDemo.Api.dll"]
