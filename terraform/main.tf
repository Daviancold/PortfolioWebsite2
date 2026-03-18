module "vcn" {
  source         = "./modules/vcn"
  compartment_id = var.compartment_id
  vcn_cidr       = var.vcn_cidr
  personal_ip    = var.personal_ip
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