# For entering cluster to run networking command and testing
kubectl run debug --image=curlimages/curl --rm -it --restart=Never -- /bin/sh

# To change grafana password
kubectl patch secret prometheus-stack-grafana -n monitoring \
  --type merge \
  -p "{\"data\": {\"admin-password\": \"$(echo -n 'yournewpassword' | base64)\"}}"