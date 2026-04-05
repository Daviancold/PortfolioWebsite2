# ============================================================
# Image lookup
# ============================================================

# Dynamically resolves the latest OKE-optimised Oracle Linux 8
# ARM image for VM.Standard.A1.Flex nodes.
data "oci_core_images" "latest_oke_arm_image" {
  compartment_id           = var.compartment_id
  operating_system         = "Oracle Linux"
  operating_system_version = "8"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# ============================================================
# Cluster
# ============================================================

resource "oci_containerengine_cluster" "k8s_cluster" {
  compartment_id     = var.compartment_id
  vcn_id             = var.vcn_id
  kubernetes_version = var.k8s_version
  name               = "oci-k8s-cluster"
  type               = "BASIC_CLUSTER" # Ensures $0 management fee

  # API endpoint lives in the public NLB subnet so kubectl can reach it.
  # Workers are private — the endpoint subnet must be separate from the
  # worker subnet, which is why nlb_subnet_id is used here.
  endpoint_config {
    is_public_ip_enabled = true
    subnet_id            = var.nlb_subnet_id
  }

  # Required for OCI_VCN_IP_NATIVE CNI — tells OKE to use VCN-native
  # pod networking at the cluster level. This replaces the old
  # kubernetes_network_config block which only applies to flannel.
  cluster_pod_network_options {
    cni_type = "OCI_VCN_IP_NATIVE"
  }

  options {
    add_ons {
      is_kubernetes_dashboard_enabled = false
      is_tiller_enabled               = false # Tiller was removed in Helm 3, no-op
    }
  }
}

# ============================================================
# Node pool
# ============================================================

# ARM Always Free Tier node pool.
# 2 nodes × 2 OCPU × 12 GB = 4 OCPU / 24 GB total (within free tier limits).
# 2 nodes × 50 GB boot = 100 GB total, leaving 100 GB for PVCs.
# 1. THE WORKER POOL (Dedicated to Heavy Workloads / Minecraft)
resource "oci_containerengine_node_pool" "worker_pool" {
  cluster_id         = oci_containerengine_cluster.k8s_cluster.id
  compartment_id     = var.compartment_id
  kubernetes_version = var.k8s_version
  name               = "worker-node-pool"
  node_shape         = "VM.Standard.A1.Flex"

  node_shape_config {
    ocpus         = 2
    memory_in_gbs = 12
  }

  node_config_details {
    size = 1

    placement_configs {
      availability_domain = var.availability_domain
      subnet_id           = var.worker_subnet_id
    }

    # Pods share the worker subnet with nodes.
    # At ~30 IPs used out of 254 available this is safe for this workload —
    # see IP budget analysis. If workload grows, split into a dedicated pod subnet.
    node_pool_pod_network_option_details {
      cni_type       = "OCI_VCN_IP_NATIVE"
      pod_subnet_ids = [var.worker_subnet_id]
    }
  }

  node_source_details {
    image_id                = data.oci_core_images.latest_oke_arm_image.images[0].id
    source_type             = "IMAGE"
    boot_volume_size_in_gbs = 50
  }

  # SRE Labeling for Node Affinity
  initial_node_labels {
    key   = "node-role.kubernetes.io/worker"
    value = "true"
  }

  # Prevent Terraform from replacing nodes on every OKE patch release.
  # Update these manually when you intentionally want to roll the node pool.
  lifecycle {
    ignore_changes = [
      node_source_details[0].image_id, 
      kubernetes_version
    ]
  }

  # SSH key for emergency access via OCI Bastion Service.
  ssh_public_key = var.ssh_public_key
}

# 2. THE INFRA POOL (Dedicated to Monitoring & Management)
resource "oci_containerengine_node_pool" "infra_pool" {
  cluster_id         = oci_containerengine_cluster.k8s_cluster.id
  compartment_id     = var.compartment_id
  kubernetes_version = var.k8s_version
  name               = "infra-node-pool"
  node_shape         = "VM.Standard.A1.Flex"

  node_shape_config {
    ocpus         = 2
    memory_in_gbs = 12
  }

  node_config_details {
    size = 1

    placement_configs {
      availability_domain = var.availability_domain
      subnet_id           = var.worker_subnet_id
    }

    node_pool_pod_network_option_details {
      cni_type       = "OCI_VCN_IP_NATIVE"
      pod_subnet_ids = [var.worker_subnet_id]
    }
  }

  node_source_details {
    image_id                = data.oci_core_images.latest_oke_arm_image.images[0].id
    source_type             = "IMAGE"
    boot_volume_size_in_gbs = 50
  }

  initial_node_labels {
    key   = "node-role.kubernetes.io/infra"
    value = "true"
  }

  lifecycle {
    ignore_changes = [
      node_source_details[0].image_id, 
      kubernetes_version
    ]
  }

  ssh_public_key = var.ssh_public_key
}
