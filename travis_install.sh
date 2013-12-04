echo 'NPM Installs'
npm install
npm install -g grunt-cli bower
echo 'Installing Bower Dependencies'
bower install

echo 'Installing Slimer'
wget http://download.slimerjs.org/v0.8/0.8.5/slimerjs-0.8.5.zip -O slimerjs.zip
unzip slimerjs.zip -d slimer-temp
mv slimer-temp/slimer* slimerjs/
rm -r slimer-temp

echo 'Installing Casper'
git clone git://github.com/n1k0/casperjs.git
cd casperjs
git checkout 1.1-beta3
cd ..