### For entering cluster to run networking command and testing ###
kubectl run debug --image=curlimages/curl --rm -it --restart=Never -- /bin/sh



### For minecraft server data management ###
kubectl scale statefulset minecraft-server -n apps --replicas=0

### Copies your local folder into the /data directory on the Block Volume
kubectl cp ./local-world-folder/ apps/$(kubectl get pod -l app=minecraft-admin -n apps -o jsonpath='{.items[0].metadata.name}'):/data/
### Pulls the world from the cloud to your laptop
kubectl cp apps/$(kubectl get pod -l app=minecraft-admin -n apps -o jsonpath='{.items[0].metadata.name}'):/data ./backup-$(date +%F)

### Enter the interactive shell
kubectl exec -it deployment/minecraft-admin -n apps -- bash
chown -R 1000:1000 /data

### Helpful world data edit commands
kubectl exec -it deployment/minecraft-admin -n apps -- nano /data/fabric/whitelist.json
# nano /data/server.properties
