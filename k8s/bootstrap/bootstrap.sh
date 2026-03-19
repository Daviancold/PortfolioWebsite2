#!/bin/bash
# bootstrap.sh — run once after terraform apply

CLUSTER_ID=$(terraform output -raw cluster_id)
REGION=$(terraform output -raw region)

# Get kubeconfig
oci ce cluster create-kubeconfig \
  --cluster-id $CLUSTER_ID \
  --file ~/.kube/config \
  --region $REGION \
  --token-version 2.0.0

# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait and apply root app
kubectl wait --for=condition=available deployment/argocd-server \
  -n argocd --timeout=180s

kubectl apply -f k8s/argocd/apps.yaml