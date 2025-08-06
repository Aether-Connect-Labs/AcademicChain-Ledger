#!/bin/bash

# 1. Autenticación en el registro Docker
echo "Autenticando en el registro Docker..."
docker login -u $DOCKER_USER -p $DOCKER_PASS

# 2. Construir imágenes
echo "Construyendo imágenes Docker..."
docker-compose -f docker-compose.prod.yml build

# 3. Publicar imágenes
echo "Publicando imágenes..."
docker-compose -f docker-compose.prod.yml push

# 4. Desplegar en Kubernetes
echo "Desplegando en Kubernetes..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/volumes.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# 5. Esperar a que los pods estén listos
echo "Esperando a que los pods estén listos..."
kubectl wait --for=condition=Ready pods --all -n academicchain --timeout=300s

# 6. Verificar estado
echo "Verificando estado del despliegue..."
kubectl get all -n academicchain

echo "¡Despliegue completado con éxito!"