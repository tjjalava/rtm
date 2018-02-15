#!/bin/bash

if [ `whoami` != "tjjalava" ]; then
        echo "Run as tjjalava"
        exit 1
fi

cwd=`pwd`
cd `dirname $0`/..
yarn install
echo "======= Starting rtm =======" >> logs/rtm.log
nohup node bin/www >> logs/rtm.log 2>&1 &
echo $! > rtm.pid
cd ${cwd}