echo "start delpoying..."

# use production as env
export NODE_ENV=production

# delpoy by pm2-docker
cd /usr/local/image-browser-aws/

npm install --registry=http://npmjs.gagogroup.cn

gulp ts

pm2-docker start "dist/app.js" -i 0

echo "end delpoying"