module "vcn" {
  source         = "./modules/vcn"
  compartment_id = var.compartment_id
  vcn_cidr       = var.vcn_cidr
}

module "oke" {
  source              = "./modules/oke"
  compartment_id      = var.compartment_id
  vcn_id              = module.vcn.vcn_id
  worker_subnet_id    = module.vcn.worker_subnet_id
  nlb_subnet_id       = module.vcn.nlb_subnet_id
  k8s_version         = "v1.31.1"
  availability_domain = var.ad_name
  ssh_public_key      = var.ssh_public_key
  depends_on          = [module.vcn]
}

resource "local_file" "minecraft_infra_patch" {
  # This path must point to your flat minecraft folder relative to where you run TF
  filename = "${path.module}/../k8s/apps/minecraft/patch.yaml"
  
  content  = <<-EOT
    apiVersion: v1
    kind: Service
    metadata:
      name: minecraft-server
      namespace: apps
      annotations:
        oci-network-load-balancer.oraclecloud.com/subnet: "${module.vcn.nlb_subnet_id}"
        oci.oraclecloud.com/reserved-ips: "${module.vcn.minecraft_reserved_ip_address}"
  EOT
}