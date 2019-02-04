# misto travel parcel

## Install

```
docker pull dimonchikcom/misto-travel-parser:lates
```

## Usage

```bash
docker run -e token="634547863:AAEYxGIczdGwBx-49R1Vi3MqPMaUEuZzYO0" -e url="https://misto.travel/index.php?mod=search&cmd=results&limit=1&dst=43&src=1&d=2019-02-02&dd=7&dp=7&a=3&c=0&c1=10&c2=10&c3=10&s%5B%5D=4&f%5B%5D=ai&r=0%2C10&p=500%2C200000&sv%5Btc%5D%5B%5D=715" -e max_price="700" -e email="dmitriy.dn.ua@gmail.com" dimonchikcom/misto-travel-parser:lates
```