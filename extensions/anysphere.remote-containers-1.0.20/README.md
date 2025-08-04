# Cursor Dev Containers

This extension enables you to use Docker containers as your development environment. It provides a consistent, isolated workspace with all the tools and dependencies you need.

## What This Extension Does

- Runs your development environment inside a Docker container
- Mounts your workspace files into the container
- Installs and runs extensions inside the container
- Provides seamless integration with Cursor as if everything were running locally

## Prerequisites

### Docker Installation Options

You can use Docker in several ways:
- Local Docker installation
- Remote Docker environment
- Other Docker-compliant CLIs (unofficially supported)
- Kubernetes pods (requires `kubectl`)

### System Requirements

#### Local Docker Setup

**Windows:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop) with WSL2 Backend

**macOS:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Linux:**
- [Docker CE/EE](https://docs.docker.com/install/#supported-platforms) 18.06+
- [Docker Compose](https://docs.docker.com/compose/install) 1.21+
- Note: Ubuntu snap package is not supported

#### Supported Container Systems
- Debian 9+
- Ubuntu 16.04+
- CentOS / RHEL 7+
- Alpine Linux

x86_64 and arm64 architectures are supported.

## Installation Guide

### Windows / macOS Setup

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. For Windows - Ensure that WSL2 is enabled:
   - Open Docker Desktop settings
   - Enable **Use the WSL2 based engine**
   - Verify your distribution under **Resources > WSL Integration**

### Linux Setup

1. Install Docker CE/EE following [official instructions](https://docs.docker.com/install/#supported-platforms)
2. Install Docker Compose if needed
3. Add your user to the docker group:
   ```bash
   sudo usermod -aG docker $USER
   ```
4. Sign out and back in for changes to take effect

## Git Integration Tips

- For Windows users: Configure consistent line endings when working with the same repository in both container and Windows
- Git credentials are automatically shared with containers
- SSH keys can be shared with containers (see [Sharing Git credentials](https://aka.ms/vscode-remote/containers/git))

## Alpine Linux Support

- Requires Cursor v0.50.5 or newer
- Required packages: `bash`, `libstdc++`, and `wget`
- Add to your Dockerfile:
  ```dockerfile
  RUN apk add --no-cache bash libstdc++ wget
  ```

## Additional Resources

- [Alternative Docker Options](https://code.visualstudio.com/remote/advancedcontainers/docker-options)
- [Troubleshooting Guide](https://aka.ms/vscode-remote/containers/troubleshooting)
- [Remote Docker Host Setup](https://aka.ms/vscode-remote/containers/remote-host)
