output "vcn_id" {
  value = oci_core_vcn.main.id
}

output "worker_subnet_id" {
  value = oci_core_subnet.worker_subnet.id
}

output "nlb_subnet_id" {
  description = "Pass this OCID to the Kubernetes Service annotation: oci.oraclecloud.com/subnet"
  value       = oci_core_subnet.nlb_subnet.id
}

output "minecraft_reserved_ip_id" {
  description = "Pass this OCID to the Kubernetes Service annotation: oci-network-load-balancer.oraclecloud.com/reserved-ip"
  value       = oci_core_public_ip.minecraft_static_ip.id
}

output "minecraft_reserved_ip_address" {
  description = "The static IP address your Minecraft players will connect to"
  value       = oci_core_public_ip.minecraft_static_ip.ip_address
}