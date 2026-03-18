1. terraform apply  # Creates OKE
2. terraform output kubeconfig_command | bash  # Adds OKE to ~/.kube/config
3. brew install kubectx  # Now manages 2 clusters!
4. kubectx  # Lists both
5. kubectx sre-portfolio-cluster  # Switch to OKE
