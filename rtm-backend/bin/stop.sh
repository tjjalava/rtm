#!/bin/bash

if [ `whoami` != "tjjalava" ]; then
        echo "Run as tjjalava"
        exit 1
fi

cwd=`pwd`
cd `dirname $0`/..
kill `cat rtm.pid`
cd ${cwd}