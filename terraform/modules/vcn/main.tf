# ============================================================
# VCN
# ============================================================
resource "oci_core_vcn" "main" {
  cidr_block     = var.vcn_cidr
  compartment_id = var.compartment_id
  display_name   = "oci-k8s-cluster-vcn"
  dns_label      = "ocik8svcn"
}

# ============================================================
# Gateways
# ============================================================

# Internet gateway — used by the public NLB subnet
resource "oci_core_internet_gateway" "ig" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "internet-gateway"
}

# NAT gateway — used by private worker nodes for outbound traffic
# (image pulls, Cloudflare tunnel, etc.)
resource "oci_core_nat_gateway" "nat" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "nat-gateway"
}

resource "oci_core_service_gateway" "sg" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "service-gateway"

  services {
    service_id = data.oci_core_services.all_services.services[0].id
  }
}

data "oci_core_services" "all_services" {
  filter {
    name   = "name"
    values = ["All .* Services In Oracle Services Network"]
    regex  = true
  }
}

# ============================================================
# Route Tables
# ============================================================

# Default route table — attached to the public NLB subnet
resource "oci_core_default_route_table" "ig_route" {
  manage_default_resource_id = oci_core_vcn.main.default_route_table_id

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.ig.id
  }
}

# Private route table — attached to the worker subnet
# All outbound traffic exits via NAT (no public IPs on nodes)
resource "oci_core_route_table" "private_route" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "private-worker-route-table"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_nat_gateway.nat.id
  }

  route_rules {
    destination       = data.oci_core_services.all_services.services[0].cidr_block
    destination_type  = "SERVICE_CIDR_BLOCK"
    network_entity_id = oci_core_service_gateway.sg.id
  }
}

# ============================================================
# Security Lists
# ============================================================

# --- NLB subnet security list ---
# Accepts Minecraft connections from the internet,
# forwards only to the worker subnet on port 25565.
resource "oci_core_security_list" "nlb_sec_list" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "nlb-security-list"


  # --- EGRESS RULES ---
  egress_security_rules {
    destination = cidrsubnet(var.vcn_cidr, 8, 1)
    protocol    = "all"
    description = "Allow Kubernetes API endpoint to communicate with worker nodes and pods (sharing same subnet), and enable path discovery to workers"
  }

  egress_security_rules {
    destination      = data.oci_core_services.all_services.services[0].cidr_block
    destination_type = "SERVICE_CIDR_BLOCK"
    protocol         = "6"
    description      = "Allow Kubernetes API endpoint to communicate with OKE."
  }

  # --- INGRESS RULES ---
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    description = "Minecraft Java Edition inbound"

    tcp_options {
      min = 25565
      max = 25565
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = cidrsubnet(var.vcn_cidr, 8, 1)  # worker subnet
    description = "Worker and pods to Kubernetes API endpoint"
    tcp_options { 
      min = 6443
      max = 6443 
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = cidrsubnet(var.vcn_cidr, 8, 1)
    description = "Worker and pods to Kubernetes API endpoint"
    tcp_options { 
      min = 12250
      max = 12250 
    }
  }

  ingress_security_rules {
    protocol = "1"  # ICMP
    source   = cidrsubnet(var.vcn_cidr, 8, 1)
    description = "Path discovery from workers"
    icmp_options { 
      type = 3
      code = 4 
    }
  }

  ingress_security_rules {
    protocol = "6"  # TCP
    source   = "0.0.0.0/0"
    description = "External Access to Kubernetes API endpoint"
    tcp_options { 
      min = 6443
      max = 6443
    }
  }
}

# --- Worker subnet security list ---
resource "oci_core_security_list" "worker_sec_list" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "worker-security-list"

  # --- EGRESS RULES ---
  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
    description = "Allow nodes to pull images and connect to Cloudflare"
  }

  # --- INGRESS RULES ---
  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    description = "NLB NodePort routing — source IP preserved from internet"
    tcp_options {
      min = 31234
      max = 31234
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = cidrsubnet(var.vcn_cidr, 8, 0)
    description = "Allow Kubernetes API endpoint to communicate with worker nodes."

    tcp_options {
      min = 10250
      max = 10250
    }
  }

  ingress_security_rules {
    protocol    = "1" # ICMP
    source      = cidrsubnet(var.vcn_cidr, 8, 0)
    description = "Path Discovery"
    icmp_options {
      type = 3
      code = 4
    }
  }

  ingress_security_rules {
    protocol    = "all"
    source      = cidrsubnet(var.vcn_cidr, 8, 0) # NLB Subnet
    description = "Load balancer to worker nodes node ports"
  }

  # --- INGRESS: Internal pod-to-pod and VCN traffic ---
  # It catches all above rules, but above rules still written for explicit 
  # understanding.
  ingress_security_rules {
    protocol    = "all"
    source      = var.vcn_cidr
    description = "Allow internal pod-to-pod and VCN traffic (Includes NLB)"
  }

  # SSH:    Use OCI Bastion Service instead.
  # kubectl: Target the OKE cluster public endpoint, not the node IPs.
  #          The endpoint is already secured by Oracle with its own access controls.
}

# ============================================================
# Subnets
# ============================================================

# Public subnet for the OKE-managed Network Load Balancer.
# The NLB resource itself is provisioned by OKE when you apply
# the Minecraft Kubernetes Service manifest (type: LoadBalancer).
resource "oci_core_subnet" "nlb_subnet" {
  cidr_block                 = cidrsubnet(var.vcn_cidr, 8, 0) # 10.0.0.0/24
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.main.id
  display_name               = "nlb-subnet-public"
  dns_label                  = "nlbpub"
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_vcn.main.default_route_table_id
  security_list_ids          = [oci_core_security_list.nlb_sec_list.id]
}

# Private subnet for OKE worker nodes.
# Nodes have no public IPs; all outbound traffic exits via NAT.
resource "oci_core_subnet" "worker_subnet" {
  cidr_block                 = cidrsubnet(var.vcn_cidr, 8, 1) # 10.0.1.0/24
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.main.id
  display_name               = "worker-subnet-private"
  dns_label                  = "workers"
  prohibit_public_ip_on_vnic = true
  route_table_id             = oci_core_route_table.private_route.id
  security_list_ids          = [oci_core_security_list.worker_sec_list.id]
}

# ============================================================
# Reserved public IP for the Minecraft NLB
# ============================================================
# This IP is attached to the NLB via the Kubernetes Service annotation:
#
#   oci-network-load-balancer.oraclecloud.com/reserved-ip: |
#     [{"id": "<minecraft_reserved_ip_id output>"}]
#
# OKE's cloud controller manager handles the actual NLB provisioning.
resource "oci_core_public_ip" "minecraft_static_ip" {
  compartment_id = var.compartment_id
  lifetime       = "RESERVED"
  display_name   = "minecraft-nlb-ip"
}