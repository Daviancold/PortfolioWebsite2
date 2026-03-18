variable "vcn_cidr" {
  description = "The IP range for the VCN"
  type        = string
  default     = "10.0.0.0/16"
}

variable "compartment_id" {
  description = "The OCID of the OCI compartment"
  type        = string
}

variable "personal_ip" {
  description = "Passed from root"
  type = string
}