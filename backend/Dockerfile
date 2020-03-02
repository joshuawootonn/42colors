# Get Base Image (Full .NET Core SDK)
FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS build-env
WORKDIR /app

# Copy csproj and restore
COPY ./backend.webapp/backend.webapp.csproj  ./backend.webapp/backend.webapp.csproj
COPY ./backend.core/backend.core.csproj  ./backend.core/backend.core.csproj
COPY ./backend.test.integration/backend.test.integration.csproj  ./backend.test.integration/backend.test.integration.csproj
COPY ./backend.test.unit/backend.test.unit.csproj  ./backend.test.unit/backend.test.unit.csproj
COPY ./backend.test.core/backend.test.core.csproj  ./backend.test.core/backend.test.core.csproj
COPY ./backend.sln  ./backend.sln

RUN dotnet restore

# Copy everything else and build
COPY . ./
RUN dotnet publish -c Release -o out

# Generate runtime image
FROM mcr.microsoft.com/dotnet/core/aspnet:3.1
WORKDIR /app
EXPOSE 80
COPY --from=build-env /app/out .      # change this
ENTRYPOINT ["dotnet", "backend.dll"]  # and this