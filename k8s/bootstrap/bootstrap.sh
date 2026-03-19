#!/bin/bash
# bootstrap.sh — run once after terraform apply

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")"

# CLUSTER_ID=$(terraform output -raw cluster_id)
# REGION=$(terraform output -raw region)

# # Get kubeconfig
# oci ce cluster create-kubeconfig \
#   --cluster-id $CLUSTER_ID \
#   --file ~/.kube/config \
#   --region $REGION \
#   --token-version 2.0.0

# Install ArgoCD
kubectl get namespace argocd &>/dev/null || kubectl create namespace argocd
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait and apply root app
kubectl wait --for=condition=available deployment/argocd-server \
  -n argocd --timeout=180s

# Apply secrets before app deployment
kubectl get secret cloudflare-tunnel-token &>/dev/null || \
  kubectl create -f "$K8S_DIR/apps/cloudflared/secret.yaml"

kubectl apply -f "$K8S_DIR/bootstrap/root-app.yaml"