# start docker and run the service bash script to run the service

docker run -t -p 3000:3000 -v /home/huteng/www/image-browser-aws/:/usr/local/image-browser-aws/ -v /home/ec2-user/s3-gagobucket/:/home/ec2-user/s3-gagobucket/ docker.gagogroup.cn:5000/image-browser-aws:latest /usr/local/image-browser-aws/bin/start_from_docker.sh