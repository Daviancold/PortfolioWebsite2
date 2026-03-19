output "cluster_id" {
  value = oci_containerengine_cluster.k8s_cluster.id
}

output "kubeconfig_command" {
  description = "Run this to configure kubectl (copy-paste ready)"
  value = <<-EOT
    oci ce cluster create-kubeconfig \
      --cluster-id ${oci_containerengine_cluster.k8s_cluster.id} \
      --file ~/.kube/config \
      --region ap-singapore-1 \
      --token-version 2.0.0 \
      --kube-endpoint PUBLIC_ENDPOINT
    
    export KUBECONFIG=~/.kube/config
    kubectl get nodes
  EOT
}