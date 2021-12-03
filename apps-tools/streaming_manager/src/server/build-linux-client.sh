#!/bin/bash
unzip -o ./libs/asio.zip -d ./libs
cmake CMakeLists.txt -DCMAKE_BUILD_TYPE=Release -DMODEL=Z10 -DCLIENT_PRJ=ON
make
# -j$(grep ^cpu\\scores /proc/cpuinfo | uniq |  awk '{print $4}')


#APP=$(pwd | grep -o '[^/]*$')
APP='linux-tool_beta_2.1'

echo "$APP"
ZIP="$APP".zip
rm ./target -rf
mkdir -p target
cp ./bin/rpsa_client ./target
cp ./bin/convert_tool ./target
cp ./client/default_multiple_dac_config.json ./target
cp ./client/default_dac_config.json ./target
cd target
zip -r "$ZIP" *
mv  "$ZIP" ../"$ZIP"
cd ..
rm target -rf


