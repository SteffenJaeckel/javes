echo "prepare ..."
VERSION=$(node inc_version.js)
cd src/
meteor bundle --architecture os.linux.x86_64 ../deployme.tar.gz
cd ..
git add deployme.tar.gz
git add src/version.js
git commit -m "$VERSION erstellt."
git tag $VERSION
echo "[ok]"
