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

### Install ArgoCD ###
kubectl get namespace argocd &>/dev/null || kubectl create namespace argocd
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

#### Wait and apply root app ###
kubectl wait --for=condition=available deployment/argocd-server \
  -n argocd --timeout=180s

### Set insecure mode for ArgoCD ###
kubectl patch configmap argocd-cmd-params-cm \
  -n argocd \
  --type merge \
  -p '{"data": {"server.insecure": "true"}}'

### Apply fix for ApplicationSet CRD installation failure due to annotation size limit ###
kubectl apply -n argocd --server-side --force-conflicts -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

### Apply secrets before app deployment (Update required secrets where needed) ###
kubectl get secret cloudflare-tunnel-token &>/dev/null || \
  kubectl create -f "$K8S_DIR/apps/cloudflared/secret.yaml"

kubectl get secret dockerhub-credentials -n argocd &>/dev/null || \
  kubectl create secret docker-registry dockerhub-credentials \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=daviancold \
  --docker-password=<your-dockerhub-pat> \
  -n argocd

kubectl apply -f "$K8S_DIR/bootstrap/root-app.yaml"