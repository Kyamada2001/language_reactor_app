##　ビルドコマンド
    docker build -t my-lambda-image . 

## 起動コマンド
    docker run -p 9000:8080 my-lambda-image:latest