# Hint Dog - Telegram Bot

## ssh tunnel port proxy

```sh
# kill tunnels
ssh la "ps ax | grep '[s]shd: root' | awk '{print \$1}' | xargs kill -9 &> /dev/null"

# remote interface : remote port : local interface : local port
ssh -N -R 127.0.0.1:14835:127.0.0.1:14835 la &> /dev/null

docker-compose up mongo

docker exec -it hintdog_mongo mongosh 'mongodb://root:local-root-password@127.0.0.1:27017/hintdog?authSource=admin&appName=cli'
```

## mongo

```js
disableTelemetry()
```

## deploy

```sh
npm run build
rsync -rv build package.json package-lock.json config.prod.json la:/home/hintdog/tgbot/
```

## run prod

```sh
su hintdog
cd ~/tgbot
npm ci --omit=dev
ps ax | grep '[n]ode' | awk "{print \$1}" | xargs kill -9
nohup npm run prod &
mongosh 'mongodb://127.0.0.1:27017/hintdog?appName=cli'
```
