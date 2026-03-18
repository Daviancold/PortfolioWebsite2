variable "vcn_cidr" {
  description = "The IP range for the VCN"
  type        = string
  default     = "10.0.0.0/16"
}

variable "compartment_id" {
  description = "The OCID of the OCI compartment"
  type        = string
} 

variable "region" {
  description = "Chosen region of OCI servers"
  default     = "ap-singapore-1"
}

variable "ad_name" {
  description = "Availability Domain Name"
  type        = string
}

variable "personal_ip" {
  description = "Home IP Address"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH Public Key (to be passed in using tfvars)"
  type        = string
}