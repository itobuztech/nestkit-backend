
### Prod server run locally
docker buildx build -f Dockerfile.prod -t itobuz/nest-starter-backend:arm .
docker push itobuz/nest-starter-backend:arm
docker buildx build --platform linux/amd64 -f Dockerfile.prod -t itobuz/nest-starter-backend:amd .
docker push itobuz/nest-starter-backend:amd
