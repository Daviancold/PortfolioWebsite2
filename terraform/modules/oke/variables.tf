# ============================================================
# OKE module variables
# ============================================================

variable "compartment_id" {
  description = "OCID of the compartment to deploy into"
  type        = string
}

variable "vcn_id" {
  description = "OCID of the VCN"
  type        = string
}

variable "worker_subnet_id" {
  description = "OCID of the private worker subnet (10.0.1.0/24)"
  type        = string
}

variable "nlb_subnet_id" {
  description = "OCID of the public NLB subnet (10.0.0.0/24) — used for the cluster API endpoint"
  type        = string
}

variable "availability_domain" {
  description = "Availability domain to place worker nodes in"
  type        = string
}

variable "k8s_version" {
  description = "Kubernetes version for the cluster and node pool (e.g. v1.31.1)"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH public key for emergency node access via OCI Bastion Service"
  type        = string
}