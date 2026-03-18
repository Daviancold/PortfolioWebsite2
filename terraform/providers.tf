terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
  }

  cloud {
    organization = "davian-terraform"
    workspaces {
      name = "kubernetes-workspace"
    }
  }
}

provider "oci" {
  # This tells Terraform to look at your ~/.oci/config
  # It will automatically find the user OCID, Fingerprint, Key, and Tenancy ID
  config_file_profile = "terraform"
  region              = var.region
}
