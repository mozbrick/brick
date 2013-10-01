echo 'NPM Installs'
npm install
npm install -g grunt-cli bower
echo 'Installing Bower Dependencies' 
bower install

echo 'Installing Slimer'
wget http://download.slimerjs.org/v0.8/slimerjs-0.8.zip
unzip slimerjs-0.8.zip
mv slimerjs-0.8/ slimerjs/

echo 'Installing Casper'
git clone git://github.com/n1k0/casperjs.git
cd casperjs
git checkout 1.1-beta1
cd ..